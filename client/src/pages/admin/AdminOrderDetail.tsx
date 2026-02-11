import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminFetchOrder, adminMarkOrderPaid, adminUpdateOrderStatus } from "../../api";
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

const ORDER_STATUSES = [
  "PLACED",
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PAYMENT_FAILED",
];

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminFetchOrder(id);
      setOrder(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(next: string) {
    if (!order) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminUpdateOrderStatus(order.id, next);
      setOrder(updated);
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid() {
    if (!order) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminMarkOrderPaid(order.id);
      setOrder(updated);
    } catch (e: any) {
      setError(e?.message || "Failed to mark paid");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1>Admin • Order</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--ghost" to="/admin/orders">Back to Orders</Link>
          <Link className="btn btn--ghost" to="/admin">Dashboard</Link>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {order ? (
        <div className="panel" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="muted small">Order ID</div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>{order.id}</div>
              <div className="muted small">Created: {formatDate(order.createdAt)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted small">Total</div>
              <div style={{ fontWeight: 900, fontSize: "1.4rem" }}>
                <Price value={order.total} currency={order.currency || "INR"} />
              </div>
              <div className="muted small">Payment: {order.payment?.status || "—"} ({order.payment?.method || "—"})</div>
            </div>
          </div>

          <hr />

          <h2>Customer</h2>
          <p style={{ margin: 0 }}><strong>{order.customer?.name}</strong></p>
          <p style={{ margin: 0 }} className="muted">{order.customer?.phone} {order.customer?.email ? `• ${order.customer.email}` : ""}</p>
          <p style={{ marginTop: 8 }} className="muted">{order.customer?.address}</p>

          <h2 style={{ marginTop: 16 }}>Items</h2>
          <ul className="summary">
            {(order.items || []).map((it) => (
              <li key={it.productId} className="summary__row">
                <div>
                  <strong>{it.name}</strong> <span className="muted">× {it.qty}</span>
                  <div className="muted small">{it.pack}</div>
                </div>
                <div>
                  <Price value={it.price ?? null} currency={it.currency ?? order.currency ?? "INR"} />
                </div>
              </li>
            ))}
          </ul>

          <hr />

          <h2>Admin actions</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="muted small">
              Status
              <select
                className="input"
                value={order.status || ""}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                style={{ marginLeft: 10 }}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {order.payment?.status !== "PAID" ? (
              <button className="btn" type="button" onClick={markPaid} disabled={saving}>
                Mark Paid
              </button>
            ) : null}

            <button className="btn btn--ghost" type="button" onClick={load} disabled={saving}>
              Refresh
            </button>
          </div>

          {order.payment?.providerOrderId ? (
            <p className="muted small" style={{ marginTop: 10 }}>
              Provider order id: {order.payment.providerOrderId}
            </p>
          ) : null}
          {order.payment?.providerPaymentId ? (
            <p className="muted small" style={{ marginTop: 0 }}>
              Provider payment id: {order.payment.providerPaymentId}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
