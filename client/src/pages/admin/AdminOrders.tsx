import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetchOrders } from "../../api";
import type { Order } from "../../types";
import { Price } from "../../components/Price";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetchOrders({ q: q.trim() || undefined, status: status || undefined });
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1>Admin • Orders</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--ghost" to="/admin">Dashboard</Link>
          <Link className="btn btn--ghost" to="/admin/products">Products</Link>
        </div>
      </div>

      <div className="hero__filters" style={{ marginTop: 10 }}>
        <input
          className="input"
          placeholder="Search by order id / name / phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[
            "PLACED",
            "PENDING_PAYMENT",
            "PAID",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "PAYMENT_FAILED",
          ].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="cart" style={{ marginTop: 12 }}>
        {items.map((o) => (
          <div key={o.id} className="cart__row" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <Link to={`/admin/orders/${o.id}`}><strong>{o.id}</strong></Link>
                <div className="muted small">{formatDate(o.createdAt)}</div>
                <div className="muted small">
                  {o.customer?.name} • {o.customer?.phone}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div><strong>{o.status}</strong></div>
                <div className="muted small">Payment: {o.payment?.status || "—"} ({o.payment?.method || "—"})</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  <Price value={o.total} currency={o.currency || "INR"} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? <p className="muted" style={{ marginTop: 12 }}>No orders found.</p> : null}
    </div>
  );
}
