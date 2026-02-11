import { Link, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "./cart/CartContext";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const cart = useCart();
  const auth = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    await auth.logout();
    nav("/");
  }


  return (
    <div className="app">
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="brand">
            <span className="brand__name">Varsha Ayurveda</span>
            <span className="brand__tag muted">Store</span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav__link">Products</Link>
            <Link to="/cart" className="nav__link">
              Cart <span className="badge">{cart.count}</span>
            </Link>

            {auth.user ? (
              <>
                <Link to="/my-orders" className="nav__link">My Orders</Link>
                {auth.user.role === "admin" ? (
                  <Link to="/admin" className="nav__link">Admin</Link>
                ) : null}
                <span className="nav__user muted small">Hi, {auth.user.name}</span>
                <button type="button" className="nav__link nav__btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav__link">Login</Link>
                <Link to="/signup" className="nav__link">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="muted small">
            Mfg. For: <strong>Varsha Ayurveda</strong> — 35-A, Parash Nagar Bearasiya Road, Bhopal - 462038
          </div>
        </div>
      </footer>
    </div>
  );
}
