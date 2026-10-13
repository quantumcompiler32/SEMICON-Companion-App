import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { differenceInMinutes } from "date-fns";
import { EVENT_DATE, TIMEZONE } from "../data/conference";
import type { Activity, Exhibitor, PersonalData } from "./models";
export const eventTime = (time: string) =>
  fromZonedTime(`${EVENT_DATE}T${time}:00`, TIMEZONE);
export const timeLabel = (time: string) =>
  formatInTimeZone(eventTime(time), TIMEZONE, "h:mm a");
export const rangeLabel = (a: Activity) =>
  `${timeLabel(a.start)} – ${timeLabel(a.end)}`;
export const minutesUntil = (time: string, now: Date) =>
  Math.max(0, differenceInMinutes(eventTime(time), now));
export function timeline(activities: Activity[], now: Date) {
  const sorted = [...activities].sort((a, b) => a.start.localeCompare(b.start));
  return {
    current: sorted.find(
      (a) => eventTime(a.start) <= now && now < eventTime(a.end),
    ),
    next: sorted.find((a) => eventTime(a.start) > now),
    before: now < eventTime("08:00"),
    after: now >= eventTime("19:00"),
  };
}
export function status(a: Activity, now: Date, attended: string[]) {
  if (now < eventTime(a.start)) return "upcoming";
  if (now < eventTime(a.end)) return "happening now";
  return attended.includes(a.id)
    ? "completed"
    : a.type === "required"
      ? "missed"
      : "ended";
}
export function conflicts(candidate: Activity, activities: Activity[]) {
  return activities.filter(
    (a) =>
      a.id !== candidate.id &&
      (a.type === "required" || a.type === "transport") &&
      eventTime(candidate.start) < eventTime(a.end) &&
      eventTime(candidate.end) > eventTime(a.start),
  );
}
export function goalProgress(data: PersonalData) {
  const counts: Record<string, number> = {
    people: data.contacts.length,
    booths: ["siemens", "nordson", "edwards"].filter(
      (id) => data.booths[id]?.visited,
    ).length,
    careers: data.notes.filter((n) => n.kind === "career").length,
    opportunities:
      data.notes.filter((n) => n.kind === "opportunity").length +
      data.contacts.filter((c) => c.opportunities.trim()).length,
    insights: data.notes.filter((n) => n.kind === "insight").length,
    skills: data.notes.filter((n) => n.kind === "skill").length,
  };
  return data.goals.map((g) => ({
    ...g,
    value: Math.max(g.manual, counts[g.id] ?? 0),
  }));
}
export function planTour(
  exhibitors: Exhibitor[],
  data: PersonalData,
  conversation = 10,
  walkBuffer = 5,
  returnBuffer = 15,
) {
  const available = 60 - returnBuffer;
  const capacity = Math.max(
    0,
    Math.min(3, Math.floor(available / (conversation + walkBuffer))),
  );
  const eligible = exhibitors
    .filter((e) => e.booth && !data.booths[e.id]?.visited)
    .sort(
      (a, b) =>
        (data.booths[a.id]?.priority ?? a.priority) -
        (data.booths[b.id]?.priority ?? b.priority),
    );
  const ordered = [
    ...data.tourOrder
      .map((id) => eligible.find((e) => e.id === id))
      .filter((e): e is Exhibitor => !!e),
    ...eligible.filter((e) => !data.tourOrder.includes(e.id)),
  ].slice(0, capacity);
  return {
    stops: ordered.map((e, i) => ({
      exhibitor: e,
      start: 810 + i * (conversation + walkBuffer),
      end: 810 + i * (conversation + walkBuffer) + conversation,
    })),
    returnAt: 870 - returnBuffer,
    provisional: true,
    conversation,
    walkBuffer,
    returnBuffer,
  };
}
export const clockMinutes = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
