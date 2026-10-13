import Dexie, { type Table } from "dexie";
import type { MapAsset, PersonalData } from "../domain/models";
export class NavigatorDB extends Dexie {
  snapshots!: Table<{ id: string; data: PersonalData }>;
  maps!: Table<MapAsset>;
  constructor(name = "semicon-navigator") {
    super(name);
    this.version(1).stores({ snapshots: "id", maps: "id" });
  }
}
export const db = new NavigatorDB();
export async function saveSnapshot(data: PersonalData) {
  await db.snapshots.put({ id: "personal", data });
}
