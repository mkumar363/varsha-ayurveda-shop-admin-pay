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

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // close menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const isAdmin = useMemo(() => auth.user?.role === "admin", [auth.user?.role]);

  return (
    <div className="app">
      <header className={`header ${menuOpen ? "header--menu-open" : ""}`}>
        <div className="container header__inner">
          <Link to="/" className="brand" onClick={closeMenu} aria-label="Go to home">
            <span className="brand__name">Varsha Ayurveda</span>
            <span className="brand__tag muted">Store</span>
          </Link>

          {/* toggle button */}
          <button
            className="menuBtn"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            ☰
          </button>

          {/* nav */}
          <nav id="main-nav" className="nav" aria-label="Main navigation">
            <Link to="/" className="nav__link" onClick={closeMenu}>
              Products
            </Link>

            <Link to="/cart" className="nav__link" onClick={closeMenu}>
              Cart <span className="badge">{cart.count}</span>
            </Link>

            {auth.user ? (
              <>
                {isAdmin ? (
                  <Link to="/admin" className="nav__link" onClick={closeMenu}>
                    Admin
                  </Link>
                ) : null}

                <span className="nav__text">
                  Hi, <strong>{auth.user.name}</strong>
                </span>

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    auth.logout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav__link" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/signup" className="btn" onClick={closeMenu}>
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
        </div>
      </footer>
    </div>
  );
}
