import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import ProductDetail from "../Detail/detail_components/productdetail";

export default function ProductDetailPage() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader
        title="THE PRODUCT"
        breadcrumb="Shop"
        image="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=80"
      />
      <ProductDetail />
      <Footer />
    </div>
  );
}
