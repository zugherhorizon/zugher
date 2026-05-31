import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — zugher." }] }),
  component: () => (
    <StubPage
      tag="Nous rejoindre"
      title={
        <>
          Une <em>lettre mensuelle</em>, sans bruit.
        </>
      }
      lead="Veille territoires, opportunités sélectionnées, nouveautés produit. Branchement tlistemail en Phase 1."
    />
  ),
});
