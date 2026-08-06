import { createFileRoute } from "@tanstack/react-router";
import { InscriptionForm } from "@/components/zugher/InscriptionForm";

export const Route = createFileRoute("/inscription")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { audience?: string; territory?: string; needs?: string } => ({
    audience: typeof search.audience === "string" ? search.audience : undefined,
    territory: typeof search.territory === "string" ? search.territory : undefined,
    needs: typeof search.needs === "string" ? search.needs : undefined,
  }),

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

function InscriptionPage() {
  const search = Route.useSearch();
  return (
    <InscriptionForm
      mode="account"
      defaults={{
        audience:
          search.audience === "grand_public" || search.audience === "pro"
            ? search.audience
            : "",
        territory: search.territory ?? "",
        needs: search.needs ?? "",
      }}
    />
  );
}
