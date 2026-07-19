import GarmentViewer from "./GarmentViewer";

// The post-socials, normal-page counterpart to the animated hero/story
// sequence above — same garments, but static and manually explorable
// (drag to spin) rather than auto-playing, for visitors who scrolled past
// the cinematic intro and want to look again at their own pace.
export default function GarmentGallery({garments}) {
  if (!garments || garments.length === 0) return null;

  return (
    <div style={{marginBottom: 48}}>
      <p style={{
        color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
        textTransform: "uppercase", marginBottom: 20,
      }}>
        Explore The Collection
      </p>
      <div style={{display: "flex", flexWrap: "wrap", gap: 32}}>
        {garments.map((garment, i) => (
          <div key={i} style={{width: "clamp(140px, 26vw, 220px)"}}>
            <GarmentViewer angles={garment} interactive size="100%" />
          </div>
        ))}
      </div>
    </div>
  );
}
