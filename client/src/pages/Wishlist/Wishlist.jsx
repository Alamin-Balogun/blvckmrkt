import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import WishlistGrid from "../Wishlist/wishlist_component/wishlistgrid";

export default function Wishlist() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader
        title="My Wishlist"
        breadcrumb="Wishlist"
        image="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
      />
      <WishlistGrid />
      <Footer />
    </div>
  );
}
