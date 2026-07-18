import {useState, useEffect} from "react";
import {AnimatePresence} from "framer-motion";
import {
  getBrandProfile,
  updateBrandProfile,
  deleteBrandAccount,
} from "./dashboard_components/api";
import ImageUpload from "../../../../components/ImageUpload";
import PhoneInput from "../../../../components/phoneinput";
import { useGeo } from "../../../../utils/geo";

const BASE = "https://blvckmrktng.com/api";
function token() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

const inp = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 13,
  padding: "12px 14px",
  borderRadius: 9,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};
const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function Label({c}) {
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 6,
      }}>
      {c}
    </label>
  );
}

function Toast({msg, ok}) {
  if (!msg) return null;
  return (
    <div
      style={{
        background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        borderRadius: 9,
        padding: "10px 14px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
      {ok ? (
        <svg width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span style={{color: ok ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600}}>{msg}</span>
    </div>
  );
}

const CATEGORIES = [
  "Streetwear",
  "Sneakers",
  "Accessories",
  "Outerwear",
  "Bottoms",
  "Tops",
  "Headwear",
  "Bags",
  "Jewellery",
  "Vintage",
  "Other",
];


// ─── Main Settings Component ──────────────────────────────────────────────────
export default function Settings({onBrandUpdate}) {
  const { Country, State, City, loaded } = useGeo();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg]           = useState(null);
  const [socialMsg, setSocialMsg]   = useState(null);
  const [phoneValid, setPhoneValid] = useState(true);

  const [form, setForm] = useState({
    first_name:   "",
    last_name:    "",
    email:        "",
    avatar_url:   "",
    brand_name:   "",
    category:     "Streetwear",
    description:  "",
    logo_url:     "",
    banner_url:   "",
    hero_left_image_url:   "",
    hero_center_image_url: "",
    hero_right_image_url:  "",
    story_line_1: "",
    story_line_2: "",
    story_line_3: "",
    website:      "",
    instagram:    "",
    facebook:     "",
    twitter:      "",
    // ✅ FIX: DB column is tik_tok — use tik_tok as the key throughout
    tik_tok:      "",
    phone:        "",
    country_code: "",
    country_name: "",
    state_code:   "",
    state_name:   "",
    city:         "",
  });

  const [pw, setPw] = useState({current: "", newPass: "", confirm: ""});

  useEffect(() => {
    getBrandProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          first_name:   p.first_name   || "",
          last_name:    p.last_name    || "",
          email:        p.email        || "",
          avatar_url:   p.avatar_url   || "",
          brand_name:   p.brand_name   || p.name || "",
          category:     p.category     || "Streetwear",
          description:  p.description  || "",
          logo_url:     p.logo_url     || "",
          banner_url:   p.banner_url   || "",
          hero_left_image_url:   p.hero_left_image_url   || "",
          hero_center_image_url: p.hero_center_image_url || "",
          hero_right_image_url:  p.hero_right_image_url  || "",
          story_line_1: p.story_line_1 || "",
          story_line_2: p.story_line_2 || "",
          story_line_3: p.story_line_3 || "",
          website:      p.website      || "",
          instagram:    p.instagram    || "",
          facebook:     p.facebook     || "",
          twitter:      p.twitter      || "",
          // ✅ FIX: read from both possible keys the API might return
          tik_tok:      p.tik_tok || p.tiktok || "",
          phone:        p.phone        || "",
          country_code: p.country_code || "",
          country_name: p.country_name || "",
          state_code:   p.state_code   || "",
          state_name:   p.state_name   || "",
          city:         p.city         || "",
        });
      })
      .catch((e) => setProfileMsg({msg: "Failed to load profile: " + e.message, ok: false}))
      .finally(() => setLoading(false));
  }, []);

  const flash = (setter, msg, ok, delay = 4000) => {
    setter({msg, ok});
    setTimeout(() => setter(null), delay);
  };

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));

  const handleSaveProfile = async () => {
    console.log("FULL FORM:", JSON.stringify(form, null, 2));
    if (!phoneValid) {
      return flash(setProfileMsg, "Please enter a valid phone number before saving.", false, 5000);
    }
    setSaving(true);
    setProfileMsg(null);
    try {
      const payload = {
        // Personal
        first_name:   form.first_name,
        last_name:    form.last_name,
        email:        form.email,
        avatar_url:   form.avatar_url,
        // Brand
        name:         form.brand_name,
        brand_name:   form.brand_name,
        category:     form.category,
        description:  form.description,
        logo_url:     form.logo_url,
        banner_url:   form.banner_url,
        hero_left_image_url:   form.hero_left_image_url,
        hero_center_image_url: form.hero_center_image_url,
        hero_right_image_url:  form.hero_right_image_url,
        story_line_1: form.story_line_1,
        story_line_2: form.story_line_2,
        story_line_3: form.story_line_3,
        website:      form.website,
        phone:        form.phone,
        // Location
        country_code: form.country_code,
        country_name: form.country_name,
        state_code:   form.state_code,
        state_name:   form.state_name,
        city:         form.city,
        // Social — send both keys so the backend accepts whichever it expects
        instagram:    form.instagram,
        facebook:     form.facebook,
        twitter:      form.twitter,
        tik_tok:      form.tik_tok,   // ✅ matches DB column name
        tiktok:       form.tik_tok,   // ✅ also send as tiktok in case API uses that key
      };
      const updated = await updateBrandProfile(payload);
      if (updated) {
        setProfile(updated);
        setForm((prev) => ({
          ...prev,
          first_name:   updated.first_name   ?? prev.first_name,
          last_name:    updated.last_name     ?? prev.last_name,
          email:        updated.email         ?? prev.email,
          avatar_url:   updated.avatar_url    ?? prev.avatar_url,
          brand_name:   updated.brand_name    ?? updated.name ?? prev.brand_name,
          category:     updated.category      ?? prev.category,
          description:  updated.description   ?? prev.description,
          logo_url:     updated.logo_url       ?? prev.logo_url,
          banner_url:   updated.banner_url     ?? prev.banner_url,
          hero_left_image_url:   updated.hero_left_image_url   ?? prev.hero_left_image_url,
          hero_center_image_url: updated.hero_center_image_url ?? prev.hero_center_image_url,
          hero_right_image_url:  updated.hero_right_image_url  ?? prev.hero_right_image_url,
          story_line_1: updated.story_line_1 ?? prev.story_line_1,
          story_line_2: updated.story_line_2 ?? prev.story_line_2,
          story_line_3: updated.story_line_3 ?? prev.story_line_3,
          website:      updated.website        ?? prev.website,
          instagram:    updated.instagram      ?? prev.instagram,
          facebook:     updated.facebook       ?? prev.facebook,
          twitter:      updated.twitter        ?? prev.twitter,
          tik_tok:      updated.tik_tok  ?? updated.tiktok ?? prev.tik_tok,
          phone:        updated.phone          ?? prev.phone,
          country_code: updated.country_code   ?? prev.country_code,
          country_name: updated.country_name   ?? prev.country_name,
          state_code:   updated.state_code     ?? prev.state_code,
          state_name:   updated.state_name     ?? prev.state_name,
          city:         updated.city           ?? prev.city,
        }));
        onBrandUpdate?.(updated);
      }
      flash(setProfileMsg, "Profile updated successfully.", true);
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e?.message || e?.error || e?.detail || "Failed to update profile. Please try again.";
      flash(setProfileMsg, msg, false);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pw.current || !pw.newPass || !pw.confirm)
      return flash(setPwMsg, "All fields are required.", false);
    if (pw.newPass !== pw.confirm) return flash(setPwMsg, "New passwords don't match.", false);
    if (pw.newPass.length < 8)
      return flash(setPwMsg, "New password must be at least 8 characters.", false);
    setSavingPw(true);
    try {
      const res = await fetch(`${BASE}/auth/change-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${token()}`},
        body: JSON.stringify({current_password: pw.current, new_password: pw.newPass}),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Incorrect current password.");
      }
      setPw({current: "", newPass: "", confirm: ""});
      flash(setPwMsg, "Password updated successfully.", true);
    } catch (e) {
      flash(setPwMsg, e.message || "Failed to change password.", false);
    } finally {
      setSavingPw(false);
    }
  };

  const handleSaveSocial = async () => {
    setSocialMsg(null);
    setSavingSocial(true);
    try {
      const updated = await updateBrandProfile({
        instagram: form.instagram,
        facebook:  form.facebook,
        twitter:   form.twitter,
        tik_tok:   form.tik_tok,  // ✅ matches DB column
        tiktok:    form.tik_tok,  // ✅ also send as tiktok for API compatibility
      });
      if (updated) {
        setProfile(updated);
        // ✅ Update local form state with whatever key the API returns
        setForm((prev) => ({
          ...prev,
          instagram: updated.instagram ?? prev.instagram,
          facebook:  updated.facebook  ?? prev.facebook,
          twitter:   updated.twitter   ?? prev.twitter,
          tik_tok:   updated.tik_tok ?? updated.tiktok ?? prev.tik_tok,
        }));
        onBrandUpdate?.(updated);
      }
      flash(setSocialMsg, "Social handles updated successfully.", true);
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e?.message || e?.error || e?.detail || "Failed to update social handles. Please try again.";
      flash(setSocialMsg, msg, false);
    } finally {
      setSavingSocial(false);
    }
  };

  if (loading)
    return (
      <div style={{display: "flex", flexDirection: "column", gap: 14}}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        {[180, 260, 140].map((h, i) => (
          <div key={i} style={{height: h, background: "#0d0d0d", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", animation: "pulse 1.4s infinite"}} />
        ))}
      </div>
    );

  const brandInitial = (form.brand_name[0] || "B").toUpperCase();

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .bs-top-row{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;margin-bottom:16px;}
        .bs-name-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
        .bs-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:860px){.bs-top-row{grid-template-columns:1fr!important;}}
        .bs-steplabel{display:inline;}
        @media(max-width:520px){.bs-name-row,.bs-2col{grid-template-columns:1fr!important;}.bs-steplabel{display:none!important;}}
        select option { background: #111 !important; color: #fff !important; }
        select option:checked { background: #ef4444 !important; color: #fff !important; }
      `}</style>

      <div style={{marginBottom: 24}}>
        <h2 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "#fff", letterSpacing: "0.04em", margin: "0 0 4px"}}>
          SETTINGS
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          Manage your brand profile, security, and account settings.
        </p>
      </div>

      <div className="bs-top-row">
        {/* ── Brand Profile ── */}
        <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
            <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block", borderRadius: 2}} />
            Brand Profile
          </p>

          {profileMsg && <Toast msg={profileMsg.msg} ok={profileMsg.ok} />}

          {/* Personal Info */}
          <div style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 16}}>
            <p style={{color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block"}} />
              Personal Info
            </p>
            <div style={{marginBottom: 14}}>
              <Label c="Profile Photo" />
              <div style={{display: "flex", gap: 14, alignItems: "center"}}>
                <div style={{width: 52, height: 52, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: "rgba(255,255,255,0.4)", border: "2px solid rgba(255,255,255,0.1)"}}>
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                  ) : (
                    ((form.first_name[0] || "U") + (form.last_name[0] || "")).toUpperCase()
                  )}
                </div>
                <ImageUpload
                  folder="avatars"
                  shape="circle"
                  label="Upload Photo"
                  preview={form.avatar_url}
                  onUpload={(url) => setForm((f) => ({...f, avatar_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Your personal profile photo.<br />Shown in sidebar &amp; topbar.
                </p>
              </div>
            </div>
            <div className="bs-name-row">
              <div>
                <Label c="First Name" />
                <input value={form.first_name} onChange={set("first_name")} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="Last Name" />
                <input value={form.last_name} onChange={set("last_name")} style={inp} onFocus={onF} onBlur={onB} />
              </div>
            </div>
            <div>
              <Label c="Email Address" />
              <input type="email" value={form.email} onChange={set("email")} style={inp} onFocus={onF} onBlur={onB} />
            </div>
          </div>

          {/* Brand Info */}
          <div style={{background: "rgba(239,68,68,0.02)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: 10, padding: "14px 16px", marginBottom: 16}}>
            <p style={{color: "rgba(239,68,68,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block"}} />
              Brand Info
            </p>

            {/* Logo */}
            <div style={{marginBottom: 14}}>
              <Label c="Brand Logo" />
              <div style={{display: "flex", gap: 14, alignItems: "center"}}>
                <div style={{width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#ef4444,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "#fff", border: "2px solid rgba(255,255,255,0.1)"}}>
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                  ) : brandInitial}
                </div>
                <ImageUpload
                  folder="logos"
                  shape="square"
                  label="Upload Logo"
                  preview={form.logo_url}
                  onUpload={(url) => setForm((f) => ({...f, logo_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Brand logo for your<br />storefront page.
                </p>
              </div>
            </div>

            {/* Banner */}
            <div style={{marginBottom: 14}}>
              <Label c="Brand Banner" />
              <div style={{marginBottom: 8, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", height: 80, position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
                {form.banner_url ? (
                  <img src={form.banner_url} alt="banner" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                ) : (
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
                    No banner uploaded — storefront will show a gradient
                  </p>
                )}
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <ImageUpload
                  folder="banners"
                  shape="square"
                  label="Upload Banner"
                  preview={form.banner_url}
                  onUpload={(url) => setForm((f) => ({...f, banner_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Wide banner for your storefront header. Recommended: 1200×400px.
                </p>
              </div>
            </div>

            {/* Hero Showcase */}
            <div style={{marginBottom: 14}}>
              <Label c="Hero Showcase" />
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: "0 0 12px"}}>
                Upload up to 3 product photos for an animated showcase on your storefront, replacing the plain banner above.
                The center image is required for the showcase to appear — left/right are optional.
              </p>
              <div className="bs-2col" style={{gap: 12, marginBottom: 12}}>
                {[
                  {key: "hero_left_image_url", label: "Left Image"},
                  {key: "hero_center_image_url", label: "Center Image (required)"},
                  {key: "hero_right_image_url", label: "Right Image"},
                ].map(({key, label}) => (
                  <div key={key}>
                    <div style={{marginBottom: 8, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", height: 70, position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
                      {form[key] ? (
                        <img src={form[key]} alt={label} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                      ) : (
                        <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0, textAlign: "center", padding: "0 8px"}}>
                          {label}
                        </p>
                      )}
                    </div>
                    <ImageUpload
                      folder="brand-hero"
                      shape="square"
                      label="Upload"
                      preview={form[key]}
                      onUpload={(url) => setForm((f) => ({...f, [key]: url}))}
                    />
                  </div>
                ))}
              </div>
              {[
                {key: "story_line_1", placeholder: "Crafted for the streets."},
                {key: "story_line_2", placeholder: "Made to move with you."},
                {key: "story_line_3", placeholder: "Wear it your way."},
              ].map(({key, placeholder}, i) => (
                <div key={key} style={{marginBottom: 8}}>
                  <Label c={`Story Line ${i + 1} (optional)`} />
                  <input value={form[key]} onChange={set(key)} placeholder={placeholder} style={inp} onFocus={onF} onBlur={onB} />
                </div>
              ))}
            </div>

            <div style={{marginBottom: 10}}>
              <Label c="Brand Name" />
              <input value={form.brand_name} onChange={set("brand_name")} style={inp} onFocus={onF} onBlur={onB} />
            </div>

            <div className="bs-2col" style={{marginBottom: 10}}>
              <div>
                <Label c="Category" />
                <select value={form.category} onChange={set("category")} style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark"}}>
                  {CATEGORIES.map((c) => (
                    <option key={c} style={{background: "#1a1a1a", color: "#fff"}}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label c="Verification Status" />
                <div style={{...inp, display: "flex", alignItems: "center", gap: 8, cursor: "default", pointerEvents: "none", color: profile?.verification_status === "verified" ? "#22c55e" : profile?.verification_status === "rejected" ? "#ef4444" : "#f97316"}}>
                  <div style={{width: 7, height: 7, borderRadius: "50%", background: profile?.verification_status === "verified" ? "#22c55e" : profile?.verification_status === "rejected" ? "#ef4444" : "#f97316", flexShrink: 0}} />
                  <span style={{fontSize: 12, fontWeight: 700, textTransform: "capitalize"}}>
                    {profile?.verification_status || "Pending"}
                  </span>
                </div>
                {(!profile?.verification_status || profile.verification_status === "pending") && (
                  <div style={{marginTop: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8, alignItems: "flex-start"}}>
                    <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0, marginTop: 1}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{color: "rgba(245,158,11,0.85)", fontSize: 11, margin: 0, lineHeight: 1.6}}>
                      Verification is reviewed by our team. Keep your profile complete to speed up approval.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div style={{background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 10, padding: "14px 16px", marginBottom: 14}}>
              <p style={{color: "rgba(99,102,241,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
                <svg width="10" height="10" fill="none" stroke="rgba(99,102,241,0.7)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
                <span style={{color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10}}>
                  {" "}— used for currency detection
                </span>
              </p>
              <div style={{marginBottom: 10}}>
                <Label c="Country" />
                <select
                  value={form.country_code}
                  onChange={(e) => {
                    const c = loaded ? Country.getCountryByCode(e.target.value) : null;
                    setForm((f) => ({...f, country_code: e.target.value, country_name: c?.name || "", state_code: "", state_name: "", city: ""}));
                  }}
                  style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                  onFocus={onF} onBlur={onB}>
                  <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select country…</option>
                  {(loaded ? Country.getAllCountries() : []).map((c) => (
                    <option key={c.isoCode} value={c.isoCode} style={{background: "#111", color: "#fff"}}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              {form.country_code && (
                <div style={{marginBottom: 10}}>
                  <Label c="State / Region" />
                  <select
                    value={form.state_code}
                    onChange={(e) => {
                      const s = loaded ? State.getStateByCodeAndCountry(e.target.value, form.country_code) : null;
                      setForm((f) => ({...f, state_code: e.target.value, state_name: s?.name || "", city: ""}));
                    }}
                    style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                    onFocus={onF} onBlur={onB}>
                    <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select state…</option>
                    {(loaded ? State.getStatesOfCountry(form.country_code) : []).map((s) => (
                      <option key={s.isoCode} value={s.isoCode} style={{background: "#111", color: "#fff"}}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.state_code && (
                <div>
                  <Label c="City (optional)" />
                  {(loaded ? City.getCitiesOfState(form.country_code, form.state_code) : []).length > 0 ? (
                    <select
                      value={form.city}
                      onChange={(e) => setForm((f) => ({...f, city: e.target.value}))}
                      style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                      onFocus={onF} onBlur={onB}>
                      <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select city…</option>
                      {(loaded ? City.getCitiesOfState(form.country_code, form.state_code) : []).map((c) => (
                        <option key={c.name} value={c.name} style={{background: "#111", color: "#fff"}}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.city} onChange={(e) => setForm((f) => ({...f, city: e.target.value}))} style={inp} placeholder="Type city name…" onFocus={onF} onBlur={onB} />
                  )}
                </div>
              )}
              {form.country_name && (
                <p style={{color: "rgba(99,102,241,0.5)", fontSize: 10, margin: "10px 0 0"}}>
                  📍 {[form.city, form.state_name, form.country_name].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="bs-2col" style={{marginBottom: 10}}>
              <div>
                <Label c="Contact Phone" />
                <PhoneInput
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({...f, phone: v}))}
                  onValidChange={(ok) => setPhoneValid(ok)}
                />
              </div>
              <div>
                <Label c="Website" />
                <input value={form.website} onChange={set("website")} style={inp} onFocus={onF} onBlur={onB} placeholder="https://…" />
              </div>
            </div>

            <div style={{marginBottom: 10}}>
              <Label c="Brand Description" />
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                style={{...inp, resize: "vertical", lineHeight: 1.6}}
                onFocus={onF} onBlur={onB}
                placeholder="Tell buyers what your brand is about…"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{background: saving ? "#7f1d1d" : "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", transition: "background 0.18s", display: "flex", alignItems: "center", gap: 8}}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#ef4444"; }}>
            {saving && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ── Right Column ── */}
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          {/* Change Password */}
          <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
              <span style={{width: 3, height: 14, background: "#6366f1", display: "inline-block", borderRadius: 2}} />
              Change Password
            </p>
            {pwMsg && <Toast msg={pwMsg.msg} ok={pwMsg.ok} />}
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 16}}>
              <div>
                <Label c="Current Password" />
                <input type="password" value={pw.current} onChange={(e) => setPw((p) => ({...p, current: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="New Password" />
                <input type="password" placeholder="Min. 8 characters" value={pw.newPass} onChange={(e) => setPw((p) => ({...p, newPass: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="Confirm New Password" />
                <input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({...p, confirm: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPw}
              style={{width: "100%", background: savingPw ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)", color: savingPw ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: savingPw ? "not-allowed" : "pointer", transition: "all 0.18s"}}
              onMouseEnter={(e) => { if (!savingPw) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </div>

          {/* Social Media Handles */}
          <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
              <span style={{width: 3, height: 14, background: "#06b6d4", display: "inline-block", borderRadius: 2}} />
              Social Media Handles
            </p>
            {socialMsg && <Toast msg={socialMsg.msg} ok={socialMsg.ok} />}
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {[
                {
                  key: "instagram",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  ),
                  placeholder: "instagram",
                },
                {
                  key: "facebook",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  ),
                  placeholder: "facebook",
                },
                {
                  key: "twitter",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  placeholder: "twitter / X",
                },
                {
                  // ✅ FIX: key changed from "tiktok" to "tik_tok" to match form state and DB
                  key: "tik_tok",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                    </svg>
                  ),
                  placeholder: "tiktok",
                },
              ].map(({key, icon, placeholder}) => (
                <div key={key} style={{position: "relative"}}>
                  <span style={{position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 4}}>
                    {icon}
                    <span style={{color: "rgba(255,255,255,0.25)", fontSize: 12}}>@</span>
                  </span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({...f, [key]: e.target.value.replace("@", "")}))}
                    style={{...inp, paddingLeft: 44}}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveSocial}
              disabled={savingSocial}
              style={{width: "100%", marginTop: 14, background: savingSocial ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.1)", color: savingSocial ? "rgba(6,182,212,0.4)" : "rgba(6,182,212,0.85)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: savingSocial ? "not-allowed" : "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8}}
              onMouseEnter={(e) => { if (!savingSocial) { e.currentTarget.style.background = "rgba(6,182,212,0.18)"; e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)"; }}}
              onMouseLeave={(e) => { if (!savingSocial) { e.currentTarget.style.background = "rgba(6,182,212,0.1)"; e.currentTarget.style.color = "rgba(6,182,212,0.85)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; }}}>
              {savingSocial && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
              )}
              {savingSocial ? "Saving..." : "Save Social Handles"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div style={{background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "22px 24px"}}>
        <p style={{color: "rgba(239,68,68,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10}}>
          Danger Zone
        </p>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 16, lineHeight: 1.6}}>
          Once you delete your brand account, all your products, orders, analytics, and storefront
          data will be permanently removed. This cannot be undone.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 20px", borderRadius: 8, cursor: "pointer", transition: "all 0.18s"}}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}>
            Delete Brand Account
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{opacity: 0, y: -6}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              style={{background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "16px"}}>
              <p style={{color: "#ef4444", fontSize: 12, fontWeight: 700, margin: "0 0 12px"}}>
                Are you absolutely sure? This cannot be undone.
              </p>
              {deleteError && (
                <p style={{color: "#ef4444", fontSize: 11, marginBottom: 10, fontWeight: 600}}>{deleteError}</p>
              )}
              <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError("");
                    try {
                      await deleteBrandAccount();
                      localStorage.removeItem("blvck_token");
                      sessionStorage.removeItem("blvck_token");
                      window.location.href = "/";
                    } catch (e) {
                      setDeleteError(e.message || "Failed to delete account. Please try again.");
                      setDeleting(false);
                    }
                  }}
                  style={{background: deleting ? "#7f1d1d" : "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer", transition: "background 0.18s", display: "flex", alignItems: "center", gap: 7}}
                  onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#dc2626"; }}
                  onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = deleting ? "#7f1d1d" : "#ef4444"; }}>
                  {deleting && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                  )}
                  {deleting ? "Deleting..." : "Yes, Delete My Brand"}
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  style={{background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.18s"}}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}