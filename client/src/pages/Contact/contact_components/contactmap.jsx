import {useContactContent} from "./contactcontentcontext";

export default function ContactMap() {
  const mapSectionTag = useContactContent("map_section_tag", "Find Us");
  const mapHeading = useContactContent("map_heading", "OUR LOCATION");
  const mapsUrl = useContactContent("maps_url", "https://maps.google.com");
  const mapEmbed = useContactContent(
    "map_embed_url",
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7286442669593!2d3.391!3d6.448!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos%20Island%2C%20Lagos!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng",
  );

  return (
    <section className="bg-black border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase block mb-1">
              {mapSectionTag}
            </span>
            <h3
              className="text-white font-black"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.06em",
              }}>
              {mapHeading}
            </h3>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden sm:flex items-center gap-1.5 text-white/30 hover:text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-200">
            Open in Maps
            <svg
              className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* Map embed */}
        <div
          className="relative w-full overflow-hidden border border-white/8"
          style={{height: 380}}>
          <iframe
            title="BLVCKMRKT Location"
            src={mapEmbed}
            width="100%"
            height="100%"
            style={{border: 0, filter: "invert(90%) hue-rotate(180deg) grayscale(30%)"}}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Dark overlay for branding */}
          <div className="absolute inset-0 pointer-events-none border border-white/8" />
        </div>
      </div>
    </section>
  );
}
