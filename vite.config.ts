// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro (Cloudflare preset by default), etc.
// Do NOT add them manually.
//
// To build for a Node VPS (OVH), set NITRO_PRESET=node-server before the Vite build:
//   NITRO_PRESET=node-server node ./node_modules/vite/bin/vite.js build
// → output: .output/server/index.mjs (Node entrypoint used by systemd)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

const preset = process.env.NITRO_PRESET;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [mcpPlugin()],
  ...(preset
    ? {
        nitro: {
          preset,
          output: {
            dir: ".output",
            serverDir: ".output/server",
            publicDir: ".output/public",
          },
        },
      }
    : {}),
});
