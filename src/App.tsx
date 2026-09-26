import { Route, BrowserRouter, Routes } from 'react-router-dom';
import QuickView from './components/QuickView';
import SearchOverlay from './components/SearchOverlay';
import { AuthPrompt, AuthProvider, AdminRoute, ProtectedRoute } from './lib/auth';
import { ShopProvider } from './lib/store';
import { Account, WishlistPage } from './pages/Account';
import Admin from './pages/Admin';
import { AdminLogin, Login, Register } from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import { About, Contact } from './pages/Info';
import ProductDetails from './pages/ProductDetails';
import Shop from './pages/Shop';

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div><p className="font-display text-6xl">404</p><p className="mt-2 text-stone-500">That room doesn't exist.</p>
        <a href="/" className="mt-5 inline-block rounded-lg bg-[#2A1912] px-6 py-2.5 text-sm font-bold text-white">Go Home</a></div>
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <QuickView />
          <SearchOverlay />
          <AuthPrompt />
        </BrowserRouter>
      </AuthProvider>
    </ShopProvider>
  );
}
