import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — zugher." }] }),
  component: () => (
    <StubPage
      tag="Nous rejoindre"
      title={
        <>
          Parlons de <em>votre territoire</em>.
        </>
      }
      lead="Formulaire de contact, calendrier de démo, accès DPO. Connecté à Lovable Cloud en Phase 1."
    />
  ),
});
