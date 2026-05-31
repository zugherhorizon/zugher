import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/investisseurs")({
  head: () => ({ meta: [{ title: "Espace investisseurs — zugher." }] }),
  component: () => (
    <StubPage
      tag="App · 06 · BtoC"
      title={
        <>
          Espace <em>investisseurs</em>.
        </>
      }
      lead="Deal-flow qualifié, scoring IA, suivi de portefeuille. Branchement à tinvest, tportefeuille et tfin en Phase 3."
    />
  ),
});
