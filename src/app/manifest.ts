import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyCrewFest",
    short_name: "MyCrewFest",
    description: "L'app du festivalier — prépare, vis et souviens-toi de chaque festival avec ton crew.",
    start_url: "/catalogue",
    display: "standalone",
    background_color: "#0D0E12",
    theme_color: "#0D0E12",
    orientation: "portrait",
    icons: [
      {
        src: "/file.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/file.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["entertainment", "lifestyle"],
    lang: "fr",
  };
}
