import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Inscription — zugher." },
      {
        name: "description",
        content:
          "Créez votre compte zugher pour accéder à la place de marché de territoires : opportunités, business plan IA, espace investisseurs.",
      },
    ],
  }),
  component: InscriptionPage,
});

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
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Canada",
  "Maroc",
  "Algérie",
  "Tunisie",
  "Sénégal",
  "Côte d'Ivoire",
  "Cameroun",
  "Autre",
];

const schema = z
  .object({
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
    pays: z.string().trim().max(80).optional().or(z.literal("")),
  })
  .refine((d) => d.email.toLowerCase() === d.emailConfirm.toLowerCase(), {
    path: ["emailConfirm"],
    message: "Les deux adresses e-mail ne correspondent pas",
  });

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirm: string;
  phone: string;
  profil: string;
  pays: string;
};

const initial: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  emailConfirm: "",
  phone: "",
  profil: "",
  pays: "",
};

function InscriptionPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setField =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
          },
        },
      });
      if (error) throw error;
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
    }),
    [form],
  );

  if (submitted) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">Inscription · Vérification</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Vérifiez votre <em>boîte mail</em>.
        </h1>
        <p className="zg-lead">
          Nous venons d'envoyer un lien de confirmation à{" "}
          <strong>{summary.email}</strong>. Cliquez sur le lien dans l'e-mail pour
          activer votre compte zugher.
        </p>

        <div className="zg-gate-note" style={{ marginTop: 24 }}>
          <strong>Important</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
            Votre espace privé reste verrouillé tant que l'adresse n'est pas
            confirmée. Si vous ne recevez rien dans 5 minutes, vérifiez vos
            spams ou recommencez l'inscription avec la même adresse.
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
          </ul>
        </div>

        <div className="zg-actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setServerError(null);
            }}
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
      <div className="zg-stub-tag">Compte · Inscription</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}>
        Rejoignez <em>zugher</em>.
      </h1>
      <p className="zg-lead">
        Seuls l'<strong>e-mail</strong> et le <strong>profil</strong> sont
        obligatoires. Vous recevrez un lien de vérification par e-mail pour
        activer votre compte.
      </p>

      <form onSubmit={onSubmit} className="zg-form" style={{ marginTop: 28 }} noValidate>
        <div className="zg-grid-2">
          <Field label="Prénom">
            <input
              type="text"
              value={form.firstName}
              onChange={setField("firstName")}
              maxLength={80}
              placeholder="Camille"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Nom">
            <input
              type="text"
              value={form.lastName}
              onChange={setField("lastName")}
              maxLength={80}
              placeholder="Durand"
              autoComplete="family-name"
            />
          </Field>
        </div>

        <div className="zg-grid-2">
          <Field label="Adresse e-mail" required error={errors.email}>
            <input
              type="email"
              required
              value={form.email}
              onChange={setField("email")}
              maxLength={255}
              placeholder="vous@exemple.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
          </Field>
          <Field label="Confirmer l'e-mail" required error={errors.emailConfirm}>
            <input
              type="email"
              required
              value={form.emailConfirm}
              onChange={setField("emailConfirm")}
              maxLength={255}
              placeholder="vous@exemple.com"
              autoComplete="email"
              onPaste={(e) => e.preventDefault()}
              aria-invalid={!!errors.emailConfirm}
            />
          </Field>
        </div>

        <Field label="Numéro de téléphone" error={errors.phone}>
          <input
            type="tel"
            value={form.phone}
            onChange={setField("phone")}
            maxLength={30}
            placeholder="+33 6 12 34 56 78"
            autoComplete="tel"
          />
        </Field>

        <div className="zg-grid-2">
          <Field label="Profil" required error={errors.profil}>
            <select
              required
              value={form.profil}
              onChange={setField("profil")}
              aria-invalid={!!errors.profil}
            >
              <option value="">— Sélectionnez votre profil —</option>
              {PROFILS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Pays">
            <select value={form.pays} onChange={setField("pays")}>
              <option value="">— Sélectionnez votre pays —</option>
              {PAYS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        {serverError && <div className="zg-error">{serverError}</div>}

        <p className="zg-help">
          En créant un compte, vous acceptez les conditions d'utilisation et la
          politique de confidentialité de zugher (RGPD).
        </p>

        <div className="zg-actions" style={{ marginTop: 16 }}>
          <button type="submit" disabled={sending} className="zg-btn zg-btn-primary">
            {sending ? "Envoi du lien…" : "Créer mon compte"}
          </button>
          <Link to="/" className="zg-btn zg-btn-ghost">Annuler</Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
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
