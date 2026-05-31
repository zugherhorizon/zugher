import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  projectName: z.string().trim().min(2).max(120),
  sector: z.string().trim().min(2).max(80),
  territory: z.string().trim().min(2).max(80),
  problem: z.string().trim().min(10).max(2000),
  solution: z.string().trim().min(10).max(2000),
  target: z.string().trim().min(2).max(500),
  revenueModel: z.string().trim().min(2).max(500),
  fundingNeeds: z.string().trim().max(500).optional().default(""),
});

const BusinessPlanSchema = z.object({
  executiveSummary: z.string(),
  problemStatement: z.string(),
  solution: z.string(),
  marketAnalysis: z.object({
    targetCustomers: z.string(),
    marketSize: z.string(),
    competition: z.string(),
    trends: z.string(),
  }),
  businessModel: z.object({
    valueProposition: z.string(),
    revenueStreams: z.string(),
    pricing: z.string(),
  }),
  goToMarket: z.string(),
  operations: z.string(),
  team: z.string(),
  financials: z.object({
    year1: z.string(),
    year2: z.string(),
    year3: z.string(),
    breakEven: z.string(),
    fundingPlan: z.string(),
  }),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  roadmap: z.array(z.object({ phase: z.string(), milestones: z.string() })),
});

export type BusinessPlan = z.infer<typeof BusinessPlanSchema>;

export const generateBusinessPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { ok: false as const, error: "Service IA non configuré." };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Tu es un expert en création d'entreprise et financement de projets. Génère un business plan structuré, réaliste et actionnable EN FRANÇAIS pour le projet suivant :

- Nom : ${data.projectName}
- Secteur : ${data.sector}
- Territoire ciblé : ${data.territory}
- Problème adressé : ${data.problem}
- Solution proposée : ${data.solution}
- Cible : ${data.target}
- Modèle de revenus envisagé : ${data.revenueModel}
- Besoins de financement : ${data.fundingNeeds || "Non précisés"}

Sois concret, chiffré quand pertinent (en euros), et adapté au contexte territorial. Évite le jargon creux.`;

    try {
      const { experimental_output } = await generateText({
        model,
        prompt,
        experimental_output: Output.object({ schema: BusinessPlanSchema }),
      });
      return { ok: true as const, plan: experimental_output };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 429) {
        return { ok: false as const, error: "Limite de requêtes atteinte. Réessayez dans un instant." };
      }
      if (status === 402) {
        return { ok: false as const, error: "Crédits IA épuisés. Ajoutez des crédits dans l'espace de travail." };
      }
      return { ok: false as const, error: `Échec de génération : ${message}` };
    }
  });
