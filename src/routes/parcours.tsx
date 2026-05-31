import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/parcours")({
  head: () => ({ meta: [{ title: "Parcours porteur — zugher." }] }),
  component: () => (
    <StubPage
      tag="App · 03 + 05 · BtoC"
      title={
        <>
          Du bilan de compétence au <em>business plan</em>.
        </>
      }
      lead="Parcours guidé : évaluation, étude de marché, business plan généré par IA. Données issues des tables tbp, tprojet, tcomp en Phase 2."
    />
  ),
});
