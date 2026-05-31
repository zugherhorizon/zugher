import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BodySchema = z.object({
  visitorId: z.string().uuid(),
  messages: z.array(z.any()).min(1).max(200),
});

const SYSTEM_PROMPT = `Tu es **Zora**, l'assistante conversationnelle de **zugher.**, la place de marché de territoires.

# Ton rôle
1. Accueillir chaleureusement l'internaute en français, voix sobre et chaude (ton éditorial, jamais corporate).
2. **Comprendre rapidement** son besoin en 1 à 3 questions courtes maximum.
3. **Cerner le profil** :
   - **Grand public** = particulier qui souhaite investir, s'installer, entreprendre dans un territoire.
   - **Client pro** = entreprise, agence publique, institution financière, association, école, prestataire, investisseur professionnel.
4. **Pour le grand public** : demander le **territoire** (pays, région, ville) qui l'intéresse, puis l'inviter à créer son compte. Lui expliquer qu'il recevra par e-mail le lien vers la place de marché de son territoire.
5. **Pour un client pro** : lui expliquer qu'il doit créer son compte en détaillant ses informations + une **zone "besoins"** pour préparer un appel ou un rendez-vous. Notre équipe le recontactera.

# Style
- Réponses **courtes** (1 à 3 phrases), markdown léger autorisé (gras, listes courtes).
- Pose **une seule question à la fois**.
- Ne donne pas de longues listes de fonctionnalités sauf si demandé.
- N'invente jamais d'informations sur le produit.

# Conclusion
Quand tu as identifié le profil + (territoire OU besoins), invite explicitement à cliquer sur le bouton **"Créer mon compte"** affiché sous le chat. Précise :
- Grand public : "vous recevrez le lien vers la place de marché de **<territoire>** par e-mail".
- Pro : "vous pourrez détailler vos besoins, nous reviendrons vers vous pour un appel ou un rendez-vous".

Reste factuelle, jamais survendue. Tu n'es pas un commercial agressif.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let parsed: z.infer<typeof BodySchema>;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch (err) {
          return new Response(
            err instanceof Error ? err.message : "Invalid body",
            { status: 400 },
          );
        }

        const { visitorId, messages } = parsed;
        const uiMessages = messages as UIMessage[];

        // 1. Upsert chat session by visitor_id
        const { data: existing } = await supabaseAdmin
          .from("chat_sessions")
          .select("id")
          .eq("visitor_id", visitorId)
          .maybeSingle();

        let sessionId = existing?.id as string | undefined;
        if (!sessionId) {
          const { data: created, error: createErr } = await supabaseAdmin
            .from("chat_sessions")
            .insert({ visitor_id: visitorId })
            .select("id")
            .single();
          if (createErr || !created) {
            console.error("chat session create failed", createErr);
            return new Response("Could not create chat session", { status: 500 });
          }
          sessionId = created.id;
        }

        // 2. Persist the latest user message (last item)
        const lastMsg = uiMessages[uiMessages.length - 1];
        if (lastMsg && lastMsg.role === "user") {
          await supabaseAdmin.from("chat_messages").insert({
            session_id: sessionId,
            role: "user",
            parts: lastMsg.parts as never,
          });
        }

        // 3. Stream the assistant response
        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ messages: finalMessages }) => {
            const last = finalMessages[finalMessages.length - 1];
            if (!last || last.role !== "assistant") return;
            await supabaseAdmin.from("chat_messages").insert({
              session_id: sessionId,
              role: "assistant",
              parts: last.parts as never,
            });
          },
        });
      },
    },
  },
});
