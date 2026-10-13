import { describe, it, expect } from "vitest";
import {
  initialData,
  schoolSchedule,
  sessions,
  exhibitors,
} from "../src/data/conference";
import {
  conflicts,
  eventTime,
  goalProgress,
  minutesUntil,
  planTour,
  status,
  timeline,
} from "../src/domain/schedule";
import {
  calendar,
  csvCell,
  mergeBackup,
  parseBackup,
  toCSV,
} from "../src/services/export";
import { NavigatorDB } from "../src/services/database";
import type { Connection } from "../src/domain/models";
describe("authoritative schedule", () => {
  it("defaults new devices to the confirmed Group B assignment", () =>
    expect(initialData().settings.group).toBe("B"));
  it.each([
    ["A", "Awareness to Action", "BINGO", "Scavenger Hunt"],
    ["B", "Scavenger Hunt", "AT3", "BINGO"],
    ["C", "BINGO", "Scavenger Hunt", "Building Semiconductor Talent"],
  ] as const)("selects only group %s activities", (g, one, two, three) => {
    const s = schoolSchedule(g);
    expect(s.find((a) => a.id === "breakout-1")?.title).toContain(one);
    expect(s.find((a) => a.id === "breakout-2")?.title).toContain(two);
    expect(s.find((a) => a.id === "breakout-3")?.title).toContain(three);
  });
  it("keeps unknown group neutral", () =>
    expect(
      schoolSchedule(null)
        .filter((a) => a.id.startsWith("breakout"))
        .every((a) => a.title.includes("Confirm your assigned group")),
    ).toBe(true));
  it("uses Pacific instants regardless of device timezone", () => {
    expect(eventTime("13:30").toISOString()).toBe("2026-10-13T20:30:00.000Z");
    expect(minutesUntil("14:30", new Date("2026-10-13T20:45:00Z"))).toBe(45);
  });
  it("transitions exactly at the return boundary", () => {
    const s = schoolSchedule("B");
    expect(timeline(s, new Date("2026-10-13T21:29:59Z")).current?.id).toBe(
      "independent",
    );
    expect(
      timeline(s, new Date("2026-10-13T21:30:00Z")).current?.title,
    ).toContain("AT3");
  });
  it("handles before, gaps, and after event", () => {
    const s = schoolSchedule(null);
    expect(timeline(s, new Date("2026-10-12T18:00:00Z")).before).toBe(true);
    expect(timeline(s, eventTime("16:45")).current).toBeUndefined();
    expect(timeline(s, eventTime("19:00")).after).toBe(true);
  });
  it("requires attendance evidence and caps past countdowns", () => {
    const a = schoolSchedule("A")[1];
    expect(status(a, eventTime("09:59"), [])).toBe("upcoming");
    expect(status(a, eventTime("10:00"), [])).toBe("happening now");
    expect(status(a, eventTime("10:30"), [])).toBe("missed");
    expect(status(a, eventTime("10:30"), [a.id])).toBe("completed");
    expect(minutesUntil("10:00", eventTime("11:00"))).toBe(0);
  });
  it("flags all optional conflicts and ignores touching edges", () => {
    const s = schoolSchedule("C");
    for (const a of sessions) expect(conflicts(a, s).length).toBeGreaterThan(0);
    expect(
      conflicts({ ...sessions[0], start: "16:30", end: "16:45" }, s),
    ).toHaveLength(0);
    expect(s.some((a) => a.id.startsWith("session"))).toBe(false);
  });
});
describe("time budgeting and progress", () => {
  it("fits three provisional stops and a return buffer", () => {
    const p = planTour(exhibitors, initialData());
    expect(p.stops).toHaveLength(3);
    expect(p.stops[2].end + 5).toBeLessThanOrEqual(p.returnAt);
    expect(p.returnAt).toBe(855);
    expect(p.provisional).toBe(true);
  });
  it("excludes visited booths, respects reordering, and reduces stops", () => {
    const d = initialData();
    d.booths.siemens = {
      favorite: false,
      status: "visited",
      notes: "",
      visited: true,
    };
    d.tourOrder = ["edwards", "nordson"];
    expect(planTour(exhibitors, d).stops[0].exhibitor.id).toBe("edwards");
    expect(planTour(exhibitors, d, 20, 10, 15).stops).toHaveLength(1);
  });
  it("derives goals from contacts, tags, and visited priority booths", () => {
    const d = initialData();
    d.notes = [
      {
        id: "n",
        text: "Precision motion",
        kind: "skill",
        association: "",
        createdAt: new Date().toISOString(),
      },
    ];
    d.booths.siemens = {
      favorite: false,
      notes: "",
      visited: true,
      status: "follow-up",
    };
    d.goals[0].manual = 2;
    expect(goalProgress(d).find((g) => g.id === "skills")?.value).toBe(1);
    expect(goalProgress(d).find((g) => g.id === "booths")?.value).toBe(1);
    expect(goalProgress(d)[0].value).toBe(2);
  });
});
describe("backup and calendar", () => {
  it("roundtrips and merges without deleting records", () => {
    const old = initialData();
    old.notes = [
      {
        id: "old",
        text: "Saved",
        association: "Siemens",
        kind: "insight",
        createdAt: new Date().toISOString(),
      },
    ];
    const incoming = parseBackup(JSON.stringify(initialData()));
    expect(mergeBackup(old, incoming).notes[0].text).toBe("Saved");
    expect(parseBackup(JSON.stringify(old))).toEqual(old);
  });
  it.each([
    { version: 99 },
    { ...initialData(), settings: { ...initialData().settings, group: "D" } },
    {
      ...initialData(),
      customActivities: [
        {
          id: "bad",
          title: "Bad",
          start: "29:00",
          end: "30:00",
          location: "",
          preparation: "",
          type: "required",
        },
      ],
    },
    { ...initialData(), contacts: [{ name: "missing fields" }] },
  ])("rejects malformed backups", (v) =>
    expect(() => parseBackup(JSON.stringify(v))).toThrow(),
  );
  it("escapes CSV quotes, newlines, and formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(toCSV([{ name: 'a,"b"', notes: "line\nnext" }])).toContain(
      '"a,""b"""',
    );
  });
  it("exports absolute UTC calendar times and alarms", () => {
    const ics = calendar(
      [schoolSchedule("A").find((a) => a.id === "independent")!],
      15,
    );
    expect(ics).toContain("DTSTART:20261013T203000Z");
    expect(ics).toContain("DTEND:20261013T213000Z");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
describe("IndexedDB persistence", () => {
  it("persists notes, contacts, settings, and maps across database reopen", async () => {
    const name = `test-${crypto.randomUUID()}`;
    let db = new NavigatorDB(name);
    const data = initialData();
    data.settings.group = "C";
    data.notes = [
      {
        id: "n",
        text: "Offline insight",
        association: "Siemens",
        kind: "insight",
        createdAt: new Date().toISOString(),
      },
    ];
    data.contacts = [
      {
        id: "c",
        name: "Engineer",
        company: "Siemens",
        role: "Engineer",
        email: "a@example.com",
        linkedin: "",
        booth: "5982",
        metAt: "Show floor",
        notes: "Robotics",
        advice: "Learn controls",
        opportunities: "Mentorship",
        status: "to follow up",
        followUpDate: "2026-10-15",
        tags: "automation",
        createdAt: new Date().toISOString(),
      } satisfies Connection,
    ];
    await db.snapshots.put({ id: "personal", data });
    await db.maps.put({
      id: "m",
      name: "floor.png",
      mime: "image/png",
      data: new Blob(["sample"]),
      source: "test",
      addedAt: new Date().toISOString(),
    });
    db.close();
    db = new NavigatorDB(name);
    expect((await db.snapshots.get("personal"))?.data).toEqual(data);
    expect(await db.maps.count()).toBe(1);
    await db.delete();
  });
});
