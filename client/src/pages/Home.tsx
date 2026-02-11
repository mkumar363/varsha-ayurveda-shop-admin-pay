import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../api";
import type { Product } from "../types";
import { ProductCard } from "../components/ProductCard";

export function HomePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchProducts({});
      setProducts(res.items);
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = !category || (p.category || "") === category;
      if (!matchesCategory) return false;
      if (!qq) return true;

      const hay = [p.name, p.brand, p.category, p.pack, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [products, q, category]);

  return (
    <div className="container">
      <div className="hero">
        <div>
          <h1>Varsha Ayurveda</h1>
          {/* <p className="muted">
            Ayurveda product catalogue turned into a simple e‑commerce storefront.
          </p> */}
        </div>

        <div className="hero__filters">
          <input
            className="input"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>
          No products match your search.
        </p>
      ) : null}
    </div>
  );
}
