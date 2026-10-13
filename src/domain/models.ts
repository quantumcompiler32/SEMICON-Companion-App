export type Group = "A" | "B" | "C";
export type ActivityType =
  "required" | "optional" | "personal" | "break" | "transport";
export interface VenueLocation {
  hall: string;
  floor: string;
  room: string;
  area: string;
  meetingPoint: string;
  source: string;
  checkedAt: string;
  detailNote: string;
}
export interface Activity {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  locationDetails?: VenueLocation;
  type: ActivityType;
  preparation: string;
  company?: string;
  source?: string;
  verified?: boolean;
  geographic?: "moscone" | "campus";
}
export interface Exhibitor {
  id: string;
  name: string;
  booth?: string;
  hall?: string;
  category: string;
  relevance: string;
  priority: number;
  questions: string[];
  source?: string;
  verifiedAt?: string;
  technology?: string;
}
export type BoothStatus =
  "not visited" | "visited" | "interested" | "follow-up";
export interface BoothRecord {
  status: BoothStatus;
  favorite: boolean;
  notes: string;
  visited: boolean;
  priority?: number;
}
export interface Connection {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedin: string;
  booth: string;
  metAt: string;
  notes: string;
  advice: string;
  opportunities: string;
  status: "to follow up" | "contacted" | "done";
  followUpDate: string;
  tags: string;
  photo?: string;
  createdAt: string;
}
export type NoteKind =
  "insight" | "career" | "opportunity" | "skill" | "general";
export interface Note {
  id: string;
  text: string;
  association: string;
  kind: NoteKind;
  createdAt: string;
}
export interface Goal {
  id: string;
  title: string;
  target: number;
  manual: number;
}
export interface MapAsset {
  id: string;
  name: string;
  mime: string;
  data: Blob;
  source: string;
  addedAt: string;
}
export interface Settings {
  group: Group | null;
  theme: "dark" | "light";
  hall: string;
  introduction: string;
  reminderMinutes: number;
}
export interface PersonalData {
  version: 1;
  settings: Settings;
  contacts: Connection[];
  notes: Note[];
  booths: Record<string, BoothRecord>;
  checklist: string[];
  attended: string[];
  customActivities: Activity[];
  reminders: Record<string, number>;
  goals: Goal[];
  tourOrder: string[];
}
