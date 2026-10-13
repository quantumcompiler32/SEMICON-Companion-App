import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Heart,
  Map,
  MessageSquareText,
  NotebookPen,
  Search,
  SlidersHorizontal,
  Users,
  Route,
} from "lucide-react";
import { exhibitors } from "../data/conference";
import { useNavigator, updateData } from "../stores/useNavigator";
import { useUI } from "../app/context";
import { Button } from "../components/ui/button";
import {
  Badge,
  Location,
  PageHeading,
  SectionHeading,
} from "../components/shared";
import { clockMinutes, planTour, timeLabel } from "../domain/schedule";
import type { BoothRecord } from "../domain/models";
import { VenueMap } from "./VenueMap";
export function Explore() {
  const { data } = useNavigator();
  const { open, goTo, destination } = useUI();
  const [mode, setMode] = useState<"exhibitors" | "map" | "tour">(
    destination ? "map" : "exhibitors",
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [conversation, setConversation] = useState(10);
  const [walk, setWalk] = useState(5);
  const [buffer, setBuffer] = useState(15);
  const tour = planTour(exhibitors, data, conversation, walk, buffer);
  const changeBooth = (id: string, patch: Partial<BoothRecord>) =>
    updateData((d) => ({
      ...d,
      booths: {
        ...d.booths,
        [id]: {
          ...(d.booths[id] ?? {
            status: "not visited",
            favorite: false,
            notes: "",
            visited: false,
          }),
          ...patch,
        },
      },
    }));
  function reorder(i: number, offset: number) {
    const ids = tour.stops.map((s) => s.exhibitor.id);
    [ids[i], ids[i + offset]] = [ids[i + offset], ids[i]];
    updateData((d) => ({ ...d, tourOrder: ids }));
  }
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW YOUR CURIOSITY"
        title="Find your next discovery."
        description="Engineering worth seeing. Questions worth asking."
        action={
          <Button onClick={() => setMode("tour")}>
            <Route size={18} />
            Plan My Independent Tour
          </Button>
        }
      />
      <div className="filter-tabs">
        {(["exhibitors", "map", "tour"] as const).map((v) => (
          <button
            key={v}
            aria-pressed={mode === v}
            className={mode === v ? "selected" : ""}
            onClick={() => setMode(v)}
          >
            {v === "exhibitors"
              ? "Exhibitors"
              : v === "map"
                ? "Venue maps"
                : "My independent tour"}
          </button>
        ))}
      </div>
      {mode === "map" ? (
        <VenueMap />
      ) : mode === "tour" ? (
        <>
          <section className="tour-hero card">
            <Badge tone="amber">Suggested · provisional order</Badge>
            <h2>One hour. Three good conversations.</h2>
            <p>
              1:30–2:30 PM · explore in small groups. Booth locations and
              walking times are unknown. This plan budgets time, but does not
              optimize an indoor route.
            </p>
            <div className="tour-inputs">
              {[
                ["Conversation", conversation, setConversation],
                ["Walking buffer", walk, setWalk],
                ["Return buffer", buffer, setBuffer],
              ].map(([label, value, set]) => (
                <label key={String(label)}>
                  {String(label)}
                  <select
                    aria-label={String(label)}
                    value={Number(value)}
                    onChange={(e) =>
                      (set as (n: number) => void)(Number(e.target.value))
                    }
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>
          <div className="tour-stops">
            {tour.stops.map((s, i) => (
              <section className="card tour-stop" key={s.exhibitor.id}>
                <span className="stop-number">{i + 1}</span>
                <div>
                  <p className="eyebrow accent">
                    {timeLabel(clockMinutes(s.start))} –{" "}
                    {timeLabel(clockMinutes(s.end))}
                  </p>
                  <h3>{s.exhibitor.name}</h3>
                  <Location>
                    Booth {s.exhibitor.booth} · hall not verified
                  </Location>
                  <p>{s.exhibitor.questions[0]}</p>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      goTo(`${s.exhibitor.name} · Booth ${s.exhibitor.booth}`);
                      setMode("map");
                    }}
                  >
                    Find on map <ArrowUpRight size={16} />
                  </Button>
                </div>
                <div className="reorder-buttons">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${s.exhibitor.name} earlier`}
                    disabled={i === 0}
                    onClick={() => reorder(i, -1)}
                  >
                    <ArrowUp size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${s.exhibitor.name} later`}
                    disabled={i === tour.stops.length - 1}
                    onClick={() => reorder(i, 1)}
                  >
                    <ArrowDown size={18} />
                  </Button>
                </div>
              </section>
            ))}
          </div>
          {!tour.stops.length && (
            <div className="notice">
              No unvisited verified booths fit this budget. Reduce time per stop
              or choose a personal plan.
            </div>
          )}
          <div className="notice green">
            <Route size={22} />
            <p>
              <strong>
                Begin your return by {timeLabel(clockMinutes(tour.returnAt))}.
              </strong>
              <br />
              This is a planning buffer, not a measured walking time. Rejoin
              your assigned group at 2:30 PM; adjust earlier if needed.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="search-bar">
            <Search size={19} />
            <input
              aria-label="Search exhibitors or booth numbers"
              placeholder="Search a company, interest, or booth…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SlidersHorizontal size={18} />
          </div>
          <div className="filter-tabs small">
            {[
              "All",
              "Priority booths",
              "Favorites",
              "Visited",
              "Follow-up",
            ].map((f) => (
              <button
                key={f}
                className={filter === f ? "selected" : ""}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>
          <SectionHeading
            title="Built around your interests"
            eyebrow="ROBOTICS · MECHANICAL ENGINEERING · AI"
          />
          <div className="exhibitor-grid">
            {exhibitors
              .filter(
                (e) =>
                  `${e.name} ${e.booth ?? ""} ${e.category} ${e.relevance}`
                    .toLowerCase()
                    .includes(query.toLowerCase()) &&
                  (filter === "All" ||
                    (filter === "Priority booths" && e.priority <= 3) ||
                    (filter === "Favorites" && data.booths[e.id]?.favorite) ||
                    (filter === "Visited" && data.booths[e.id]?.visited) ||
                    (filter === "Follow-up" &&
                      data.booths[e.id]?.status === "follow-up")),
              )
              .map((e) => {
                const record = data.booths[e.id];
                return (
                  <article className="card exhibitor-card" key={e.id}>
                    <div className="exhibitor-top">
                      <span className={`company-logo ${e.id}`}>
                        {e.id === "siemens"
                          ? "SIEMENS"
                          : e.id === "nordson"
                            ? "N"
                            : e.id === "edwards"
                              ? "e"
                              : e.name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 3)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${record?.favorite ? "Unfavorite" : "Favorite"} ${e.name}`}
                        onClick={() =>
                          changeBooth(e.id, { favorite: !record?.favorite })
                        }
                      >
                        <Heart
                          size={19}
                          fill={record?.favorite ? "currentColor" : "none"}
                          className={record?.favorite ? "accent" : ""}
                        />
                      </Button>
                    </div>
                    <Badge tone={e.booth ? "green" : "amber"}>
                      {e.booth
                        ? "Confirmed booth"
                        : "Exhibitor presence not verified"}
                    </Badge>
                    <h3>{e.name}</h3>
                    <p className="muted">{e.category}</p>
                    <Location>
                      {e.booth
                        ? `Booth ${e.booth} · hall not verified`
                        : "Booth and hall not verified"}
                    </Location>
                    <details>
                      <summary>Why it connects to your work</summary>
                      <p>{e.relevance}</p>
                      {e.technology && <p className="muted">{e.technology}</p>}
                    </details>
                    <div className="question-box">
                      <MessageSquareText size={17} />
                      <p>“{e.questions[0]}”</p>
                    </div>
                    <div className="booth-controls">
                      <label>
                        Status
                        <select
                          aria-label={`Status for ${e.name}`}
                          value={record?.status ?? "not visited"}
                          onChange={(ev) =>
                            changeBooth(e.id, {
                              status: ev.target.value as BoothRecord["status"],
                              ...(ev.target.value === "visited"
                                ? { visited: true }
                                : {}),
                            })
                          }
                        >
                          {[
                            "not visited",
                            "visited",
                            "interested",
                            "follow-up",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Priority
                        <select
                          aria-label={`Priority for ${e.name}`}
                          value={record?.priority ?? e.priority}
                          onChange={(ev) =>
                            changeBooth(e.id, {
                              priority: Number(ev.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="row-actions">
                      <Button
                        variant={record?.visited ? "secondary" : "outline"}
                        size="small"
                        onClick={() =>
                          changeBooth(e.id, {
                            visited: !record?.visited,
                            status: record?.visited ? "not visited" : "visited",
                          })
                        }
                      >
                        <Check size={16} />
                        {record?.visited ? "Visited" : "Mark visited"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          goTo(
                            `${e.name}${e.booth ? ` · Booth ${e.booth}` : ""}`,
                          );
                          setMode("map");
                        }}
                      >
                        <Map size={16} />
                        Find
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Add note for ${e.name}`}
                        onClick={() =>
                          open({ type: "note", association: e.name })
                        }
                      >
                        <NotebookPen size={17} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Add connection at ${e.name}`}
                        onClick={() =>
                          open({
                            type: "contact",
                            company: e.name,
                            booth: e.booth,
                          })
                        }
                      >
                        <Users size={17} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ask ChatGPT about ${e.name}`}
                        onClick={() => open({ type: "ask", topic: e.name })}
                      >
                        <MessageSquareText size={17} />
                      </Button>
                    </div>
                    <label className="booth-note-label">
                      Personal booth notes
                      <textarea
                        rows={2}
                        placeholder="A detail to remember…"
                        aria-label={`Personal notes for ${e.name}`}
                        value={record?.notes ?? ""}
                        onChange={(ev) =>
                          changeBooth(e.id, { notes: ev.target.value })
                        }
                      />
                    </label>
                    {data.contacts
                      .filter((c) => c.company === e.name)
                      .map((c) => (
                        <p className="linked-note" key={c.id}>
                          {c.name} ·{" "}
                          {c.email ||
                            c.linkedin ||
                            "Contact saved in Connections"}
                        </p>
                      ))}
                    {data.notes
                      .filter((n) => n.association === e.name)
                      .map((n) => (
                        <p className="linked-note" key={n.id}>
                          {n.text}
                        </p>
                      ))}
                    {e.source && (
                      <a
                        className="source-link"
                        href={e.source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Verification source · {e.verifiedAt} ↗
                      </a>
                    )}
                  </article>
                );
              })}
          </div>
        </>
      )}
    </>
  );
}
