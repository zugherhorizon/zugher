import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_my_profile",
  title: "Mettre à jour mon profil",
  description:
    "Met à jour les informations territoriales du profil zugher de l'utilisateur connecté (pays, région, département, ville, secteur, besoins).",
  inputSchema: {
    country: z.string().trim().min(2).max(80).optional(),
    region: z.string().trim().max(120).optional(),
    department: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    sector: z.string().trim().max(120).optional(),
    needs: z.string().trim().max(2000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined && v !== ""),
    );
    if (Object.keys(patch).length === 0)
      return {
        content: [{ type: "text", text: "Aucun champ à mettre à jour." }],
        isError: true,
      };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", ctx.getUserId())
      .select("id, country, region, department, city, sector, needs")
      .maybeSingle();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
