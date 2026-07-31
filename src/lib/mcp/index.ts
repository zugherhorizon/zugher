import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import updateMyProfile from "./tools/update-my-profile";
import listMyAppointments from "./tools/list-my-appointments";
import getMySubscription from "./tools/get-my-subscription";

// L'issuer OAuth doit être l'hôte Supabase direct : la variable SUPABASE_URL est
// réécrite en proxy .lovable.cloud à la publication, ce que mcp-js rejette.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "zugher-horizon",
  title: "Zugher Horizon",
  version: "0.1.0",
  instructions:
    "Outils zugher pour l'utilisateur connecté : consulter et mettre à jour son profil territorial, lister ses rendez-vous et consulter son abonnement.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, updateMyProfile, listMyAppointments, getMySubscription],
});
