import { useState } from "react";
import {
  Copy,
  Download,
  Mail,
  Pencil,
  Plus,
  Search,
  Users,
  CalendarClock,
  Trash2,
} from "lucide-react";
import { useNavigator, updateData } from "../stores/useNavigator";
import { useUI } from "../app/context";
import { Button } from "../components/ui/button";
import {
  Badge,
  CheckboxRow,
  EmptyState,
  PageHeading,
} from "../components/shared";
import { copyText, download, toCSV } from "../services/export";
export function Connections() {
  const { data } = useNavigator();
  const { open, toast } = useUI();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [confirm, setConfirm] = useState("");
  const matches = data.contacts
    .filter((c) =>
      `${c.name} ${c.company} ${c.tags} ${c.notes}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "company"
          ? a.company.localeCompare(b.company)
          : sort === "follow-up"
            ? (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999")
            : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE, NOT JUST BUSINESS CARDS"
        title="Keep the conversation going."
        description="Remember the advice. Make the next connection count."
        action={
          <Button onClick={() => open({ type: "contact" })}>
            <Plus size={18} />
            Add Connection
          </Button>
        }
      />
      <div className="stats-row">
        <div>
          <strong>{data.contacts.length}</strong>
          <span>people met</span>
        </div>
        <div>
          <strong>
            {data.contacts.filter((c) => c.status === "to follow up").length}
          </strong>
          <span>to follow up</span>
        </div>
        <div>
          <strong>
            {data.contacts.filter((c) => c.opportunities.trim()).length}
          </strong>
          <span>potential opportunities</span>
        </div>
      </div>
      <div className="search-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            aria-label="Search connections"
            placeholder="Search a name, company, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Sort connections"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Most recent</option>
          <option value="name">Name</option>
          <option value="company">Company</option>
          <option value="follow-up">Follow-up date</option>
        </select>
        <Button
          variant="secondary"
          onClick={() =>
            download(
              "semicon-connections.csv",
              toCSV(data.contacts.map(({ photo, ...rest }) => rest)),
              "text/csv",
            )
          }
        >
          <Download size={17} />
          CSV
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            download(
              "semicon-connections.json",
              JSON.stringify(data.contacts, null, 2),
            )
          }
        >
          JSON
        </Button>
      </div>
      {!data.contacts.length ? (
        <EmptyState
          icon={Users}
          title="Your next mentor could be one conversation away."
          text="Add the people you meet, what you talked about, and one thoughtful follow-up."
          action={
            <Button onClick={() => open({ type: "contact" })}>
              <Plus size={18} />
              Add your first connection
            </Button>
          }
        />
      ) : !matches.length ? (
        <p className="empty-state">No connections match your search.</p>
      ) : (
        <div className="connections-grid">
          {matches.map((c) => (
            <article className="card contact-card" key={c.id}>
              <div className="contact-top">
                {c.photo ? (
                  <img
                    className="avatar contact-photo"
                    src={c.photo}
                    alt={`Attachment for ${c.name}`}
                  />
                ) : (
                  <span className="avatar">
                    {c.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
                <div>
                  <h3>{c.name}</h3>
                  <p>
                    {c.role}
                    {c.role && c.company ? " · " : ""}
                    {c.company}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${c.name}`}
                  onClick={() => open({ type: "contact", id: c.id })}
                >
                  <Pencil size={17} />
                </Button>
              </div>
              <Badge tone={c.status === "to follow up" ? "amber" : "green"}>
                {c.status}
              </Badge>
              {c.tags && <p className="accent">{c.tags}</p>}
              {c.metAt && (
                <p className="muted">
                  Met at {c.metAt}
                  {c.booth ? ` · Booth ${c.booth}` : ""}
                </p>
              )}
              {c.notes && <p className="contact-note">{c.notes}</p>}
              {c.advice && (
                <div className="question-box">
                  <p>
                    <strong>Advice received</strong>
                    <br />
                    {c.advice}
                  </p>
                </div>
              )}
              {c.opportunities && (
                <div className="opportunity">
                  <strong>Potential opportunity</strong>
                  <p>{c.opportunities}</p>
                </div>
              )}
              {c.email && (
                <p className="location">
                  <Mail size={15} />
                  {c.email}
                </p>
              )}
              {c.linkedin && (
                <a
                  className="source-link"
                  href={safeLinkedIn(c.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn profile ↗
                </a>
              )}
              {c.followUpDate && (
                <p className="location">
                  <CalendarClock size={16} />
                  Follow up {c.followUpDate}
                </p>
              )}
              <CheckboxRow
                checked={c.status === "done"}
                onChange={() =>
                  updateData((d) => ({
                    ...d,
                    contacts: d.contacts.map((x) =>
                      x.id === c.id
                        ? {
                            ...x,
                            status:
                              x.status === "done" ? "to follow up" : "done",
                          }
                        : x,
                    ),
                  }))
                }
              >
                Follow-up completed
              </CheckboxRow>
              <div className="row-actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={async () => {
                    try {
                      await copyText(
                        `Hi ${c.name.split(" ")[0]}, it was great meeting you at SEMICON West. Thank you for sharing ${c.advice || "your perspective on engineering"}. I'm excited to keep learning about ${c.company || "this field"} and would love to stay connected. — Moksh`,
                      );
                      toast("Follow-up copied. Review and send it yourself.");
                    } catch {
                      toast(
                        "Clipboard unavailable. Edit the contact to review your follow-up details.",
                      );
                    }
                  }}
                >
                  <Copy size={16} />
                  Copy follow-up
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${c.name}`}
                  onClick={() => setConfirm(c.id)}
                >
                  <Trash2 size={17} />
                </Button>
              </div>
              {confirm === c.id && (
                <div className="notice amber">
                  <p>Delete this connection?</p>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => {
                      updateData((d) => ({
                        ...d,
                        contacts: d.contacts.filter((x) => x.id !== c.id),
                      }));
                      setConfirm("");
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setConfirm("")}
                  >
                    Keep
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function safeLinkedIn(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      (u.hostname === "linkedin.com" || u.hostname.endsWith(".linkedin.com"))
      ? u.href
      : "https://www.linkedin.com/";
  } catch {
    return "https://www.linkedin.com/";
  }
}
