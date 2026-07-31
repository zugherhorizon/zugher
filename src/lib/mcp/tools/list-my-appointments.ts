import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_appointments",
  title: "Mes rendez-vous",
  description:
    "Liste les rendez-vous zugher de l'utilisateur connecté, du plus récent au plus ancien.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10),
    upcoming_only: z.boolean().default(false),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, upcoming_only }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, format, status, contact_name, contact_email, meeting_link, notes",
      )
      .eq("user_id", ctx.getUserId())
      .order("starts_at", { ascending: false })
      .limit(limit);
    if (upcoming_only) query = query.gte("starts_at", new Date().toISOString());
    const { data, error } = await query;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { appointments: data ?? [] },
    };
  },
});
