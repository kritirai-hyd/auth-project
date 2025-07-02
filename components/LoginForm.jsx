"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import "../assets/css/style.css";
import "../assets/css/user.css";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, role } = formData;

    if (!email || !password || !role) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Call next-auth signIn with credentials provider
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: role.toLowerCase(),
      });

      if (res?.ok) {
        setSuccess("Login successful! Redirecting...");
        // Redirect is handled in useEffect when session updates
      } else {
        setError(res?.error || "Invalid credentials or role.");
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect authenticated users based on role
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role.toLowerCase();
      const redirectMap = {
        user: "/user/dashboard",
        manager: "/manager/dashboard",
        accountant: "/accountant/dashboard",
      };
      router.push(redirectMap[role] || "/");
    }
  }, [session, status, router]);

  return (
    <div className="login-container" role="main">
      <h2>Login</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          aria-describedby="emailHelp"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Your password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          aria-required="true"
        >
          <option value="">-- Select Role --</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="accountant">Accountant</option>
        </select>

        {error && (
          <p
            style={{ color: "red", marginTop: "0.5rem" }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{ color: "green", marginTop: "0.5rem" }}
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="login-link" style={{ marginTop: "1rem" }}>
        Don&apos;t have an account? <a href="/register">Register here</a>
      </div>
    </div>
  );
}
