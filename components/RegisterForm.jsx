"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

    const { name, email, phone, password, role } = formData;
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
      const res = await axios.post("https://auth-project-virid.vercel.app/api/register", formData);
      setMessage({ text: "Registration successful! Redirecting to login...", type: "success" });

      setTimeout(() => {
        router.push("https://auth-project-virid.vercel.app/login");
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
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Name</label>
        <input
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          pattern="[0-9]{10}"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        <label htmlFor="role">Role</label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Role --</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="accountant">Accountant</option>
        </select>

        {message.text && (
          <p style={{ color: message.type === "error" ? "red" : "green", marginTop: "0.5rem" }}>
            {message.text}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="login-link" style={{ marginTop: "1rem" }}>
        Already have an account?{" "}
        <a href="https://auth-project-virid.vercel.app/login">Login here</a>
      </div>
    </div>
  );
}
