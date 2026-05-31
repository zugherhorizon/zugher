import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

export type InscriptionMode = "account" | "newsletter";

const PROFILS = [
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "entreprise", label: "Entreprise" },
  { value: "agence_publique", label: "Agence publique" },
  { value: "institution_financiere", label: "Institution financière" },
  { value: "association", label: "Association" },
  { value: "investisseur", label: "Investisseur" },
  { value: "prestataire", label: "Prestataire" },
  { value: "competence", label: "Compétence" },
  { value: "ecole_universite", label: "École / Université" },
] as const;

const PROFIL_VALUES = PROFILS.map((p) => p.value) as [string, ...string[]];

const PAYS = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc",
  "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire", "Cameroun", "Autre",
];

const SECTEURS = [
  "Agriculture & Agroalimentaire", "Artisanat", "Commerce & Distribution",
  "Construction & BTP", "Culture, Arts & Médias", "Éducation & Formation",
  "Énergie & Environnement", "Finance & Assurance", "Industrie & Manufacturing",
  "Immobilier", "Numérique & Tech", "Santé & Bien-être",
  "Services aux entreprises", "Services à la personne",
  "Tourisme & Hôtellerie", "Transport & Logistique", "Autre",
];

const baseSchema = z
  .object({
    audience: z.enum(["grand_public", "pro"], { message: "Choisissez un type de compte" }),
    firstName: z.string().trim().max(80).optional().or(z.literal("")),
    lastName: z.string().trim().max(80).optional().or(z.literal("")),
    email: z.string().trim().email("Adresse e-mail invalide").max(255),
    emailConfirm: z.string().trim().max(255),
    phone: z
      .string()
      .trim()
      .max(30)
      .regex(/^[0-9+ ().-]*$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
    profil: z.enum(PROFIL_VALUES, { message: "Sélectionnez un profil" }),
    pays: z.string().trim().min(1, "Sélectionnez un pays").max(80),
    region: z.string().trim().max(120).optional().or(z.literal("")),
    departement: z.string().trim().max(120).optional().or(z.literal("")),
    ville: z.string().trim().max(120).optional().or(z.literal("")),
    secteur: z.string().trim().max(120).optional().or(z.literal("")),
    territory: z.string().trim().max(160).optional().or(z.literal("")),
    needs: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => d.email.toLowerCase() === d.emailConfirm.toLowerCase(), {
    path: ["emailConfirm"],
    message: "Les deux adresses e-mail ne correspondent pas",
  });

const accountSchema = baseSchema.refine(
  (d) => d.audience !== "pro" || (d.needs && d.needs.trim().length >= 20),
  {
    path: ["needs"],
    message: "Pour un compte professionnel, détaillez vos besoins (20 caractères min.)",
  },
);

type FormState = {
  audience: "" | "grand_public" | "pro";
  firstName: string;
  lastName: string;
  email: string;
  emailConfirm: string;
  phone: string;
  profil: string;
  pays: string;
  region: string;
  departement: string;
  ville: string;
  secteur: string;
  territory: string;
  needs: string;
};

const initial: FormState = {
  audience: "", firstName: "", lastName: "", email: "", emailConfirm: "",
  phone: "", profil: "", pays: "", region: "", departement: "", ville: "",
  secteur: "", territory: "", needs: "",
};

type Props = {
  mode?: InscriptionMode;
  defaults?: Partial<FormState>;
};

export function InscriptionForm({ mode = "account", defaults }: Props) {
  const isNewsletter = mode === "newsletter";
  // Same validation rules for both flows (pays/profil/audience requis,
  // territoire pour grand public, besoins requis pour les pro).
  const schema = accountSchema;


  const [form, setForm] = useState<FormState>(() => ({ ...initial, ...defaults }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { settings } = useSiteSettings();
  const timeoutMin = settings.email_verification_timeout_minutes;

  const setField =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "_";
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            phone: form.phone.trim(),
            profile: form.profil,
            country: form.pays.trim(),
            region: form.region.trim(),
            department: form.departement.trim(),
            city: form.ville.trim(),
            sector: form.secteur.trim(),
            audience: form.audience,
            territory: form.territory.trim(),
            needs: form.needs.trim(),
            signup_source: isNewsletter ? "newsletter" : "account",
            newsletter_opt_in: isNewsletter,
          },
        },
      });
      if (error) throw error;
      setSentAt(Date.now());
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Réessayez dans un instant.",
      );
    } finally {
      setSending(false);
    }
  };

  const summary = useMemo(
    () => ({
      nom: [form.firstName, form.lastName].filter(Boolean).join(" ") || "—",
      email: form.email,
      tel: form.phone || "—",
      profil: PROFILS.find((p) => p.value === form.profil)?.label ?? "—",
      pays: form.pays || "—",
      localisation:
        [form.ville, form.departement, form.region].filter(Boolean).join(", ") || "—",
      secteur: form.secteur || "—",
    }),
    [form],
  );

  if (submitted) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">
          {isNewsletter ? "Newsletter · Vérification" : "Inscription · Vérification"}
        </div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Vérifiez votre <em>boîte mail</em>.
        </h1>
        <p className="zg-lead">
          Nous venons d'envoyer un lien de confirmation à{" "}
          <strong>{summary.email}</strong>. Cliquez sur le lien dans l'e-mail pour
          activer votre compte zugher.
        </p>

        <Countdown sentAt={sentAt} timeoutMin={timeoutMin} />

        <div className="zg-gate-note" style={{ marginTop: 16 }}>
          <strong>Prochaine étape</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
            {isNewsletter ? (
              <>Dès confirmation, votre compte sera créé et vous serez{" "}
              <strong>abonné(e) à la lettre mensuelle</strong>. Aucun appel ni
              rendez-vous ne sera planifié — vous restez maître du tempo.</>
            ) : form.audience === "pro" ? (
              <>Après confirmation, notre équipe revient vers vous sous 48h
              ouvrées pour caler un <strong>appel ou un rendez-vous</strong> à
              partir des besoins que vous nous avez transmis.</>
            ) : (
              <>Après confirmation, vous recevrez le lien vers la{" "}
              <strong>place de marché</strong>
              {form.territory ? <> de <strong>{form.territory}</strong></> : null}
              {" "}directement dans votre espace privé.</>
            )}
          </p>
        </div>

        <div className="zg-gate-note" style={{ marginTop: 16 }}>
          <strong>Récapitulatif</strong>
          <ul className="zg-list" style={{ marginTop: 8 }}>
            <li><strong>Identité :</strong> {summary.nom}</li>
            <li><strong>E-mail :</strong> {summary.email}</li>
            <li><strong>Téléphone :</strong> {summary.tel}</li>
            <li><strong>Profil :</strong> {summary.profil}</li>
            <li><strong>Pays :</strong> {summary.pays}</li>
            <li><strong>Localisation :</strong> {summary.localisation}</li>
            <li><strong>Secteur d'activité :</strong> {summary.secteur}</li>
          </ul>
        </div>

        <div className="zg-actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => { setSubmitted(false); setServerError(null); }}
            className="zg-btn zg-btn-ghost"
          >
            Renvoyer un lien
          </button>
          <Link to="/" className="zg-btn zg-btn-ghost">Retour à l'accueil</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 820 }}>
      <div className="zg-stub-tag">
        {isNewsletter ? "Newsletter · Inscription" : "Compte · Inscription"}
      </div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}>
        {isNewsletter ? (
          <>Recevez la <em>lettre mensuelle</em>.</>
        ) : (
          <>Rejoignez <em>zugher</em>.</>
        )}
      </h1>
      <p className="zg-lead">
        {isNewsletter ? (
          <>S'abonner crée automatiquement votre compte zugher.{" "}
          <strong>Aucun appel ni rendez-vous</strong> ne sera planifié — uniquement
          la lettre mensuelle (veille territoires, opportunités, nouveautés).</>
        ) : (
          <>L'<strong>e-mail</strong>, le <strong>type de compte</strong>, le{" "}
          <strong>profil</strong> et le <strong>pays</strong> sont obligatoires.
          Vous recevrez un lien de vérification par e-mail pour activer votre compte.</>
        )}
      </p>

      <form onSubmit={onSubmit} className="zg-form" style={{ marginTop: 28 }} noValidate>
        <Field label="Type de compte" required error={errors.audience}>
          <select
            required
            value={form.audience}
            onChange={setField("audience")}
            aria-invalid={!!errors.audience}
          >
            <option value="">— Sélectionnez —</option>
            <option value="grand_public">Grand public (particulier / investisseur individuel)</option>
            <option value="pro">Professionnel (entreprise, agence, institution, association…)</option>
          </select>
        </Field>

        {form.audience === "grand_public" && (
          <Field label="Territoire d'intérêt" error={errors.territory}>
            <input
              type="text"
              value={form.territory}
              onChange={setField("territory")}
              maxLength={160}
              placeholder="Ex. Nouvelle-Aquitaine, Dakar, Tunis…"
            />
          </Field>
        )}

        {form.audience === "pro" && (
          <Field
            label={
              isNewsletter
                ? "Vos besoins (contexte de l'abonnement)"
                : "Vos besoins (préparation du rendez-vous)"
            }
            required
            error={errors.needs}
          >

            <textarea
              required
              value={form.needs}
              onChange={setField("needs")}
              maxLength={2000}
              rows={5}
              placeholder="Décrivez votre projet, le territoire ciblé, vos attentes, votre calendrier, toute information utile pour préparer notre appel ou rendez-vous."
              aria-invalid={!!errors.needs}
            />
          </Field>
        )}

        <div className="zg-grid-2">
          <Field label="Prénom">
            <input type="text" value={form.firstName} onChange={setField("firstName")}
              maxLength={80} placeholder="Camille" autoComplete="given-name" />
          </Field>
          <Field label="Nom">
            <input type="text" value={form.lastName} onChange={setField("lastName")}
              maxLength={80} placeholder="Durand" autoComplete="family-name" />
          </Field>
        </div>

        <div className="zg-grid-2">
          <Field label="Adresse e-mail" required error={errors.email}>
            <input type="email" required value={form.email} onChange={setField("email")}
              maxLength={255} placeholder="vous@exemple.com" autoComplete="email"
              aria-invalid={!!errors.email} />
          </Field>
          <Field label="Confirmer l'e-mail" required error={errors.emailConfirm}>
            <input type="email" required value={form.emailConfirm}
              onChange={setField("emailConfirm")} maxLength={255}
              placeholder="vous@exemple.com" autoComplete="email"
              onPaste={(e) => e.preventDefault()}
              aria-invalid={!!errors.emailConfirm} />
          </Field>
        </div>

        <Field label="Numéro de téléphone" error={errors.phone}>
          <input type="tel" value={form.phone} onChange={setField("phone")}
            maxLength={30} placeholder="+33 6 12 34 56 78" autoComplete="tel" />
        </Field>

        <div className="zg-grid-2">
          <Field label="Profil" required error={errors.profil}>
            <select required value={form.profil} onChange={setField("profil")}
              aria-invalid={!!errors.profil}>
              <option value="">— Sélectionnez votre profil —</option>
              {PROFILS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Pays" required error={errors.pays}>
            <select required value={form.pays} onChange={setField("pays")}
              aria-invalid={!!errors.pays}>
              <option value="">— Sélectionnez votre pays —</option>
              {PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <div className="zg-grid-2">
          <Field label="Région" error={errors.region}>
            <input type="text" value={form.region} onChange={setField("region")}
              maxLength={120} placeholder="Nouvelle-Aquitaine" autoComplete="address-level1" />
          </Field>
          <Field label="Département" error={errors.departement}>
            <input type="text" value={form.departement} onChange={setField("departement")}
              maxLength={120} placeholder="Gironde (33)" />
          </Field>
        </div>

        <div className="zg-grid-2">
          <Field label="Ville" error={errors.ville}>
            <input type="text" value={form.ville} onChange={setField("ville")}
              maxLength={120} placeholder="Bordeaux" autoComplete="address-level2" />
          </Field>
          <Field label="Secteur d'activité" error={errors.secteur}>
            <select value={form.secteur} onChange={setField("secteur")}>
              <option value="">— Sélectionnez un secteur —</option>
              {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {serverError && <div className="zg-error">{serverError}</div>}

        <p className="zg-help">
          En {isNewsletter ? "vous abonnant" : "créant un compte"}, vous acceptez les
          conditions d'utilisation et la politique de confidentialité de zugher (RGPD).
        </p>

        <div className="zg-actions" style={{ marginTop: 16 }}>
          <button type="submit" disabled={sending} className="zg-btn zg-btn-primary">
            {sending
              ? "Envoi du lien…"
              : isNewsletter ? "M'abonner à la newsletter" : "Créer mon compte"}
          </button>
          <Link to="/" className="zg-btn zg-btn-ghost">Annuler</Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  label, required, error, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="zg-field">
      <span className="zg-field-label">
        {label}
        {required && <em style={{ color: "var(--terra)" }}> *</em>}
      </span>
      {children}
      {error && <span className="zg-error" style={{ marginTop: 6 }}>{error}</span>}
    </label>
  );
}

function Countdown({ sentAt, timeoutMin }: { sentAt: number | null; timeoutMin: number }) {
  const totalMs = timeoutMin * 60_000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!sentAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sentAt]);
  if (!sentAt) return null;
  const remaining = Math.max(0, totalMs - (now - sentAt));
  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, "0");
  const expired = remaining === 0;
  return (
    <div
      className="zg-gate-note"
      style={{ marginTop: 24, borderColor: expired ? "var(--terra)" : undefined }}
    >
      <strong>{expired ? "Délai expiré" : "Temps restant pour confirmer"}</strong>
      <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
        {expired ? (
          <>Le délai de {timeoutMin} minute{timeoutMin > 1 ? "s" : ""} est écoulé. Demandez un nouveau lien ci-dessous.</>
        ) : (
          <>
            Cliquez sur le lien dans votre e-mail dans les{" "}
            <strong style={{ fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</strong>{" "}
            qui suivent.
          </>
        )}
      </p>
    </div>
  );
}
