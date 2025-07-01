"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../assets/css/style.css";
import "../assets/css/user.css";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

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
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: role.toLowerCase(),
      });

      if (res?.ok) {
        setSuccess("Login successful! Redirecting...");
        // Redirect based on role
        const redirectMap = {
          user: "/user/dashboard",
          manager: "/manager/dashboard",
          accountant: "/accountant/dashboard",
        };
        setTimeout(() => {
          router.push(redirectMap[role.toLowerCase()] || "/");
        }, 1000);
      } else {
        setError(res?.error || "Login failed. Check your credentials.");
        setFormData(prev => ({ ...prev, password: "" }));
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
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
        >
          <option value="">-- Select Role --</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="accountant">Accountant</option>
        </select>

        {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: "0.5rem" }}>{success}</p>}

        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Don't have an account? <Link href="/register">Register here</Link>
      </p>
    </div>
  );
}
