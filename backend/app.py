"""HomeCraft API — FastAPI + SQLite.

Auth uses PBKDF2-HMAC-SHA256 password hashing (stdlib) and JWT sessions
stored in a Secure HttpOnly cookie. Password hashes are NEVER returned.
Run:  uvicorn app:app --host 127.0.0.1 --port 8000
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import jwt
from fastapi import Cookie, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator

BASE = Path(__file__).parent
# HC_DB / HC_UPLOADS let a hosted deployment point at a persistent disk —
# the container filesystem is ephemeral, so the database and uploaded
# images would otherwise be wiped on every deploy. Defaults keep local dev
# exactly as it was (both inside backend/).
DB_PATH = Path(os.getenv('HC_DB') or (BASE / 'homecraft.db'))
UPLOADS = Path(os.getenv('HC_UPLOADS') or (BASE / 'uploads'))
UPLOADS.mkdir(parents=True, exist_ok=True)

SECRET_FILE = BASE / '.secret'


def get_secret() -> str:
    env = os.getenv('HC_SECRET')
    if env and env != 'change-me-to-a-long-random-string':
        return env
    if SECRET_FILE.exists():
        return SECRET_FILE.read_text().strip()
    s = secrets.token_hex(32)
    SECRET_FILE.write_text(s)
    return s


SECRET = get_secret()
COOKIE_NAME = 'hc_session'
EMAIL_RE = re.compile(r'^\S+@\S+\.\S+$')
MOBILE_RE = re.compile(r'^[6-9]\d{9}$')
GENDERS = {'male', 'female', 'other', 'prefer_not_to_say'}
STATUSES = {'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'}

# Simple in-memory login rate limiter: ip -> [timestamps]
_attempts: dict[str, list[float]] = {}


def check_rate_limit(ip: str, limit: int = 100, window: int = 300) -> None:
    now = time.time()
    hits = [t for t in _attempts.get(ip, []) if now - t < window]
    if len(hits) >= limit:
        raise HTTPException(429, 'Too many attempts. Please try again later.')
    hits.append(now)
    _attempts[ip] = hits


# ---------------- database ----------------

def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys = ON')
    return con


def init_db() -> None:
    con = db()
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            mobile TEXT NOT NULL,
            gender TEXT NOT NULL DEFAULT 'prefer_not_to_say',
            password_hash TEXT NOT NULL,
            profile_image TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wishlist (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (user_id, product_id)
        );
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Confirmed',
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            size TEXT,
            color TEXT
        );
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            price INTEGER NOT NULL,
            old_price INTEGER,
            discount INTEGER NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT 'Living Room',
            collections TEXT NOT NULL DEFAULT '[]',
            tags TEXT NOT NULL DEFAULT '[]',
            images TEXT NOT NULL DEFAULT '[]',
            rotation_images TEXT NOT NULL DEFAULT '[]',
            colors TEXT NOT NULL DEFAULT '[]',
            sizes TEXT NOT NULL DEFAULT '[]',
            rating REAL NOT NULL DEFAULT 4.5,
            reviews INTEGER NOT NULL DEFAULT 0,
            featured INTEGER NOT NULL DEFAULT 0,
            new_arrival INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS removed_products (
            id TEXT PRIMARY KEY,
            deleted_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_name TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL DEFAULT '',
            rating INTEGER NOT NULL,
            text TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL
        );
        """
    )
    # Lightweight migrations for DBs created before role/status/products existed.
    for col, ddl in (
        ('role', "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"),
        ('status', "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'"),
        ('last_login', 'ALTER TABLE users ADD COLUMN last_login TEXT'),
    ):
        cols = [r['name'] for r in con.execute('PRAGMA table_info(users)').fetchall()]
        if col not in cols:
            con.execute(ddl)
    for col, ddl in (('rotation_images', "ALTER TABLE products ADD COLUMN rotation_images TEXT NOT NULL DEFAULT '[]'"), ('variants', "ALTER TABLE products ADD COLUMN variants TEXT NOT NULL DEFAULT '[]'"),):
        cols = [r['name'] for r in con.execute('PRAGMA table_info(products)').fetchall()]
        if col not in cols:
            con.execute(ddl)
    con.commit()
    # Seed default admin (dev/demo only) — never duplicated.
    admin = con.execute("SELECT id FROM users WHERE email = 'admin@123'").fetchone()
    if not admin:
        ts = now_iso()
        con.execute(
            'INSERT INTO users (full_name, email, mobile, gender, password_hash, role, status, created_at, updated_at)'
            ' VALUES (?,?,?,?,?,?,?,?,?)',
            ('Admin', 'admin@123', '9840000000', 'prefer_not_to_say', hash_password('admin@123'), 'admin', 'active', ts, ts),
        )
        con.commit()
    # Seed collections catalogue (ids/slugs mirror the frontend COLLECTIONS).
    if con.execute('SELECT COUNT(*) c FROM collections').fetchone()['c'] == 0:
        ts = now_iso()
        for cid, name, slug in [
            ('living-room', 'Living Room', 'living-room'), ('bedroom', 'Bedroom', 'bedroom'),
            ('dining', 'Dining', 'dining'), ('home-office', 'Home Office', 'home-office'),
            ('outdoor', 'Outdoor', 'outdoor'), ('decor', 'Decor', 'decor'),
            ('storage', 'Storage', 'storage'), ('kids-teens', 'Kids & Teens', 'kids-teens'),
            ('entryway', 'Entryway', 'entryway'), ('premium', 'Premium Collection', 'premium'),
        ]:
            con.execute(
                'INSERT INTO collections (id, name, slug, description, created_at) VALUES (?,?,?,?,?)',
                (cid, name, slug, f'Handcrafted {name.lower()} furniture.', ts),
            )
        con.commit()
    con.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------- passwords & tokens ----------------

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 200_000)
    return f'pbkdf2_sha256$200000${salt.hex()}${dk.hex()}'


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt_hex, hash_hex = stored.split('$')
        dk = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def make_token(user_id: int, days: int = 1) -> str:
    exp = int(time.time()) + days * 86400
    return jwt.encode({'sub': str(user_id), 'exp': exp}, SECRET, algorithm='HS256')


def user_from_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET, algorithms=['HS256'])
    except jwt.PyJWTError:
        return None
    con = db()
    row = con.execute(
        'SELECT id, full_name, email, mobile, gender, profile_image, role, status, created_at, updated_at, last_login'
        ' FROM users WHERE id = ?', (payload.get('sub'),)
    ).fetchone()
    con.close()
    return dict(row) if row else None


def public_user(row: dict[str, Any]) -> dict[str, Any]:
    return {k: row[k] for k in ('id', 'full_name', 'email', 'mobile', 'gender', 'profile_image', 'role', 'status', 'created_at', 'updated_at') if k in row}


def set_session(res: Response, user_id: int, remember: bool) -> None:
    res.set_cookie(
        COOKIE_NAME, make_token(user_id, 30 if remember else 1),
        max_age=(30 if remember else 1) * 86400,
        httponly=True, samesite='lax', secure=False, path='/',
    )


# ---------------- schemas ----------------

class RegisterIn(BaseModel):
    full_name: str
    email: str
    mobile: str
    gender: str = 'prefer_not_to_say'
    password: str

    @field_validator('full_name')
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 80:
            raise ValueError('Please enter your full name (2–80 characters).')
        return v

    @field_validator('email')
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError('Please enter a valid email address.')
        return v

    @field_validator('mobile')
    @classmethod
    def _mobile(cls, v: str) -> str:
        v = v.strip().replace(' ', '')
        if not MOBILE_RE.match(v):
            raise ValueError('Please enter a valid 10-digit Indian mobile number.')
        return v

    @field_validator('gender')
    @classmethod
    def _gender(cls, v: str) -> str:
        if v not in GENDERS:
            raise ValueError('Invalid gender option.')
        return v

    @field_validator('password')
    @classmethod
    def _pw(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters.')
        return v


class LoginIn(BaseModel):
    email: str
    password: str
    remember: bool = False


class ProfileIn(BaseModel):
    full_name: str
    mobile: str
    gender: str = 'prefer_not_to_say'


class PasswordIn(BaseModel):
    current_password: str
    new_password: str


class ImageIn(BaseModel):
    image_data: str  # data:image/(jpeg|png|webp);base64,...


class AddressIn(BaseModel):
    full_name: str
    mobile: str
    address: str
    city: str
    state: str
    pincode: str
    is_default: bool = False


class WishlistIn(BaseModel):
    product_ids: list[str]


class OrderItemIn(BaseModel):
    product_id: str
    name: str = ''
    price: int = 0
    qty: int = 1
    size: str | None = None
    color: str | None = None


class OrderIn(BaseModel):
    items: list[OrderItemIn]
    total: int
    name: str
    city: str


class ContactIn(BaseModel):
    name: str
    email: str
    phone: str = ''
    subject: str = ''
    message: str


# ---------------- app ----------------

app = FastAPI(title='HomeCraft API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv('HC_CORS', 'http://127.0.0.1:5173,http://localhost:5173').split(',')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
init_db()


def require_user(token: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> dict[str, Any]:
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    return user


@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


# ---------------- auth ----------------

@app.post('/api/auth/register', status_code=201)
def register(body: RegisterIn, res: Response, req: Request):
    check_rate_limit(req.client.host if req.client else 'unknown', 20, 600)
    con = db()
    if con.execute('SELECT 1 FROM users WHERE email = ?', (body.email,)).fetchone():
        con.close()
        raise HTTPException(409, 'This email is already registered.')
    ts = now_iso()
    cur = con.execute(
        'INSERT INTO users (full_name, email, mobile, gender, password_hash, created_at, updated_at)'
        ' VALUES (?,?,?,?,?,?,?)',
        (body.full_name, body.email, body.mobile, body.gender, hash_password(body.password), ts, ts),
    )
    con.commit()
    row = con.execute(
        'SELECT id, full_name, email, mobile, gender, profile_image, role, status, created_at, updated_at FROM users WHERE id = ?',
        (cur.lastrowid,),
    ).fetchone()
    con.close()
    user = public_user(dict(row))
    set_session(res, user['id'], False)
    return user


@app.post('/api/auth/login')
def login(body: LoginIn, res: Response, req: Request):
    # Generic error: never reveal whether the email exists.
    check_rate_limit(req.client.host if req.client else 'unknown')
    con = db()
    row = con.execute('SELECT * FROM users WHERE email = ?', (body.email.strip().lower(),)).fetchone()
    if not row or not verify_password(body.password, row['password_hash']):
        con.close()
        raise HTTPException(401, 'Invalid login credentials.')
    if row['status'] == 'blocked':
        con.close()
        raise HTTPException(403, 'Your account has been blocked. Please contact support.')
    con.execute('UPDATE users SET last_login=? WHERE id=?', (now_iso(), row['id']))
    con.commit()
    fresh = con.execute('SELECT * FROM users WHERE id=?', (row['id'],)).fetchone()
    con.close()
    set_session(res, row['id'], body.remember)
    return public_user(dict(fresh))


@app.post('/api/auth/logout')
def logout(res: Response):
    res.delete_cookie(COOKIE_NAME, path='/')
    return {'ok': True}


@app.get('/api/auth/me')
def me(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    return user


@app.put('/api/auth/profile')
def update_profile(body: ProfileIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    name = body.full_name.strip()
    mobile = body.mobile.strip().replace(' ', '')
    if len(name) < 2 or len(name) > 80:
        raise HTTPException(422, 'Please enter your full name (2–80 characters).')
    if not MOBILE_RE.match(mobile):
        raise HTTPException(422, 'Please enter a valid 10-digit Indian mobile number.')
    if body.gender not in GENDERS:
        raise HTTPException(422, 'Invalid gender option.')
    con = db()
    con.execute(
        'UPDATE users SET full_name=?, mobile=?, gender=?, updated_at=? WHERE id=?',
        (name, mobile, body.gender, now_iso(), user['id']),
    )
    con.commit()
    row = con.execute(
        'SELECT id, full_name, email, mobile, gender, profile_image, created_at, updated_at FROM users WHERE id=?',
        (user['id'],),
    ).fetchone()
    con.close()
    return public_user(dict(row))


@app.put('/api/auth/password')
def change_password(body: PasswordIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    if len(body.new_password) < 8:
        raise HTTPException(422, 'New password must be at least 8 characters.')
    con = db()
    row = con.execute('SELECT password_hash FROM users WHERE id=?', (user['id'],)).fetchone()
    if not row or not verify_password(body.current_password, row['password_hash']):
        con.close()
        raise HTTPException(401, 'Current password is incorrect.')
    con.execute(
        'UPDATE users SET password_hash=?, updated_at=? WHERE id=?',
        (hash_password(body.new_password), now_iso(), user['id']),
    )
    con.commit()
    con.close()
    return {'ok': True}


@app.put('/api/auth/profile/image')
def upload_image(body: ImageIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    m = re.match(r'^data:image/(jpeg|png|webp);base64,(.+)$', body.image_data, re.DOTALL)
    if not m:
        raise HTTPException(422, 'Only JPG, PNG or WebP images are allowed.')
    raw = base64.b64decode(m.group(2))
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(422, 'Image must be smaller than 5 MB.')
    if m.group(1) == 'jpeg' and not raw.startswith(b'\xff\xd8'):
        raise HTTPException(422, 'Invalid image file.')
    if m.group(1) == 'png' and not raw.startswith(b'\x89PNG'):
        raise HTTPException(422, 'Invalid image file.')
    ext = 'jpg' if m.group(1) == 'jpeg' else m.group(1)
    fname = f"u{user['id']}_{secrets.token_hex(8)}.{ext}"
    (UPLOADS / fname).write_bytes(raw)
    # Remove previous upload
    con = db()
    old = con.execute('SELECT profile_image FROM users WHERE id=?', (user['id'],)).fetchone()
    if old and old['profile_image']:
        try:
            (UPLOADS / Path(old['profile_image']).name).unlink(missing_ok=True)
        except OSError:
            pass
    url = f'/uploads/{fname}'
    con.execute('UPDATE users SET profile_image=?, updated_at=? WHERE id=?', (url, now_iso(), user['id']))
    con.commit()
    con.close()
    return {'profile_image': url}


@app.delete('/api/auth/profile/image')
def remove_image(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    old = con.execute('SELECT profile_image FROM users WHERE id=?', (user['id'],)).fetchone()
    if old and old['profile_image']:
        try:
            (UPLOADS / Path(old['profile_image']).name).unlink(missing_ok=True)
        except OSError:
            pass
    con.execute('UPDATE users SET profile_image=NULL, updated_at=? WHERE id=?', (now_iso(), user['id']))
    con.commit()
    con.close()
    return {'ok': True}


# Uploaded files are written by this module with one of two shapes:
#   profile avatar -> u<user-id>_<16 hex>.jpg|png|webp
#   product image  -> p_<product-id>_<index>_<8 hex>.jpg|png|webp
# Only those exact shapes are served, so nothing outside the uploads folder is
# ever reachable through this route.
UPLOAD_NAME_RE = re.compile(
    r'(?:u\d+_[0-9a-f]{8,16}|p_[A-Za-z0-9_-]{1,80}_\d{1,3}_[0-9a-f]{4,16})\.(?:jpg|png|webp)'
)


@app.get('/uploads/{fname}')
def uploads(fname: str):
    if not UPLOAD_NAME_RE.fullmatch(fname):
        raise HTTPException(404, 'Not found.')
    path = (UPLOADS / fname).resolve()
    if UPLOADS.resolve() not in path.parents or not path.is_file():
        raise HTTPException(404, 'Not found.')
    return FileResponse(path)


# ---------------- addresses ----------------

@app.get('/api/addresses')
def list_addresses(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    rows = con.execute('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC', (user['id'],)).fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.post('/api/addresses', status_code=201)
def add_address(body: AddressIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    if not re.fullmatch(r'\d{6}', body.pincode.strip()):
        raise HTTPException(422, 'Enter a 6-digit pincode.')
    if not MOBILE_RE.match(body.mobile.strip().replace(' ', '')):
        raise HTTPException(422, 'Please enter a valid 10-digit Indian mobile number.')
    con = db()
    if body.is_default:
        con.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', (user['id'],))
    cur = con.execute(
        'INSERT INTO addresses (user_id, full_name, mobile, address, city, state, pincode, is_default, created_at)'
        ' VALUES (?,?,?,?,?,?,?,?,?)',
        (user['id'], body.full_name.strip(), body.mobile.strip(), body.address.strip(), body.city.strip(),
         body.state.strip(), body.pincode.strip(), 1 if body.is_default else 0, now_iso()),
    )
    con.commit()
    row = con.execute('SELECT * FROM addresses WHERE id=?', (cur.lastrowid,)).fetchone()
    con.close()
    return dict(row)


@app.put('/api/addresses/{addr_id}')
def edit_address(addr_id: int, body: AddressIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    if not con.execute('SELECT 1 FROM addresses WHERE id=? AND user_id=?', (addr_id, user['id'])).fetchone():
        con.close()
        raise HTTPException(404, 'Address not found.')
    if body.is_default:
        con.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', (user['id'],))
    con.execute(
        'UPDATE addresses SET full_name=?, mobile=?, address=?, city=?, state=?, pincode=?, is_default=? WHERE id=?',
        (body.full_name.strip(), body.mobile.strip(), body.address.strip(), body.city.strip(),
         body.state.strip(), body.pincode.strip(), 1 if body.is_default else 0, addr_id),
    )
    con.commit()
    row = con.execute('SELECT * FROM addresses WHERE id=?', (addr_id,)).fetchone()
    con.close()
    return dict(row)


@app.delete('/api/addresses/{addr_id}')
def delete_address(addr_id: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    cur = con.execute('DELETE FROM addresses WHERE id=? AND user_id=?', (addr_id, user['id']))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Address not found.')
    return {'ok': True}


# ---------------- wishlist ----------------

@app.get('/api/wishlist')
def get_wishlist(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    rows = con.execute('SELECT product_id FROM wishlist WHERE user_id=?', (user['id'],)).fetchall()
    con.close()
    return {'product_ids': [r['product_id'] for r in rows]}


@app.put('/api/wishlist')
def put_wishlist(body: WishlistIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    con.execute('DELETE FROM wishlist WHERE user_id=?', (user['id'],))
    ts = now_iso()
    for pid in body.product_ids[:200]:
        con.execute('INSERT OR IGNORE INTO wishlist (user_id, product_id, created_at) VALUES (?,?,?)', (user['id'], pid, ts))
    con.commit()
    con.close()
    return {'ok': True}


# ---------------- orders ----------------

@app.get('/api/orders')
def list_orders(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    con = db()
    orders = con.execute('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', (user['id'],)).fetchall()
    out = []
    for o in orders:
        items = con.execute('SELECT product_id, name, price, qty, size, color FROM order_items WHERE order_id=?', (o['id'],)).fetchall()
        d = dict(o)
        d['items'] = [dict(i) for i in items]
        out.append(d)
    con.close()
    return out


@app.post('/api/orders', status_code=201)
def create_order(body: OrderIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    if not body.items:
        raise HTTPException(422, 'Order has no items.')
    oid = 'HC' + secrets.token_hex(4).upper()
    con = db()
    con.execute(
        'INSERT INTO orders (id, user_id, total, status, name, city, created_at) VALUES (?,?,?,?,?,?,?)',
        (oid, user['id'], body.total, 'Confirmed', body.name, body.city, now_iso()),
    )
    for it in body.items:
        con.execute(
            'INSERT INTO order_items (order_id, product_id, name, price, qty, size, color) VALUES (?,?,?,?,?,?,?)',
            (oid, it.product_id, it.name, it.price, it.qty, it.size, it.color),
        )
    con.commit()
    con.close()
    return {'id': oid, 'status': 'Confirmed'}


# ---------------- contact ----------------

@app.post('/api/contact', status_code=201)
def contact(body: ContactIn):
    if len(body.name.strip()) < 2 or not EMAIL_RE.match(body.email.strip()) or len(body.message.strip()) < 5:
        raise HTTPException(422, 'Please complete the form correctly.')
    con = db()
    con.execute(
        'INSERT INTO messages (name, email, phone, subject, message, created_at) VALUES (?,?,?,?,?,?)',
        (body.name.strip(), body.email.strip(), body.phone.strip(), body.subject.strip(), body.message.strip(), now_iso()),
    )
    con.commit()
    con.close()
    return {'ok': True}


# ---------------- public catalogue (admin-managed products) ----------------

def product_to_front(r: dict[str, Any], req: Request) -> dict[str, Any]:
    import json as _json

    def _list(v: str) -> list:
        try:
            return _json.loads(v) if v else []
        except Exception:
            return []

    imgs = _list(r.get('images') or '[]')
    rot = _list(r.get('rotation_images') or '[]')
    variants = _list(r.get('variants') or '[]')
    base = str(req.base_url).rstrip('/')
    imgs = [(u if u.startswith('http') else base + u) if u.startswith('/') else u for u in imgs]
    rot = [(u if u.startswith('http') else base + u) if u.startswith('/') else u for u in rot]
    # normalize variant image URLs
    for v in variants:
        if isinstance(v, dict):
            for k in ('images', 'rotationImages', 'rotation_images'):
                if k in v and isinstance(v[k], list):
                    v[k] = [(u if u.startswith('http') else base + u) if isinstance(u, str) and u.startswith('/') else u for u in v[k]]
            # normalize legacy key
            if 'rotation_images' in v and 'rotationImages' not in v:
                v['rotationImages'] = v.pop('rotation_images')
    return {
        'id': r['id'], 'name': r['name'], 'category': r['category'],
        'description': r.get('description') or '', 'price': r['price'],
        'oldPrice': r.get('old_price'), 'rating': r.get('rating') or 4.5,
        'reviews': r.get('reviews') or 0, 'stock': r['stock'], 'images': imgs,
        'rotationImages': rot,
        'variants': variants,
        'colors': _list(r.get('colors') or '[]'), 'sizes': _list(r.get('sizes') or '[]'),
        'featured': bool(r.get('featured')), 'newArrival': bool(r.get('new_arrival')),
        'collections': _list(r.get('collections') or '[]'), 'tags': _list(r.get('tags') or '[]'),
    }


@app.get('/api/products')
def public_products(req: Request):
    con = db()
    rows = con.execute('SELECT * FROM products ORDER BY created_at DESC').fetchall()
    con.close()
    return [product_to_front(dict(r), req) for r in rows]


@app.get('/api/products/removed')
def removed_catalogue_products():
    """Ids of catalogue products an admin deleted.

    The client merges `src/lib/data.ts` catalogue entries with the rows above,
    so it needs to know which static ids were removed — otherwise a deleted
    product reappears on the next refresh.
    """
    con = db()
    rows = con.execute('SELECT id FROM removed_products ORDER BY deleted_at').fetchall()
    con.close()
    return {'ids': [r['id'] for r in rows]}


@app.get('/api/products/{pid}')
def public_product(pid: str, req: Request):
    con = db()
    row = con.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    con.close()
    if not row:
        raise HTTPException(404, 'Product not found.')
    return product_to_front(dict(row), req)




@app.get('/api/collections')
def public_collections():
    con = db()
    rows = con.execute('SELECT id, name, slug, description, image FROM collections ORDER BY name').fetchall()
    con.close()
    return [dict(r) for r in rows]


class ReviewIn(BaseModel):
    product_id: str
    product_name: str = ''
    rating: int
    text: str


@app.post('/api/reviews', status_code=201)
def post_review(body: ReviewIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Login to write a review.')
    if user.get('status') in ('blocked', 'muted'):
        raise HTTPException(403, 'Your account cannot post reviews right now.')
    if not (1 <= body.rating <= 5) or len(body.text.strip()) < 3:
        raise HTTPException(422, 'Please add a rating and a short review.')
    con = db()
    con.execute(
        'INSERT INTO reviews (user_id, user_name, product_id, product_name, rating, text, status, created_at)'
        ' VALUES (?,?,?,?,?,?,?,?)',
        (user['id'], user['full_name'], body.product_id, body.product_name, body.rating,
         body.text.strip(), 'pending', now_iso()),
    )
    con.commit()
    con.close()
    return {'ok': True}


# ---------------- admin ----------------

def require_admin(token: str | None) -> dict[str, Any]:
    user = user_from_token(token)
    if not user:
        raise HTTPException(401, 'Not authenticated.')
    if user.get('role') != 'admin':
        raise HTTPException(403, 'Admin access required.')
    return user


class VariantIn(BaseModel):
    id: str = ''
    colorName: str = ''
    colorValue: str = ''
    price: int | None = None
    stock: int | None = None
    rotationImages: list[str] = []
    images: list[str] = []

class ProductIn(BaseModel):
    name: str
    description: str = ''
    price: int
    old_price: int | None = None
    stock: int = 0
    category: str = 'Living Room'
    collections: list[str] = []
    tags: list[str] = []
    colors: list[str] = []
    sizes: list[str] = []
    rating: float = 4.5
    featured: bool = False
    new_arrival: bool = False
    images: list[str] = []  # data-URLs or absolute URLs
    rotation_images: list[str] = []  # ordered rotation frames (legacy)
    variants: list[VariantIn] = []  # per-color rotation sets


class CollectionIn(BaseModel):
    name: str
    slug: str
    description: str = ''
    image: str = ''


def save_product_images(pid: str, images: list[str]) -> list[str]:
    import json as _json  # noqa: F401
    out: list[str] = []
    for i, img in enumerate(images[:6]):
        if img.startswith('data:image/'):
            m = re.match(r'^data:image/(jpeg|png|webp);base64,(.+)$', img, re.DOTALL)
            if not m:
                raise HTTPException(422, 'Only JPG, PNG or WebP images are allowed.')
            raw = base64.b64decode(m.group(2))
            if len(raw) > 3 * 1024 * 1024:
                raise HTTPException(422, 'Product images must be smaller than 3 MB each.')
            ext = 'jpg' if m.group(1) == 'jpeg' else m.group(1)
            fname = f'p_{pid}_{i}_{secrets.token_hex(4)}.{ext}'
            (UPLOADS / fname).write_bytes(raw)
            out.append(f'/uploads/{fname}')
        elif img.startswith(('http://', 'https://', '/uploads/')):
            out.append(img)
        # anything else (executables, scripts) is rejected silently
    if not out:
        out = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop']
    return out


@app.post('/api/admin/login')
def admin_login(body: LoginIn, res: Response, req: Request):
    check_rate_limit(req.client.host if req.client else 'unknown')
    con = db()
    row = con.execute('SELECT * FROM users WHERE email = ?', (body.email.strip().lower(),)).fetchone()
    con.close()
    if not row or row['role'] != 'admin' or not verify_password(body.password, row['password_hash']):
        raise HTTPException(401, 'Invalid login credentials.')
    if row['status'] == 'blocked':
        raise HTTPException(403, 'Your account has been blocked.')
    set_session(res, row['id'], body.remember)
    return public_user(dict(row))


@app.get('/api/admin/stats')
def admin_stats(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    stats = {
        'total_users': con.execute("SELECT COUNT(*) c FROM users WHERE role='user'").fetchone()['c'],
        'active_users': con.execute("SELECT COUNT(*) c FROM users WHERE role='user' AND status='active'").fetchone()['c'],
        'blocked_users': con.execute("SELECT COUNT(*) c FROM users WHERE status='blocked'").fetchone()['c'],
        'total_products': con.execute('SELECT COUNT(*) c FROM products').fetchone()['c'],
        'total_orders': con.execute('SELECT COUNT(*) c FROM orders').fetchone()['c'],
        'revenue': con.execute('SELECT COALESCE(SUM(total),0) s FROM orders').fetchone()['s'],
        'unread_messages': con.execute('SELECT COUNT(*) c FROM messages WHERE is_read=0').fetchone()['c'],
        'pending_reviews': con.execute("SELECT COUNT(*) c FROM reviews WHERE status='pending'").fetchone()['c'],
    }
    recent_users = [dict(r) for r in con.execute(
        'SELECT id, full_name, email, mobile, gender, role, status, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 5').fetchall()]
    recent_orders = [dict(r) for r in con.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').fetchall()]
    low_stock = [dict(r) for r in con.execute('SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock LIMIT 8').fetchall()]
    recent_products = [dict(r) for r in con.execute('SELECT id, name, price, stock, created_at FROM products ORDER BY created_at DESC LIMIT 5').fetchall()]
    con.close()
    return {**stats, 'recent_users': recent_users, 'recent_orders': recent_orders,
            'low_stock': low_stock, 'recent_products': recent_products}


@app.get('/api/admin/users')
def admin_users(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    users = [dict(r) for r in con.execute(
        'SELECT id, full_name, email, mobile, gender, profile_image, role, status, created_at, last_login FROM users ORDER BY created_at DESC').fetchall()]
    for u in users:
        u['order_count'] = con.execute('SELECT COUNT(*) c FROM orders WHERE user_id=?', (u['id'],)).fetchone()['c']
        u['wishlist_count'] = con.execute('SELECT COUNT(*) c FROM wishlist WHERE user_id=?', (u['id'],)).fetchone()['c']
    con.close()
    return users


@app.get('/api/admin/users/{uid}')
def admin_user_detail(uid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    u = con.execute(
        'SELECT id, full_name, email, mobile, gender, profile_image, role, status, created_at, updated_at, last_login FROM users WHERE id=?',
        (uid,)).fetchone()
    if not u:
        con.close()
        raise HTTPException(404, 'User not found.')
    d = dict(u)
    d['order_count'] = con.execute('SELECT COUNT(*) c FROM orders WHERE user_id=?', (uid,)).fetchone()['c']
    d['wishlist_count'] = con.execute('SELECT COUNT(*) c FROM wishlist WHERE user_id=?', (uid,)).fetchone()['c']
    d['orders'] = [dict(r) for r in con.execute('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', (uid,)).fetchall()]
    con.close()
    return d


@app.patch('/api/admin/users/{uid}/{action}')
def admin_user_action(uid: int, action: str, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    me = require_admin(token)
    if action not in ('block', 'unblock', 'mute', 'unmute'):
        raise HTTPException(422, 'Unknown action.')
    if uid == me['id']:
        raise HTTPException(422, 'You cannot change your own status.')
    con = db()
    if not con.execute('SELECT 1 FROM users WHERE id=?', (uid,)).fetchone():
        con.close()
        raise HTTPException(404, 'User not found.')
    status = {'block': 'blocked', 'unblock': 'active', 'mute': 'muted', 'unmute': 'active'}[action]
    con.execute('UPDATE users SET status=?, updated_at=? WHERE id=?', (status, now_iso(), uid))
    con.commit()
    con.close()
    return {'ok': True, 'status': status}


@app.delete('/api/admin/users/{uid}')
def admin_user_delete(uid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    me = require_admin(token)
    if uid == me['id']:
        raise HTTPException(422, 'You cannot delete your own account.')
    con = db()
    cur = con.execute('DELETE FROM users WHERE id=?', (uid,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'User not found.')
    return {'ok': True}


@app.post('/api/admin/products', status_code=201)
def admin_create_product(body: ProductIn, req: Request, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    if len(body.name.strip()) < 2:
        raise HTTPException(422, 'Enter a product name.')
    if body.price <= 0:
        raise HTTPException(422, 'Enter a valid price.')
    import json as _json
    pid = re.sub(r'[^a-z0-9]+', '-', body.name.strip().lower()).strip('-') + '-' + secrets.token_hex(3)
    ts = now_iso()
    imgs = save_product_images(pid, body.images)
    rot = save_product_images(pid + '_rot', body.rotation_images) if body.rotation_images else []
    # per-variant rotation sets
    variants_out = []
    for v in body.variants:
        v_imgs = save_product_images(pid + '_var', v.images) if v.images else []
        v_rot = save_product_images(pid + '_varrot', v.rotationImages) if v.rotationImages else []
        variants_out.append({**v.model_dump(), 'images': v_imgs, 'rotationImages': v_rot})
    # if rotation not provided, keep empty (frontend synthesizes fallback)
    disc = round((1 - body.price / body.old_price) * 100) if body.old_price and body.old_price > body.price else 0
    con = db()
    con.execute(
        'INSERT INTO products (id, name, description, price, old_price, discount, stock, category, collections, tags, images, rotation_images, variants, colors, sizes, rating, featured, new_arrival, created_at, updated_at)'
        ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        (pid, body.name.strip(), body.description.strip(), body.price, body.old_price, disc, body.stock,
         body.category, _json.dumps(body.collections), _json.dumps(body.tags), _json.dumps(imgs), _json.dumps(rot), _json.dumps(variants_out),
         _json.dumps(body.colors), _json.dumps(body.sizes), body.rating,
         1 if body.featured else 0, 1 if body.new_arrival else 0, ts, ts),
    )
    con.commit()
    row = con.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    con.close()
    return product_to_front(dict(row), req)


@app.put('/api/admin/products/{pid}')
def admin_update_product(pid: str, body: ProductIn, req: Request, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    import json as _json
    con = db()
    if not con.execute('SELECT 1 FROM products WHERE id=?', (pid,)).fetchone():
        con.close()
        raise HTTPException(404, 'Product not found.')
    imgs = save_product_images(pid, body.images)
    rot = save_product_images(pid + '_rot', body.rotation_images) if body.rotation_images else []
    variants_out = []
    for v in body.variants:
        v_imgs = save_product_images(pid + '_var', v.images) if v.images else []
        v_rot = save_product_images(pid + '_varrot', v.rotationImages) if v.rotationImages else []
        variants_out.append({**v.model_dump(), 'images': v_imgs, 'rotationImages': v_rot})
    disc = round((1 - body.price / body.old_price) * 100) if body.old_price and body.old_price > body.price else 0
    con.execute(
        'UPDATE products SET name=?, description=?, price=?, old_price=?, discount=?, stock=?, category=?, collections=?, tags=?, images=?, rotation_images=?, variants=?, colors=?, sizes=?, rating=?, featured=?, new_arrival=?, updated_at=? WHERE id=?',
        (body.name.strip(), body.description.strip(), body.price, body.old_price, disc, body.stock,
         body.category, _json.dumps(body.collections), _json.dumps(body.tags), _json.dumps(imgs), _json.dumps(rot), _json.dumps(variants_out),
         _json.dumps(body.colors), _json.dumps(body.sizes), body.rating,
         1 if body.featured else 0, 1 if body.new_arrival else 0, now_iso(), pid),
    )
    con.commit()
    row = con.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    con.close()
    return product_to_front(dict(row), req)


@app.delete('/api/admin/products/{pid}')
def admin_delete_product(pid: str, catalogue: bool = False,
                         token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    """Delete a product by its stable id.

    Products stored in the `products` table are removed as rows. Catalogue
    (seed) products are not DB rows, so the removal is remembered in
    `removed_products` — that keeps the deletion persistent instead of the
    static entry reappearing on the next catalogue merge.
    """
    require_admin(token)
    con = db()
    cur = con.execute('DELETE FROM products WHERE id=?', (pid,))
    if cur.rowcount == 0:
        if not catalogue:
            con.close()
            raise HTTPException(404, 'Product not found.')
        con.execute('INSERT OR IGNORE INTO removed_products (id, deleted_at) VALUES (?,?)', (pid, now_iso()))
    con.commit()
    con.close()
    return {'ok': True, 'scope': 'catalogue' if cur.rowcount == 0 else 'row'}


@app.post('/api/admin/collections', status_code=201)
def admin_create_collection(body: CollectionIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    try:
        con.execute(
            'INSERT INTO collections (id, name, slug, description, image, created_at) VALUES (?,?,?,?,?,?)',
            (body.slug, body.name, body.slug, body.description, body.image, now_iso()),
        )
        con.commit()
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(409, 'A collection with this slug already exists.')
    con.close()
    return {'ok': True}


@app.put('/api/admin/collections/{slug}')
def admin_update_collection(slug: str, body: CollectionIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute('UPDATE collections SET name=?, description=?, image=? WHERE slug=?',
                      (body.name, body.description, body.image, slug))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Collection not found.')
    return {'ok': True}


@app.delete('/api/admin/collections/{slug}')
def admin_delete_collection(slug: str, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute('DELETE FROM collections WHERE slug=?', (slug,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Collection not found.')
    return {'ok': True}


@app.get('/api/admin/orders')
def admin_orders(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    orders = con.execute(
        'SELECT o.*, u.full_name AS customer, u.email AS customer_email FROM orders o'
        ' LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC').fetchall()
    out = []
    for o in orders:
        d = dict(o)
        d['items'] = [dict(i) for i in con.execute('SELECT * FROM order_items WHERE order_id=?', (o['id'],)).fetchall()]
        out.append(d)
    con.close()
    return out


class OrderStatusIn(BaseModel):
    status: str


@app.patch('/api/admin/orders/{oid}/status')
def admin_order_status(oid: str, body: OrderStatusIn, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    if body.status not in STATUSES:
        raise HTTPException(422, 'Invalid status.')
    con = db()
    cur = con.execute('UPDATE orders SET status=? WHERE id=?', (body.status, oid))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Order not found.')
    return {'ok': True, 'status': body.status}


@app.get('/api/admin/reviews')
def admin_reviews(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    rows = con.execute('SELECT * FROM reviews ORDER BY created_at DESC').fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.patch('/api/admin/reviews/{rid}/approve')
def admin_review_approve(rid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute("UPDATE reviews SET status='approved' WHERE id=?", (rid,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Review not found.')
    return {'ok': True}


@app.delete('/api/admin/reviews/{rid}')
def admin_review_delete(rid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute('DELETE FROM reviews WHERE id=?', (rid,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Review not found.')
    return {'ok': True}


@app.get('/api/admin/messages')
def admin_messages(token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    rows = con.execute('SELECT * FROM messages ORDER BY created_at DESC').fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.patch('/api/admin/messages/{mid}/read')
def admin_message_read(mid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute('UPDATE messages SET is_read=1 WHERE id=?', (mid,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Message not found.')
    return {'ok': True}


@app.delete('/api/admin/messages/{mid}')
def admin_message_delete(mid: int, token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    require_admin(token)
    con = db()
    cur = con.execute('DELETE FROM messages WHERE id=?', (mid,))
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Message not found.')
    return {'ok': True}

