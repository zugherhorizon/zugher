import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { generateBusinessPlan, type BusinessPlan } from "@/lib/business-plan.functions";

export const Route = createFileRoute("/business-plan")({
  head: () => ({
    meta: [
      { title: "Business Plan IA — zugher." },
      {
        name: "description",
        content:
          "Générez un business plan structuré et chiffré en quelques minutes grâce à l'intelligence artificielle.",
      },
    ],
  }),
  component: BusinessPlanPage,
});

type FormState = {
  projectName: string;
  sector: string;
  territory: string;
  problem: string;
  solution: string;
  target: string;
  revenueModel: string;
  fundingNeeds: string;
};

const initial: FormState = {
  projectName: "",
  sector: "",
  territory: "",
  problem: "",
  solution: "",
  target: "",
  revenueModel: "",
  fundingNeeds: "",
};

function BusinessPlanPage() {
  const [form, setForm] = useState<FormState>(initial);
  const fn = useServerFn(generateBusinessPlan);
  const mutation = useMutation({
    mutationFn: (data: FormState) => fn({ data }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const result = mutation.data;
  const plan = result?.ok ? result.plan : null;
  const errorMsg = result && !result.ok ? result.error : mutation.error instanceof Error ? mutation.error.message : null;

  return (
    <section className="zg-stub" style={{ maxWidth: 980 }}>
      <div className="zg-stub-tag">Application · Business Plan IA</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
        Votre business plan, <em>généré</em> en quelques minutes.
      </h1>
      <p className="zg-lead">
        Décrivez votre projet en quelques lignes. L'IA produit un BP structuré : marché, modèle économique,
        finances prévisionnelles, risques et feuille de route.
      </p>

      {!plan && (
        <form onSubmit={onSubmit} className="zg-form" style={{ marginTop: 32 }}>
          <div className="zg-grid-2">
            <Field label="Nom du projet" required>
              <input required value={form.projectName} onChange={setField("projectName")} placeholder="Ex. Coopérative Maraîchère du Val" />
            </Field>
            <Field label="Secteur d'activité" required>
              <input required value={form.sector} onChange={setField("sector")} placeholder="Ex. Agriculture, EdTech, Tourisme…" />
            </Field>
            <Field label="Territoire ciblé" required>
              <input required value={form.territory} onChange={setField("territory")} placeholder="Ex. Région PACA, Pays basque…" />
            </Field>
            <Field label="Cible / clientèle" required>
              <input required value={form.target} onChange={setField("target")} placeholder="Ex. Cantines scolaires, familles bio…" />
            </Field>
          </div>

          <Field label="Problème adressé" required>
            <textarea required rows={3} value={form.problem} onChange={setField("problem")} placeholder="Quel besoin non couvert votre projet résout-il ?" />
          </Field>
          <Field label="Solution proposée" required>
            <textarea required rows={3} value={form.solution} onChange={setField("solution")} placeholder="Décrivez votre produit ou service…" />
          </Field>
          <Field label="Modèle de revenus" required>
            <textarea required rows={2} value={form.revenueModel} onChange={setField("revenueModel")} placeholder="Ex. Abonnement, vente directe, commission…" />
          </Field>
          <Field label="Besoins de financement (optionnel)">
            <input value={form.fundingNeeds} onChange={setField("fundingNeeds")} placeholder="Ex. 150 000 € pour démarrage et trésorerie" />
          </Field>

          {errorMsg && <div className="zg-error">{errorMsg}</div>}

          <div className="zg-actions" style={{ marginTop: 16 }}>
            <button type="submit" disabled={mutation.isPending} className="zg-btn zg-btn-primary">
              {mutation.isPending ? "Génération en cours…" : "Générer mon business plan"}
            </button>
            <Link to="/" className="zg-btn zg-btn-ghost">Annuler</Link>
          </div>
          <p className="zg-help">La génération prend généralement entre 20 et 60 secondes.</p>
        </form>
      )}

      {plan && <PlanView plan={plan} onReset={() => mutation.reset()} />}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="zg-field">
      <span className="zg-field-label">
        {label}
        {required && <em style={{ color: "var(--terra)" }}> *</em>}
      </span>
      {children}
    </label>
  );
}

function PlanView({ plan, onReset }: { plan: BusinessPlan; onReset: () => void }) {
  return (
    <article className="zg-plan" style={{ marginTop: 40 }}>
      <div className="zg-actions" style={{ marginBottom: 24 }}>
        <button onClick={onReset} className="zg-btn zg-btn-ghost">← Nouveau business plan</button>
        <button onClick={() => window.print()} className="zg-btn zg-btn-primary">Imprimer / PDF</button>
      </div>

      <Section title="Résumé exécutif">{plan.executiveSummary}</Section>
      <Section title="Problème">{plan.problemStatement}</Section>
      <Section title="Solution">{plan.solution}</Section>

      <Section title="Analyse de marché">
        <SubBlock label="Clients cibles" value={plan.marketAnalysis.targetCustomers} />
        <SubBlock label="Taille du marché" value={plan.marketAnalysis.marketSize} />
        <SubBlock label="Concurrence" value={plan.marketAnalysis.competition} />
        <SubBlock label="Tendances" value={plan.marketAnalysis.trends} />
      </Section>

      <Section title="Modèle économique">
        <SubBlock label="Proposition de valeur" value={plan.businessModel.valueProposition} />
        <SubBlock label="Sources de revenus" value={plan.businessModel.revenueStreams} />
        <SubBlock label="Tarification" value={plan.businessModel.pricing} />
      </Section>

      <Section title="Go-to-market">{plan.goToMarket}</Section>
      <Section title="Opérations">{plan.operations}</Section>
      <Section title="Équipe">{plan.team}</Section>

      <Section title="Prévisions financières">
        <SubBlock label="Année 1" value={plan.financials.year1} />
        <SubBlock label="Année 2" value={plan.financials.year2} />
        <SubBlock label="Année 3" value={plan.financials.year3} />
        <SubBlock label="Point mort" value={plan.financials.breakEven} />
        <SubBlock label="Plan de financement" value={plan.financials.fundingPlan} />
      </Section>

      <Section title="Risques & mitigations">
        <ul className="zg-list">
          {plan.risks.map((r, i) => (
            <li key={i}>
              <strong>{r.risk}</strong> — {r.mitigation}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Feuille de route">
        <ul className="zg-list">
          {plan.roadmap.map((r, i) => (
            <li key={i}>
              <strong>{r.phase} :</strong> {r.milestones}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="zg-plan-section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function SubBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="zg-subblock">
      <div className="zg-subblock-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
