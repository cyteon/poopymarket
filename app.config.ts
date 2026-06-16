import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    externals: {
      inline: ["@modelcontextprotocol/sdk"],
    },
  },
  ssr: true,
});
