import {Link} from "react-router-dom";
import {motion} from "framer-motion";
import logo from "../../../assets/logo.png";
import {useCartWishlist} from "../../../components/cartcontext";

// Minimal chrome for the product page — just enough to get back home or
// into the cart — instead of the full shop nav + hero header, so buyers
// land straight on the product without scrolling past a repeat of what
// they just saw on the shop/home page.
export default function DetailHeader() {
  const {cartCount} = useCartWishlist();

  return (
    <div className="w-full bg-black border-b border-white/10 px-6 md:px-12 py-4 flex items-center justify-between">
      <Link to="/">
        <img src={logo} alt="BLVCKMRKT" className="h-8 w-auto object-contain" />
      </Link>
      <Link to="/cart" className="relative text-white/60 hover:text-white transition-colors">
        <motion.svg
          whileHover={{scale: 1.15}}
          whileTap={{scale: 0.9}}
          transition={{type: "spring", stiffness: 300}}
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </motion.svg>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
