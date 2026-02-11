import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container">
      <h1>404</h1>
      <p className="muted">Page not found.</p>
      <Link className="btn" to="/">Go home</Link>
    </div>
  );
}
