import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    target: "es2020",
    sourcemap: false,

    rollupOptions: {
      // ✅ This tells rollup to treat each icon set as external
      // so only the ones you import get bundled
      treeshake: {
        moduleSideEffects: false,        // ✅ Enables aggressive tree shaking
        propertyReadSideEffects: false,  // ✅ Removes unused icon exports
        unknownGlobalSideEffects: false,
      },

      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/react-dom/")) return "vendor-react";
          if (
            id.includes("/node_modules/react/") &&
            !id.includes("react-dom") &&
            !id.includes("react-router") &&
            !id.includes("react-icons") &&
            !id.includes("react-paystack")
          ) return "vendor-react";

          if (
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/react-router-dom/") ||
            id.includes("/node_modules/@remix-run/")
          ) return "vendor-router";

          if (
            id.includes("/node_modules/framer-motion/") ||
            id.includes("/node_modules/motion-dom/") ||
            id.includes("/node_modules/motion/")
          ) return "vendor-motion";

          // ✅ Split EACH icon set into its own chunk
          // so unused sets are never loaded
          if (id.includes("/node_modules/react-icons/fa")) return "icons-fa";
          if (id.includes("/node_modules/react-icons/fi")) return "icons-fi";
          if (id.includes("/node_modules/react-icons/bi")) return "icons-bi";
          if (id.includes("/node_modules/react-icons/ai")) return "icons-ai";
          if (id.includes("/node_modules/react-icons/md")) return "icons-md";
          if (id.includes("/node_modules/react-icons/hi")) return "icons-hi";
          if (id.includes("/node_modules/react-icons/io")) return "icons-io";
          if (id.includes("/node_modules/react-icons/io5")) return "icons-io5";
          if (id.includes("/node_modules/react-icons/si")) return "icons-si";
          if (id.includes("/node_modules/react-icons/ti")) return "icons-ti";
          if (id.includes("/node_modules/react-icons/gi")) return "icons-gi";
          if (id.includes("/node_modules/react-icons/wi")) return "icons-wi";
          if (id.includes("/node_modules/react-icons/di")) return "icons-di";
          if (id.includes("/node_modules/react-icons/bs")) return "icons-bs";
          if (id.includes("/node_modules/react-icons/ri")) return "icons-ri";
          if (id.includes("/node_modules/react-icons/cg")) return "icons-cg";
          if (id.includes("/node_modules/react-icons/vsc")) return "icons-vsc";
          if (id.includes("/node_modules/react-icons/tb")) return "icons-tb";
          if (id.includes("/node_modules/react-icons/pi")) return "icons-pi";
          if (id.includes("/node_modules/react-icons/lu")) return "icons-lu";
          // Catch any remaining react-icons
          if (id.includes("/node_modules/react-icons/")) return "icons-other";

          // ✅ Lucide in own chunk
          if (id.includes("/node_modules/lucide-react/")) return "vendor-lucide";

          if (
            id.includes("/node_modules/react-paystack/") ||
            id.includes("/node_modules/@paystack/") ||
            id.includes("/node_modules/flutterwave")
          ) return "vendor-payments";

          if (id.includes("/node_modules/country-state-city/")) return "vendor-geo";
          if (id.includes("/node_modules/axios/")) return "vendor-http";
          if (id.includes("/node_modules/zustand/")) return "vendor-state";

          if (id.includes("/node_modules/")) return "vendor-misc";
        },

        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion"],
  },
});