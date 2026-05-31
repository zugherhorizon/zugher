import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-site-settings";
import { listAdminCalendars } from "@/lib/appointments.functions";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres du site — Admin zugher." }],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { loading: authLoading, user, emailConfirmed } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  const [timeout, setTimeoutValue] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  type CalRow = { id: string; summary: string; primary: boolean; accessRole?: string };
  const [cals, setCals] = useState<CalRow[] | null>(null);
  const [currentTarget, setCurrentTarget] = useState<string>("primary");
  const [calsError, setCalsError] = useState<string | null>(null);
  const fetchCals = useServerFn(listAdminCalendars);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("email_verification_timeout_minutes")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTimeoutValue(data.email_verification_timeout_minutes);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchCals()
      .then((r) => {
        if (r.ok) {
          setCals(r.calendars);
          setCurrentTarget(r.currentTarget);
        } else {
          setCalsError(r.error);
        }
      })
      .catch((e) => setCalsError(String(e?.message ?? e)));
  }, [isAdmin, fetchCals]);

  if (authLoading || roleLoading) {
    return <section className="zg-stub"><p className="zg-lead">Chargement…</p></section>;
  }

  if (!user || !emailConfirmed) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <div className="zg-stub-tag">Admin · Accès restreint</div>
        <h1 className="zg-h1">Connexion requise.</h1>
        <p className="zg-lead">Connectez-vous avec un compte administrateur pour accéder aux paramètres.</p>
        <div className="zg-actions"><Link to="/inscription" className="zg-btn zg-btn-primary">Se connecter</Link></div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <div className="zg-stub-tag">Admin · Accès refusé</div>
        <h1 className="zg-h1">Réservé aux administrateurs.</h1>
        <p className="zg-lead">Votre compte n'a pas les droits nécessaires pour modifier les paramètres du site.</p>
        <div className="zg-actions"><Link to="/" className="zg-btn zg-btn-ghost">Retour à l'accueil</Link></div>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (timeout < 1 || timeout > 1440) {
      setError("La valeur doit être comprise entre 1 et 1440 minutes.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("site_settings")
      .update({ email_verification_timeout_minutes: timeout, updated_by: user.id })
      .eq("id", true);
    setSaving(false);
    if (err) setError(err.message);
    else setMessage("Paramètres enregistrés.");
  };

  return (
    <section className="zg-stub" style={{ maxWidth: 720 }}>
      <div className="zg-stub-tag">Admin · Paramètres</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}>
        Paramètres <em>du site</em>.
      </h1>
      <p className="zg-lead">
        Configurez les comportements globaux de la plateforme zugher.
      </p>

      {loading ? (
        <p style={{ marginTop: 24 }}>Chargement des paramètres…</p>
      ) : (
        <form onSubmit={onSubmit} className="zg-form" style={{ marginTop: 28 }}>
          <label className="zg-field">
            <span className="zg-field-label">
              Délai de vérification de l'e-mail (minutes)
              <em style={{ color: "var(--terra)" }}> *</em>
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              step={1}
              value={timeout}
              onChange={(e) => setTimeoutValue(Number(e.target.value))}
              required
            />
            <span className="zg-help" style={{ marginTop: 8 }}>
              Temps affiché à l'utilisateur pour cliquer sur le lien de vérification reçu par e-mail.
              Valeur par défaut : 5 minutes. Plage autorisée : 1 à 1440 minutes (24 h).
            </span>
          </label>

          {error && <div className="zg-error">{error}</div>}
          {message && <div className="zg-gate-note" style={{ marginTop: 12 }}><strong>{message}</strong></div>}

          <div className="zg-actions" style={{ marginTop: 16 }}>
            <button type="submit" disabled={saving} className="zg-btn zg-btn-primary">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <Link to="/" className="zg-btn zg-btn-ghost">Retour</Link>
          </div>
        </form>
      )}

      <div style={{ marginTop: 48, borderTop: "1px solid rgba(0,0,0,.08)", paddingTop: 28 }}>
        <h2 className="zg-h2" style={{ fontSize: "clamp(20px, 2.5vw, 26px)" }}>
          Agenda Google · RDV Pro
        </h2>
        <p className="zg-help" style={{ marginTop: 8 }}>
          Calendrier cible actuel : <code><strong>{currentTarget}</strong></code>.
          Pour changer, définissez le secret <code>GOOGLE_CALENDAR_ID</code> avec l'ID du
          calendrier voulu (ex. <code>primary</code> ou une adresse de calendrier partagé).
        </p>
        {calsError && <div className="zg-error" style={{ marginTop: 12 }}>{calsError}</div>}
        {cals && (
          <ul className="zg-list" style={{ marginTop: 12 }}>
            {cals.map((c) => (
              <li key={c.id} style={{ marginBottom: 6 }}>
                <strong>{c.summary}</strong>
                {c.primary && <span style={{ marginLeft: 8, color: "var(--terra)" }}>(primary)</span>}
                <br />
                <code style={{ fontSize: 12 }}>{c.id}</code>
                {c.accessRole && <span style={{ marginLeft: 8, opacity: .7 }}>· {c.accessRole}</span>}
                {c.id === currentTarget && (
                  <span style={{ marginLeft: 8, color: "var(--terra)" }}>← cible actuelle</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
