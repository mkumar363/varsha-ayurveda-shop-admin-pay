import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminCreateProduct, adminDeleteProduct, adminUpdateProduct, fetchProducts } from "../../api";
import type { Product } from "../../types";

export function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => products.find(p => p.id === selectedId) || null, [products, selectedId]);

  const [form, setForm] = useState<Partial<Product>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchProducts({ limit: 200 });
      setProducts(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected) {
      setForm({
        id: selected.id,
        name: selected.name,
        category: selected.category,
        pack: selected.pack,
        price: selected.price ?? null,
        currency: selected.currency ?? "INR",
        image: selected.image,
        shortDescription: selected.shortDescription,
      });
    } else {
      setForm({});
    }
  }, [selected]);

  async function saveSelected() {
    if (!selected) return;
    setError("");
    try {
      const updated = await adminUpdateProduct(selected.id, {
        name: form.name,
        category: form.category,
        pack: form.pack,
        price: form.price === "" ? null : form.price,
        currency: form.currency,
        image: form.image,
        shortDescription: form.shortDescription,
      });
      setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    } catch (e: any) {
      setError(e?.message || "Failed to save product");
    }
  }

  async function createNew() {
    setError("");
    try {
      const created = await adminCreateProduct({
        name: "New Product",
        brand: "Varsha Ayurveda",
        category: "Other",
        pack: "",
        price: null,
        currency: "INR",
        image: "",
        shortDescription: "",
        tags: [],
      });
      setProducts(prev => [created, ...prev]);
      setSelectedId(created.id);
    } catch (e: any) {
      setError(e?.message || "Failed to create product");
    }
  }

  async function removeSelected() {
    if (!selected) return;
    if (!confirm(`Delete ${selected.name}?`)) return;
    setError("");
    try {
      await adminDeleteProduct(selected.id);
      setProducts(prev => prev.filter(p => p.id !== selected.id));
      setSelectedId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to delete product");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1>Admin • Products</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--ghost" to="/admin">Dashboard</Link>
          <Link className="btn btn--ghost" to="/admin/orders">Orders</Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button className="btn" type="button" onClick={createNew}>New product</button>
        <button className="btn btn--ghost" type="button" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="checkout" style={{ marginTop: 14 }}>
        <section className="panel">
          <h2>All products</h2>
          <div className="summary">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn--ghost"
                style={{ justifyContent: "space-between", display: "flex" }}
                onClick={() => setSelectedId(p.id)}
              >
                <span style={{ textAlign: "left" }}>
                  <strong>{p.name}</strong>
                  <span className="muted small">{p.category ? ` • ${p.category}` : ""}</span>
                </span>
                <span className="muted small">{typeof p.price === "number" ? `₹${p.price}` : "—"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Edit</h2>
          {!selected ? (
            <p className="muted">Select a product to edit.</p>
          ) : (
            <>
              <label className="label">
                Name
                <input className="input" value={String(form.name || "")} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </label>

              <label className="label">
                Category
                <input className="input" value={String(form.category || "")} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
              </label>

              <label className="label">
                Pack
                <input className="input" value={String(form.pack || "")} onChange={(e) => setForm(f => ({ ...f, pack: e.target.value }))} />
              </label>

              <label className="label">
                Price (INR)
                <input
                  className="input"
                  inputMode="decimal"
                  value={form.price === null || form.price === undefined ? "" : String(form.price)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, price: v === "" ? null : Number(v) }));
                  }}
                />
                <span className="muted small">Leave blank for “Price on request”.</span>
              </label>

              <label className="label">
                Image path
                <input className="input" value={String(form.image || "")} onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))} />
              </label>

              <label className="label">
                Short description
                <textarea className="input" rows={4} value={String(form.shortDescription || "")} onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))} />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" type="button" onClick={saveSelected}>Save</button>
                <button className="btn btn--ghost" type="button" onClick={removeSelected}>Delete</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
