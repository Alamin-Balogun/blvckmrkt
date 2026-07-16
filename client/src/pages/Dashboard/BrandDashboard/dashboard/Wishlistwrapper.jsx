// ─── WishlistWrapper.jsx ──────────────────────────────────────────────────────
// Drop this file next to Wishlist.jsx and use <WishlistWrapper> instead of
// <Wishlist> in your router/dashboard layout.
//
// It checks enable_wishlist from platform settings and either renders the real
// Wishlist or a friendly "disabled" message.

import {
  usePlatformSettings,
  DisabledFeature,
  MaintenanceBanner,
} from "../dashboard/dashboard_components/platformsettingscontext";
import Wishlist from "./Wishlist";

export default function WishlistWrapper(props) {
  const {settings} = usePlatformSettings();

  return (
    <div>
      <MaintenanceBanner />
      {settings.enable_wishlist === false ? (
        <DisabledFeature
          title="Wishlist Unavailable"
          reason="The wishlist feature has been temporarily disabled by the platform administrator."
        />
      ) : (
        <Wishlist {...props} />
      )}
    </div>
  );
}

// ─── ShopWrapper.jsx ──────────────────────────────────────────────────────────
// Same pattern for the Shop page — respects disable_purchases and enable_drops.
// Save as ShopWrapper.jsx next to Shop.jsx.

// import {usePlatformSettings, DisabledFeature, MaintenanceBanner} from "../dashboard/dashboard_components/PlatformSettingsContext";
// import Shop from "./Shop";
//
// export default function ShopWrapper(props) {
//   const {settings} = usePlatformSettings();
//
//   return (
//     <div>
//       <MaintenanceBanner />
//       {settings.disable_purchases === true ? (
//         <DisabledFeature
//           title="Shop Unavailable"
//           reason="Purchases are currently paused by the platform administrator. Please check back soon."
//         />
//       ) : (
//         // Pass settings down so Shop can optionally hide the Drops section
//         <Shop {...props} dropsEnabled={settings.enable_drops !== false} />
//       )}
//     </div>
//   );
// }
