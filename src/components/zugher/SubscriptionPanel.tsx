import { CustomerPortalButton } from "./CustomerPortalButton";
import { useSubscription } from "@/hooks/use-subscription";

const PADDLE_PRODUCT_TO_PLAN_NAME: Record<string, string> = {
  expertise: "Expertise",
  elan: "Élan",
  dealflow: "Dealflow",
};

const STATUS_META: Record<
  string,
  { label: string; tone: "ok" | "warn" | "muted" | "alert" }
> = {
  active: { label: "Actif", tone: "ok" },
  trialing: { label: "Période d'essai", tone: "ok" },
  past_due: { label: "Paiement en attente", tone: "warn" },
  paused: { label: "En pause", tone: "muted" },
  canceled: { label: "Résilié", tone: "alert" },
};

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  ok: { bg: "rgba(34,139,90,0.10)", fg: "#1f6b46" },
  warn: { bg: "rgba(214,158,46,0.14)", fg: "#8a5a00" },
  muted: { bg: "rgba(0,0,0,0.06)", fg: "#444" },
  alert: { bg: "rgba(176,74,46,0.10)", fg: "var(--terra-deep)" },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getCadence(priceId: string | undefined): string {
  if (!priceId) return "";
  if (priceId.endsWith("_yearly")) return "Annuel";
  if (priceId.endsWith("_monthly")) return "Mensuel";
  return "";
}

export function SubscriptionPanel() {
  const { subscription, loading, isActive } = useSubscription();

  const cardStyle: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 24,
    background: "#fff",
    maxWidth: 640,
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ opacity: 0.6, fontSize: 14 }}>Chargement de votre abonnement…</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 11,
            opacity: 0.65,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 6,
          }}
        >
          Mon abonnement
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600 }}>
          Aucun abonnement actif
        </h2>
        <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.5 }}>
          Découvrez nos offres pour débloquer l'accès complet à la plateforme.
        </p>
        <div style={{ marginTop: 16 }}>
          <a href="/offres" className="zg-btn zg-btn-primary">
            Voir les offres
          </a>
        </div>
      </div>
    );
  }

  const planName =
    PADDLE_PRODUCT_TO_PLAN_NAME[subscription.product_id] ?? subscription.product_id;
  const cadence = getCadence(subscription.price_id);
  const statusMeta = STATUS_META[subscription.status] ?? {
    label: subscription.status,
    tone: "muted" as const,
  };
  const tone = TONE_COLORS[statusMeta.tone];
  const willCancel =
    subscription.cancel_at_period_end && subscription.status !== "canceled";

  return (
    <div style={cardStyle}>
      <div
        style={{
          fontSize: 11,
          opacity: 0.65,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 6,
        }}
      >
        Mon abonnement
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>
          {planName}
          {cadence ? (
            <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>
              {" "}
              · {cadence}
            </span>
          ) : null}
        </h2>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "currentColor",
            }}
          />
          {statusMeta.label}
        </span>
      </div>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          margin: "20px 0 0",
        }}
      >
        <div>
          <dt style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
            Période en cours
          </dt>
          <dd style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            {formatDate(subscription.current_period_start)}
            <br />
            <span style={{ opacity: 0.6 }}>au</span>{" "}
            {formatDate(subscription.current_period_end)}
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
            {subscription.status === "canceled" || willCancel
              ? "Accès jusqu'au"
              : "Prochain renouvellement"}
          </dt>
          <dd style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            {formatDate(subscription.current_period_end)}
          </dd>
        </div>
      </dl>

      {willCancel ? (
        <div
          role="status"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "1px solid rgba(214,158,46,0.4)",
            borderRadius: 8,
            background: "rgba(214,158,46,0.10)",
            fontSize: 13,
            color: "#7a4a00",
          }}
        >
          Résiliation programmée — votre accès reste actif jusqu'au{" "}
          {formatDate(subscription.current_period_end)}.
        </div>
      ) : null}

      {!isActive && subscription.status === "canceled" ? (
        <div
          role="status"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "1px solid var(--terra)",
            borderRadius: 8,
            background: "rgba(176,74,46,0.06)",
            fontSize: 13,
            color: "var(--terra-deep)",
          }}
        >
          Cet abonnement est terminé. Choisissez une nouvelle offre pour réactiver
          l'accès.
        </div>
      ) : null}

      <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <CustomerPortalButton />
        <a href="/offres" className="zg-btn zg-btn-ghost">
          Changer d'offre
        </a>
      </div>
    </div>
  );
}
