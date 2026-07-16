import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import CartGrid from "./cart_components/cartgrid";

export default function Cart() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader
        title="Shopping Cart"
        breadcrumb="Cart"
        image="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80"
      />
      <CartGrid />
      <Footer />
    </div>
  );
}
