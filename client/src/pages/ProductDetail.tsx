import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct } from "../api";
import type { Product } from "../types";
import { useCart } from "../cart/CartContext";
import { Price } from "../components/Price";
import { QuantityControl } from "../components/QuantityControl";

export function ProductDetailPage() {
  const { id } = useParams();
  const cart = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetchProduct(id)
      .then(setProduct)
      .catch((e: any) => setError(e?.message || "Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container"><p>Loading…</p></div>;
  }
  if (error) {
    return <div className="container"><p className="error">{error}</p></div>;
  }
  if (!product) {
    return <div className="container"><p>Not found.</p></div>;
  }

  return (
    <div className="container">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> <span className="muted">/</span> <span>{product.name}</span>
      </div>

      <div className="product">
        <div className="product__media">
          <img
            src={product.image || "/vite.svg"}
            alt={product.name}
            className="product__img"
          />
        </div>

        <div className="product__info">
          <h1 className="product__title">{product.name}</h1>

          <p className="product__meta">
            {product.category ? <span className="pill">{product.category}</span> : null}
            {product.pack ? <span className="muted">• {product.pack}</span> : null}
          </p>

          <p className="product__price">
            <Price value={product.price ?? null} currency={product.currency ?? "INR"} />
          </p>

          {product.shortDescription ? <p>{product.shortDescription}</p> : null}

          <div className="product__buy">
            <QuantityControl qty={qty} onChange={setQty} />
            <button
              className="btn"
              onClick={() => cart.add(product, qty)}
            >
              Add to cart
            </button>
            <Link className="btn btn--ghost" to="/cart">
              Go to cart
            </Link>
          </div>

          <p className="muted small">
            Note: Product information here is based on the provided catalogue images. For medical
            advice, consult a qualified professional.
          </p>
        </div>
      </div>
    </div>
  );
}
