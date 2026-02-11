export function Price({ value, currency = "INR" }: { value?: number | null; currency?: string | null }) {
  if (typeof value !== "number") return <span className="muted">Price on request</span>;
  try {
    return (
      <span>
        {new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value)}
      </span>
    );
  } catch {
    return <span>{value} {currency}</span>;
  }
}
