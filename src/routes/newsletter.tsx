import { createFileRoute } from "@tanstack/react-router";
import { InscriptionForm } from "@/components/zugher/InscriptionForm";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — zugher." },
      {
        name: "description",
        content:
          "Abonnez-vous à la lettre mensuelle zugher : veille territoires, opportunités sélectionnées, nouveautés produit. L'inscription crée automatiquement votre compte.",
      },
    ],
  }),
  component: () => <InscriptionForm mode="newsletter" />,
});
