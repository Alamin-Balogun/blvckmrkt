import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import DropsGrid from "../Drops/drops_components/dropsgrid";
import {DropsContentProvider, useDropsContent} from "../Drops/drops_components/dropscontentcontext";

function DropsInner() {
  const pageTitle = useDropsContent("page_title", "Drops");
  const pageHeaderImage = useDropsContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <DropsGrid />
      <Footer />
    </div>
  );
}

export default function Drops() {
  return (
    <DropsContentProvider>
      <DropsInner />
    </DropsContentProvider>
  );
}
