import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/zugher/StubPage";
import { RequireAuth } from "@/components/zugher/RequireAuth";
import { SubscriptionPanel } from "@/components/zugher/SubscriptionPanel";
import { SubscriptionSimulator } from "@/components/zugher/SubscriptionSimulator";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — zugher." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <RequireAuth reason="Le tableau de bord territoire est réservé aux membres connectés.">
      <StubPage
        tag="BtoB · Pilotage"
        title={
          <>
            Tableau de bord <em>territoire</em>.
          </>
        }
        lead="KPI, secteurs porteurs, alertes IA, journal d'activité. Vue agrégée des tables tjournal, tao, tprev en Phase 2."
      >
        <div style={{ marginTop: 32 }}>
          <SubscriptionPanel />
          <SubscriptionSimulator />
        </div>
      </StubPage>
    </RequireAuth>
  );
}
