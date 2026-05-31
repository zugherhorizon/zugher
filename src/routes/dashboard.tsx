import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — zugher." }] }),
  component: () => (
    <StubPage
      tag="BtoB · Pilotage"
      title={
        <>
          Tableau de bord <em>territoire</em>.
        </>
      }
      lead="KPI, secteurs porteurs, alertes IA, journal d'activité. Vue agrégée des tables tjournal, tao, tprev en Phase 2."
    />
  ),
});
