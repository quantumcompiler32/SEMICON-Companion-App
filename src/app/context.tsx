import { createContext, useContext } from "react";
export type Tab = "Home" | "Schedule" | "Explore" | "Connections" | "More";
export type Modal =
  | { type: "note"; association?: string }
  | { type: "contact"; id?: string; company?: string; booth?: string }
  | { type: "intro" }
  | { type: "ask"; topic?: string }
  | { type: "activity"; id?: string };
interface UI {
  now: Date;
  tab: Tab;
  navigate: (tab: Tab) => void;
  modal: Modal | null;
  open: (modal: Modal) => void;
  close: () => void;
  toast: (message: string) => void;
  destination: string;
  goTo: (destination: string) => void;
}
export const UIContext = createContext<UI | null>(null);
export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("UI provider missing");
  return value;
}
