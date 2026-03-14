import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { HtmlTagDescriptor } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Strip the Lovable/GPT-Engineer live-edit script in production builds.
    // In development it is injected via transformIndexHtml so it is never
    // hard-coded in index.html (keeping the file clean for production).
    {
      name: 'dev-only-scripts',
      transformIndexHtml(html, ctx) {
        if (!ctx.server) {
          // Production: defensively strip any gptengineer/cdn.gpteng.co script
          // that might be added back accidentally (the hard-coded script and its
          // comment have been removed from index.html, but this acts as a
          // safety net for future contributors).
          return html.replace(
            /\s*<!--.*?DO NOT REMOVE.*?-->\s*<script[^>]*cdn\.gpteng\.co[^>]*><\/script>/s,
            ''
          );
        }
        // Development: inject the script dynamically so it never appears in
        // the committed index.html
        const tags: HtmlTagDescriptor[] = [
          {
            tag: 'script',
            attrs: { src: 'https://cdn.gpteng.co/gptengineer.js', type: 'module' },
            injectTo: 'body',
          },
        ];
        return { html, tags };
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
}));
