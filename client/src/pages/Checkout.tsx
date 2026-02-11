import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder, razorpayCreateOrder, razorpayVerifyPayment } from "../api";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { Price } from "../components/Price";

export function CheckoutPage() {
  const cart = useCart();
  const auth = useAuth();
  const nav = useNavigate();

  const canComputeTotal = cart.items.every((i) => typeof i.product.price === "number");
  const total = canComputeTotal
    ? cart.items.reduce((sum, i) => sum + (i.product.price || 0) * i.qty, 0)
    : null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");

  useEffect(() => {
    if (!auth.user) return;
    setName((prev) => prev || auth.user!.name);
    setEmail((prev) => prev || auth.user!.email);
  }, [auth.user]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const itemsInput = useMemo(
    () => cart.items.map((i) => ({ productId: i.product.id, qty: i.qty })),
    [cart.items]
  );

  async function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const existing = document.getElementById("razorpay-checkout-js");
      if (existing) return resolve(true);

      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMethod === "COD") {
        const order = await createOrder({
          customer: { name, phone, email, address },
          items: itemsInput,
          paymentMethod: "COD",
        });
        cart.clear();
        nav(`/order/${order.id}`);
        return;
      }

      // Razorpay
      if (!canComputeTotal || typeof total !== "number") {
        setError("Online payment needs prices for all items. Please add prices (admin) or choose Cash on Delivery.");
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        setError("Failed to load payment gateway. Please try again.");
        return;
      }

      const created = await razorpayCreateOrder({
        customer: { name, phone, email, address },
        items: itemsInput,
      });

      const options: any = {
        key: created.razorpay.keyId,
        amount: created.razorpay.amount,
        currency: created.razorpay.currency,
        name: "Varsha Ayurveda",
        description: "Secure payment",
        order_id: created.razorpay.orderId,
        prefill: {
          name,
          email,
          contact: phone,
        },
        notes: {
          internalOrderId: created.orderId,
        },
        handler: async function (response: any) {
          try {
            const verified = await razorpayVerifyPayment({
              orderId: created.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            cart.clear();
            nav(`/order/${verified.order.id}`);
          } catch (err: any) {
            setError(err?.message || "Payment verification failed");
          }
        },
      };

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        setError("Payment gateway is not available in this browser.");
        return;
      }

      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (e: any) {
      setError(e?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1>Checkout</h1>

      <div className="checkout">
        <form className="panel" onSubmit={onSubmit}>
          <h2>Customer details</h2>

          {!auth.user ? (
            <p className="muted small">
              Have an account? <Link to="/login">Login</Link> to save your order under your profile.
            </p>
          ) : null}

          <label className="label">
            Full name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="label">
            Phone
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>

          <label className="label">
            Email (optional)
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>

          <label className="label">
            Address
            <textarea className="input" value={address} onChange={(e) => setAddress(e.target.value)} required rows={4} />
          </label>

          <h2>Payment</h2>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <label className="muted" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              Cash on Delivery (COD)
            </label>
            <label className="muted" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "RAZORPAY"}
                onChange={() => setPaymentMethod("RAZORPAY")}
                disabled={!canComputeTotal}
              />
              Pay Online (Razorpay)
              {!canComputeTotal ? <span className="muted small">(needs prices)</span> : null}
            </label>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting
              ? (paymentMethod === "COD" ? "Placing order…" : "Opening payment…")
              : (paymentMethod === "COD" ? "Place order" : "Pay now")}
          </button>

          <p className="muted small" style={{ marginTop: 10 }}>
            Online payments are handled using Razorpay Standard Checkout. COD orders are stored in the local JSON DB.
          </p>
        </form>

        <aside className="panel">
          <h2>Order summary</h2>
          {cart.items.length === 0 ? (
            <p className="muted">No items.</p>
          ) : (
            <ul className="summary">
              {cart.items.map((i) => (
                <li key={i.product.id} className="summary__row">
                  <div>
                    <div><strong>{i.product.name}</strong> <span className="muted">× {i.qty}</span></div>
                    <div className="muted small">{i.product.pack}</div>
                  </div>
                  <div>
                    <Price value={i.product.price ?? null} currency={i.product.currency ?? "INR"} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <hr />

          <div className="summary__total">
            <strong>Total</strong>
            <Price value={total} currency="INR" />
          </div>
          {!canComputeTotal ? (
            <p className="muted small">
              Some items have “Price on request”, so the total may not be computed.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
