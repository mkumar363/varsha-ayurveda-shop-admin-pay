import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { Price } from "../components/Price";
import { QuantityControl } from "../components/QuantityControl";

export function CartPage() {
  const cart = useCart();
  const nav = useNavigate();

  const hasAnyPrice = cart.items.some((i) => typeof i.product.price === "number");
  const canComputeTotal = cart.items.every((i) => typeof i.product.price === "number");

  const total = canComputeTotal
    ? cart.items.reduce((sum, i) => sum + (i.product.price || 0) * i.qty, 0)
    : null;

  return (
    <div className="container">
      <h1>Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="empty">
          <p className="muted">Your cart is empty.</p>
          <Link className="btn" to="/">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="cart">
            {cart.items.map((item) => (
              <div className="cart__row" key={item.product.id}>
                <img
                  src={item.product.image || "/vite.svg"}
                  alt={item.product.name}
                  className="cart__img"
                />
                <div className="cart__info">
                  <Link to={`/product/${item.product.id}`} className="cart__title">
                    {item.product.name}
                  </Link>
                  <div className="muted small">
                    {item.product.pack || ""} {item.product.category ? `• ${item.product.category}` : ""}
                  </div>

                  <div className="cart__controls">
                    <QuantityControl
                      qty={item.qty}
                      onChange={(next) => cart.setQty(item.product.id, next)}
                    />
                    <button
                      className="btn btn--ghost"
                      onClick={() => cart.remove(item.product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart__price">
                  <Price value={item.product.price ?? null} currency={item.product.currency ?? "INR"} />
                </div>
              </div>
            ))}
          </div>

          <div className="cart__summary">
            <div>
              <strong>Total</strong>
              <div className="muted small">
                {canComputeTotal
                  ? "All items priced"
                  : hasAnyPrice
                    ? "Some items have no price (total not computed)"
                    : "Prices not provided"}
              </div>
            </div>
            <div className="cart__total">
              <Price value={total} currency="INR" />
            </div>
          </div>

          <div className="cart__actions">
            <Link className="btn btn--ghost" to="/">
              Continue shopping
            </Link>
            <button className="btn" onClick={() => nav("/checkout")}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
