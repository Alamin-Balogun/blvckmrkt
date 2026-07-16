import {useState} from "react";
import {useContactContent} from "./contactcontentcontext";
import {motion, AnimatePresence} from "framer-motion";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 13,
  padding: "12px 16px",
  outline: "none",
  transition: "border-color 0.2s",
  letterSpacing: "0.04em",
};

const labelStyle = {
  color: "rgba(255,255,255,0.45)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

export default function ContactForm() {
  const [form, setForm] = useState({name: "", email: "", subject: "", message: ""});
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ── CMS fields ─────────────────────────────────────────────────────────────
  const sectionTag = useContactContent("form_section_tag", "Get In Touch");
  const formTitle = useContactContent("form_title", "WE\'RE ALWAYS\nREADY TO");
  const formTitleRed = useContactContent("form_title_red", "HELP.");
  const formSubtitle = useContactContent(
    "form_subtitle",
    "Whether you have a question about a product, need help with an order, want to become a verified seller, or just want to reach out — drop us a message and we\'ll get back to you fast.",
  );
  const infoPhone = useContactContent("phone", "+234 801 234 5678");
  const infoEmail = useContactContent("email", "hello@blvckmrkt.com");
  const infoAddress = useContactContent("address", "14 Broad Street, Lagos Island, Nigeria");
  const hours1Day = useContactContent("hours1_day", "Mon – Fri");
  const hours1Time = useContactContent("hours1_time", "9:00am – 6:00pm");
  const hours2Day = useContactContent("hours2_day", "Saturday");
  const hours2Time = useContactContent("hours2_time", "10:00am – 3:00pm");
  const hours3Day = useContactContent("hours3_day", "Sunday");
  const hours3Time = useContactContent("hours3_time", "Closed");
  const instagramUrl = useContactContent("instagram", "#");
  const twitterUrl = useContactContent("twitter", "#");
  const tiktokUrl = useContactContent("tiktok", "#");
  const facebookUrl = useContactContent("facebook", "#");
  const submitBtnText = useContactContent("submit_btn_text", "Send Message");
  const successTitle = useContactContent("success_title", "MESSAGE SENT!");
  const successMsg = useContactContent(
    "success_msg",
    "We\'ve received your message and will get back to you within 24 hours.",
  );
  const sendAnotherText = useContactContent("send_another_text", "Send Another");

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.email && form.message) setSubmitted(true);
  };

  const socials = [
    {
      name: "Instagram",
      href: instagramUrl,
      d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    },
    {
      name: "X",
      href: twitterUrl,
      d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    },
    {
      name: "TikTok",
      href: tiktokUrl,
      d: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z",
    },
    {
      name: "YouTube",
      href: facebookUrl,
      d: "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
    },
  ];

  return (
    <section className="bg-[#0a0a0a] border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* ── Left: info + socials ── */}
          <motion.div
            initial={{opacity: 0, x: -30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true}}
            transition={{duration: 0.6}}>
            <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase block mb-3">
              {sectionTag}
            </span>
            <h2
              className="text-white font-black leading-none mb-5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                letterSpacing: "0.04em",
              }}>
              {formTitle.split("\n")[0]}
              <br />
              {formTitle.split("\n")[1] || ""} <span className="text-red-500">{formTitleRed}</span>
            </h2>
            <p className="text-white/40 text-[13px] leading-relaxed tracking-wide mb-10 max-w-md">
              {formSubtitle}
            </p>

            {/* Info rows */}
            <div className="flex flex-col gap-6 mb-10">
              {[
                {
                  icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                  label: "Call Now",
                  val: infoPhone,
                },
                {
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                  label: "Send Email",
                  val: infoEmail,
                },
                {
                  icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                  label: "Our Location",
                  val: infoAddress,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/25 text-[9px] font-bold tracking-[0.22em] uppercase mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-white text-[13px] tracking-wide">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Working hours */}
            <div className="border border-white/8 bg-black/40 px-6 py-5 mb-8">
              <p className="text-white font-bold text-[10px] tracking-[0.22em] uppercase mb-3">
                Working Hours
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  {day: hours1Day, hours: hours1Time},
                  {day: hours2Day, hours: hours2Time},
                  {day: hours3Day, hours: hours3Time},
                ].map((h) => (
                  <div key={h.day} className="flex items-center justify-between">
                    <span className="text-white/40 text-[12px]">{h.day}</span>
                    <span
                      className={`text-[12px] font-bold ${h.hours === "Closed" ? "text-red-500" : "text-white"}`}>
                      {h.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Socials */}
            <div>
              <p className="text-white/25 text-[9px] font-bold tracking-[0.22em] uppercase mb-3">
                Follow Us On
              </p>
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    title={s.name}
                    className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-500 hover:border-red-500/50 transition-all duration-200">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Right: form ── */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.1}}>
            <div className="border border-white/8 bg-black/40 p-8 md:p-10">
              <h3
                className="text-white font-black mb-6"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.06em",
                }}>
                DROP YOUR MESSAGE
              </h3>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    exit={{opacity: 0}}
                    style={{display: "flex", flexDirection: "column", gap: 20}}>
                    {/* Name + Email */}
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                      {[
                        {
                          name: "name",
                          label: "Your Name",
                          placeholder: "e.g. Dami Adeyemi",
                          type: "text",
                        },
                        {
                          name: "email",
                          label: "Email Address",
                          placeholder: "you@example.com",
                          type: "email",
                        },
                      ].map((f) => (
                        <div key={f.name}>
                          <label style={labelStyle}>{f.label}</label>
                          <input
                            type={f.type}
                            name={f.name}
                            required
                            placeholder={f.placeholder}
                            value={form[f.name]}
                            onChange={handleChange}
                            onFocus={() => setFocused(f.name)}
                            onBlur={() => setFocused(null)}
                            style={{
                              ...inputStyle,
                              borderColor:
                                focused === f.name
                                  ? "rgba(239,68,68,0.6)"
                                  : "rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Phone + Subject */}
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                      {[
                        {
                          name: "phone",
                          label: "Phone (optional)",
                          placeholder: "+234 800 000 0000",
                          type: "tel",
                        },
                        {
                          name: "subject",
                          label: "Subject",
                          placeholder: "e.g. Order enquiry",
                          type: "text",
                        },
                      ].map((f) => (
                        <div key={f.name}>
                          <label style={labelStyle}>{f.label}</label>
                          <input
                            type={f.type}
                            name={f.name}
                            placeholder={f.placeholder}
                            value={form[f.name] || ""}
                            onChange={handleChange}
                            onFocus={() => setFocused(f.name)}
                            onBlur={() => setFocused(null)}
                            style={{
                              ...inputStyle,
                              borderColor:
                                focused === f.name
                                  ? "rgba(239,68,68,0.6)"
                                  : "rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Message */}
                    <div>
                      <label style={labelStyle}>Message</label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        placeholder="Tell us what's on your mind..."
                        value={form.message}
                        onChange={handleChange}
                        onFocus={() => setFocused("message")}
                        onBlur={() => setFocused(null)}
                        style={{
                          ...inputStyle,
                          resize: "vertical",
                          borderColor:
                            focused === "message" ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.1)",
                          minHeight: 120,
                        }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="group relative overflow-hidden bg-white text-black text-[11px] font-black tracking-[0.25em] uppercase px-8 py-4 flex items-center justify-center gap-2 self-start hover:text-white transition-colors duration-200">
                      <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                      <span className="relative">{submitBtnText}</span>
                      <svg
                        className="relative w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{opacity: 0, scale: 0.95}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.4}}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "60px 0",
                      gap: 16,
                      textAlign: "center",
                    }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <svg
                        width="22"
                        height="22"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p
                      style={{
                        color: "#fff",
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1.6rem",
                        letterSpacing: "0.06em",
                      }}>
                      {successTitle}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 13,
                        maxWidth: 280,
                        lineHeight: 1.6,
                      }}>
                      {successMsg}
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({name: "", email: "", subject: "", message: ""});
                      }}
                      style={{
                        background: "none",
                        border: "1px solid rgba(239,68,68,0.4)",
                        color: "#ef4444",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        padding: "10px 24px",
                        cursor: "pointer",
                        marginTop: 8,
                        transition: "all 0.2s",
                      }}>
                      {sendAnotherText}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
