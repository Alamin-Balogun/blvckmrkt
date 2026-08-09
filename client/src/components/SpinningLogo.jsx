import { useEffect } from "react";

// 1. npm install @google/model-viewer
//    (or drop this script tag once, e.g. in your index.html / root layout instead:
//     <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>)
// 2. Put blvckmrkt_logo_red_web.glb (and _white_web.glb) in your /public folder
// 3. <SpinningLogo /> anywhere in your JSX

export default function SpinningLogo({ color = "red", size = 320, style }) {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  const src =
    color === "white"
      ? "/blvckmrkt_logo_white_web.glb"
      : "/blvckmrkt_logo_red_web.glb";

  return (
    <model-viewer
      src={src}
      alt="BLVCKMRKT logo"
      auto-rotate
      auto-rotate-delay="0"
      rotation-per-second="30deg"
      disable-zoom
      disable-pan
      interaction-prompt="none"
      shadow-intensity="0"
      exposure="1.1"
      camera-orbit="0deg 75deg 105%"
      style={{ width: size, height: size, background: "transparent", pointerEvents: "none", ...style }}
    />
  );
}
