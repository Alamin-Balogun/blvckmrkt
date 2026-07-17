import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { AuthProvider } from "./pages/Auth/context/authcontext";
import { Navigate } from "react-router-dom";
import { useAuth } from "./pages/Auth/context/authcontext";

import DashboardFAB from "./components/DashboardFAB";
import VisitTracker from "./components/visittracker";

function DashboardGuard({ children, required, redirect }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const isBrand = user.account_type === "brand";
  const needsBrand = required === "brand";
  if (needsBrand && !isBrand) return <Navigate to={redirect} replace />;
  if (!needsBrand && isBrand) return <Navigate to={redirect} replace />;
  return children;
}
import { CartWishlistProvider } from "./components/cartcontext";
import { CurrencyProvider } from "./components/currencycontext";

// ✅ ALL pages are now lazy loaded — each page only downloads when visited
const Home                   = lazy(() => import("./pages/Home/Home"));
const Shop                   = lazy(() => import("./pages/Shop/Shop"));
const Cart                   = lazy(() => import("./pages/Cart/Cart"));
const Wishlist               = lazy(() => import("./pages/Wishlist/Wishlist"));
const Sell                   = lazy(() => import("./pages/Sell"));
const About                  = lazy(() => import("./pages/About/About"));
const Contact                = lazy(() => import("./pages/Contact/Contact"));
const Blog                   = lazy(() => import("./pages/Blog/Blog"));
const BlogPost               = lazy(() => import("./pages/Blog/blog_components/blogpost"));
const Brands                 = lazy(() => import("./pages/Brands/Brands"));
const BrandProfile           = lazy(() => import("./pages/Brands/BrandProfile"));
const Drops                  = lazy(() => import("./pages/Drops/Drops"));
const Detail                 = lazy(() => import("./pages/Detail/Detail"));
const Checkout               = lazy(() => import("./pages/Checkout/Checkout"));
const PaymentCallback        = lazy(() => import("./pages/PaymentCallback/PaymentCallback"));
const AuthPage               = lazy(() => import("./pages/Auth/Authpage"));
const Terms                  = lazy(() => import("./pages/TermsPrivacy/Termspage"));
const Privacy                = lazy(() => import("./pages/TermsPrivacy/Privacypage"));
const Authentication         = lazy(() => import("./pages/TermsPrivacy/Authenticationpage"));
const Return                 = lazy(() => import("./pages/TermsPrivacy/Returnpage"));
const Brandpartnershipagreement = lazy(() => import("./pages/TermsPrivacy/Brandpartnershipagreement"));
const Shippingpolicy         = lazy(() => import("./pages/TermsPrivacy/Shippingpolicypage"));
const AdminDashboard         = lazy(() => import("./pages/Dashboard/AdminDashboard/dashboard/Admin"));
const BuyerDashboard         = lazy(() => import("./pages/Dashboard/BuyerDashboard/dashboard/Buyer"));
const BrandUpgradeForm       = lazy(() => import("./pages/Upgrade/BrandUpgradeForm"));
const BrandDashboard         = lazy(() => import("./pages/Dashboard/BrandDashboard/dashboard/Brand"));

// ✅ Loading screen shown while any page chunk is downloading
function PageLoader() {
  return (
    <div style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    }}>
      {/* Spinning ring */}
      <div style={{
        width: 32,
        height: 32,
        border: "2px solid rgba(239,68,68,0.15)",
        borderTop: "2px solid #ef4444",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
      }}>
        Loading...
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider baseCurrency="NGN">
          <CartWishlistProvider>
            {/* ✅ Suspense wraps ALL routes — shows PageLoader while chunk downloads */}
            <Suspense fallback={<PageLoader />}>
            <DashboardFAB />
            <VisitTracker />
              <Routes>
                <Route path="/"                          element={<Home />} />
                <Route path="/shop"                      element={<Shop />} />
                <Route path="/shop/:id"                  element={<Detail />} />
                <Route path="/cart"                      element={<Cart />} />
                <Route path="/wishlist"                  element={<Wishlist />} />
                <Route path="/checkout"                  element={<Checkout />} />
                <Route path="/payment/callback"          element={<PaymentCallback />} />
                <Route path="/about"                     element={<About />} />
                <Route path="/contact"                   element={<Contact />} />
                <Route path="/blog"                      element={<Blog />} />
                <Route path="/blog/:slug"                element={<BlogPost />} />
                <Route path="/brands"                    element={<Brands />} />
                <Route path="/brands/:slug"              element={<BrandProfile />} />
                <Route path="/drops"                     element={<Drops />} />
                <Route path="/sell"                      element={<Sell />} />
                {/* Auth */}
                <Route path="/signup"                    element={<AuthPage defaultMode="signup" />} />
                <Route path="/login"                     element={<AuthPage defaultMode="login" />} />
                <Route path="/register"                  element={<AuthPage defaultMode="signup" />} />
                {/* Terms & Privacy */}
                <Route path="/terms"                     element={<Terms />} />
                <Route path="/privacy"                   element={<Privacy />} />
                <Route path="/return"                    element={<Return />} />
                <Route path="/shipping-policy"           element={<Shippingpolicy />} />
                <Route path="/Authentication"            element={<Authentication />} />
                <Route path="/brand-partnership-agreement" element={<Brandpartnershipagreement />} />
                {/* Dashboards */}
                <Route path="/dashboard/admin"           element={<AdminDashboard />} />
                <Route path="/dashboard/buyer"           element={<DashboardGuard required="user" redirect="/dashboard/brand"><BuyerDashboard /></DashboardGuard>} />
                <Route path="/upgrade-to-brand"          element={<BrandUpgradeForm />} />
                <Route path="/dashboard/brand"           element={<DashboardGuard required="brand" redirect="/dashboard/buyer"><BrandDashboard /></DashboardGuard>} />
              </Routes>
            </Suspense>
          </CartWishlistProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);