import { Link } from "react-router-dom";
import type { Product } from "../types";
import { Price } from "./Price";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card__media" aria-label={product.name}>
        <img
          src={product.image || "/vite.svg"}
          alt={product.name}
          loading="lazy"
          className="card__img"
        />
      </Link>

      <div className="card__body">
        <div className="card__titleRow">
          <h3 className="card__title">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <div className="card__price">
            <Price value={product.price ?? null} currency={product.currency ?? "INR"} />
          </div>
        </div>

        <p className="card__meta">
          {product.category ? <span className="pill">{product.category}</span> : null}
          {product.pack ? <span className="muted">• {product.pack}</span> : null}
        </p>

        {product.shortDescription ? (
          <p className="card__desc">{product.shortDescription}</p>
        ) : null}

        <div className="card__actions">
          <Link className="btn btn--ghost" to={`/product/${product.id}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
