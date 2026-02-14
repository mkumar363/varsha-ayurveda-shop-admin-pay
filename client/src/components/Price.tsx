export function Price({
  value,
  currency,
}: {
  value?: number | null;
  currency?: string | null;
}) {
  if (typeof value !== "number") return <span className="muted">Price on request</span>;

  // Intl.NumberFormat expects currency?: string (NOT null)
  const safeCurrency: string = currency ?? "INR";

  try {
    return (
      <span>
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: safeCurrency,
        }).format(value)}
      </span>
    );
  } catch {
    return (
      <span>
        {value} {safeCurrency}
      </span>
    );
  }
}
