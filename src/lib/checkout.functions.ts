import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveCheckoutPrice } from "./pricing";

const InputSchema = z.object({
  planId: z.enum(["demandeur", "competence", "porteur", "investisseur"]),
  cadence: z.enum(["monthly", "yearly"]),
});

/**
 * Prépare une session de paiement pour l'offre choisie.
 * Le prix est recalculé côté serveur via resolveCheckoutPrice — le client
 * n'envoie qu'un planId + une cadence, jamais un montant.
 *
 * Quand le provider de paiement sera branché (Stripe / Paddle), c'est ici
 * qu'on créera la session avec `priced.unitAmountCents`, `priced.currency`
 * et `priced.intervalMonths`.
 */
export const prepareCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const priced = resolveCheckoutPrice(data.planId, data.cadence);

    if (!priced) {
      // Offre gratuite ou plan inconnu : pas de paiement à initier.
      return {
        status: "free" as const,
        planId: data.planId,
        cadence: data.cadence,
      };
    }

    return {
      status: "ready" as const,
      ...priced,
    };
  });
