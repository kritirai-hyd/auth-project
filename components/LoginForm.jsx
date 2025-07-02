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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

      console.log("signIn response:", res);

      if (res?.ok) {
        setSuccess("Login successful! Redirecting...");
        // Let useSession() handle the redirect in useEffect
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

  // Redirect authenticated users to the correct dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role.toLowerCase();
      const redirectMap = {
        user: "https://auth-project-virid.vercel.app/user/dashboard",
        manager: "https://auth-project-virid.vercel.app/manager/dashboard",
        accountant: "https://auth-project-virid.vercel.app/accountant/dashboard",
      };
      const redirectUrl = redirectMap[role] || "/";
      router.push(redirectUrl);
    }
  }, [session, status, router]);

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

      <div className="login-link">
        Don&apos;t have an account? <a href="/register">Register here</a>
      </div>
    </div>
  );
}
