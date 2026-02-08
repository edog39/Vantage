/**
 * Login.jsx
 *
 * Self-contained login form component for the Vantage website.
 * Renders a centered card with email and password fields, a
 * submit button with loading state, inline validation, and
 * links to "Forgot password" and "Sign up".
 *
 * Uses CSS Modules for scoped styling and the global design
 * tokens defined in global.css for visual consistency with the
 * rest of the marketing site.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../styles/Login.module.css";

/* ── Simple email regex for client-side validation ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * validate — Runs basic field-level validation on the login form.
 *
 * @param {{ email: string, password: string }} values - Current form values
 * @returns {{ email: string, password: string }} Error messages (empty string = valid)
 */
function validate(values) {
  const errors = { email: "", password: "" };

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
}

/**
 * Login — Card-based login form with email/password fields,
 * show/hide password toggle, loading state, and inline validation.
 *
 * @returns {JSX.Element} The login form UI
 */
export default function Login() {
  /* ── Form state ── */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ── UI state ── */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  /**
   * handleBlur — Marks a field as "touched" so its error message
   * is displayed. Runs validation on the current values.
   *
   * @param {"email" | "password"} field - The field that lost focus
   */
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate({ email, password }));
  };

  /**
   * handleSubmit — Validates inputs and, if valid, simulates an
   * async login request. Replace the setTimeout with a real API
   * call when the backend auth endpoint is ready.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /* Mark all fields as touched so errors show immediately */
    setTouched({ email: true, password: true });

    const newErrors = validate({ email, password });
    setErrors(newErrors);

    /* Bail out if any field has an error */
    const hasErrors = Object.values(newErrors).some((msg) => msg !== "");
    if (hasErrors) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          email: data.error || "Login failed",
          password: "",
        }));
        return;
      }

      /* Store token and user for subsequent authenticated requests */
      if (data.token) {
        localStorage.setItem("vantage_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("vantage_user", JSON.stringify(data.user));
      }

      /* Redirect to home or dashboard once routing supports it */
      window.location.href = "/";
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        email: "Unable to connect. Please try again.",
        password: "",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.card}>

        {/* ── Brand Mark ── */}
        <div className={styles.brandMark} aria-hidden="true">V</div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in to your Vantage account
          </p>
        </div>

        {/* ── Form ── */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* ── Email Field ── */}
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="login-email"
                type="email"
                className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={touched.email && errors.email ? "login-email-error" : undefined}
              />
            </div>
            <span
              id="login-email-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.email ? errors.email : ""}
            </span>
          </div>

          {/* ── Password Field ── */}
          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`${styles.input} ${styles.inputWithToggle} ${touched.password && errors.password ? styles.inputError : ""}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={touched.password && errors.password ? "login-password-error" : undefined}
              />

              {/* Show / Hide password toggle */}
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <span
              id="login-password-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.password ? errors.password : ""}
            </span>
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <span className={styles.spinner} aria-hidden="true" />}
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>

        {/* ── Forgot Password Link ── */}
        <Link to="#" className={styles.forgot}>
          Forgot password?
        </Link>

        {/* ── Separator ── */}
        <div className={styles.divider} />

        {/* ── Sign Up Prompt ── */}
        <p className={styles.signupPrompt}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className={styles.signupLink}>
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}
