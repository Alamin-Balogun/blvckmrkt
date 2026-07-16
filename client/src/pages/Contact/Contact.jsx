import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import ContactInfo from "../Contact/contact_components/contactinfo";
import ContactForm from "../Contact/contact_components/contactform";
import ContactMap from "../Contact/contact_components/contactmap";
import Newsletter from "../../components/newsletter";
import {
  ContactContentProvider,
  useContactContent,
} from "../Contact/contact_components/contactcontentcontext";

function ContactInner() {
  const pageTitle = useContactContent("page_title", "Contact Us");
  const pageHeaderImage = useContactContent(
    "page_header_image",
    "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80",
  );

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <PageHeader title={pageTitle} breadcrumb={pageTitle} image={pageHeaderImage} />
      <ContactInfo />
      <ContactForm />
      <ContactMap />
      <Newsletter />
      <Footer />
    </div>
  );
}

export default function Contact() {
  return (
    <ContactContentProvider>
      <ContactInner />
    </ContactContentProvider>
  );
}
