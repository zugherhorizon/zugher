import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Business hours config (admin's local TZ assumed Europe/Paris)
const SLOT_MINUTES = 30;
const BUSINESS_HOURS_START = 9; // 09:00
const BUSINESS_HOURS_END = 18; // 18:00
const LOOKAHEAD_DAYS = 14;
const TZ_OFFSET_HOURS = 1; // approx Europe/Paris (winter). Good enough for display.

type Slot = { startsAt: string; endsAt: string };

function generateBaseSlots(): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  // Start from tomorrow to leave admin time to prepare
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  for (let d = 0; d < LOOKAHEAD_DAYS; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    for (let h = BUSINESS_HOURS_START; h < BUSINESS_HOURS_END; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        const s = new Date(day);
        s.setHours(h - TZ_OFFSET_HOURS, m, 0, 0); // store as UTC-ish
        const e = new Date(s.getTime() + SLOT_MINUTES * 60_000);
        slots.push({ startsAt: s.toISOString(), endsAt: e.toISOString() });
      }
    }
  }
  return slots;
}

async function fetchGoogleBusy(
  timeMin: string,
  timeMax: string,
): Promise<{ start: string; end: string }[] | null> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) return null;
  try {
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_calendar/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        }),
      },
    );
    if (!res.ok) {
      console.error("Google freeBusy failed", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      calendars?: { primary?: { busy?: { start: string; end: string }[] } };
    };
    return json.calendars?.primary?.busy ?? [];
  } catch (e) {
    console.error("Google freeBusy error", e);
    return null;
  }
}

export const listAvailableSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const slots = generateBaseSlots();
    if (slots.length === 0) return { slots: [], calendarConnected: false };

    const timeMin = slots[0].startsAt;
    const timeMax = slots[slots.length - 1].endsAt;

    const [busyGoogle, dbBookings] = await Promise.all([
      fetchGoogleBusy(timeMin, timeMax),
      context.supabase
        .from("appointments")
        .select("starts_at,ends_at")
        .gte("starts_at", timeMin)
        .lte("starts_at", timeMax)
        .in("status", ["pending", "confirmed"]),
    ]);

    const busy: { start: number; end: number }[] = [];
    if (busyGoogle) {
      for (const b of busyGoogle) {
        busy.push({
          start: new Date(b.start).getTime(),
          end: new Date(b.end).getTime(),
        });
      }
    }
    for (const b of dbBookings.data ?? []) {
      busy.push({
        start: new Date(b.starts_at).getTime(),
        end: new Date(b.ends_at).getTime(),
      });
    }

    const available = slots.filter((s) => {
      const ss = new Date(s.startsAt).getTime();
      const se = new Date(s.endsAt).getTime();
      return !busy.some((b) => ss < b.end && se > b.start);
    });

    return { slots: available, calendarConnected: !!busyGoogle };
  });

const BookSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  format: z.enum(["call", "video"]),
  contactName: z.string().trim().min(1).max(200),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

async function createGoogleEvent(args: {
  startsAt: string;
  endsAt: string;
  summary: string;
  description: string;
  format: "call" | "video";
  attendeeEmail: string;
}): Promise<{ eventId?: string; meetLink?: string } | null> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) return null;
  try {
    const body: Record<string, unknown> = {
      summary: args.summary,
      description: args.description,
      start: { dateTime: args.startsAt },
      end: { dateTime: args.endsAt },
      attendees: [{ email: args.attendeeEmail }],
    };
    if (args.format === "video") {
      body.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("Google event create failed", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      id?: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: { uri?: string }[] };
    };
    return {
      eventId: json.id,
      meetLink:
        json.hangoutLink ?? json.conferenceData?.entryPoints?.[0]?.uri,
    };
  } catch (e) {
    console.error("Google event create error", e);
    return null;
  }
}

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      return { ok: false as const, error: "Email introuvable." };
    }

    // Check slot still free
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .lt("starts_at", data.endsAt)
      .gt("ends_at", data.startsAt)
      .in("status", ["pending", "confirmed"]);
    if (conflicts && conflicts.length > 0) {
      return { ok: false as const, error: "Ce créneau vient d'être réservé. Choisissez-en un autre." };
    }

    const googleResult = await createGoogleEvent({
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      summary: `zugher · RDV ${data.format === "video" ? "visio" : "appel"} avec ${data.contactName}`,
      description: [
        `Contact : ${data.contactName} <${email}>`,
        data.contactPhone ? `Téléphone : ${data.contactPhone}` : null,
        data.notes ? `\nNotes :\n${data.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      format: data.format,
      attendeeEmail: email,
    });

    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      contact_email: email,
      contact_name: data.contactName,
      contact_phone: data.contactPhone || null,
      format: data.format,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      notes: data.notes || null,
      status: googleResult?.eventId ? "confirmed" : "pending",
      google_event_id: googleResult?.eventId ?? null,
      meeting_link: googleResult?.meetLink ?? null,
    });

    if (error) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: true as const,
      confirmed: !!googleResult?.eventId,
      meetingLink: googleResult?.meetLink ?? null,
    };
  });
