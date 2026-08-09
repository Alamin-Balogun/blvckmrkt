import Navbar from "../../components/navbar";
import HeroSlider from "./home_components/heroslider";
import FeatureCards from "./home_components/featurecards";
import PerksStrip from "./home_components/perksstrip";
import ProductSections from "./home_components/productsections";
import WantedBoard from "./home_components/wantedboard";
import TheVault from "./home_components/thevault";
// import Testimonials from "./home_components/testimonials";
import FeaturedCollections from "./home_components/featuredcollections";
import ProductShowcase from "./home_components/productshowcase";
import PromoBanner from "./home_components/promobanner";
import BlogSection from "./home_components/blogsection";
import Services from "./home_components/services";
import Newsletter from "../../components/newsletter";
import Footer from "../../components/footer";
import {HomeContentProvider} from "./home_components/homecontentcontext";

export default function Home() {
  return (
    <HomeContentProvider>
      <div className="bg-black min-h-screen">
        <Navbar />
        <HeroSlider />
        <PerksStrip />
        {/* Products come first on mobile so buyers don't have to scroll
            past the Drops/Brands/Culture trio to reach what they came for. */}
        <ProductSections />
        <TheVault />
        <FeatureCards />
        {/* <Testimonials /> */}
        <FeaturedCollections />
        <ProductShowcase />
        <PromoBanner />
        <BlogSection />
        <WantedBoard />
        <Services />
        <Newsletter />
        <Footer />
      </div>
    </HomeContentProvider>
  );
}
