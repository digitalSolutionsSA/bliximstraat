import { ShoppingBag } from "lucide-react";
import { useMerchCart } from "../../contexts/MerchCartContext";

export default function MerchCartButton() {
  const { count, openCart } = useMerchCart();

  return (
    <button
      onClick={openCart}
      className="relative inline-flex items-center justify-center rounded-full p-2.5 text-white/90 hover:text-white transition"
      style={{ border: "1px solid rgba(255,255,255,0.14)" }}
      aria-label="Open cart"
      type="button"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-black text-[11px] flex items-center justify-center font-semibold"
        >
          {count}
        </span>
      )}
    </button>
  );
}
