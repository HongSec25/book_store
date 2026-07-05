import { Link } from "react-router-dom";

export default function EmptyState({ icon: Icon, title, description, actionTo, actionLabel }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rust/10 text-rust mb-4">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-display font-bold text-lg text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center rounded-full bg-rust px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-parchment transition-transform hover:scale-105"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
