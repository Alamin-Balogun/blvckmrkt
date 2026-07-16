import {motion} from "framer-motion";
import {useContactContent} from "./contactcontentcontext";

const ADDRESS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const PHONE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const EMAIL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function ContactInfo() {
  const address = useContactContent("address", "14 Broad Street, Lagos Island, Lagos, Nigeria");
  const phone = useContactContent("phone", "+234 801 234 5678");
  const phone2 = useContactContent("phone2", "+1 (800) 255-9638");
  const email = useContactContent("email", "hello@blvckmrkt.com");
  const email2 = useContactContent("email2", "support@blvckmrkt.com");
  const mapsUrl = useContactContent("maps_url", "https://maps.google.com");
  const phoneHours = useContactContent("phone_hours", "Mon–Fri, 9am–6pm");
  const emailReply = useContactContent("email_reply", "We reply within 24hrs");

  const cards = [
    {
      icon: ADDRESS_ICON,
      title: "Visit Us",
      lines: address.split(",").reduce(
        (acc, part, i, arr) => {
          if (i === 0) return [part + ","];
          if (i === 1) return [...acc, part.trim() + (arr[2] ? "," : "")];
          return [...acc.slice(0, -1), acc[acc.length - 1] + " " + part.trim()];
        },
        [address],
      ),
      link: {label: "Get Directions", href: mapsUrl},
    },
    {
      icon: PHONE_ICON,
      title: "Call Us",
      lines: [phone, phone2].filter(Boolean),
      link: {label: phoneHours, href: `tel:${phone.replace(/\s/g, "")}`},
    },
    {
      icon: EMAIL_ICON,
      title: "Email Us",
      lines: [email, email2].filter(Boolean),
      link: {label: emailReply, href: `mailto:${email}`},
    },
  ];

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: "-40px"}}
              transition={{duration: 0.5, delay: i * 0.1}}
              className="group bg-black hover:bg-[#0d0d0d] transition-colors duration-300 p-10 flex flex-col items-center text-center gap-5">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full border border-white/10 group-hover:border-red-500/50 flex items-center justify-center text-white/40 group-hover:text-red-500 transition-all duration-300">
                {card.icon}
              </div>

              {/* Title */}
              <h3
                className="text-white font-black"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.3rem",
                  letterSpacing: "0.1em",
                }}>
                {card.title}
              </h3>

              {/* Lines */}
              <div className="flex flex-col gap-1">
                {card.lines.map((l) => (
                  <p key={l} className="text-white/40 text-[13px] leading-relaxed tracking-wide">
                    {l}
                  </p>
                ))}
              </div>

              {/* Link */}
              <a
                href={card.link.href}
                target={card.link.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-red-500 hover:text-white text-[10px] font-black tracking-[0.22em] uppercase transition-colors duration-200 flex items-center gap-1.5">
                {card.link.label}
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
