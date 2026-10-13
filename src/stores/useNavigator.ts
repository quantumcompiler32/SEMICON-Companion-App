import { create } from "zustand";
import type { PersonalData } from "../domain/models";
import { initialData } from "../data/conference";
import { db, saveSnapshot } from "../services/database";
interface Store {
  data: PersonalData;
  ready: boolean;
  error: string;
  saving: boolean;
  hydrate: () => Promise<void>;
  change: (update: (data: PersonalData) => PersonalData) => void;
  flush: () => Promise<void>;
}
let pending: Promise<void> = Promise.resolve();
let revision = 0;
export const useNavigator = create<Store>((set, get) => ({
  data: initialData(),
  ready: false,
  error: "",
  saving: false,
  hydrate: async () => {
    try {
      const row = await db.snapshots.get("personal");
      set({ data: row?.data ?? initialData(), ready: true });
    } catch {
      set({
        ready: true,
        error:
          "Local storage could not open. Export a backup before leaving this page.",
      });
    }
  },
  change: (update) => {
    const data = update(get().data);
    const current = ++revision;
    set({ data, saving: true });
    pending = pending
      .catch(() => {})
      .then(() => saveSnapshot(data))
      .then(() => {
        if (current === revision) set({ saving: false, error: "" });
      })
      .catch(() => {
        set({
          saving: false,
          error:
            "Could not save locally. Export a backup now to preserve your changes.",
        });
        throw new Error("Local save failed");
      });
    void pending.catch(() => {});
  },
  flush: () => pending,
}));
export const updateData = (update: (data: PersonalData) => PersonalData) =>
  useNavigator.getState().change(update);
