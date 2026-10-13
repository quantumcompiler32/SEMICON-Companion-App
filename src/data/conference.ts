import type {
  Activity,
  Exhibitor,
  Group,
  PersonalData,
  VenueLocation,
} from "../domain/models";
export const EVENT_DATE = "2026-10-13";
export const TIMEZONE = "America/Los_Angeles";
export const AGENDA_URL =
  "https://semiconwest2026.eventscribe.net/agenda.asp?pfp=days&day=10/13/2026&theday=Tuesday&h=Tuesday%20October%2013&BCFO=P%7CG";
export const MAP_URL =
  "https://expo.semi.org/west2026/Public/EventMap.aspx?ID=32402&ShAvailable=1";
const school = "MUSD student itinerary supplied by Moksh, October 13, 2026";
const a = (
  id: string,
  title: string,
  start: string,
  end: string,
  location: string,
  type: Activity["type"] = "required",
  preparation = "Stay with your assigned group.",
): Activity => ({
  id,
  title,
  start,
  end,
  location: location.startsWith("Workforce Pavilion")
    ? `North Hall · Expo Floor · ${location}`
    : location.includes("Smart Manufacturing Pavilion")
      ? "North Hall · Expo Floor · Smart Manufacturing Pavilion"
      : location,
  locationDetails: location.startsWith("Workforce Pavilion")
    ? {
        hall: "North Hall",
        floor: "Expo Floor",
        room: "No room number listed",
        area: "Workforce Development Pavilion",
        meetingPoint: location.includes("bistro")
          ? "Bistro tables (MUSD itinerary)"
          : "Pavilion Stage (MUSD itinerary)",
        source: AGENDA_URL,
        checkedAt: EVENT_DATE,
        detailNote:
          "Official agenda verifies the pavilion hall and floor. The exact school meeting point comes from the MUSD itinerary; confirm it with your chaperone.",
      }
    : location.includes("Smart Manufacturing Pavilion")
      ? {
          hall: "North Hall",
          floor: "Expo Floor",
          room: "No room number listed",
          area: "Smart Manufacturing Pavilion",
          meetingPoint: "Pavilion presentation area",
          source: AGENDA_URL,
          checkedAt: EVENT_DATE,
          detailNote:
            "Official agenda lists a pavilion on the expo floor, without a numbered room.",
        }
      : undefined,
  type,
  preparation,
  source: school,
  verified: true,
});
const breakouts: Record<Group, string[]> = {
  A: [
    "Awareness to Action: Building the Next Generation Semiconductor Workforce",
    "BINGO",
    "Show Floor Scavenger Hunt",
  ],
  B: [
    "Show Floor Scavenger Hunt",
    "AT3: A National Community College Model for Semiconductor Technician Workforce Development",
    "BINGO",
  ],
  C: [
    "BINGO",
    "Show Floor Scavenger Hunt",
    "Building Semiconductor Talent Pipelines Through Partnerships, Pathways, and Workforce Innovation",
  ],
};
function breakout(i: number, group: Group | null): Activity {
  const slots = [
    ["11:30", "12:15"],
    ["14:30", "15:15"],
    ["15:15", "16:00"],
  ];
  const title = group ? breakouts[group][i] : "Confirm your assigned group";
  const stage =
    group && !["BINGO", "Show Floor Scavenger Hunt"].includes(title);
  return a(
    `breakout-${i + 1}`,
    `Breakout #${i + 1} · ${title}`,
    slots[i][0],
    slots[i][1],
    !group
      ? "Ask your MUSD chaperone"
      : stage
        ? "Workforce Pavilion · Pavilion Stage"
        : title === "BINGO"
          ? "Confirm BINGO meeting point with chaperone"
          : "Show floor · confirm starting point",
    "required",
    !group
      ? "Select Group A, B, or C after checking with your chaperone."
      : stage
        ? "Ask about engineering pathways and skills students can build."
        : "Follow your group instructions; confirm the meeting point.",
  );
}
export function schoolSchedule(group: Group | null): Activity[] {
  return [
    {
      ...a(
        "bus-out",
        "Meet & travel to San Francisco",
        "08:00",
        "10:00",
        "MUSD Innovation Campus · East Parking Lot",
        "transport",
        "Meet at 8 AM. 1331 E Calaveras Blvd, Milpitas, CA 95035. Arrival may vary; allow approximately 1–2 hours.",
      ),
      geographic: "campus",
    },
    {
      ...a(
        "arrival",
        "Arrival & check-in",
        "10:00",
        "10:30",
        "Moscone Center",
        "required",
        "Have your registration ready. Confirm your group with your chaperone.",
      ),
      geographic: "moscone",
    },
    a(
      "overview",
      "SEMI Foundation Overview",
      "10:30",
      "11:00",
      "Workforce Pavilion · Pavilion Stage",
      "required",
      "Michelle introduces semiconductor workforce development and opportunities.",
    ),
    a(
      "welcome",
      "Welcome & Agenda",
      "11:00",
      "11:30",
      "Workforce Pavilion · bistro tables",
      "required",
      "Introductions, safety, group assignments, and agenda review.",
    ),
    breakout(0, group),
    a(
      "lunch",
      "Lunch & recharge",
      "12:15",
      "13:15",
      "Throughout Moscone Center",
      "break",
      "Get water and eat. Be back for the 1:15 PM check-in.",
    ),
    a(
      "check-in",
      "Afternoon check-in",
      "13:15",
      "13:30",
      "Workforce Pavilion · bistro tables",
      "required",
      "Check in before independent exploration.",
    ),
    a(
      "independent",
      "Independent Tour Time",
      "13:30",
      "14:30",
      "Moscone Center · show floor",
      "required",
      "Explore in small groups. Save a return buffer and rejoin your group by 2:30 PM.",
    ),
    breakout(1, group),
    breakout(2, group),
    a(
      "farewell",
      "Farewell & Reflections",
      "16:00",
      "16:30",
      "Workforce Pavilion · bistro tables",
      "required",
      "Share what you learned and confirm bus pickup with your chaperone.",
    ),
    {
      ...a(
        "bus-home",
        "Planned bus departure",
        "17:00",
        "18:30",
        "San Francisco · pickup point to be confirmed",
        "transport",
        "Planned departure 5 PM. Confirm exact pickup location and timing; estimated return 6:30–7 PM.",
      ),
    },
    {
      ...a(
        "return",
        "Estimated return & pickup",
        "18:30",
        "19:00",
        "MUSD Innovation Campus",
        "transport",
        "Return window is approximate. Arrange your pickup.",
      ),
      geographic: "campus",
    },
  ];
}
export const sessions: Activity[] = [
  a(
    "session-twin",
    "From Visualization to Action: Building the Closed-Loop Smart Fab with Digital Twin and MES",
    "13:20",
    "13:40",
    "North Hall · Smart Manufacturing Pavilion",
    "optional",
    "Connect digital twins and closed-loop control to Evera.",
  ),
  a(
    "session-ai",
    "Applied AI in Semiconductor Facilities: From Digital Twins to Operational Resilience",
    "14:45",
    "15:05",
    "North Hall · Smart Manufacturing Pavilion",
    "optional",
    "Ask how AI-generated control decisions are validated before deployment.",
  ),
  a(
    "session-maintenance",
    "From Detection to Decision: Reducing Unplanned Downtime with Production-Aware Predictive Maintenance",
    "15:05",
    "15:25",
    "North Hall · Smart Manufacturing Pavilion",
    "optional",
    "Connect sensor telemetry and MQTT research to equipment reliability.",
  ),
  a(
    "session-defects",
    "The Smart Factory in Practice: Production Experiences from Automating Defect Classification and Root Cause Analysis",
    "15:45",
    "16:05",
    "North Hall · Smart Manufacturing Pavilion",
    "optional",
    "Connect defect detection to Evera and EdgeGuard vision work.",
  ),
].map((x, i) => ({
  ...x,
  company: ["Applied Materials", "Siemens Industry", "IBM", "SixSense AI"][i],
  source: AGENDA_URL,
  verified: true,
}));
export const exhibitors: Exhibitor[] = [
  {
    id: "siemens",
    name: "Siemens Industry",
    booth: "5982",
    category: "Automation · AI · Engineering software",
    priority: 1,
    technology: "Industrial control engineering",
    relevance:
      "Your Evera and VEX / FTC control experience is a starting point for asking about reliable industrial automation.",
    questions: [
      "How do you validate AI-generated control code before allowing it to operate real manufacturing equipment?",
    ],
    source: "https://expo.semi.org/west2026/Public/eBooth.aspx?BoothID=658005",
    verifiedAt: EVENT_DATE,
  },
  {
    id: "nordson",
    name: "Nordson Test & Inspection",
    booth: "5844",
    category: "Inspection · Computer vision · Quality",
    priority: 2,
    technology: "SonoFlex acoustic inspection (from your brief)",
    relevance:
      "Connect inspection tradeoffs to your work on computer vision, grasp precision, and EdgeGuard positioning accuracy.",
    questions: [
      "How do you balance inspection accuracy, false positives, and processing speed?",
    ],
    source: "https://www.nordson.com/en/About-Us/Events/Semicon-West-2026",
    verifiedAt: EVENT_DATE,
  },
  {
    id: "edwards",
    name: "Edwards Vacuum",
    booth: "633",
    category: "Mechanical systems · Precision equipment",
    priority: 3,
    technology: "Ganymede Dry Pump (from your brief)",
    relevance:
      "Explore mechanical reliability and precision systems, building on robotics troubleshooting and sensor telemetry research.",
    questions: [
      "What mechanical design challenges matter most for equipment that must operate reliably in a semiconductor fab?",
    ],
    source: MAP_URL,
    verifiedAt: EVENT_DATE,
  },
  ...[
    [
      "applied",
      "Applied Materials",
      "Semiconductor equipment",
      "Digital twins, equipment engineering, and your interest in mechanical research.",
    ],
    [
      "lam",
      "Lam Research",
      "Wafer fabrication equipment",
      "Precision motion, robotics, and manufacturing processes.",
    ],
    [
      "asml",
      "ASML",
      "Lithography systems",
      "Mechatronics, embedded systems, and extreme positioning accuracy.",
    ],
    [
      "kla",
      "KLA",
      "Metrology & inspection",
      "Computer vision, defect detection, and quality measurement.",
    ],
    [
      "ibm",
      "IBM",
      "AI & predictive maintenance",
      "Your environmental sensors, Python, MQTT, and PostgreSQL experience.",
    ],
    [
      "sixsense",
      "SixSense AI",
      "AI defect classification",
      "Your Evera and EdgeGuard computer vision work.",
    ],
  ].map(([id, name, category, relevance], i) => ({
    id,
    name,
    category,
    relevance,
    priority: i + 4,
    questions: [
      "Which engineering skills should a high school student build for work like this?",
      "Are there student mentorship, research, or shadowing opportunities?",
    ],
  })),
];
export const checklistItems = [
  "Charge phone",
  "Save official agenda",
  "Download venue floor maps",
  "Confirm assigned group",
  "Prepare LinkedIn QR code",
  "Open Evera GitHub repository",
  "Prepare personal introduction",
  "Choose target booths",
  "Bring snacks and water",
  "Bring pen and notes",
  "Arrange pickup transportation",
  "Save MUSD Innovation Campus address",
];
export const introduction = `Hi, I'm Moksh. I'm a high school junior at Milpitas Middle College, and I'm interested in mechanical engineering, robotics, and AI.\n\nI've worked on VEX and FTC robotics, sensor-based research, and recently helped build Evera, an AI-powered robotic arm using Hugging Face LeRobot. Our team won second place in the Physical AI track at a UCSC hackathon.\n\nI'm here to understand how robotics and automation are used in semiconductor manufacturing and what opportunities might exist for students interested in this field.`;
export const shortIntroduction =
  "Hi, I'm Moksh, a high school junior exploring mechanical engineering, robotics, and AI. I helped build Evera, an AI-powered robotic arm. I'd love to hear how your team uses automation and what skills I should learn next.";
export const resources = [
  { name: "Official Tuesday agenda", url: AGENDA_URL },
  { name: "Official exhibitor floor plan", url: MAP_URL },
  { name: "SEMICON West", url: "https://www.semiconwest.org/" },
  {
    name: "Evera on GitHub",
    url: "https://github.com/quantumcompiler32/evera",
  },
  {
    name: "My LinkedIn profile",
    url: "https://www.linkedin.com/in/moksh-joshi/",
  },
  { name: "ChatGPT", url: "https://chatgpt.com/" },
];
export function initialData(): PersonalData {
  return {
    version: 1,
    settings: {
      group: null,
      theme: "dark",
      hall: "Not selected",
      introduction,
      reminderMinutes: 10,
    },
    contacts: [],
    notes: [],
    booths: {},
    checklist: [],
    attended: [],
    customActivities: [],
    reminders: {},
    tourOrder: [],
    goals: [
      {
        id: "people",
        title: "Meet relevant industry professionals",
        target: 3,
        manual: 0,
      },
      {
        id: "booths",
        title: "Visit high-priority booths",
        target: 3,
        manual: 0,
      },
      {
        id: "careers",
        title: "Learn engineering career paths",
        target: 2,
        manual: 0,
      },
      {
        id: "opportunities",
        title: "Find a student opportunity",
        target: 1,
        manual: 0,
      },
      {
        id: "insights",
        title: "Record valuable technical insights",
        target: 3,
        manual: 0,
      },
      {
        id: "skills",
        title: "Choose an engineering skill to learn",
        target: 1,
        manual: 0,
      },
    ],
  };
}
