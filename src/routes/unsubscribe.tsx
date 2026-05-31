import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Désinscription — zugher." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "success" }
  | { kind: "submitting" };

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setState({ kind: "invalid", message: "Lien invalide ou expiré." });
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setState({
            kind: "invalid",
            message: json.error ?? "Lien invalide.",
          });
          return;
        }
        if (json.valid) {
          setState({ kind: "valid" });
        } else if (json.reason === "already_unsubscribed") {
          setState({ kind: "already" });
        } else {
          setState({ kind: "invalid", message: "Lien invalide." });
        }
      })
      .catch(() =>
        setState({ kind: "invalid", message: "Erreur de connexion." }),
      );
  }, []);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await r.json();
      if (json.success) {
        setState({ kind: "success" });
      } else if (json.reason === "already_unsubscribed") {
        setState({ kind: "already" });
      } else {
        setState({
          kind: "invalid",
          message: json.error ?? "Erreur lors de la désinscription.",
        });
      }
    } catch {
      setState({ kind: "invalid", message: "Erreur de connexion." });
    }
  };

  return (
    <section className="zg-stub" style={{ maxWidth: 640 }}>
      <div className="zg-stub-tag">Désinscription</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
        Gérer vos <em>communications</em>.
      </h1>

      {state.kind === "loading" && <p className="zg-lead">Vérification…</p>}

      {state.kind === "valid" && (
        <>
          <p className="zg-lead">
            Confirmez votre désinscription pour ne plus recevoir nos emails.
          </p>
          <div className="zg-actions" style={{ marginTop: 16 }}>
            <button onClick={confirm} className="zg-btn zg-btn-primary">
              Me désinscrire
            </button>
          </div>
        </>
      )}

      {state.kind === "submitting" && (
        <p className="zg-lead">Désinscription en cours…</p>
      )}

      {state.kind === "success" && (
        <div className="zg-gate-note" style={{ marginTop: 16 }}>
          <strong>Vous êtes désinscrit.</strong>
          <p style={{ margin: "8px 0 0" }}>
            Vous ne recevrez plus d'emails de notre part.
          </p>
        </div>
      )}

      {state.kind === "already" && (
        <div className="zg-gate-note" style={{ marginTop: 16 }}>
          <strong>Désinscription déjà effectuée.</strong>
        </div>
      )}

      {state.kind === "invalid" && (
        <div className="zg-error" style={{ marginTop: 16 }}>
          {state.message}
        </div>
      )}
    </section>
  );
}
