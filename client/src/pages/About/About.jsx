import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import AboutSection from "../About/about_components/aboutsection";
// import TeamSection from "../About/about_components/teamsection";
import WhyChooseUs from "../About/about_components/whychooseus";
import WorkingProcess from "../About/about_components/workingprocess";
import {AboutContentProvider, useAboutContent} from "../About/about_components/aboutcontentcontext";

function AboutInner() {
  const pageTitle = useAboutContent("page_title", "About Us");
  const pageHeaderImage = useAboutContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <AboutSection />
      {/* <TeamSection /> */}
      <WhyChooseUs />
      <WorkingProcess />
      <Footer />
    </div>
  );
}

export default function About() {
  return (
    <AboutContentProvider>
      <AboutInner />
    </AboutContentProvider>
  );
}
