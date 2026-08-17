import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sawusauna: "sawusauna.html",
        join: "liity.html",
        contact: "yhteys.html",
        notFound: "404.html",
      },
    },
  },
});
