import type { Activity, PersonalData } from "../domain/models";
import { initialData } from "../data/conference";
import { eventTime } from "../domain/schedule";
export const csvCell = (v: unknown) => {
  const value = String(v ?? "");
  return `"${(/^[=+@\-\t\r]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
};
export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap(Object.keys))];
  return (
    "\uFEFF" +
    [
      keys.map(csvCell).join(","),
      ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n")
  );
}
export function download(
  name: string,
  data: string | Blob,
  type = "application/json",
) {
  const url = URL.createObjectURL(
    typeof data === "string" ? new Blob([data], { type }) : data,
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escapeICS = (s: string) =>
  s
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
const utc = (time: string) =>
  eventTime(time)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export function calendar(activities: Activity[], reminder = 10) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SEMICON Navigator//Conference//EN",
    "CALSCALE:GREGORIAN",
    ...activities.flatMap((a) => [
      "BEGIN:VEVENT",
      `UID:${a.id}@semicon-navigator.local`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "")}`,
      `DTSTART:${utc(a.start)}`,
      `DTEND:${utc(a.end)}`,
      `SUMMARY:${escapeICS(a.title)}`,
      `LOCATION:${escapeICS(a.location)}`,
      `DESCRIPTION:${escapeICS(a.preparation)}`,
      ...(reminder > 0
        ? [
            "BEGIN:VALARM",
            `TRIGGER:-PT${reminder}M`,
            "ACTION:DISPLAY",
            `DESCRIPTION:${escapeICS(a.title)}`,
            "END:VALARM",
          ]
        : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(foldICS).join("\r\n") + "\r\n";
}
function foldICS(line: string) {
  let out = "",
    length = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (length + bytes > 73) {
      out += "\r\n ";
      length = 1;
    }
    out += char;
    length += bytes;
  }
  return out;
}
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string" && v.length <= 100000;
const stringFields = (v: Record<string, unknown>, keys: string[]) =>
  keys.every((k) => str(v[k]));
export function parseBackup(text: string): PersonalData {
  const v: unknown = JSON.parse(text);
  const bad = () => {
    throw new Error(
      "Invalid backup. Please choose an unmodified SEMICON Navigator JSON export.",
    );
  };
  if (
    !isObject(v) ||
    v.version !== 1 ||
    !isObject(v.settings) ||
    !Array.isArray(v.contacts) ||
    !Array.isArray(v.notes) ||
    !Array.isArray(v.goals) ||
    !Array.isArray(v.customActivities) ||
    !isObject(v.booths) ||
    !isObject(v.reminders)
  )
    return bad();
  const s = v.settings;
  if (
    ![null, "A", "B", "C"].includes(s.group as null) ||
    !["dark", "light"].includes(String(s.theme)) ||
    !stringFields(s, ["hall", "introduction"]) ||
    ![0, 5, 10, 15].includes(Number(s.reminderMinutes))
  )
    return bad();
  for (const key of ["checklist", "attended", "tourOrder"])
    if (!Array.isArray(v[key]) || !(v[key] as unknown[]).every(str))
      return bad();
  if (v.contacts.length > 10000 || v.notes.length > 10000) return bad();
  const ids = new Set<string>();
  for (const c of v.contacts) {
    if (
      !isObject(c) ||
      !stringFields(c, [
        "id",
        "name",
        "company",
        "role",
        "email",
        "linkedin",
        "booth",
        "metAt",
        "notes",
        "advice",
        "opportunities",
        "followUpDate",
        "tags",
        "createdAt",
      ]) ||
      !["to follow up", "contacted", "done"].includes(String(c.status)) ||
      !validDate(String(c.createdAt)) ||
      (c.photo !== undefined &&
        (typeof c.photo !== "string" ||
          c.photo.length > 4200000 ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(c.photo as string))) ||
      ids.has(String(c.id))
    )
      return bad();
    ids.add(String(c.id));
  }
  for (const n of v.notes)
    if (
      !isObject(n) ||
      !stringFields(n, ["id", "text", "association", "createdAt"]) ||
      !validDate(String(n.createdAt)) ||
      !["general", "insight", "career", "opportunity", "skill"].includes(
        String(n.kind),
      )
    )
      return bad();
  for (const g of v.goals)
    if (
      !isObject(g) ||
      !stringFields(g, ["id", "title"]) ||
      typeof g.target !== "number" ||
      !Number.isInteger(g.target) ||
      g.target < 1 ||
      g.target > 100 ||
      typeof g.manual !== "number" ||
      !Number.isInteger(g.manual) ||
      g.manual < 0 ||
      g.manual > 100
    )
      return bad();
  for (const a of v.customActivities)
    if (
      !isObject(a) ||
      !stringFields(a, [
        "id",
        "title",
        "start",
        "end",
        "location",
        "preparation",
      ]) ||
      !["personal", "optional", "break"].includes(String(a.type)) ||
      !validTime(String(a.start)) ||
      !validTime(String(a.end)) ||
      String(a.end) <= String(a.start)
    )
      return bad();
  for (const b of Object.values(v.booths))
    if (
      !isObject(b) ||
      !["not visited", "visited", "interested", "follow-up"].includes(
        String(b.status),
      ) ||
      typeof b.favorite !== "boolean" ||
      typeof b.visited !== "boolean" ||
      !str(b.notes) ||
      (b.priority !== undefined &&
        (typeof b.priority !== "number" || b.priority < 1 || b.priority > 9))
    )
      return bad();
  for (const m of Object.values(v.reminders))
    if (typeof m !== "number" || ![0, 5, 10, 15].includes(m)) return bad();
  return { ...initialData(), ...v } as unknown as PersonalData;
}
export const validTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
function validDate(v: string) {
  return !Number.isNaN(Date.parse(v));
}
export function mergeBackup(
  current: PersonalData,
  incoming: PersonalData,
): PersonalData {
  const unique = <T extends { id: string }>(a: T[], b: T[]) => [
    ...new Map([...a, ...b].map((x) => [x.id, x])).values(),
  ];
  return {
    ...incoming,
    contacts: unique(current.contacts, incoming.contacts),
    notes: unique(current.notes, incoming.notes),
    goals: unique(current.goals, incoming.goals),
    customActivities: unique(
      current.customActivities,
      incoming.customActivities,
    ),
    booths: { ...current.booths, ...incoming.booths },
    checklist: [...new Set([...current.checklist, ...incoming.checklist])],
    attended: [...new Set([...current.attended, ...incoming.attended])],
  };
}
export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
export function learningPrompt(topic: string, context: string) {
  return `I'm attending SEMICON West 2026. I'm a high school junior interested in mechanical engineering, robotics, and AI. My experience includes VEX/FTC robotics, environmental sensors with MQTT and Python, EdgeGuard precision automation, and Evera, an SO-101 robotic arm prototype using Hugging Face LeRobot.\n\nTopic: ${topic}\nWhat I observed or want to ask: ${context || "Help me understand this topic and its engineering applications."}\n\nExplain the fundamentals, engineering tradeoffs, and how this connects to my robotics experience. Use a level suitable for someone with robotics programming experience. Suggest a thoughtful follow-up question for an engineer.`;
}
