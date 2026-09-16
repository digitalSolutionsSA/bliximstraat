import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.tsx";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { MerchCartProvider } from "./contexts/MerchCartContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <MerchCartProvider>
          <App />
        </MerchCartProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);