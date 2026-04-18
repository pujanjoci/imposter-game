import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Imposter Game",
    short_name: "Imposter",
    description: "Multiplayer party game of bluffing and deduction.",
    start_url: "/",
    display: "standalone",
    background_color: "#070b12",
    theme_color: "#8b5cf6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
