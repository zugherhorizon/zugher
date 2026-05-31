import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications SaaS — zugher." }] }),
  component: () => (
    <StubPage
      tag="App · catalogue"
      title={
        <>
          Les <em>neuf applications</em> du socle.
        </>
      }
      lead="Networking, Crowdfunding, Recrutement, Appels d'offres et compagnie : chaque module sera détaillé ici, avec sa fiche fonctionnelle, ses tarifs et son intégration IA."
    />
  ),
});
