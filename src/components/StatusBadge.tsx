interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
  PRESENT:  "bg-success/15 text-success border border-success/20",
  ABSENT:   "bg-danger/15 text-danger border border-danger/20",
  HALF_DAY: "bg-warning/15 text-warning border border-warning/20",
  LEAVE:    "bg-info/15 text-info border border-info/20",
  PENDING:  "bg-warning/15 text-warning border border-warning/20",
  APPROVED: "bg-success/15 text-success border border-success/20",
  REJECTED: "bg-danger/15 text-danger border border-danger/20",
  PAID:     "bg-info/15 text-info border border-info/20",
  SICK:     "bg-warning/15 text-warning border border-warning/20",
  UNPAID:   "bg-surface-overlay text-foreground-muted border border-surface-border",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-surface-overlay text-foreground-muted border border-surface-border";
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center font-medium uppercase tracking-tactical ${style} ${sizeStyle}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
