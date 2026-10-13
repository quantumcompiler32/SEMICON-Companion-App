import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Check, MapPin } from "lucide-react";
import { Button } from "./ui/button";
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow accent">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "green" | "amber" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Location({ children }: { children: React.ReactNode }) {
  return (
    <span className="location">
      <MapPin size={14} />
      {children}
    </span>
  );
}
export function ExternalLink({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <a className="resource-link" href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={17} />
    </a>
  );
}
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="checkbox-row"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
    >
      <span className={`check-box ${checked ? "checked" : ""}`}>
        {checked && <Check size={14} />}
      </span>
      <span>{children}</span>
    </button>
  );
}
export function ActionTile({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <Button variant="secondary" className="action-tile" onClick={onClick}>
      <Icon size={22} />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <ArrowUpRight size={17} />
    </Button>
  );
}
