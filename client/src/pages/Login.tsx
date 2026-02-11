import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await auth.login(email, password);
      nav(from);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    }
  }

  return (
    <div className="container">
      <div className="panel auth">
        <h1>Login</h1>
        <p className="muted">
          Don’t have an account? <Link to="/signup">Create one</Link>.
        </p>

        <form onSubmit={onSubmit} className="auth__form">
          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn" type="submit" disabled={auth.loading}>
            {auth.loading ? "Please wait…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
