import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders } from "../api";
import type { Order } from "../types";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function MyOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMyOrders();
        setItems(res.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <h1>My Orders</h1>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="empty">
          <p className="muted">You have no orders yet.</p>
          <Link to="/" className="btn">Shop now</Link>
        </div>
      ) : null}

      <div className="cart" style={{ marginTop: 12 }}>
        {items.map((o) => (
          <div className="cart__row" key={o.id}>
            <div style={{ gridColumn: "1 / span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div><strong>Order:</strong> {o.id}</div>
                  <div className="muted small">{formatDate(o.createdAt)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div><strong>Status:</strong> {o.status}</div>
                  <div className="muted small">Payment: {o.payment?.status || "—"}</div>
                </div>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Items: {(o.items || []).reduce((sum, it) => sum + (it.qty || 0), 0)}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/order/${o.id}`} className="btn btn--ghost">View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
