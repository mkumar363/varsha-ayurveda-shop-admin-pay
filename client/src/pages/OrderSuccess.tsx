import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOrder } from "../api";
import type { Order } from "../types";
import { Price } from "../components/Price";

export function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetchOrder(id)
      .then(setOrder)
      .catch((e: any) => setError(e?.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="container">
      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {order ? (
        <div className="panel">
          <h1>Order ✅</h1>
          <p className="muted">
            Your order id is <strong>{order.id}</strong>
          </p>

          <p className="muted" style={{ marginTop: 0 }}>
            Status: <strong>{order.status}</strong>
            {order.payment?.status ? (
              <> • Payment: <strong>{order.payment.status}</strong> ({order.payment.method || "—"})</>
            ) : null}
          </p>

          <h2 style={{ marginTop: 16 }}>Items</h2>
          <ul className="summary">
            {order.items.map((i) => (
              <li key={i.productId} className="summary__row">
                <div>
                  <strong>{i.name}</strong> <span className="muted">× {i.qty}</span>
                  <div className="muted small">{i.pack}</div>
                </div>
                <div>
                  <Price value={i.price ?? null} currency={i.currency ?? "INR"} />
                </div>
              </li>
            ))}
          </ul>

          <hr />

          <div className="summary__total">
            <strong>Total</strong>
            <Price value={order.total} currency={order.currency ?? "INR"} />
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" to="/">
              Back to store
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
