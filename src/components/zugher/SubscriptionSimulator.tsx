import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSubscription } from "@/hooks/use-subscription";
import {
  simulatePaddleEvent,
  type SimulatorAction,
} from "@/lib/subscription-simulator.functions";

const ACTIONS: Array<{ id: SimulatorAction; label: string; tone?: "danger" | "warn" }> = [
  { id: "cancel", label: "Programmer une résiliation", tone: "warn" },
  { id: "pause", label: "Mettre en pause", tone: "warn" },
  { id: "resume", label: "Reprendre" },
  { id: "switch_to_expertise", label: "Passer à Expertise" },
  { id: "switch_to_elan", label: "Passer à Élan" },
  { id: "switch_to_dealflow", label: "Passer à Dealflow" },
  { id: "switch_yearly", label: "Basculer en annuel" },
  { id: "switch_monthly", label: "Basculer en mensuel" },
];

export function SubscriptionSimulator() {
  const { environment, subscription } = useSubscription();
  const simulate = useServerFn(simulatePaddleEvent);
  const [pending, setPending] = useState<SimulatorAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (environment !== "sandbox") return null;

  const handleRun = async (action: SimulatorAction) => {
    setError(null);
    setMessage(null);
    setPending(action);
    try {
      await simulate({ data: { action, environment } });
      setMessage(
        "Événement simulé. L'écran « Mon abonnement » devrait se mettre à jour automatiquement.",
      );
    } catch (e: any) {
      setError(e?.message ?? "Impossible de simuler l'événement.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 12,
        border: "1px dashed rgba(214,158,46,0.6)",
        background: "rgba(214,158,46,0.06)",
        maxWidth: 640,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#7a4a00",
          marginBottom: 6,
        }}
      >
        Mode test · Simulateur Paddle
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>
        Déclenche un événement webhook fictif sur votre abonnement de test
        (sandbox uniquement). Permet de vérifier la synchronisation temps réel
        sans attendre Paddle. {!subscription ? (
          <strong> Souscrivez d'abord une offre depuis <a href="/offres">/offres</a>.</strong>
        ) : null}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => handleRun(a.id)}
            disabled={!subscription || pending !== null}
            className="zg-btn zg-btn-ghost"
            style={{
              fontSize: 13,
              padding: "6px 12px",
              cursor: pending ? "wait" : "pointer",
              opacity: pending && pending !== a.id ? 0.5 : 1,
              borderColor:
                a.tone === "warn" ? "rgba(176,74,46,0.5)" : undefined,
              color: a.tone === "warn" ? "var(--terra-deep)" : undefined,
            }}
          >
            {pending === a.id ? "Envoi…" : a.label}
          </button>
        ))}
      </div>

      {message ? (
        <div role="status" style={{ marginTop: 12, fontSize: 13, color: "#1f6b46" }}>
          {message}
        </div>
      ) : null}
      {error ? (
        <div role="alert" style={{ marginTop: 12, fontSize: 13, color: "var(--terra-deep)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
