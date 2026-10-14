import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.tsx";

import { AuthProvider } from "./contexts/AuthContext";
import { MerchCartProvider } from "./contexts/MerchCartContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <MerchCartProvider>
        <App />
      </MerchCartProvider>
    </AuthProvider>
  </StrictMode>
);