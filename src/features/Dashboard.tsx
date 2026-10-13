import { dashboardTitle } from "../utils-display";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Compass,
  MessageSquareText,
  Navigation,
  NotebookPen,
  Plus,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useNavigator, updateData } from "../stores/useNavigator";
import { schoolSchedule, exhibitors } from "../data/conference";
import {
  eventTime,
  goalProgress,
  minutesUntil,
  rangeLabel,
  timeline,
  timeLabel,
} from "../domain/schedule";
import { useUI } from "../app/context";
import { Button } from "../components/ui/button";
import {
  ActionTile,
  Badge,
  Location,
  SectionHeading,
} from "../components/shared";
export function Dashboard() {
  const { data } = useNavigator();
  const { now, navigate, open, goTo } = useUI();
  const schedule = schoolSchedule(data.settings.group);
  const { current, next, before, after } = timeline(schedule, now);
  const goals = goalProgress(data);
  const done = goals.filter((g) => g.value >= g.target).length;
  const booth = exhibitors.find((e) => e.booth && !data.booths[e.id]?.visited);
  const attended = current && data.attended.includes(current.id);
  const remaining = current ? minutesUntil(current.end, now) : 0;
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow accent">YOUR PERSONAL CONFERENCE COMPANION</p>
          <h1>
            Your day, in focus<span className="accent">.</span>
          </h1>
          <p className="muted">A little direction. A lot of possibility.</p>
        </div>
        <div className="date-stamp">
          <span>OCT</span>
          <strong>13</strong>
          <small>TUESDAY</small>
        </div>
      </div>
      <div className="event-meta">
        <span className="status-dot" /> <strong>SEMICON WEST 2026</strong>
        <span className="meta-separator">/</span>
        <span>Tuesday, October 13 · Moscone Center, San Francisco</span>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="now-card">
            <div className="now-top">
              <Badge tone="green">
                <span className="status-dot" />
                {after
                  ? "DAY COMPLETE"
                  : before
                    ? "BEFORE EVENT"
                    : current
                      ? "HAPPENING NOW"
                      : "BETWEEN ACTIVITIES"}
              </Badge>
              <span className="now-clock">
                <Clock3 size={14} />
                {current ? rangeLabel(current) : "Pacific time"}
              </span>
            </div>
            <div className="now-body">
              <p className="eyebrow">
                {current?.type === "transport"
                  ? "ON THE MOVE"
                  : current?.type === "break"
                    ? "TAKE A BREATHER"
                    : after
                      ? "NICELY DONE, MOKSH"
                      : before
                        ? "READY WHEN YOU ARE"
                        : "YOUR NEXT MOVE"}
              </p>
              <h2>
                {(current ? dashboardTitle(current) : undefined) ??
                  (after
                    ? "Bring today into tomorrow."
                    : before
                      ? "Your conference begins at 10:00 AM."
                      : "Time to regroup.")}
              </h2>
              <Location>
                {current?.location ??
                  (after
                    ? "Review your notes and follow up with connections."
                    : (next?.location ?? "Moscone Center, San Francisco"))}
              </Location>
              <p className="now-description">
                {current?.preparation ??
                  (after
                    ? "Capture your takeaways, back up your notes, and choose one next action."
                    : "Keep your school itinerary close. The next stop is below.")}
              </p>
            </div>
            <div className="now-bottom">
              <div>
                <strong>
                  {current
                    ? remaining
                    : next
                      ? minutesUntil(next.start, now)
                      : 0}
                </strong>
                <span>min {current ? "remaining" : "to next stop"}</span>
              </div>
              {current && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    updateData((d) => ({
                      ...d,
                      attended: attended
                        ? d.attended.filter((id) => id !== current.id)
                        : [...d.attended, current.id],
                    }))
                  }
                >
                  {attended ? <Check size={17} /> : <Plus size={17} />}{" "}
                  {attended ? "Checked in" : "Check in"}
                </Button>
              )}
              <span className="orbital-mark" aria-hidden="true">
                <Compass size={74} strokeWidth={0.7} />
              </span>
            </div>
            <div className="activity-progress">
              <span
                style={{
                  width: `${current ? 100 * (1 - remaining / Math.max(1, minutesUntil(current.end, eventTime(current.start)))) : 0}%`,
                }}
              />
            </div>
          </section>
          <section className="next-card">
            <div>
              <p className="eyebrow">
                UP NEXT{" "}
                {next && (
                  <span className="accent">
                    · IN {minutesUntil(next.start, now)} MIN
                  </span>
                )}
              </p>
              <h3>
                {next ? dashboardTitle(next) : "No more scheduled activities"}
              </h3>
              {next && (
                <p>
                  {timeLabel(next.start)} <span>·</span> {next.location}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="View full schedule"
              onClick={() => navigate("Schedule")}
            >
              <ArrowUpRight size={22} />
            </Button>
          </section>
          <Button
            className="navigate-button"
            onClick={() =>
              goTo(next?.location ?? current?.location ?? "Moscone Center")
            }
          >
            <Navigation size={19} />
            <span>Navigate to Next Stop</span>
            <ArrowRight size={19} />
          </Button>
          {!data.settings.group && (
            <div className="group-banner">
              <div>
                <Users size={19} />
                <span>
                  <strong>First, find your group.</strong>
                  <small>
                    Check with your chaperone, then select your assignment.
                  </small>
                </span>
              </div>
              <div className="group-options">
                {(["A", "B", "C"] as const).map((g) => (
                  <Button
                    key={g}
                    variant="outline"
                    size="small"
                    onClick={() =>
                      updateData((d) => ({
                        ...d,
                        settings: { ...d.settings, group: g },
                      }))
                    }
                  >
                    Group {g}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <SectionHeading
            title="Make a connection"
            eyebrow="GOOD CONVERSATIONS START HERE"
            action={
              <Button
                variant="ghost"
                size="small"
                onClick={() => navigate("Explore")}
              >
                All exhibitors <ArrowRight size={15} />
              </Button>
            }
          />
          {booth ? (
            <section className="booth-feature">
              <div className="booth-feature-head">
                <div className={`company-logo ${booth.id}`} aria-hidden="true">
                  {booth.id === "siemens"
                    ? "SIEMENS"
                    : booth.id === "nordson"
                      ? "N"
                      : "e"}
                </div>
                <Badge tone="amber">PRIORITY {booth.priority}</Badge>
              </div>
              <h3>{booth.name}</h3>
              <p className="muted">{booth.category}</p>
              <div className="booth-meta">
                <Location>Booth {booth.booth}</Location>
                <Badge tone="green">Confirmed booth</Badge>
              </div>
              <div className="question-box">
                <MessageSquareText size={18} />
                <div>
                  <p className="eyebrow">A QUESTION WORTH ASKING</p>
                  <p>“{booth.questions[0]}”</p>
                </div>
              </div>
              <div className="row-actions">
                <Button
                  variant="secondary"
                  onClick={() => goTo(`${booth.name} · Booth ${booth.booth}`)}
                >
                  Find booth <ArrowUpRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    open({ type: "note", association: booth.name })
                  }
                >
                  <NotebookPen size={17} />
                  Add a note
                </Button>
              </div>
            </section>
          ) : (
            <div className="card">
              <Check className="accent" />
              <h3>All three priority booths visited.</h3>
              <p>Keep the conversations going in Connections.</p>
            </div>
          )}
          <div className="quick-actions">
            <ActionTile
              icon={NotebookPen}
              title="Quick note"
              text="Catch the insight"
              onClick={() => open({ type: "note" })}
            />
            <ActionTile
              icon={Users}
              title="Add connection"
              text="Remember the person"
              onClick={() => open({ type: "contact" })}
            />
          </div>
        </div>
        <aside className="dashboard-aside">
          <section className="card goals-preview">
            <div className="card-title">
              <span className="icon-well">
                <Target size={20} />
              </span>
              <h3>A day with purpose</h3>
            </div>
            <p className="muted">Small steps. Meaningful progress.</p>
            <div className="goals-number">
              <strong>
                {done}
                <span> / {goals.length}</span>
              </strong>
              <span>goals reached</span>
              <div
                className="progress-ring"
                style={{
                  background: `conic-gradient(var(--accent) ${(done / goals.length) * 360}deg, var(--line) 0)`,
                }}
              >
                <span>
                  <Zap size={22} />
                </span>
              </div>
            </div>
            <div className="mini-goals">
              {goals.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <span>{g.title}</span>
                  <strong>
                    {g.value}
                    <span>/{g.target}</span>
                  </strong>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${Math.min(100, (g.value / g.target) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={() => navigate("More")}>
              View all goals <ArrowRight size={15} />
            </Button>
          </section>
          <section className="card day-preview">
            <SectionHeading
              title="The shape of your day"
              action={<Clock3 size={18} className="muted" />}
            />
            <p className="muted">Your school itinerary comes first.</p>
            <div className="mini-timeline">
              {schedule
                .filter((a) => a.type !== "transport")
                .map((a) => (
                  <button
                    key={a.id}
                    className={a.id === current?.id ? "active" : ""}
                    onClick={() => navigate("Schedule")}
                  >
                    <time>{timeLabel(a.start)}</time>
                    <span className="timeline-node" />
                    <span>
                      {a.title.split(" · ")[0]}
                      {a.id === current?.id && <small>NOW</small>}
                    </span>
                  </button>
                ))}
            </div>
          </section>
          <button
            className="intro-card"
            onClick={() => open({ type: "intro" })}
          >
            <span className="avatar">MJ</span>
            <span>
              <strong>Hi, I’m Moksh.</strong>
              <small>Your introduction, ready to go.</small>
            </span>
            <ArrowUpRight size={20} />
          </button>
        </aside>
      </div>
    </>
  );
}
