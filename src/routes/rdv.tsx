import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  listAvailableSlots,
  bookAppointment,
} from "@/lib/appointments.functions";

export const Route = createFileRoute("/rdv")({
  head: () => ({
    meta: [
      { title: "Planifier un rendez-vous — zugher." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/inscription" });
    }
  },
  component: RdvPage,
});

type Slot = { startsAt: string; endsAt: string };

function formatDateHeader(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RdvPage() {
  const listFn = useServerFn(listAvailableSlots);
  const bookFn = useServerFn(bookAppointment);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["available-slots"],
    queryFn: () => listFn(),
  });

  const [selected, setSelected] = useState<Slot | null>(null);
  const [format, setFormat] = useState<"call" | "video">("video");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; confirmed: boolean; meetingLink: string | null }
    | { ok: false; error: string }
    | null
  >(null);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of data?.slots ?? []) {
      const key = s.startsAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !name.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const r = await bookFn({
        data: {
          startsAt: selected.startsAt,
          endsAt: selected.endsAt,
          format,
          contactName: name.trim(),
          contactPhone: phone.trim(),
          notes: notes.trim(),
        },
      });
      setResult(r);
      if (r.ok) {
        const { data: u } = await supabase.auth.getUser();
        const recipient = u.user?.email;
        if (recipient) {
          try {
            await sendTransactionalEmail({
              templateName: "appointment-confirmation",
              recipientEmail: recipient,
              idempotencyKey: `appt-confirm-${selected.startsAt}-${recipient}`,
              templateData: {
                contactName: name.trim(),
                dateLabel: formatDateHeader(selected.startsAt),
                timeLabel: `${formatTime(selected.startsAt)} (heure de Paris)`,
                format,
                meetingLink: r.meetingLink ?? null,
                contactPhone: phone.trim() || null,
              },
            });
          } catch (mailErr) {
            console.warn("Confirmation email failed", mailErr);
          }
        }
        setSelected(null);
        refetch();
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.ok) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">RDV planifié</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Rendez-vous <em>{result.confirmed ? "confirmé" : "enregistré"}</em>.
        </h1>
        <p className="zg-lead">
          {result.confirmed
            ? "Vous allez recevoir une invitation par email avec tous les détails."
            : "Votre demande est bien enregistrée. Notre équipe revient vers vous sous 24h ouvrées pour confirmer le créneau."}
        </p>
        {result.meetingLink && (
          <div className="zg-gate-note" style={{ marginTop: 16 }}>
            <strong>Lien visio</strong>
            <p style={{ margin: "8px 0 0", wordBreak: "break-all" }}>
              <a href={result.meetingLink} target="_blank" rel="noreferrer">
                {result.meetingLink}
              </a>
            </p>
          </div>
        )}
        <div className="zg-actions" style={{ marginTop: 24 }}>
          <Link to="/dashboard" className="zg-btn zg-btn-primary">
            Accéder à mon espace
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 980 }}>
      <div className="zg-stub-tag">Pro · Prise de rendez-vous</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}>
        Planifions notre <em>premier échange</em>.
      </h1>
      <p className="zg-lead" style={{ maxWidth: 720 }}>
        Choisissez un créneau de 30 minutes qui vous convient. Notre équipe
        prépare l'appel avec les informations que vous nous avez transmises lors
        de l'inscription.
      </p>

      {isLoading && <p style={{ marginTop: 24 }}>Chargement des créneaux disponibles…</p>}

      {!isLoading && groupedByDay.length === 0 && (
        <div className="zg-gate-note" style={{ marginTop: 24 }}>
          <strong>Aucun créneau disponible</strong>
          <p style={{ margin: "8px 0 0" }}>
            Tous les créneaux des deux prochaines semaines sont pris. Écrivez-nous
            via le chat pour un rendez-vous plus rapide.
          </p>
        </div>
      )}

      {!isLoading && groupedByDay.length > 0 && (
        <>
          {data && !data.calendarConnected && (
            <p className="zg-help" style={{ marginTop: 16 }}>
              Note admin : agenda Google non connecté — les créneaux affichés sont
              les heures de bureau par défaut (9h–18h, jours ouvrés).
            </p>
          )}

          <div style={{ marginTop: 32, display: "grid", gap: 24 }}>
            {groupedByDay.map(([day, slots]) => (
              <div key={day}>
                <h3 style={{ textTransform: "capitalize", marginBottom: 12 }}>
                  {formatDateHeader(day)}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.map((s) => {
                    const isSel = selected?.startsAt === s.startsAt;
                    return (
                      <button
                        key={s.startsAt}
                        type="button"
                        onClick={() => setSelected(s)}
                        className={isSel ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"}
                        style={{ padding: "8px 14px" }}
                      >
                        {formatTime(s.startsAt)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <form
          onSubmit={onSubmit}
          className="zg-form"
          style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border, #e8e4dd)" }}
        >
          <h2 style={{ marginBottom: 16 }}>
            Réserver le créneau du {formatDateHeader(selected.startsAt)} à{" "}
            {formatTime(selected.startsAt)}
          </h2>

          <label className="zg-field">
            <span className="zg-field-label">Format souhaité *</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as "call" | "video")}>
              <option value="video">Visio (Google Meet)</option>
              <option value="call">Appel téléphonique</option>
            </select>
          </label>

          <label className="zg-field">
            <span className="zg-field-label">Votre nom *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="Camille Durand"
            />
          </label>

          {format === "call" && (
            <label className="zg-field">
              <span className="zg-field-label">Numéro à appeler *</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                placeholder="+33 6 12 34 56 78"
              />
            </label>
          )}

          <label className="zg-field">
            <span className="zg-field-label">Précisions complémentaires</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Mise à jour ou contexte spécifique à transmettre avant le rendez-vous."
            />
          </label>

          {result && !result.ok && (
            <div className="zg-error" style={{ marginTop: 12 }}>{result.error}</div>
          )}

          <div className="zg-actions" style={{ marginTop: 16 }}>
            <button
              type="submit"
              disabled={submitting || (format === "call" && !phone.trim())}
              className="zg-btn zg-btn-primary"
            >
              {submitting ? "Réservation…" : "Confirmer le rendez-vous"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="zg-btn zg-btn-ghost"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
