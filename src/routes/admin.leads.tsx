import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-site-settings";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Leads chat — Admin zugher." }] }),
  component: AdminLeadsPage,
});

type Session = Database["public"]["Tables"]["chat_sessions"]["Row"];
type Message = Database["public"]["Tables"]["chat_messages"]["Row"];
type Status = Database["public"]["Enums"]["chat_session_status"];

const STATUSES: Status[] = ["new", "contacted", "qualified", "converted", "archived"];
const STATUS_LABEL: Record<Status, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  converted: "Converti",
  archived: "Archivé",
};

function AdminLeadsPage() {
  const { loading: authLoading, user, emailConfirmed } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterAudience, setFilterAudience] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  // Drawer
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (err) setError(err.message);
    else setSessions((data ?? []) as Session[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (filterAudience && s.audience !== filterAudience) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterFrom && new Date(s.created_at) < new Date(filterFrom)) return false;
      if (filterTo && new Date(s.created_at) > new Date(filterTo + "T23:59:59")) return false;
      if (q) {
        const hay = [s.lead_name, s.lead_email, s.territory, s.notes]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, search, filterAudience, filterStatus, filterFrom, filterTo]);

  const stats = useMemo(() => {
    const by: Record<string, number> = {};
    for (const s of filtered) by[s.status] = (by[s.status] ?? 0) + 1;
    return { total: filtered.length, by };
  }, [filtered]);

  const openDetails = async (s: Session) => {
    setOpenSession(s);
    setMsgLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", s.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    setMsgLoading(false);
  };

  const updateStatus = async (id: string, status: Status) => {
    const prev = sessions;
    setSessions((cur) => cur.map((s) => (s.id === id ? { ...s, status } : s)));
    if (openSession?.id === id) setOpenSession({ ...openSession, status });
    const { error: err } = await supabase
      .from("chat_sessions").update({ status }).eq("id", id);
    if (err) {
      setSessions(prev);
      setError(err.message);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Supprimer définitivement cette conversation ?")) return;
    await supabase.from("chat_messages").delete().eq("session_id", id);
    const { error: err } = await supabase.from("chat_sessions").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSessions((cur) => cur.filter((s) => s.id !== id));
    if (openSession?.id === id) setOpenSession(null);
  };

  const exportCsv = () => {
    const headers = ["created_at","status","audience","lead_name","lead_email","territory","notes"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [headers.join(",")];
    for (const s of filtered) {
      rows.push(headers.map((h) => escape((s as any)[h])).join(","));
    }
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-zugher-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || roleLoading) {
    return <section className="zg-stub"><p className="zg-lead">Chargement…</p></section>;
  }
  if (!user || !emailConfirmed) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <div className="zg-stub-tag">Admin · Accès restreint</div>
        <h1 className="zg-h1">Connexion requise.</h1>
        <div className="zg-actions"><Link to="/inscription" className="zg-btn zg-btn-primary">Se connecter</Link></div>
      </section>
    );
  }
  if (!isAdmin) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <div className="zg-stub-tag">Admin · Accès refusé</div>
        <h1 className="zg-h1">Réservé aux administrateurs.</h1>
        <div className="zg-actions"><Link to="/" className="zg-btn zg-btn-ghost">Retour</Link></div>
      </section>
    );
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 1280 }}>
      <div className="zg-stub-tag">Admin · Leads chat</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}>
        Leads générés <em>par le chat</em>.
      </h1>
      <p className="zg-lead">
        Consultez, filtrez et exportez les conversations qualifiées par Zora.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
        <StatChip label="Total" value={stats.total} />
        {STATUSES.map((s) => (
          <StatChip key={s} label={STATUS_LABEL[s]} value={stats.by[s] ?? 0} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 24 }}>
        <input
          placeholder="Rechercher (nom, email, territoire…)"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select value={filterAudience} onChange={(e) => setFilterAudience(e.target.value)} style={inputStyle}>
          <option value="">Toutes audiences</option>
          <option value="grand_public">Grand public</option>
          <option value="pro">Professionnel</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">Tous statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={inputStyle} />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={inputStyle} />
        <button onClick={exportCsv} className="zg-btn zg-btn-primary" type="button">
          Exporter CSV ({filtered.length})
        </button>
      </div>

      {error && <div className="zg-error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Table */}
      <div style={{ marginTop: 24, overflowX: "auto", border: "1px solid var(--line, #e5e5e5)", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--bg-subtle, #fafafa)", textAlign: "left" }}>
              <Th>Date</Th><Th>Audience</Th><Th>Nom</Th><Th>Email</Th>
              <Th>Territoire</Th><Th>Statut</Th><Th>{" "}</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center" }}>Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", opacity: 0.6 }}>Aucun lead.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid var(--line, #eee)" }}>
                <Td>{new Date(s.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</Td>
                <Td><AudienceBadge value={s.audience} /></Td>
                <Td>{s.lead_name || <em style={{ opacity: 0.5 }}>—</em>}</Td>
                <Td>{s.lead_email || <em style={{ opacity: 0.5 }}>—</em>}</Td>
                <Td>{s.territory || <em style={{ opacity: 0.5 }}>—</em>}</Td>
                <Td>
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value as Status)}
                    style={{ ...inputStyle, padding: "4px 8px", fontSize: 13 }}
                  >
                    {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                  </select>
                </Td>
                <Td>
                  <button onClick={() => openDetails(s)} className="zg-btn zg-btn-ghost" style={{ padding: "4px 10px", fontSize: 13 }}>
                    Détails
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link to="/admin/parametres" className="zg-btn zg-btn-ghost">← Paramètres</Link>
      </div>

      {/* Detail drawer */}
      {openSession && (
        <div
          onClick={() => setOpenSession(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(560px, 100%)", height: "100%", background: "var(--bg, #fff)", overflowY: "auto", padding: 24, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Conversation</h2>
              <button onClick={() => setOpenSession(null)} className="zg-btn zg-btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
            </div>

            <dl style={{ marginTop: 20, display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 14 }}>
              <Dt>Date</Dt><Dd>{new Date(openSession.created_at).toLocaleString("fr-FR")}</Dd>
              <Dt>Statut</Dt>
              <Dd>
                <select
                  value={openSession.status}
                  onChange={(e) => updateStatus(openSession.id, e.target.value as Status)}
                  style={{ ...inputStyle, padding: "4px 8px" }}
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                </select>
              </Dd>
              <Dt>Audience</Dt><Dd><AudienceBadge value={openSession.audience} /></Dd>
              <Dt>Nom</Dt><Dd>{openSession.lead_name || "—"}</Dd>
              <Dt>Email</Dt><Dd>{openSession.lead_email || "—"}</Dd>
              <Dt>Territoire</Dt><Dd>{openSession.territory || "—"}</Dd>
              <Dt>Notes / besoins</Dt><Dd style={{ whiteSpace: "pre-wrap" }}>{openSession.notes || "—"}</Dd>
            </dl>

            <h3 style={{ marginTop: 28, fontSize: 16 }}>Messages</h3>
            {msgLoading ? <p>Chargement…</p> : messages.length === 0 ? (
              <p style={{ opacity: 0.6 }}>Aucun message.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {messages.map((m) => (
                  <div key={m.id} style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: m.role === "user" ? "var(--bg-subtle, #f5f5f5)" : "var(--terra-soft, #fff5ef)",
                    fontSize: 14,
                  }}>
                    <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {m.role === "user" ? "Visiteur" : "Zora"} · {new Date(m.created_at).toLocaleTimeString("fr-FR")}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{renderParts(m.parts)}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              <button onClick={() => deleteSession(openSession.id)} className="zg-btn zg-btn-ghost" style={{ color: "var(--terra)" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function renderParts(parts: unknown): string {
  if (!Array.isArray(parts)) return typeof parts === "string" ? parts : "";
  return parts
    .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
    .filter(Boolean)
    .join("\n");
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--line, #ddd)",
  background: "var(--bg, #fff)",
  fontSize: 14,
  fontFamily: "inherit",
};

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: "8px 14px",
      borderRadius: 999,
      border: "1px solid var(--line, #e5e5e5)",
      fontSize: 13,
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AudienceBadge({ value }: { value: string | null }) {
  if (!value) return <em style={{ opacity: 0.5 }}>—</em>;
  const isPro = value === "pro";
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      background: isPro ? "var(--terra-soft, #fff5ef)" : "var(--bg-subtle, #f0f0f0)",
      color: isPro ? "var(--terra, #c2410c)" : "inherit",
    }}>
      {isPro ? "Pro" : "Grand public"}
    </span>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{ padding: "10px 12px", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7 }}>{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>{children}</td>
);
const Dt = ({ children }: { children: React.ReactNode }) => (
  <dt style={{ opacity: 0.6, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</dt>
);
const Dd = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <dd style={{ margin: 0, ...style }}>{children}</dd>
);
