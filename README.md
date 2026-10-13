# SEMICON Navigator

Moksh's mobile-first, offline-first personal companion for **Tuesday, October 13, 2026**, at Moscone Center. The live dashboard shows the current MUSD activity, next stop, countdowns, and a location action. Required school activities always remain authoritative. Group B is the default, confirmed by Moksh on October 13, 2026; existing saved group choices are preserved.

## Run locally

Node.js **22.13+** (or 24 LTS) and npm are required by the current PDF.js/toolchain versions.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run test:e2e
```

The end-to-end configuration uses local Google Chrome on macOS when available. On other systems, install Playwright Chromium (`npx playwright install chromium`) ; the configuration falls back to Playwright Chromium automatically. The tests launch the production preview, so build first. A service worker is registered for production builds; development is intentionally uncached.

## Features

- Pacific-time itinerary with Group A/B/C selection, neutral unknown-group breakouts, attendance, timeline/calendar layouts, filters, custom plans, conflict warnings, and per-activity reminders.
- Live home dashboard, 2:30 PM return warning, high-priority exhibitor prompts, favorites/status/notes, manual priorities, and a provisional three-stop independent tour with adjustable time budgets and reordering.
- Local PDF/image map import, page selection, zoom/scroll pan, manual “I am here” orientation, booth search, offline storage, and outdoor Apple Maps links.
- Contact capture/editing, optional photo, search/sorting/tags, follow-up dates/checklist, and CSV/JSON export. Follow-up templates only copy; no messages are sent.
- Timestamped tagged notes, optional browser dictation, personal introduction, goals derived from contacts/visited booths/tagged notes, preparation checklist, resources, and a day summary.
- ChatGPT prompt preparation and clipboard copying. Users paste into their existing conversation; no AI API, chatbot, or invented conversation deep link.
- Standalone PWA, locally generated icons, safe-area-aware interface, dark/light themes, reduced-motion support, IndexedDB persistence, and validated mergeable JSON backups.

## Data provenance and updates

`src/data/conference.ts` holds the initial dataset. `src/domain/schedule.ts` holds timezone and scheduling rules. No external scraping runs in production.

**School itinerary:** the MUSD student itinerary provided in the build brief is the authoritative source. “Confirmed” for school activities means supplied by that itinerary, not independently school-approved by this app. External conference timing must not overwrite it. Group-specific BINGO and scavenger-hunt meeting points remain unverified. Confirm those and bus pickup with the chaperone.

**Optional technical sessions:** titles, times, companies, and Smart Manufacturing Pavilion location checked against the [official Tuesday agenda](https://semiconwest2026.eventscribe.net/agenda.asp?pfp=days&day=10/13/2026&theday=Tuesday&h=Tuesday%20October%2013&BCFO=P%7CG) on October 13, 2026. The SixSense title follows the official listing. All four overlap school activities and remain separate. Workforce talk durations in the public agenda differ from school breakout windows; the school windows are preserved.

**Location details:** schedule cards and the venue directory expose hall, floor, room, and meeting point. Workforce and Smart Manufacturing Pavilions are North Hall, Expo Floor; the public agenda publishes no numbered room for either. Other official program areas include South Hall Upper Mezzanine rooms 152 (Smart MedTech), 154 (Components/Instruments/Subsystems), and 156 (Advanced Packaging), plus South Hall Lower Level room 1 (Sustainability). These do not add activities to your school itinerary. See `docs/location-verification.md` for verification notes.

**Booths:** Siemens 5982 checked against its [official exhibitor listing](https://expo.semi.org/west2026/Public/eBooth.aspx?BoothID=658005); Nordson 5844 checked against [Nordson's event page](https://www.nordson.com/en/About-Us/Events/Semicon-West-2026); Edwards 633 checked against the [official event map directory](https://expo.semi.org/west2026/Public/EventMap.aspx?ID=32402&ShAvailable=1). Checked October 13, 2026. Halls, coordinates, and walking times are not verified and are not inferred from booth numbers. SonoFlex and Ganymede feature names are retained from the user brief and labeled as such. Other companies are interests, not claims of exhibitor presence.

To update the agenda, edit the local data, check primary sources, retain source URLs/dates, run tests, and rebuild. Preserve activity IDs if users have already recorded attendance/reminders. Keep school and external agendas separate.

## Add official floor maps

No official floor-map PDF/image was present in the repository or successfully retrieved. The app provides a missing-asset state instead of drawing an approximate map.

1. Obtain an official **2026** map you are permitted to use.
2. On the device, open **Explore → Venue maps → Import official map**. PDFs, PNG, JPEG, and WebP up to 25 MB are accepted and stored as IndexedDB Blobs.
3. Or bundle the asset in `public/maps/` and add `{ name, url: '/maps/filename.pdf', mime: 'application/pdf', source: 'official source URL' }` to `src/data/maps.ts`. Those maps are imported automatically on first map-screen access. Keep bundled assets below the 8 MB per-file precache limit or deliberately adjust the cache budget.
4. Verify its year, labels, and readability. Coordinates are intentionally absent until independently reviewed map coordinates exist. Selecting a destination displays its name/booth for visual lookup; it does not draw a fabricated marker.

Map files are separate from the personal JSON backup. Download maps from the viewer to transfer them to another device. Scroll to pan; zoom buttons and Safari's page pinch zoom are supported. PDF pages render locally through a cached PDF.js worker.

## Persistence, backups, and updates

All personal data is local to this browser/origin. Zustand owns in-memory state; Dexie saves complete snapshots in a serialized write queue. Forms wait for writes before reporting a saved note/contact. IndexedDB schema versions can be extended with non-destructive Dexie migrations. The service worker uses the prompt update strategy, so it does not force an in-progress session to reload. An updated version activates after older app windows close. Service-worker caches are separate from IndexedDB and do not erase personal records.

Export a backup from **More → Settings**. Import validates the schema and merges records by stable IDs, preserving existing contacts/notes. Incoming settings and matching IDs take precedence. CSV exports escape fields and neutralize spreadsheet formula prefixes. Optional contact photos are included in JSON; maps are not. Safari may evict data, and private browsing may restrict persistence. “Request persistent storage” reports the browser decision; it does not guarantee retention. If local storage fails, the app shows an export warning.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, create a project and import `quantumcompiler32/SEMICON-Companion-App`.
3. Select Vite, use `npm run build`, output `dist`, and Node 22.13+ / 24.
4. Deploy. `vercel.json` configures static output, SPA navigation, and fresh service-worker fetching.
5. Open the HTTPS deployment on the phone once online. HTTPS (or localhost during testing) is required for the service worker and clipboard.

No environment variables, backend, login, paid APIs, or external font requests are required. Deployment changes the origin; localhost records do not transfer automatically. Export/import a backup if needed.

## Install on iPhone

1. Open the deployed HTTPS site in **Safari**.
2. Tap **Share**.
3. Select **Add to Home Screen**.
4. Confirm **Navigator** and add it.
5. Launch from the Home Screen while online, then test airplane mode before the event.

Load every needed resource and import official maps beforehand. iOS installation and safe areas must be verified on the actual iPhone; Chromium mobile emulation is not an iOS installation test.

## Browser limitations and reliability

- No indoor positioning, route optimization, inferred halls, or live venue tracking. Manual hall selection is an orientation aid.
- Conversation/walking/return buffers are planning assumptions. Verify your actual return path and adjust earlier as needed.
- Attendance is manual. “Missed” means a required activity ended without a recorded check-in; the app cannot know your physical attendance.
- Open-app reminders use the device clock and pause if the OS suspends the page. `.ics` downloads provide a calendar fallback with alarms; import into a supported calendar. Background notifications are not implemented or guaranteed.
- Optional speech recognition depends on browser/permissions/connectivity and may use the browser provider's service. iPhone keyboard dictation is the fallback; typed notes work offline.
- Clipboard requires HTTPS and browser permission. Prepared text remains visible for manual copying. Opening ChatGPT does not guarantee the existing chat opens.
- External agenda, LinkedIn, GitHub, and Apple Maps pages require internet. Offline local copies of third-party sites are not claimed.
- No multi-device sync. Clearing browser data removes local records; export a backup first.

## Architecture

`src/app/` contains the shell and action context; `src/components/ui/` contains local shadcn-style Radix components; `src/features/` contains screen modules; `src/data/` contains sourced seed data; `src/domain/` contains pure schedule, conflict, tour, and progress calculations; `src/services/` contains storage/export/validation; `src/stores/` contains application state; `src/styles/` contains responsive design tokens and layouts. Optional screen modules and PDF rendering are code-split and precached for offline navigation.

Tests cover group selection, transitions/countdowns, Pacific instants, conflicts, tour budgets, goals, backup validation/merging, CSV/ICS, IndexedDB reopen, UI offline state, and essential mobile browser flows. See `tests/` for evidence. Physical Safari install and real official-map readability remain device/content checks.
