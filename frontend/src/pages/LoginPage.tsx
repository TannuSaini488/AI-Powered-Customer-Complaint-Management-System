import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../hooks/redux";
import { login } from "../features/auth/authSlice";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("QA Reviewer");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userName.trim() || !password.trim()) {
      setError("User name and password are required for mock sign-in.");
      return;
    }
    dispatch(login(userName.trim()));
    navigate("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-panel auth-panel">
        <p className="eyebrow">Pharmaceutical QMS</p>
        <h1>Customer Complaint Management</h1>
        <p className="muted">Mock QA sign-in for API and FDF complaint intake workflows.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            User Name
            <input value={userName} onChange={(event) => setUserName(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit">Sign In</button>
        </form>
      </section>
    </main>
  );
}
