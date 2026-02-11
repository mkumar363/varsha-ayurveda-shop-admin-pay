import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function SignupPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await auth.signup(name, email, password);
      nav(from);
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    }
  }

  return (
    <div className="container">
      <div className="panel auth">
        <h1>Sign up</h1>
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>.
        </p>

        <form onSubmit={onSubmit} className="auth__form">
          <label className="label">
            Full name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

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
            Password (min 6 characters)
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
            />
          </label>

          <label className="label">
            Confirm password
            <input
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              minLength={6}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn" type="submit" disabled={auth.loading}>
            {auth.loading ? "Please wait…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
