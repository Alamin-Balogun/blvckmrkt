import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import BlogGrid from "../Blog/blog_components/bloggrid";
import {BlogContentProvider, useBlogContent} from "../Blog/blog_components/blogcontentcontext";

function BlogInner() {
  const pageTitle = useBlogContent("page_title", "Blog");
  const pageHeaderImage = useBlogContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <BlogGrid />
      <Footer />
    </div>
  );
}

export default function Blog() {
  return (
    <BlogContentProvider>
      <BlogInner />
    </BlogContentProvider>
  );
}
