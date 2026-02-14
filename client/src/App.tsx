// client/src/App.tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "./cart/CartContext";
import { useAuth } from "./auth/AuthContext";
import "./App.css";
export default function App() {
  const cart = useCart();
  const auth = useAuth();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  // close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user?.role]);

  return (
    <div className="app">
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="brand" aria-label="Go to home">
            <span className="brand__name">Varsha Ayurveda</span>
            <span className="brand__tag muted">Store</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="menuBtn"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          {/* Nav */}
          <nav className={`nav ${menuOpen ? "nav--open" : ""}`} aria-label="Main navigation">
            <Link to="/" className="nav__link">
              Products
            </Link>

            <Link to="/cart" className="nav__link">
              Cart <span className="badge">{cart.count}</span>
            </Link>

            {auth.user ? (
              <>
                {/* Admin link */}
                {isAdmin ? (
                  <Link to="/admin" className="nav__link">
                    Admin
                  </Link>
                ) : null}

                {/* User display */}
                <span className="nav__text">
                  Hi, <strong>{auth.user.name}</strong>
                </span>

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => auth.logout()}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav__link">
                  Login
                </Link>
                <Link to="/signup" className="btn">
                  Sign up
                </Link>
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
            Mfg. For: <strong>Varsha Ayurveda</strong> — 35-A, Parash Nagar Bearasiya Road,
            Bhopal - 462038
          </div>
          <div className="muted small">Demo e-commerce site built with React + Vite.</div>
        </div>
      </footer>
    </div>
  );
}
