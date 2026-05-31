import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/competences")({
  head: () => ({ meta: [{ title: "Espace compétences — zugher." }] }),
  component: () => (
    <StubPage
      tag="App · 07 · BtoC"
      title={
        <>
          Espace <em>compétences</em> & emploi.
        </>
      }
      lead="Profils, CV, offres et matching IA. Données tadherent, tcandidat, templois, toffre, tpostule en Phase 1."
    />
  ),
});
