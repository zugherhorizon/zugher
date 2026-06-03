// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro (Cloudflare preset by default), etc.
// Do NOT add them manually.
//
// To build for a Node VPS (OVH), set NITRO_PRESET=node-server before `bun run build`:
//   NITRO_PRESET=node-server bun run build
// → output: .output/server/index.mjs (Node entrypoint)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const preset = process.env.NITRO_PRESET;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(preset ? { nitro: { preset } } : {}),
});
