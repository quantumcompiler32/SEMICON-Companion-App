import { useRegisterSW } from "virtual:pwa-register/react";
import { Component, Suspense, lazy, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Compass,
  Home,
  CalendarDays,
  Map,
  Users,
  Grid2X2,
  NotebookPen,
  MessageSquareText,
  Wifi,
  WifiOff,
  X,
  TriangleAlert,
  LoaderCircle,
} from "lucide-react";
import { UIContext, type Modal, type Tab } from "./context";
import { useNavigator } from "../stores/useNavigator";
import { Dashboard } from "../features/Dashboard";
const Schedule = lazy(() =>
  import("../features/Schedule").then((m) => ({ default: m.Schedule })),
);
const Explore = lazy(() =>
  import("../features/Explore").then((m) => ({ default: m.Explore })),
);
const Connections = lazy(() =>
  import("../features/Connections").then((m) => ({ default: m.Connections })),
);
const More = lazy(() =>
  import("../features/More").then((m) => ({ default: m.More })),
);
import { Editors } from "../features/Editors";
import { Button } from "../components/ui/button";
import { useConnectivity } from "../hooks/useConnectivity";
import { schoolSchedule } from "../data/conference";
import { eventTime, minutesUntil, timeline } from "../domain/schedule";
const destinations = [
  { name: "Home", icon: Home },
  { name: "Schedule", icon: CalendarDays },
  { name: "Explore", icon: Map },
  { name: "Connections", icon: Users },
  { name: "More", icon: Grid2X2 },
] as const;
export function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const { data, ready, error, saving, hydrate } = useNavigator();
  const [tab, setTab] = useState<Tab>("Home");
  const [modal, setModal] = useState<Modal | null>(null);
  const [now, setNow] = useState(() => new Date());
  const offline = useConnectivity();
  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState("");
  const [reminder, setReminder] = useState("");
  const fired = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    void hydrate();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const sync = () => {
      setNow(new Date());
    };
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);
  useEffect(() => {
    if (!ready) return;
    for (const activity of [
      ...schoolSchedule(data.settings.group),
      ...data.customActivities,
    ]) {
      const minutes =
        data.reminders[activity.id] ?? data.settings.reminderMinutes;
      const until = minutesUntil(activity.start, now);
      if (
        minutes > 0 &&
        eventTime(activity.start) > now &&
        until <= minutes &&
        !fired.current.has(activity.id)
      ) {
        fired.current.add(activity.id);
        setReminder(
          `${activity.title} begins at ${activity.start} Pacific · ${until} minutes to go. ${activity.location}.`,
        );
      }
    }
  }, [now, data, ready]);
  const navigate = (t: Tab) => {
    setTab(t);
    if (t !== "Explore") setDestination("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const toast = (text: string) => {
    setMessage(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(""), 5000);
  };
  const goTo = (d: string) => {
    setDestination(d);
    setTab("Explore");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const { current, next } = timeline(schoolSchedule(data.settings.group), now);
  const pendingGroup =
    current?.type === "required" &&
    current.id !== "independent" &&
    !data.attended.includes(current.id);
  const returnSoon =
    current?.id === "independent" &&
    next &&
    minutesUntil(next.start, now) <= 15;
  if (!ready)
    return (
      <div className="startup" role="status">
        <Compass size={48} className="accent" />
        <h1>Navigator</h1>
        <p>Opening your day…</p>
        <LoaderCircle size={22} />
      </div>
    );
  return (
    <MotionConfig reducedMotion="user">
      <UIContext.Provider
        value={{
          tab,
          now,
          navigate,
          modal,
          open: setModal,
          close: () => setModal(null),
          toast,
          destination,
          goTo,
        }}
      >
        <div className="app-shell">
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <aside className="sidebar">
            <button
              className="brand"
              onClick={() => navigate("Home")}
              aria-label="Navigator home"
            >
              <span className="brand-symbol">
                <Compass size={28} />
              </span>
              <span>
                navigator<small>SEMICON WEST / 2026</small>
              </span>
            </button>
            <p className="sidebar-label">YOUR CONFERENCE</p>
            <nav aria-label="Main navigation">
              {destinations.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={tab === name ? "active" : ""}
                  onClick={() => navigate(name)}
                  aria-current={tab === name ? "page" : undefined}
                >
                  <Icon size={20} />
                  {name}
                  {tab === name && <span className="nav-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-tools">
              <p className="sidebar-label">ALWAYS WITHIN REACH</p>
              <button onClick={() => setModal({ type: "note" })}>
                <NotebookPen size={18} />
                Quick note <span>+</span>
              </button>
              <button onClick={() => setModal({ type: "ask" })}>
                <MessageSquareText size={18} />
                Ask ChatGPT <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="sidebar-bottom">
              <div className="conference-pass">
                <span className="eyebrow accent">
                  ONE DAY. MANY POSSIBILITIES.
                </span>
                <h3>Build what’s next.</h3>
                <p>
                  Mechanical engineering.
                  <br />
                  Robotics. AI. You.
                </p>
                <span className="pass-lines" aria-hidden="true" />
              </div>
              <button
                className="sidebar-profile"
                onClick={() => setModal({ type: "intro" })}
              >
                <span className="avatar">MJ</span>
                <span>
                  <strong>Moksh Joshi</strong>
                  <small>Milpitas Middle College</small>
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="breadcrumb">
                <span>SEMICON West</span>
                <ChevronRight size={14} />
                <strong>{tab === "Home" ? "Overview" : tab}</strong>
              </div>
              <button className="mobile-brand" onClick={() => navigate("Home")}>
                <Compass size={24} />
                <strong>navigator</strong>
              </button>
              <div className="topbar-actions">
                <span
                  className={`offline-status ${offline ? "is-offline" : ""}`}
                >
                  {offline ? <WifiOff size={15} /> : <Wifi size={15} />}
                  <span>
                    {offline
                      ? "Offline"
                      : saving
                        ? "Saving…"
                        : "Local data saved"}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Quick note"
                  onClick={() => setModal({ type: "note" })}
                >
                  <NotebookPen size={19} />
                </Button>
                <button
                  className="avatar small-avatar"
                  aria-label="Open my introduction"
                  onClick={() => setModal({ type: "intro" })}
                >
                  MJ
                </button>
              </div>
            </header>
            {needRefresh && (
              <div className="reminder-banner" role="status">
                <span>
                  A new version is ready.{" "}
                  {modal
                    ? "Finish your open form first."
                    : "Your saved data will be preserved."}
                </span>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={!!modal}
                  onClick={async () => {
                    try {
                      await useNavigator.getState().flush();
                      await updateServiceWorker(true);
                    } catch {
                      toast("Save failed. Export a backup before updating.");
                    }
                  }}
                >
                  Save & reload
                </Button>
              </div>
            )}
            {error && (
              <div className="global-alert" role="alert">
                <TriangleAlert size={18} />
                {error}
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate("More")}
                >
                  Back up data
                </Button>
              </div>
            )}
            {(pendingGroup || returnSoon) && (
              <div className="group-status" role="status">
                <Bell size={16} />
                <span>
                  {returnSoon
                    ? `Return to your group soon · ${minutesUntil(next!.start, now)} min to Breakout #2.`
                    : `Required activity now · ${current!.title.split(" · ")[0]}. Confirm you are with your group.`}
                </span>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate("Schedule")}
                >
                  View
                </Button>
              </div>
            )}
            {reminder && (
              <div className="reminder-banner" role="alert">
                <Bell size={18} />
                <p>{reminder}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Dismiss reminder"
                  onClick={() => setReminder("")}
                >
                  <X size={18} />
                </Button>
              </div>
            )}
            <main id="main-content" className="page-content">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <Suspense
                    fallback={
                      <div className="empty-state" role="status">
                        Opening {tab.toLowerCase()}…
                      </div>
                    }
                  >
                    {tab === "Home" ? (
                      <Dashboard />
                    ) : tab === "Schedule" ? (
                      <Schedule />
                    ) : tab === "Explore" ? (
                      <Explore key={destination} />
                    ) : tab === "Connections" ? (
                      <Connections />
                    ) : (
                      <More />
                    )}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
              <footer className="page-footer">
                <span>
                  <span className="status-dot" />
                  Your day is saved on this device.
                </span>
                <span>Made for curiosity. Built for the floor.</span>
              </footer>
            </main>
          </div>
          <nav className="bottom-nav" aria-label="Mobile navigation">
            {destinations.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => navigate(name)}
                className={tab === name ? "active" : ""}
                aria-current={tab === name ? "page" : undefined}
              >
                <Icon size={21} />
                <span>{name}</span>
              </button>
            ))}
          </nav>
          <Editors />
          {message && (
            <div className="toast" role="status">
              <Check size={17} />
              {message}
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </UIContext.Provider>
    </MotionConfig>
  );
}
export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div className="startup">
          <TriangleAlert size={36} />
          <h1>Navigator hit a snag.</h1>
          <p>Your locally saved data has not been deleted.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Navigator
          </Button>
        </div>
      );
    return this.props.children;
  }
}
