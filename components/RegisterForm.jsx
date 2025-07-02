"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

import "../assets/css/style.css";
import "../assets/css/user.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const password = formData.password;
    const role = formData.role;

    if (!name || !email || !phone || !password || !role) {
      setMessage({ text: "Please fill in all fields.", type: "error" });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage({ text: "Phone number must be 10 digits.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/register", { name, email, phone, password, role });
      setMessage({ text: "Registration successful! Redirecting to login...", type: "success" });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Registration failed. Please try again.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} noValidate disabled={loading}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          required
          disabled={loading}
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
          disabled={loading}
        />

        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          pattern="[0-9]{10}"
          autoComplete="tel"
          required
          disabled={loading}
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          minLength={6}
          autoComplete="new-password"
          required
          disabled={loading}
        />

        <label htmlFor="role">Role</label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">-- Select Role --</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="accountant">Accountant</option>
        </select>

        {message.text && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            style={{ color: message.type === "error" ? "red" : "green", marginTop: "0.5rem" }}
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="login-link" style={{ marginTop: "1rem" }}>
        Already have an account? <Link href="/login">Login here</Link>
      </div>
    </div>
  );
}
