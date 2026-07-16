import Navbar from "../../components/navbar";
import HeroSlider from "./home_components/heroslider";
import FeatureCards from "./home_components/featurecards";
import PerksStrip from "./home_components/perksstrip";
import ProductShowcase from "./home_components/productshowcase";
import BrandsMarquee from "./home_components/brandsmarquee";
// import Testimonials from "./home_components/testimonials";
import FeaturedCollections from "./home_components/featuredcollections";
import PromoBanner from "./home_components/promobanner";
import SubscriptionPlans from "./home_components/subscriptionplans";
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
        <FeatureCards />
        <BrandsMarquee />
        <ProductShowcase />
        {/* <Testimonials /> */}
        <FeaturedCollections />
        <PromoBanner />
        <SubscriptionPlans />
        <BlogSection />
        <Services />
        <Newsletter />
        <Footer />
      </div>
    </HomeContentProvider>
  );
}
