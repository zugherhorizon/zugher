import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

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
  "Entrepreneur",
  "Entreprise",
  "Agence publique",
  "Institution financière",
  "Association",
  "Investisseur",
  "Prestataire",
  "Compétence",
  "École / Université",
] as const;

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
    profil: z.enum(PROFILS, { message: "Sélectionnez un profil" }),
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

  const setField =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
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
    setSubmitted(true);
  };

  const summary = useMemo(
    () => ({
      nom: [form.firstName, form.lastName].filter(Boolean).join(" ") || "—",
      email: form.email,
      tel: form.phone || "—",
      profil: form.profil,
      pays: form.pays || "—",
    }),
    [form],
  );

  if (submitted) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">Inscription · Confirmation</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Bienvenue sur <em>zugher</em>.
        </h1>
        <p className="zg-lead">
          Votre compte est en cours de création. Un e-mail de confirmation a été envoyé à{" "}
          <strong>{summary.email}</strong>.
        </p>

        <div className="zg-gate-note" style={{ marginTop: 24 }}>
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
          <Link to="/dashboard" className="zg-btn zg-btn-primary">Accéder à mon espace</Link>
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
        Quelques informations pour créer votre compte. Seuls l'<strong>e-mail</strong> et le{" "}
        <strong>profil</strong> sont obligatoires — vous compléterez le reste plus tard.
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
                <option key={p} value={p}>{p}</option>
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

        <p className="zg-help">
          En créant un compte, vous acceptez les conditions d'utilisation et la politique de
          confidentialité de zugher (RGPD).
        </p>

        <div className="zg-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="zg-btn zg-btn-primary">Créer mon compte</button>
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
