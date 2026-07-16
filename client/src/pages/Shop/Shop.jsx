import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import ProductGrid from "../Shop/shop_components/productgrid";
import NewlyDropped from "../Shop/shop_components/newlydropped";
import {ShopContentProvider, useShopContent} from "../Shop/shop_components/shopcontentcontext";

function ShopInner() {
  const pageTitle = useShopContent("page_title", "Shop");
  const pageHeaderImage = useShopContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <ProductGrid />
      <NewlyDropped />
      <Footer />
    </div>
  );
}

export default function Shop() {
  return (
    <ShopContentProvider>
      <ShopInner />
    </ShopContentProvider>
  );
}
