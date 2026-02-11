export function QuantityControl({
  qty,
  onChange,
  min = 1,
}: {
  qty: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="qty">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onChange(Math.max(min, qty - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        className="input input--qty"
        value={qty}
        onChange={(e) => onChange(Number(e.target.value))}
        inputMode="numeric"
      />
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onChange(qty + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
