// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        // Media files live on Lovable's asset CDN (the repo only carries .asset.json
        // pointers). Forward /__l5e requests so the app also shows images/videos when
        // run locally outside Lovable hosting (npm run dev from a GitHub clone).
        "/__l5e": {
          target: "https://id-preview--62f76615-b2b5-44c2-8669-2b0608c8d2ac.lovable.app",
          changeOrigin: true,
        },
        // Google sign-in starts at /~oauth/initiate, which only Lovable hosting serves.
        // Forward it so "Continue with Google" also works on a local run (http://127.0.0.1:8080).
        "/~oauth": {
          target: "https://id-preview--62f76615-b2b5-44c2-8669-2b0608c8d2ac.lovable.app",
          changeOrigin: true,
        },
      },
    },
  },
});
