import { newId } from "../utils/id";
import { LocationDetails } from "../components/LocationDetails";
import { venueLocations } from "../data/locations";
import { useEffect, useRef, useState } from "react";
import {
  FileUp,
  MapPinned,
  Minus,
  Plus,
  RotateCcw,
  Download,
  Trash2,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import { bundledMaps } from "../data/maps";
import { db } from "../services/database";
import type { MapAsset } from "../domain/models";
import { useUI } from "../app/context";
import { updateData, useNavigator } from "../stores/useNavigator";
import { Button } from "../components/ui/button";
import { Badge, EmptyState, SectionHeading } from "../components/shared";
import { MAP_URL, exhibitors, schoolSchedule } from "../data/conference";
import { download } from "../services/export";
import { timeline } from "../domain/schedule";
export function VenueMap() {
  const { data } = useNavigator();
  const { destination, goTo, toast, now } = useUI();
  const [maps, setMaps] = useState<MapAsset[]>([]);
  const [selected, setSelected] = useState("");
  const [scale, setScale] = useState(1);
  const [query, setQuery] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const asset = maps.find((m) => m.id === selected);
  const next = timeline(schoolSchedule(data.settings.group), now).next;
  useEffect(() => {
    void (async () => {
      for (const m of bundledMaps) {
        if (!(await db.maps.get(m.url))) {
          const res = await fetch(m.url);
          if (!res.ok) throw new Error("Map asset missing");
          await db.maps.put({
            id: m.url,
            name: m.name,
            mime: m.mime,
            data: await res.blob(),
            source: m.source,
            addedAt: new Date().toISOString(),
          });
        }
      }
      const m = await db.maps.toArray();
      setMaps(m);
      setSelected(m[0]?.id ?? "");
    })().catch(() => setError("Could not load saved maps."));
  }, []);
  useEffect(() => {
    setScale(1);
    setPage(1);
  }, [selected]);
  useEffect(() => {
    let cancelled = false;
    let imageURL = "";
    let destroy: (() => void) | undefined;
    setError("");
    setImage("");
    if (!asset) return;
    if (asset.mime.startsWith("image/")) {
      imageURL = URL.createObjectURL(asset.data);
      setImage(imageURL);
      setPages(1);
      return () => URL.revokeObjectURL(imageURL);
    }
    setLoading(true);
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const bytes = await asset.data.arrayBuffer();
        if (cancelled) return;
        const task = pdfjs.getDocument({ data: bytes });
        destroy = () => {
          void task.destroy();
        };
        const pdf = await task.promise;
        if (cancelled) return;
        setPages(pdf.numPages);
        const pdfPage = await pdf.getPage(Math.min(page, pdf.numPages));
        const viewport = pdfPage.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvas, viewport }).promise;
      } catch (e) {
        if (!cancelled)
          setError(
            `Unable to display this PDF. Try an image export. ${e instanceof Error ? e.message : ""}`,
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [asset, page]);
  async function upload(file: File) {
    if (
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      )
    ) {
      toast("Choose a PDF, PNG, JPEG, or WebP official floor map.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast("Choose a map smaller than 25 MB.");
      return;
    }
    const m: MapAsset = {
      id: newId(),
      name: file.name,
      mime: file.type,
      data: file,
      source: "User-imported file · verify it is the official 2026 map",
      addedAt: new Date().toISOString(),
    };
    try {
      await db.maps.add(m);
      setMaps((prev) => [...prev, m]);
      setSelected(m.id);
      toast("Map saved locally for offline use.");
    } catch {
      toast("Map could not be saved. Storage may be full.");
    }
  }
  return (
    <>
      <div className="map-destination">
        <MapPinned size={24} />
        <div>
          <p className="eyebrow accent">YOUR DESTINATION</p>
          <h3>
            {destination || next?.location || "Select a company or activity"}
          </h3>
          <p className="muted">
            Destination selected. No verified coordinates are available, so no
            map marker or indoor route is drawn.
          </p>
        </div>
      </div>
      <div className="map-toolbar card">
        <label>
          I am here
          <select
            aria-label="I am here"
            value={data.settings.hall}
            onChange={(e) =>
              updateData((d) => ({
                ...d,
                settings: { ...d.settings, hall: e.target.value },
              }))
            }
          >
            {[
              "Not selected",
              "North Hall",
              "South Hall A",
              "South Hall B",
              "Workforce Pavilion",
              "Pavilion Stage",
              "Smart Manufacturing Pavilion",
              "Exhibition show floor",
            ].map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label className="file-button">
          <FileUp size={18} />
          Import official map
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            aria-label="Import official map"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="search-bar">
        <MapPinned size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Find booth number on map"
          placeholder="Find company or booth number…"
        />
      </div>
      {query && (
        <div className="map-search-results">
          {exhibitors
            .filter((e) =>
              `${e.name} ${e.booth ?? ""}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  goTo(
                    `${e.name} · ${e.booth ? `Booth ${e.booth}` : "Booth unknown"}`,
                  );
                  setQuery("");
                }}
              >
                {e.name}
                <span>{e.booth ? `Booth ${e.booth}` : "Not verified"}</span>
              </button>
            ))}
          {!exhibitors.some((e) =>
            `${e.name} ${e.booth ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && (
            <p className="muted">
              No verified booth found. Use the official exhibitor directory.
            </p>
          )}
        </div>
      )}
      {!asset ? (
        <div className="map-empty">
          <EmptyState
            icon={MapPinned}
            title="The official map belongs here."
            text="No floor-map asset is bundled. Import an official 2026 PDF or image to zoom, pan, and keep it available offline. Booth positions and hall assignments have not been inferred."
            action={
              <Button asChild variant="secondary">
                <a href={MAP_URL} target="_blank" rel="noreferrer">
                  Open official floor plan <ArrowUpRight size={17} />
                </a>
              </Button>
            }
          />
          <div className="map-empty-bottom">
            <Badge tone="amber">Missing offline asset</Badge>
            <span>Official map required · no approximate geometry</span>
          </div>
        </div>
      ) : (
        <section className="card map-card">
          <div className="map-controls">
            <select
              aria-label="Select saved map"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="row-actions">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              >
                <Minus size={18} />
              </Button>
              <span>{Math.round(scale * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom in"
                onClick={() => setScale((s) => Math.min(4, s + 0.25))}
              >
                <Plus size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reset zoom"
                onClick={() => setScale(1)}
              >
                <RotateCcw size={17} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download saved map"
                onClick={() => download(asset.name, asset.data)}
              >
                <Download size={17} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove saved map"
                onClick={async () => {
                  await db.maps.delete(asset.id);
                  const remaining = maps.filter((m) => m.id !== asset.id);
                  setMaps(remaining);
                  setSelected(remaining[0]?.id ?? "");
                  toast("Map removed.");
                }}
              >
                <Trash2 size={17} />
              </Button>
            </div>
          </div>
          {pages > 1 && (
            <label className="inline-label">
              Page
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {Array.from({ length: pages }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} of {pages}
                  </option>
                ))}
              </select>
            </label>
          )}
          {loading && (
            <p role="status">
              <LoaderCircle size={18} />
              Rendering map…
            </p>
          )}
          {error && (
            <div role="alert" className="notice amber">
              {error}
            </div>
          )}
          <div
            className="map-viewer"
            ref={viewer}
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
          >
            <div
              className="map-paper"
              style={{ width: `${scale * 100}%`, minWidth: `${scale * 100}%` }}
            >
              {image ? (
                <img src={image} alt={asset.name} />
              ) : (
                <canvas
                  ref={canvasRef}
                  aria-label={`Official floor map: ${asset.name}, page ${page}`}
                />
              )}
            </div>
          </div>
          <p className="footnote">
            {asset.source} · imported {asset.addedAt.slice(0, 10)}. Scroll to
            pan; use the zoom buttons or Safari pinch zoom. Locate the printed
            booth number visually.
          </p>
        </section>
      )}
      <SectionHeading
        title="Hall, floor & room directory"
        eyebrow="OFFICIAL AGENDA LOCATIONS"
      />
      <div className="venue-directory">
        {venueLocations.map((location) => (
          <article className="card" key={location.area}>
            <h3>{location.area}</h3>
            <LocationDetails location={location} />
            <Button
              variant="secondary"
              size="small"
              onClick={() =>
                goTo(
                  `${location.hall} · ${location.floor} · ${location.area}${location.room.startsWith("No ") ? "" : ` · Room ${location.room}`}`,
                )
              }
            >
              Select destination <MapPinned size={16} />
            </Button>
          </article>
        ))}
      </div>
      <SectionHeading
        title="Getting to the venue"
        eyebrow="OUTDOOR DIRECTIONS ONLY"
      />
      <div className="venue-links">
        <Button asChild variant="secondary">
          <a
            href="https://maps.apple.com/?q=Moscone+Center+San+Francisco"
            target="_blank"
            rel="noreferrer"
          >
            Moscone Center <ArrowUpRight size={17} />
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a
            href="https://maps.apple.com/?q=1331+E+Calaveras+Blvd+Milpitas+CA+95035"
            target="_blank"
            rel="noreferrer"
          >
            MUSD Innovation Campus <ArrowUpRight size={17} />
          </a>
        </Button>
      </div>
    </>
  );
}
