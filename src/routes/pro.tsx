import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/pro")({
  head: () => ({ meta: [{ title: "Offre Pro — zugher." }] }),
  component: () => (
    <StubPage
      tag="BtoB · commercialisation"
      title={
        <>
          Une instance <em>à votre image</em>.
        </>
      }
      lead="Personnalisation territoire, modules activables à la carte, IA configurable. Onboarding self-service à venir en Phase 4."
    />
  ),
});
