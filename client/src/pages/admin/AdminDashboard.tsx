import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminSalesSummary } from "../../api";
import type { SalesSummary } from "../../types";
import { Price } from "../../components/Price";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminDashboardPage() {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminSalesSummary();
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1>Admin Dashboard</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--ghost" to="/admin/orders">Orders</Link>
          <Link className="btn btn--ghost" to="/admin/products">Products</Link>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {data ? (
        <>
          <div className="cart__summary" style={{ marginTop: 14 }}>
            <div>
              <div className="muted small">Total Orders</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{data.counts.ordersTotal}</div>
            </div>
            <div>
              <div className="muted small">Paid Orders</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{data.counts.ordersPaid}</div>
            </div>
            <div>
              <div className="muted small">Users</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{data.counts.usersTotal}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted small">Revenue</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>
                <Price value={data.revenue.total} currency={data.revenue.currency} />
              </div>
            </div>
          </div>

          <div className="checkout" style={{ marginTop: 14 }}>
            <section className="panel">
              <h2>Top products</h2>
              {data.topProducts.length === 0 ? (
                <p className="muted">No paid orders yet.</p>
              ) : (
                <ul className="summary">
                  {data.topProducts.map((p) => (
                    <li key={p.productId} className="summary__row">
                      <div>
                        <strong>{p.name}</strong>
                        <div className="muted small">Qty: {p.qty}</div>
                      </div>
                      <div>
                        <Price value={p.revenue} currency={data.revenue.currency} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>Recent orders</h2>
              {data.recentOrders.length === 0 ? (
                <p className="muted">No orders yet.</p>
              ) : (
                <ul className="summary">
                  {data.recentOrders.map((o) => (
                    <li key={o.id} className="summary__row">
                      <div>
                        <Link to={`/admin/orders/${o.id}`}><strong>{o.id}</strong></Link>
                        <div className="muted small">{formatDate(o.createdAt)} • {o.status}</div>
                      </div>
                      <div className="muted small" style={{ textAlign: "right" }}>
                        {o.payment?.status || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
