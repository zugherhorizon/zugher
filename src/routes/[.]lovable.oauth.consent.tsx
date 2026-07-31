import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{
    data?: {
      client?: { name?: string } | null;
      redirect_url?: string;
      redirect_to?: string;
    } | null;
    error?: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
};

const oauth = () =>
  (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id:
      typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/connexion", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    )!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <section className="zg-stub" style={{ maxWidth: 560 }}>
      <h1 className="zg-h1">Autorisation indisponible</h1>
      <p className="zg-lead">{String((error as Error)?.message ?? error)}</p>
    </section>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "cette application";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Aucune redirection renvoyée par le serveur d'autorisation.");
      return;
    }
    window.location.href = target;
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 560 }}>
      <div className="zg-stub-tag">Connexion agent</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
        Connecter <em>{clientName}</em> à votre compte.
      </h1>
      <p className="zg-lead">
        {clientName} pourra utiliser les outils zugher en votre nom : consulter et
        mettre à jour votre profil territorial, lire vos rendez-vous et votre
        abonnement.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(220, 38, 38, 0.08)",
            color: "rgb(153, 27, 27)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="zg-actions" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="zg-btn zg-btn-primary"
          disabled={busy}
          onClick={() => decide(true)}
        >
          {busy ? "…" : "Autoriser"}
        </button>
        <button
          type="button"
          className="zg-btn zg-btn-ghost"
          disabled={busy}
          onClick={() => decide(false)}
        >
          Refuser
        </button>
      </div>
    </section>
  );
}
