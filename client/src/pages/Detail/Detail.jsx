import Footer from "../../components/footer";
import DetailHeader from "../Detail/detail_components/detailheader";
import ProductDetail from "../Detail/detail_components/productdetail";

export default function ProductDetailPage() {
  return (
    <div className="bg-black min-h-screen">
      <DetailHeader />
      <ProductDetail />
      <Footer />
    </div>
  );
}
