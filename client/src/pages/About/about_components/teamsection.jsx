import {motion} from "framer-motion";
import {useAboutContent} from "./aboutcontentcontext";

const team = [
  {
    id: 1,
    name: "Dami Adeyemi",
    role: "Founder & CEO",
    bio: "Streetwear obsessive turned entrepreneur. Built BLVCKMRKT to solve the authenticity problem he faced as a buyer.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    socials: {instagram: "#", twitter: "#", linkedin: "#"},
  },
  {
    id: 2,
    name: "Zara Okonkwo",
    role: "Head of Operations",
    bio: "Keeps the platform running seamlessly. 8 years in e-commerce logistics, obsessed with seller experience.",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    socials: {instagram: "#", twitter: "#"},
  },
  {
    id: 3,
    name: "Kofi Mensah",
    role: "Head of Authentication",
    bio: "Former luxury goods verifier. If it's fake, Kofi will find it. Personally certified every policy on the platform.",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    socials: {instagram: "#", linkedin: "#"},
  },
  {
    id: 4,
    name: "Temi Balogun",
    role: "Creative Director",
    bio: "Visual identity, brand voice, every pixel you see. Temi makes sure BLVCKMRKT looks as good as what it sells.",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
    socials: {instagram: "#", twitter: "#", linkedin: "#"},
  },
  {
    id: 5,
    name: "Emeka Obi",
    role: "Lead Developer",
    bio: "Full-stack engineer who built the platform from the ground up. Speed, security, and seller tools are his obsession.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    socials: {twitter: "#", linkedin: "#"},
  },
  {
    id: 6,
    name: "Amara Diallo",
    role: "Community Manager",
    bio: "The voice of BLVCKMRKT. Manages seller relations, buyer support, and keeps the culture alive online.",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
    socials: {instagram: "#", twitter: "#"},
  },
  {
    id: 7,
    name: "Jide Fashola",
    role: "Head of Partnerships",
    bio: "Connects top brands to the platform. If your favourite label is on BLVCKMRKT, Jide made it happen.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    socials: {linkedin: "#", twitter: "#"},
  },
  {
    id: 8,
    name: "Nadia Essien",
    role: "Marketing Lead",
    bio: "Growth hacker and culture advocate. Responsible for the campaigns that actually make you stop scrolling.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    socials: {instagram: "#", twitter: "#", linkedin: "#"},
  },
];

const SOCIAL_PATHS = {
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

function SocialIcon({type, href}) {
  if (!SOCIAL_PATHS[type]) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-7 h-7 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-500 hover:border-red-500/50 transition-all duration-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d={SOCIAL_PATHS[type]} />
      </svg>
    </a>
  );
}

export default function TeamSection() {
  const headingLine1 = useAboutContent("team_heading_line1", "THE PEOPLE BEHIND");
  const headingLine2 = useAboutContent("team_heading_line2", "BLVCKMRKT");
  const subtitle = useAboutContent(
    "team_subtitle",
    "A crew of streetwear heads, tech builders, and culture advocates — united by one mission: making authentic streetwear accessible to everyone.",
  );

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-red-500/50" />
            <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
              Our Team
            </span>
            <div className="h-px w-10 bg-red-500/50" />
          </div>
          <h2
            className="text-white font-black leading-none mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            {headingLine1}
            <br />
            <span className="text-red-500">{headingLine2}</span>
          </h2>
          <p className="text-white/35 text-[13px] tracking-wide max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{opacity: 0, y: 28}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: "-40px"}}
              transition={{duration: 0.5, delay: i * 0.07}}
              className="group relative bg-[#0d0d0d] border border-white/8 hover:border-red-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col">
              <div className="relative overflow-hidden aspect-[3/3.5]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  style={{filter: "grayscale(20%)"}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block bg-red-500 text-white text-[9px] font-black tracking-[0.22em] uppercase px-3 py-1.5 rounded-full">
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3
                  className="text-white font-black leading-none mb-2 group-hover:text-red-500 transition-colors duration-300"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.2rem",
                    letterSpacing: "0.06em",
                  }}>
                  {member.name}
                </h3>
                <p className="text-white/35 text-[11px] leading-relaxed tracking-wide flex-1">
                  {member.bio}
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/8">
                  {Object.entries(member.socials).map(([type, href]) => (
                    <SocialIcon key={type} type={type} href={href} />
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-0 h-0 overflow-hidden group-hover:w-8 group-hover:h-8 transition-all duration-300">
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "32px solid #ef4444",
                    borderLeft: "32px solid transparent",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
