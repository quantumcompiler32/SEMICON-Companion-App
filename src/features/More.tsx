import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  Goal,
  MessageSquareText,
  Moon,
  NotebookPen,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react";
import { useNavigator, updateData } from "../stores/useNavigator";
import { useUI } from "../app/context";
import { Button } from "../components/ui/button";
import {
  Badge,
  CheckboxRow,
  ExternalLink as ResourceLink,
  PageHeading,
  SectionHeading,
} from "../components/shared";
import {
  checklistItems,
  exhibitors,
  resources,
  schoolSchedule,
  sessions,
} from "../data/conference";
import { goalProgress } from "../domain/schedule";
import { db } from "../services/database";
import { download, mergeBackup, parseBackup, toCSV } from "../services/export";
export function More() {
  const { data } = useNavigator();
  const { open, toast } = useUI();
  const [section, setSection] = useState("Goals");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [storage, setStorage] = useState("");
  const [mapCount, setMapCount] = useState(0);
  const [agendaSaved, setAgendaSaved] = useState(false);
  const goals = goalProgress(data);
  useEffect(() => {
    void db.maps.count().then(setMapCount);
    if ("caches" in window)
      void caches
        .keys()
        .then((keys) => setAgendaSaved(keys.some((k) => k.includes("workbox"))))
        .catch(() => {});
  }, []);
  async function importBackup(file: File) {
    try {
      if (file.size > 30 * 1024 * 1024)
        throw new Error("Backup is too large (30 MB maximum).");
      const incoming = parseBackup(await file.text());
      updateData((d) => mergeBackup(d, incoming));
      await useNavigator.getState().flush();
      toast("Backup merged. Existing notes and contacts were preserved.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not import backup.");
    }
  }
  const notes = data.notes
    .filter(
      (n) =>
        `${n.text} ${n.association}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (kind === "all" || n.kind === kind),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeading
        eyebrow="TURN A GREAT DAY INTO WHAT’S NEXT"
        title="A little more prepared."
        description="Your goals, field notes, and everything you need nearby."
      />
      <div className="filter-tabs">
        {[
          "Goals",
          "Notes",
          "Checklist",
          "Resources",
          "Settings",
          "Day summary",
        ].map((s) => (
          <button
            key={s}
            aria-pressed={section === s}
            className={section === s ? "selected" : ""}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {section === "Goals" && (
        <>
          <SectionHeading
            title="What you came here for"
            eyebrow={`${goals.filter((g) => g.value >= g.target).length} OF ${goals.length} GOALS REACHED`}
          />
          <div className="goals-grid">
            {goals.map((g) => (
              <section className="card goal-card" key={g.id}>
                <div className="card-title">
                  <Goal size={21} className="accent" />
                  <Badge tone={g.value >= g.target ? "green" : "muted"}>
                    {g.value >= g.target ? "Reached" : "In progress"}
                  </Badge>
                </div>
                <h3>{g.title}</h3>
                <div className="goal-value">
                  {g.value}
                  <span> / {g.target}</span>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${Math.min(100, (g.value / g.target) * 100)}%`,
                    }}
                  />
                </div>
                <p className="footnote">
                  Updated from your contacts, visited booths, and tagged notes.
                  Manual progress acts as a minimum.
                </p>
                <div className="goal-controls">
                  <label>
                    Target
                    <input
                      aria-label={`Target for ${g.title}`}
                      type="number"
                      min={1}
                      max={100}
                      value={g.target}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (n >= 1 && n <= 100 && Number.isInteger(n))
                          updateData((d) => ({
                            ...d,
                            goals: d.goals.map((x) =>
                              x.id === g.id ? { ...x, target: n } : x,
                            ),
                          }));
                      }}
                    />
                  </label>
                  <label>
                    Manual progress
                    <input
                      aria-label={`Manual progress for ${g.title}`}
                      type="number"
                      min={0}
                      max={100}
                      value={g.manual}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (n >= 0 && n <= 100 && Number.isInteger(n))
                          updateData((d) => ({
                            ...d,
                            goals: d.goals.map((x) =>
                              x.id === g.id ? { ...x, manual: n } : x,
                            ),
                          }));
                      }}
                    />
                  </label>
                </div>
              </section>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setSection("Day summary")}>
            Review the day <BookOpen size={17} />
          </Button>
        </>
      )}
      {section === "Notes" && (
        <>
          <SectionHeading
            title="Don’t let a good insight get away."
            action={
              <Button onClick={() => open({ type: "note" })}>
                <Plus size={18} />
                Quick note
              </Button>
            }
          />
          <div className="search-toolbar">
            <div className="search-bar">
              <Search size={18} />
              <input
                aria-label="Search notes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your field notes…"
              />
            </div>
            <select
              aria-label="Filter notes by type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {[
                "all",
                "insight",
                "career",
                "opportunity",
                "skill",
                "general",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() =>
                download(
                  "semicon-notes.json",
                  JSON.stringify(data.notes, null, 2),
                )
              }
            >
              <Download size={17} />
              JSON
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                download(
                  "semicon-notes.csv",
                  toCSV(data.notes as unknown as Record<string, unknown>[]),
                  "text/csv",
                )
              }
            >
              CSV
            </Button>
          </div>
          <div className="notes-grid">
            {notes.map((n) => (
              <article className="card note-card" key={n.id}>
                <div className="row-between">
                  <Badge tone="green">{n.kind}</Badge>
                  <time>
                    {new Date(n.createdAt).toLocaleString("en-US", {
                      timeZone: "America/Los_Angeles",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="note-text">{n.text}</p>
                <p className="muted">
                  {n.association || "Conference field note"}
                </p>
                <div className="row-actions">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                      open({ type: "ask", topic: n.association || n.text })
                    }
                  >
                    <MessageSquareText size={16} />
                    Ask ChatGPT
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete note"
                    onClick={() =>
                      updateData((d) => ({
                        ...d,
                        notes: d.notes.filter((x) => x.id !== n.id),
                      }))
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!notes.length && (
            <div className="empty-state">
              <NotebookPen size={32} />
              <h3>A place for your lightbulb moments.</h3>
              <p>
                Record an insight, career path, opportunity, or skill. Tagged
                notes update your goals automatically.
              </p>
              <Button onClick={() => open({ type: "note" })}>Add a note</Button>
            </div>
          )}
        </>
      )}
      {section === "Checklist" && (
        <div className="card checklist">
          <SectionHeading
            title="Ready for the floor"
            eyebrow={`${data.checklist.length} OF ${checklistItems.length} CHECKED`}
          />
          {checklistItems.map((item) => (
            <CheckboxRow
              key={item}
              checked={data.checklist.includes(item)}
              onChange={() =>
                updateData((d) => ({
                  ...d,
                  checklist: d.checklist.includes(item)
                    ? d.checklist.filter((x) => x !== item)
                    : [...d.checklist, item],
                }))
              }
            >
              {item}
            </CheckboxRow>
          ))}
          <p className="footnote">
            Check items yourself after completing them. Selecting a group or
            opening a link alone does not confirm preparation.
          </p>
        </div>
      )}
      {section === "Resources" && (
        <div className="resource-grid">
          <section className="card">
            <SectionHeading title="Your resource center" />
            {resources.map((r) => (
              <ResourceLink key={r.name} url={r.url}>
                {r.name}
              </ResourceLink>
            ))}
            <p className="footnote">
              External websites need connectivity. The school itinerary and
              sourced session data are stored with this app.
            </p>
            <Badge tone={agendaSaved ? "green" : "amber"}>
              {agendaSaved
                ? "App assets cached by service worker"
                : "Offline cache not yet verified"}
            </Badge>
            <p className="footnote">
              {mapCount} locally saved floor maps. Open Explore → Venue maps to
              import or download them.
            </p>
          </section>
          <section className="card">
            <Smartphone size={28} className="accent" />
            <h3>Take Navigator with you.</h3>
            <p className="muted">Install from Safari on your iPhone.</p>
            <ol className="install-steps">
              <li>Open your deployed website in Safari.</li>
              <li>Tap Share.</li>
              <li>Select Add to Home Screen.</li>
              <li>Confirm “Navigator” and tap Add.</li>
              <li>Launch it from your Home Screen.</li>
            </ol>
            <p className="footnote">
              Load it once online and import official maps before you arrive.
              Calendar downloads are the fallback for device reminders;
              background web notifications are not guaranteed.
            </p>
          </section>
          <section className="card">
            <SectionHeading title="Your introduction" />
            <Button variant="secondary" onClick={() => open({ type: "intro" })}>
              <UsersIcon />
              Read or customize
            </Button>
          </section>
          <section className="card">
            <SectionHeading title="Keep learning in ChatGPT" />
            <p className="muted">
              Prepare a question here, then paste it into your existing
              conversation.
            </p>
            <Button variant="secondary" onClick={() => open({ type: "ask" })}>
              <MessageSquareText size={18} />
              Ask ChatGPT
            </Button>
          </section>
        </div>
      )}
      {section === "Settings" && (
        <div className="settings-grid">
          <section className="card">
            <SectionHeading title="Make it yours" />
            <label className="settings-row">
              Appearance
              <Button
                variant="secondary"
                onClick={() =>
                  updateData((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      theme: d.settings.theme === "dark" ? "light" : "dark",
                    },
                  }))
                }
              >
                {data.settings.theme === "dark" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
                Switch to {data.settings.theme === "dark" ? "light" : "dark"}
              </Button>
            </label>
            <label className="settings-row">
              Default reminder
              <select
                value={data.settings.reminderMinutes}
                onChange={(e) =>
                  updateData((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      reminderMinutes: Number(e.target.value),
                    },
                  }))
                }
              >
                {[0, 5, 10, 15].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Off" : `${n} minutes before`}
                  </option>
                ))}
              </select>
            </label>
            <label className="settings-row">
              Assigned group
              <select
                value={data.settings.group ?? ""}
                onChange={(e) =>
                  updateData((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      group: (e.target.value ||
                        null) as typeof d.settings.group,
                    },
                  }))
                }
              >
                <option value="">Unknown</option>
                {["A", "B", "C"].map((g) => (
                  <option key={g} value={g}>
                    Group {g}
                  </option>
                ))}
              </select>
            </label>
            <p className="footnote">
              All event times use America/Los_Angeles. The live dashboard uses
              your device clock.
            </p>
          </section>
          <section className="card">
            <ShieldCheck size={28} className="accent" />
            <h3>Your data stays with you.</h3>
            <p className="muted">
              Notes, contacts, plans, and settings are saved on this device
              using IndexedDB.
            </p>
            <div className="row-actions">
              <Button
                variant="secondary"
                onClick={() =>
                  download(
                    `semicon-backup-${new Date().toISOString().slice(0, 10)}.json`,
                    JSON.stringify(data, null, 2),
                  )
                }
              >
                <Download size={18} />
                Export backup
              </Button>
              <label className="file-button">
                <FileUp size={18} />
                Import backup
                <input
                  aria-label="Import backup"
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importBackup(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="footnote">
              Import merges records by ID and preserves existing contacts and
              notes. Map files are stored separately; download them from the map
              viewer. Keep a backup before clearing Safari data or changing
              devices.
            </p>
            <Button
              variant="ghost"
              onClick={async () => {
                const granted = await navigator.storage?.persist?.();
                setStorage(
                  granted
                    ? "Persistent storage granted."
                    : "Persistent storage not granted by this browser. Keep a backup.",
                );
              }}
            >
              Request persistent storage
            </Button>
            {storage && (
              <p role="status" className="footnote">
                {storage}
              </p>
            )}
          </section>
        </div>
      )}
      {section === "Day summary" && (
        <section className="card summary-card">
          <Badge tone="green">YOUR CONFERENCE FIELD REPORT</Badge>
          <h2>A day of possibility.</h2>
          <p className="muted">
            A summary of what you have recorded, ready for your next step.
          </p>
          <div className="stats-row">
            <div>
              <strong>
                {exhibitors.filter((e) => data.booths[e.id]?.visited).length}
              </strong>
              <span>companies visited</span>
            </div>
            <div>
              <strong>{data.contacts.length}</strong>
              <span>people met</span>
            </div>
            <div>
              <strong>
                {data.notes.filter((n) => n.kind === "insight").length}
              </strong>
              <span>technical insights</span>
            </div>
          </div>
          {[
            [
              "Companies visited",
              exhibitors
                .filter((e) => data.booths[e.id]?.visited)
                .map((e) => e.name),
            ],
            [
              "Sessions attended",
              [
                ...schoolSchedule(data.settings.group),
                ...sessions,
                ...data.customActivities,
              ]
                .filter((a) => data.attended.includes(a.id))
                .map((a) => a.title),
            ],
            [
              "People met",
              data.contacts.map((c) => `${c.name} · ${c.company}`),
            ],
            [
              "Engineering insights",
              data.notes.filter((n) => n.kind === "insight").map((n) => n.text),
            ],
            [
              "Potential opportunities",
              [
                ...data.contacts
                  .filter((c) => c.opportunities)
                  .map((c) => `${c.company}: ${c.opportunities}`),
                ...data.notes
                  .filter((n) => n.kind === "opportunity")
                  .map((n) => n.text),
              ],
            ],
            [
              "Next actions",
              [
                ...data.contacts
                  .filter((c) => c.status === "to follow up")
                  .map(
                    (c) =>
                      `Follow up with ${c.name}${c.followUpDate ? ` on ${c.followUpDate}` : ""}`,
                  ),
                ...data.notes
                  .filter((n) => n.kind === "skill")
                  .map((n) => `Learn: ${n.text}`),
              ],
            ],
          ].map(([title, items]) => (
            <div className="summary-section" key={title as string}>
              <h3>{title as string}</h3>
              {(items as string[]).length ? (
                <ul>
                  {(items as string[]).map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nothing recorded yet.</p>
              )}
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              download(
                "semicon-day-summary.txt",
                `SEMICON West 2026 — Moksh's day summary\n\nCompanies: ${exhibitors
                  .filter((e) => data.booths[e.id]?.visited)
                  .map((e) => e.name)
                  .join(
                    ", ",
                  )}\n\nPeople: ${data.contacts.map((c) => c.name + " — " + c.company).join("\n")}\n\nNotes:\n${data.notes.map((n) => `[${n.kind}] ${n.text}`).join("\n")}\n\nNext actions:\n${data.contacts
                  .filter((c) => c.status === "to follow up")
                  .map((c) => `Follow up with ${c.name} ${c.followUpDate}`)
                  .join("\n")}`,
                "text/plain",
              )
            }
          >
            <Download size={18} />
            Export day summary
          </Button>
        </section>
      )}
    </>
  );
}
function UsersIcon() {
  return <BookOpen size={18} />;
}
