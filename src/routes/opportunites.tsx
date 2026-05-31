import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/opportunites")({
  head: () => ({ meta: [{ title: "Banque d'opportunités — zugher." }] }),
  component: () => (
    <StubPage
      tag="App · 02 · BtoC"
      title={
        <>
          Banque d'<em>opportunités</em> de projets.
        </>
      }
      lead="Catalogue d'opportunités qualifiées par territoire, secteur et niveau de maturité. Branchement à la table topportunite + scoring IA en Phase 1."
    />
  ),
});
