import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useNavigate } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const VISITOR_KEY = "zugher.visitorId";

function getVisitorId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  const visitorId = useMemo(() => (mounted ? getVisitorId() : ""), [mounted]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, visitorId, ...(body ?? {}) },
        }),
      }),
    [visitorId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: visitorId || "zugher-visitor",
    transport,
  });

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  if (!mounted) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="zg-chat-fab"
          aria-label="Ouvrir le chat zugher"
        >
          <MessageCircle size={20} />
          <span>Discuter avec Zora</span>
        </button>
      )}

      {open && (
        <div className="zg-chat-panel" role="dialog" aria-label="Chat zugher">
          <header className="zg-chat-header">
            <div>
              <div className="zg-chat-title">Zora · assistante zugher</div>
              <div className="zg-chat-sub">
                On cerne votre besoin en 2 minutes.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              className="zg-chat-close"
            >
              <X size={18} />
            </button>
          </header>

          <Conversation className="zg-chat-body">
            <ConversationContent>
              {messages.length === 0 && (
                <ConversationEmptyState
                  title="Bonjour 👋"
                  description="Dites-moi ce que vous cherchez : investir dans un territoire, lancer un projet, ou nous solliciter pour un partenariat ?"
                />
              )}

              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <Message from={m.role} key={m.id}>
                    <MessageContent
                      variant={m.role === "user" ? "contained" : "flat"}
                    >
                      {m.role === "assistant" ? (
                        <div className="zg-chat-md">
                          <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                      ) : (
                        <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {status === "submitted" && (
                <div className="zg-chat-thinking">
                  <Shimmer>Zora réfléchit…</Shimmer>
                </div>
              )}

              {error && (
                <div className="zg-error" style={{ margin: "8px 0" }}>
                  Connexion perdue. Réessayez dans un instant.
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="zg-chat-footer">
            <PromptInput onSubmit={onSubmit}>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message…"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={status}
                  disabled={!input.trim() || isLoading}
                />
              </PromptInputFooter>
            </PromptInput>

            <div className="zg-chat-actions">
              <button
                type="button"
                className="zg-btn zg-btn-primary zg-btn-sm"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/inscription" });
                }}
              >
                Créer mon compte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
