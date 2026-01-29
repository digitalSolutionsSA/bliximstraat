import { ShoppingCart } from "lucide-react";
import { useCart } from "../../contexts/CartContext";

export default function CartButton() {
  const { count, open } = useCart();

  return (
    <button
      onClick={open}
      className="relative inline-flex items-center justify-center rounded-full p-2
                 text-white/90 hover:text-white transition"
      aria-label="Open cart"
      type="button"
    >
      <ShoppingCart className="h-5 w-5" />

      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                     rounded-full bg-white text-black text-[11px]
                     flex items-center justify-center font-semibold"
        >
          {count}
        </span>
      )}
    </button>
  );
}
