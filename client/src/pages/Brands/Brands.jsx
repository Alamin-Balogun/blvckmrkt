import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import BrandsPage from "../Brands/brands_components/brandspage";
import {
  BrandsContentProvider,
  useBrandsContent,
} from "../Brands/brands_components/brandscontentcontext";

function BrandsInner() {
  const pageTitle = useBrandsContent("page_title", "Brands");
  const pageHeaderImage = useBrandsContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <BrandsPage />
      <Footer />
    </div>
  );
}

export default function Brands() {
  return (
    <BrandsContentProvider>
      <BrandsInner />
    </BrandsContentProvider>
  );
}
