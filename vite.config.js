import { defineConfig } from "vite";

export default defineConfig({
  // Määritetään GitHub-repositorion nimi poluksi, jotta tyylit ja koodit löytyvät Pagesissa oikein
  base: "/Sawusaunan-kotisivut/",
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