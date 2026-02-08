/**
 * SignUp.jsx
 *
 * Self-contained sign-up form component for the Vantage website.
 * Renders a centered card with name, email, password, and confirm
 * password fields, a submit button with loading state, inline
 * validation, and a link back to the Login page.
 *
 * Uses CSS Modules for scoped styling and the global design
 * tokens from global.css for consistency with the Login form
 * and the rest of the marketing site.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../styles/SignUp.module.css";

/* ── Simple email regex for client-side validation ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * validate — Runs basic field-level validation on the sign-up form.
 *
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} values - Current form values
 * @returns {{ name: string, email: string, password: string, confirmPassword: string }} Error messages (empty string = valid)
 */
function validate(values) {
  const errors = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  if (!values.name.trim()) {
    errors.name = "Name is required";
  } else if (values.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

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

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

/**
 * SignUp — Card-based sign-up form with name, email, password,
 * confirm password, show/hide password toggle, loading state,
 * and inline validation.
 *
 * @returns {JSX.Element} The sign-up form UI
 */
export default function SignUp() {
  /* ── Form state ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ── UI state ── */
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  /**
   * handleBlur — Marks a field as "touched" so its error message
   * is displayed. Runs validation on the current values.
   *
   * @param {"name" | "email" | "password" | "confirmPassword"} field - The field that lost focus
   */
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(
      validate({ name, email, password, confirmPassword })
    );
  };

  /**
   * handleSubmit — Validates inputs and, if valid, simulates an
   * async sign-up request. Replace the setTimeout with a real API
   * call when the backend auth endpoint is ready.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors = validate({
      name,
      email,
      password,
      confirmPassword,
    });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((msg) => msg !== "");
    if (hasErrors) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: "student",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          email: data.error || "Sign up failed",
        }));
        return;
      }

      if (data.token) {
        localStorage.setItem("vantage_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("vantage_user", JSON.stringify(data.user));
      }

      window.location.href = "/";
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        email: "Unable to connect. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        {/* ── Brand Mark ── */}
        <div className={styles.brandMark} aria-hidden="true">
          V
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Join Vantage to get started
          </p>
        </div>

        {/* ── Form ── */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* ── Name Field ── */}
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>
              Full name
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-name"
                type="text"
                className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ""}`}
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                aria-invalid={touched.name && !!errors.name}
                aria-describedby={
                  touched.name && errors.name ? "signup-name-error" : undefined
                }
              />
            </div>
            <span
              id="signup-name-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.name ? errors.name : ""}
            </span>
          </div>

          {/* ── Email Field ── */}
          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-email"
                type="email"
                className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={
                  touched.email && errors.email ? "signup-email-error" : undefined
                }
              />
            </div>
            <span
              id="signup-email-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.email ? errors.email : ""}
            </span>
          </div>

          {/* ── Password Field ── */}
          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className={`${styles.input} ${styles.inputWithToggle} ${touched.password && errors.password ? styles.inputError : ""}`}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={
                  touched.password && errors.password
                    ? "signup-password-error"
                    : undefined
                }
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <FiEyeOff size={16} />
                ) : (
                  <FiEye size={16} />
                )}
              </button>
            </div>
            <span
              id="signup-password-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.password ? errors.password : ""}
            </span>
          </div>

          {/* ── Confirm Password Field ── */}
          <div className={styles.field}>
            <label htmlFor="signup-confirm" className={styles.label}>
              Confirm password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-confirm"
                type={showConfirmPassword ? "text" : "password"}
                className={`${styles.input} ${styles.inputWithToggle} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ""}`}
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                aria-invalid={
                  touched.confirmPassword && !!errors.confirmPassword
                }
                aria-describedby={
                  touched.confirmPassword && errors.confirmPassword
                    ? "signup-confirm-error"
                    : undefined
                }
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <FiEyeOff size={16} />
                ) : (
                  <FiEye size={16} />
                )}
              </button>
            </div>
            <span
              id="signup-confirm-error"
              className={styles.errorMsg}
              role="alert"
            >
              {touched.confirmPassword ? errors.confirmPassword : ""}
            </span>
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        {/* ── Separator ── */}
        <div className={styles.divider} />

        {/* ── Login Prompt ── */}
        <p className={styles.loginPrompt}>
          Already have an account?{" "}
          <Link to="/login" className={styles.loginLink}>
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
