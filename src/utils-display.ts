import type { Activity } from "./domain/models";
/** Concise labels for the first-screen dashboard; the schedule retains full titles. */
export function dashboardTitle(a: Activity) {
  if (!a.id.startsWith("breakout-")) return a.title;
  const [slot, title] = a.title.split(" · ");
  if (title.startsWith("Awareness to Action"))
    return `${slot} · Awareness to Action`;
  if (title.startsWith("AT3:")) return `${slot} · AT3 workforce development`;
  if (title.startsWith("Building Semiconductor Talent"))
    return `${slot} · Semiconductor talent pathways`;
  return a.title;
}
