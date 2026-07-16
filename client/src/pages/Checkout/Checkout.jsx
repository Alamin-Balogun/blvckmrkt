import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import CheckoutForm from "../Checkout/checkout_components/checkoutform";

export default function Checkout() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <CheckoutForm />
      <Footer />
    </div>
  );
}
