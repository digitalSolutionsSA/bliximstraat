import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Music from "./pages/Music";
import Shows from "./pages/Shows";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Lyrics from "./pages/Lyrics";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

import PurchasedSongs from "./pages/PurchasedSongs";
import PurchaseHistory from "./pages/PurchaseHistory";

// ✅ Cart (relative imports)
import { CartProvider } from "./contexts/CartContext";
import CartModal from "./components/cart/CartModal";

/* TEMP PLACEHOLDER – used for routes you haven’t built yet */
function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-widest">{title}</h1>
        <p className="mt-3 text-white/70">Page coming soon.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* HOME */}
          <Route path="/" element={<Home />} />

          {/* MAIN SITE */}
          <Route path="/music" element={<Music />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/about" element={<About />} />
          <Route path="/lyrics" element={<Lyrics />} />
          <Route path="/bookings" element={<Bookings />} />

          {/* USER */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/purchased" element={<PurchasedSongs />} />
          <Route path="/orders" element={<PurchaseHistory />} />

          {/* ADMIN */}
          <Route path="/admin" element={<Admin />} />

          {/* FALLBACK */}
          <Route path="*" element={<Placeholder title="NOT FOUND" />} />
        </Routes>

        {/* ✅ One global cart modal for the entire app */}
        <CartModal />
      </CartProvider>
    </BrowserRouter>
  );
}
