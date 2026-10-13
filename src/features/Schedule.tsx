import { LocationDetails } from "../components/LocationDetails";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  MapPin,
  NotebookPen,
  Plus,
  TriangleAlert,
  Pencil,
  Trash2,
  MessageSquareText,
  Users,
} from "lucide-react";
import { schoolSchedule, sessions } from "../data/conference";
import {
  conflicts,
  minutesUntil,
  rangeLabel,
  status,
  timeLabel,
} from "../domain/schedule";
import { useNavigator, updateData } from "../stores/useNavigator";
import { useUI } from "../app/context";
import { Button } from "../components/ui/button";
import { Badge, PageHeading } from "../components/shared";
import { calendar, download } from "../services/export";
export function Schedule() {
  const { data } = useNavigator();
  const { now, open, goTo, toast } = useUI();
  const [filter, setFilter] = useState("School itinerary");
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const required = schoolSchedule(data.settings.group);
  const all = [...required, ...sessions, ...data.customActivities].sort(
    (a, b) => a.start.localeCompare(b.start),
  );
  const shown = all.filter(
    (a) =>
      filter === "Everything" ||
      (filter === "School itinerary" &&
        a.type !== "optional" &&
        a.type !== "personal") ||
      (filter === "Optional sessions" && a.type === "optional") ||
      (filter === "My plans" && a.type === "personal") ||
      (filter === "Breaks & travel" && ["break", "transport"].includes(a.type)),
  );
  return (
    <>
      <PageHeading
        eyebrow="TUESDAY, OCTOBER 13 · PACIFIC TIME"
        title="A plan for the day."
        description="Your group. Your next stop. Room for discovery."
        action={
          <Button onClick={() => open({ type: "activity" })}>
            <Plus size={18} />
            Add a plan
          </Button>
        }
      />
      <div className="schedule-toolbar card">
        <label className="inline-label">
          <Users size={18} />
          Assigned group
          <select
            aria-label="Assigned group"
            value={data.settings.group ?? ""}
            onChange={(e) =>
              updateData((d) => ({
                ...d,
                settings: {
                  ...d.settings,
                  group: (e.target.value || null) as typeof d.settings.group,
                },
              }))
            }
          >
            <option value="">Not assigned yet</option>
            {["A", "B", "C"].map((g) => (
              <option key={g} value={g}>
                Group {g}
              </option>
            ))}
          </select>
        </label>
        <div className="row-actions">
          <Button
            variant="ghost"
            size="small"
            onClick={() =>
              setView(view === "timeline" ? "calendar" : "timeline")
            }
          >
            <CalendarDays size={17} />
            {view === "timeline" ? "Calendar view" : "Timeline view"}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              download(
                "semicon-school-itinerary.ics",
                calendar(required, data.settings.reminderMinutes),
                "text/calendar",
              );
              toast(
                "Calendar downloaded. Import it into your calendar for device reminders.",
              );
            }}
          >
            <Download size={17} />
            Calendar export
          </Button>
        </div>
      </div>
      <div className="filter-tabs">
        {[
          "School itinerary",
          "Optional sessions",
          "My plans",
          "Breaks & travel",
          "Everything",
        ].map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            className={filter === f ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {filter === "Optional sessions" && (
        <div className="notice amber">
          <TriangleAlert size={20} />
          <p>
            All four technical sessions overlap school activities. These are
            optional interests; ask your chaperone before changing your plans.
            Agenda verified October 13, 2026.
          </p>
        </div>
      )}
      <div
        className={`schedule-list ${view === "calendar" ? "calendar-view" : ""}`}
      >
        {shown.map((a) => {
          const state = status(a, now, data.attended);
          const collision = ["optional", "personal"].includes(a.type)
            ? conflicts(a, required)
            : [];
          const checked = data.attended.includes(a.id);
          const custom = data.customActivities.some((x) => x.id === a.id);
          return (
            <article
              key={a.id}
              className={`timeline-activity ${state === "happening now" ? "current" : ""}`}
            >
              <div className="activity-time">
                <strong>{timeLabel(a.start)}</strong>
                <small>{timeLabel(a.end)}</small>
                <span className="timeline-dot" />
              </div>
              <div className="activity-card">
                <div className="activity-labels">
                  <Badge
                    tone={
                      a.type === "required"
                        ? "green"
                        : a.type === "optional"
                          ? "blue"
                          : "muted"
                    }
                  >
                    {a.type === "required"
                      ? "School · required"
                      : a.type === "optional"
                        ? "Optional session"
                        : a.type === "personal"
                          ? "Personal plan"
                          : a.type === "break"
                            ? "Break"
                            : "Transportation"}
                  </Badge>
                  <span
                    className={`activity-state ${state === "happening now" ? "accent" : ""}`}
                  >
                    {state === "missed"
                      ? "Missed · not checked in"
                      : state === "happening now"
                        ? "● Happening now"
                        : state}
                  </span>
                </div>
                <h3>{a.title}</h3>
                <p className="location">
                  <MapPin size={15} />
                  {a.location}
                </p>
                <p className="muted">{a.preparation}</p>
                {a.locationDetails && (
                  <details className="activity-location-detail">
                    <summary>Hall, floor & room details</summary>
                    <LocationDetails location={a.locationDetails} />
                  </details>
                )}
                {collision.length > 0 && (
                  <div className="conflict">
                    <TriangleAlert size={17} />
                    <span>
                      <strong>School schedule conflict</strong>
                      {collision.map((c) => (
                        <small key={c.id}>
                          {rangeLabel(c)} · {c.title}
                        </small>
                      ))}
                    </span>
                  </div>
                )}
                <div className="activity-foot">
                  <span className="muted">
                    {state === "upcoming"
                      ? `In ${minutesUntil(a.start, now)} min`
                      : state === "happening now"
                        ? `${minutesUntil(a.end, now)} min left`
                        : "October 13"}{" "}
                    · {a.verified ? "Confirmed" : "Suggested"}
                  </span>
                  <label className="reminder-label">
                    Reminder
                    <select
                      aria-label={`Reminder for ${a.title}`}
                      value={
                        data.reminders[a.id] ?? data.settings.reminderMinutes
                      }
                      onChange={(e) =>
                        updateData((d) => ({
                          ...d,
                          reminders: {
                            ...d.reminders,
                            [a.id]: Number(e.target.value),
                          },
                        }))
                      }
                    >
                      {[0, 5, 10, 15].map((n) => (
                        <option key={n} value={n}>
                          {n === 0 ? "Off" : `${n} min`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => goTo(a.location)}
                  >
                    <MapPin size={15} />
                    Find location
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => open({ type: "note", association: a.title })}
                  >
                    <NotebookPen size={15} />
                    Note
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                      updateData((d) => ({
                        ...d,
                        attended: checked
                          ? d.attended.filter((id) => id !== a.id)
                          : [...d.attended, a.id],
                      }))
                    }
                  >
                    <Check size={15} />
                    {checked ? "Attended" : "Mark attended"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Download calendar event for ${a.title}`}
                    onClick={() =>
                      download(
                        `${a.id}.ics`,
                        calendar(
                          [a],
                          data.reminders[a.id] ?? data.settings.reminderMinutes,
                        ),
                        "text/calendar",
                      )
                    }
                  >
                    <Download size={16} />
                  </Button>
                  {a.company && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ask ChatGPT about ${a.title}`}
                      onClick={() => open({ type: "ask", topic: a.title })}
                    >
                      <MessageSquareText size={16} />
                    </Button>
                  )}
                  {custom && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${a.title}`}
                        onClick={() => open({ type: "activity", id: a.id })}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${a.title}`}
                        onClick={() =>
                          updateData((d) => ({
                            ...d,
                            customActivities: d.customActivities.filter(
                              (x) => x.id !== a.id,
                            ),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}
                </div>
                {a.source?.startsWith("https:") && (
                  <a
                    className="source-link"
                    href={a.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official agenda · checked Oct 13, 2026 ↗
                  </a>
                )}
                {data.notes
                  .filter((n) => n.association === a.title)
                  .map((n) => (
                    <p className="linked-note" key={n.id}>
                      {n.text}
                    </p>
                  ))}
                {data.contacts
                  .filter((c) => c.metAt === a.title)
                  .map((c) => (
                    <p className="linked-note" key={c.id}>
                      Related contact: {c.name} · {c.company}
                    </p>
                  ))}
              </div>
            </article>
          );
        })}
      </div>
      {!shown.length && (
        <div className="empty-state">
          <CalendarDays size={32} />
          <h3>Leave room for something interesting.</h3>
          <p>
            Add a booth visit or personal plan. We’ll check it against your
            school schedule.
          </p>
          <Button onClick={() => open({ type: "activity" })}>
            <Plus size={18} />
            Add a plan
          </Button>
        </div>
      )}
      <p className="footnote">
        School times come from your supplied MUSD itinerary. Check-ins are
        manual; “missed” means attendance has not been recorded. Bus and return
        times are estimates. Reminders work while the app is open; use calendar
        export for device reminders.
      </p>
    </>
  );
}
