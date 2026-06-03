import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCustomerPortalSession } from "@/lib/customer-portal.functions";
import { useSubscription } from "@/hooks/use-subscription";

export function CustomerPortalButton() {
  const { subscription, environment, loading: subLoading } = useSubscription();
  const openPortal = useServerFn(createCustomerPortalSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (subLoading) return null;
  if (!subscription) return null;

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const { overviewUrl } = await openPortal({ data: { environment } });
      window.open(overviewUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      setError("Impossible d'ouvrir l'espace de gestion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="zg-btn zg-btn-ghost"
        style={{ cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Ouverture…" : "Gérer mon abonnement"}
      </button>
      {error ? (
        <div role="alert" style={{ fontSize: 13, color: "var(--terra-deep)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
