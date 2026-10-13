import { AGENDA_URL, EVENT_DATE } from "./conference";
import type { VenueLocation } from "../domain/models";
export const venueLocations: VenueLocation[] = [
  {
    area: "Workforce Development Pavilion",
    hall: "North Hall",
    floor: "Expo Floor",
    room: "No room number listed",
    meetingPoint: "Pavilion Stage / bistro tables per MUSD itinerary",
    detailNote:
      "School meeting points come from the MUSD itinerary. Ask the chaperone for BINGO and scavenger-hunt starting points.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
  {
    area: "Smart Manufacturing Pavilion",
    hall: "North Hall",
    floor: "Expo Floor",
    room: "No room number listed",
    meetingPoint: "Pavilion presentation area",
    detailNote:
      "All four saved optional technical sessions are here. These conflict with school activities.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
  {
    area: "Smart MedTech program",
    hall: "South Hall",
    floor: "Upper Mezzanine",
    room: "152",
    meetingPoint: "Room 152",
    detailNote:
      "A public conference program area, separate from your required school itinerary.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
  {
    area: "Components, Instruments & Subsystems program",
    hall: "South Hall",
    floor: "Upper Mezzanine",
    room: "154",
    meetingPoint: "Room 154",
    detailNote:
      "A public conference program area, separate from your required school itinerary.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
  {
    area: "Advanced Packaging & Heterogeneous Integration program",
    hall: "South Hall",
    floor: "Upper Mezzanine",
    room: "156",
    meetingPoint: "Room 156",
    detailNote:
      "A public conference program area, separate from your required school itinerary.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
  {
    area: "Sustainability Pavilion",
    hall: "South Hall",
    floor: "Lower Level",
    room: "1",
    meetingPoint: "Room 1",
    detailNote:
      "A public conference program area, separate from your required school itinerary.",
    source: AGENDA_URL,
    checkedAt: EVENT_DATE,
  },
];
