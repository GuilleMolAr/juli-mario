import { createFileRoute } from "@tanstack/react-router";

import { MarioProposal } from "@/components/game/MarioProposal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Super Juli Bros. — Una misión de amor" },
      { name: "description", content: "Un nivel secreto hecho para Juli. Llevá a Peach hasta Guillermo y descubrí la pregunta." },
      { property: "og:title", content: "Super Juli Bros. — Una misión de amor" },
      { property: "og:description", content: "Un nivel secreto hecho para Juli. Llevá a Peach hasta Guillermo y descubrí la pregunta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MarioProposal />;
}
