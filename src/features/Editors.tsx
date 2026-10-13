import { newId } from "../utils/id";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Mic,
  MicOff,
  Save,
  TriangleAlert,
} from "lucide-react";
import { Sheet } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useUI } from "../app/context";
import { useNavigator, updateData } from "../stores/useNavigator";
import {
  exhibitors,
  introduction,
  shortIntroduction,
  schoolSchedule,
  sessions,
} from "../data/conference";
import { copyText, learningPrompt, validTime } from "../services/export";
import { conflicts, rangeLabel } from "../domain/schedule";
import type { Activity, Connection, NoteKind } from "../domain/models";
export function Editors() {
  const { modal, close } = useUI();
  return (
    <>
      <Sheet
        open={!!modal}
        onClose={close}
        title={
          modal?.type === "note"
            ? "Catch an insight."
            : modal?.type === "contact"
              ? "Make a connection."
              : modal?.type === "intro"
                ? "Hi, I’m Moksh."
                : modal?.type === "ask"
                  ? "Take the question to ChatGPT."
                  : "Make room for discovery."
        }
        description={
          modal?.type === "ask"
            ? "Prepare a prompt, then return to your existing ChatGPT conversation."
            : "Saved offline on this device."
        }
      >
        {modal?.type === "note" ? (
          <NoteEditor
            key={JSON.stringify(modal)}
            association={modal.association}
          />
        ) : modal?.type === "contact" ? (
          <ContactEditor
            key={JSON.stringify(modal)}
            id={modal.id}
            company={modal.company}
            booth={modal.booth}
          />
        ) : modal?.type === "intro" ? (
          <Introduction />
        ) : modal?.type === "ask" ? (
          <AskEditor topic={modal.topic} />
        ) : modal?.type === "activity" ? (
          <ActivityEditor key={modal.id ?? "new"} id={modal.id} />
        ) : null}
      </Sheet>
    </>
  );
}
function NoteEditor({ association = "" }: { association?: string }) {
  const { close, toast } = useUI();
  const [text, setText] = useState("");
  const [related, setRelated] = useState(association);
  const [kind, setKind] = useState<NoteKind>("insight");
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<{ stop: () => void } | null>(
    null,
  );
  useEffect(() => () => recognition?.stop(), [recognition]);
  function dictate() {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Speech = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Speech) {
      toast(
        "Speech recognition is unavailable. Use the microphone on your iPhone keyboard.",
      );
      return;
    }
    if (listening) {
      recognition?.stop();
      return;
    }
    const r = new Speech();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      setText(
        (prev) => `${prev}${prev ? " " : ""}${e.results[0][0].transcript}`,
      );
      setListening(false);
    };
    r.onerror = () => {
      setListening(false);
      toast("Dictation unavailable. Use your keyboard microphone.");
    };
    r.onend = () => setListening(false);
    setRecognition(r);
    try {
      r.start();
      setListening(true);
    } catch {
      toast("Dictation could not start. Try your keyboard microphone.");
    }
  }
  return (
    <form
      className="editor-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        recognition?.stop();
        updateData((d) => ({
          ...d,
          notes: [
            ...d.notes,
            {
              id: newId(),
              text: text.trim(),
              association: related.trim(),
              kind,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        try {
          await useNavigator.getState().flush();
          toast("Note saved locally.");
          close();
        } catch {
          toast(
            "Could not save. Your note is still visible; copy it before leaving.",
          );
        }
      }}
    >
      <div className="note-prompts">
        {[
          "What did I see?",
          "What did I learn?",
          "Who should I follow up with?",
          "What technical question do I have?",
        ].map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => setText((t) => `${t}${t ? "\n" : ""}${p} `)}
          >
            {p}
          </button>
        ))}
      </div>
      <label>
        Your note
        <textarea
          autoFocus
          required
          maxLength={10000}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="One detail worth remembering…"
        />
      </label>
      <div className="row-actions">
        <Button type="button" variant="ghost" onClick={dictate}>
          {listening ? <MicOff size={17} /> : <Mic size={17} />}{" "}
          {listening ? "Stop dictation" : "Dictate if supported"}
        </Button>
        <small className="muted">Keyboard dictation also works.</small>
      </div>
      <label>
        Related company, session, or person
        <input
          value={related}
          maxLength={300}
          onChange={(e) => setRelated(e.target.value)}
          list="associations"
          placeholder="Optional"
        />
        <datalist id="associations">
          {[
            ...exhibitors.map((e) => e.name),
            ...sessions.map((s) => s.title),
            ...useNavigator.getState().data.contacts.map((c) => c.name),
          ].map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
      </label>
      <label>
        Type
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as NoteKind)}
        >
          {["insight", "career", "opportunity", "skill", "general"].map((k) => (
            <option key={k} value={k}>
              {k === "skill" ? "Skill to learn" : k}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit">
        <Save size={18} />
        Save note
      </Button>
    </form>
  );
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: {
    results: { [i: number]: { [i: number]: { transcript: string } } };
  }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
function ContactEditor({
  id,
  company = "",
  booth = "",
}: {
  id?: string;
  company?: string;
  booth?: string;
}) {
  const { data } = useNavigator();
  const { close, toast } = useUI();
  const existing = data.contacts.find((c) => c.id === id);
  const [form, setForm] = useState<Connection>(
    existing ?? {
      id: newId(),
      name: "",
      company,
      role: "",
      email: "",
      linkedin: "",
      booth,
      metAt: "",
      notes: "",
      advice: "",
      opportunities: "",
      status: "to follow up",
      followUpDate: "",
      tags: "",
      createdAt: new Date().toISOString(),
    },
  );
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const set = (key: keyof Connection, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const fields: [keyof Connection, string, string?][] = [
    ["name", "Full name"],
    ["company", "Company"],
    ["role", "Role"],
    ["email", "Email", "email"],
    ["linkedin", "LinkedIn URL", "url"],
    ["booth", "Booth number"],
    ["metAt", "Where we met"],
    ["tags", "Tags (comma separated)"],
    ["followUpDate", "Follow-up date", "date"],
  ];
  async function photo(file: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP attachment smaller than 3 MB.");
      return;
    }
    setPhotoBusy(true);
    try {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject();
        reader.readAsDataURL(file);
      });
      set("photo", result);
      setError("");
    } catch {
      setError("Could not read the attachment.");
    } finally {
      setPhotoBusy(false);
    }
  }
  return (
    <form
      className="editor-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        if (form.linkedin) {
          try {
            const url = new URL(form.linkedin);
            if (
              url.protocol !== "https:" ||
              !(
                url.hostname === "linkedin.com" ||
                url.hostname.endsWith(".linkedin.com")
              )
            )
              throw new Error();
          } catch {
            setError("Use a full https://www.linkedin.com/ profile URL.");
            return;
          }
        }
        updateData((d) => ({
          ...d,
          contacts: existing
            ? d.contacts.map((c) => (c.id === id ? form : c))
            : [...d.contacts, form],
        }));
        try {
          await useNavigator.getState().flush();
          toast("Connection saved locally.");
          close();
        } catch {
          setError(
            "Could not save locally. Keep this form open and copy your details.",
          );
        }
      }}
    >
      <div className="form-grid">
        {fields.map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              type={type ?? "text"}
              autoFocus={key === "name"}
              required={key === "name"}
              maxLength={500}
              value={String(form[key] ?? "")}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      {(
        [
          ["notes", "Conversation notes"],
          ["advice", "Technical advice received"],
          ["opportunities", "Opportunities discussed"],
        ] as const
      ).map(([key, label]) => (
        <label key={key}>
          {label}
          <textarea
            maxLength={10000}
            rows={2}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </label>
      ))}
      <label>
        Follow-up status
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {["to follow up", "contacted", "done"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Optional photo attachment
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void photo(f);
          }}
        />
      </label>
      {form.photo && (
        <img
          className="photo-preview"
          src={form.photo}
          alt="Contact attachment preview"
        />
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={photoBusy}>
        <Save size={18} />
        {photoBusy ? "Reading photo…" : "Save connection"}
      </Button>
    </form>
  );
}
function Introduction() {
  const { data } = useNavigator();
  const { toast } = useUI();
  const [short, setShort] = useState(false);
  const [value, setValue] = useState(data.settings.introduction);
  return (
    <div className="editor-form">
      <div className="filter-tabs">
        <button
          className={!short ? "selected" : ""}
          onClick={() => setShort(false)}
        >
          Full introduction
        </button>
        <button
          className={short ? "selected" : ""}
          onClick={() => setShort(true)}
        >
          Short version
        </button>
      </div>
      {short ? (
        <p className="introduction-text">{shortIntroduction}</p>
      ) : (
        <label>
          Your introduction
          <textarea
            rows={11}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={10000}
          />
        </label>
      )}
      <div className="row-actions">
        <Button
          onClick={async () => {
            try {
              await copyText(short ? shortIntroduction : value);
              toast("Introduction copied.");
            } catch {
              toast("Select the text and copy it manually.");
            }
          }}
        >
          <Copy size={17} />
          Copy introduction
        </Button>
        {!short && (
          <Button
            variant="secondary"
            onClick={() => {
              updateData((d) => ({
                ...d,
                settings: { ...d.settings, introduction: value },
              }));
              toast("Introduction saved.");
            }}
          >
            <Save size={17} />
            Save changes
          </Button>
        )}
      </div>
      <Button variant="ghost" onClick={() => setValue(introduction)}>
        Restore original text
      </Button>
    </div>
  );
}
function AskEditor({
  topic = "Semiconductor manufacturing",
}: {
  topic?: string;
}) {
  const { toast } = useUI();
  const [selected, setSelected] = useState(topic);
  const [context, setContext] = useState("");
  const [copied, setCopied] = useState(false);
  const prompt = learningPrompt(selected, context);
  return (
    <div className="editor-form">
      <label>
        Topic, company, or session
        <input
          list="learning-topics"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setCopied(false);
          }}
        />
        <datalist id="learning-topics">
          {[
            "PLCs",
            "Vacuum systems",
            "Digital twins",
            "Computer vision",
            "Predictive maintenance",
            ...exhibitors.map((e) => e.name),
            ...sessions.map((s) => s.title),
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </datalist>
      </label>
      <label>
        What did you see? What do you want to understand?
        <textarea
          rows={3}
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            setCopied(false);
          }}
          placeholder="Add a detail from your conversation…"
        />
      </label>
      <label>
        Prepared question
        <textarea className="prompt-preview" readOnly rows={9} value={prompt} />
      </label>
      <Button
        onClick={async () => {
          try {
            await copyText(prompt);
            setCopied(true);
            toast(
              "Question copied. Return to your existing ChatGPT chat and paste it.",
            );
          } catch {
            toast(
              "Clipboard unavailable. Select and copy the prepared question above.",
            );
          }
        }}
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
        {copied
          ? "Copied — paste in your existing chat"
          : "Copy prepared question"}
      </Button>
      <Button asChild variant="secondary">
        <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">
          Open ChatGPT <ExternalLink size={17} />
        </a>
      </Button>
      <p className="footnote">
        Opening ChatGPT does not guarantee your existing conversation opens.
        Return to the chat you already use and paste the prompt. Navigator does
        not use an AI API or generate explanations.
      </p>
    </div>
  );
}
function ActivityEditor({ id }: { id?: string }) {
  const { data } = useNavigator();
  const { close, toast } = useUI();
  const existing = data.customActivities.find((a) => a.id === id);
  const [form, setForm] = useState<Activity>(
    existing ?? {
      id: newId(),
      title: "",
      start: "13:30",
      end: "13:45",
      location: "",
      type: "personal",
      preparation: "",
    },
  );
  const [error, setError] = useState("");
  const collisions =
    validTime(form.start) && validTime(form.end)
      ? conflicts(form, schoolSchedule(data.settings.group))
      : [];
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !validTime(form.start) ||
          !validTime(form.end) ||
          form.start >= form.end
        ) {
          setError("Choose an end time after the start time.");
          return;
        }
        updateData((d) => ({
          ...d,
          customActivities: existing
            ? d.customActivities.map((a) => (a.id === id ? form : a))
            : [...d.customActivities, form],
        }));
        toast(
          collisions.length
            ? "Plan saved with a school schedule conflict. School activities still take priority."
            : "Personal plan saved.",
        );
        close();
      }}
    >
      <label>
        Activity name
        <input
          required
          autoFocus
          maxLength={300}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </label>
      <div className="form-grid">
        <label>
          Start · Pacific time
          <input
            type="time"
            required
            value={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
          />
        </label>
        <label>
          End · Pacific time
          <input
            type="time"
            required
            value={form.end}
            onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
          />
        </label>
      </div>
      <label>
        Location
        <input
          required
          maxLength={300}
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="Use a verified hall or booth if known"
        />
      </label>
      <label>
        Type
        <select
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as Activity["type"] }))
          }
        >
          <option value="personal">Personal booth visit / plan</option>
          <option value="optional">Optional technical session</option>
          <option value="break">Break</option>
        </select>
      </label>
      <label>
        Preparation
        <textarea
          rows={3}
          maxLength={10000}
          value={form.preparation}
          onChange={(e) =>
            setForm((f) => ({ ...f, preparation: e.target.value }))
          }
        />
      </label>
      {collisions.length > 0 && (
        <div className="notice amber">
          <TriangleAlert size={20} />
          <div>
            <strong>This plan overlaps your school itinerary.</strong>
            {collisions.map((a) => (
              <p key={a.id}>
                {rangeLabel(a)} · {a.title}
              </p>
            ))}
            <p>
              Required school activities remain on your schedule. Ask your
              chaperone before making a change.
            </p>
          </div>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit">
        <Save size={18} />
        {collisions.length ? "Save plan with conflict warning" : "Save plan"}
      </Button>
    </form>
  );
}
