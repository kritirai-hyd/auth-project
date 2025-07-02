import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    const normalizedRole = role.toLowerCase();

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      role: normalizedRole,
    });

    if (res?.ok) {
      setSuccess("Login successful! Redirecting...");

      const redirectMap = {
        user: "/user/dashboard",
        manager: "/manager/dashboard",
        accountant: "/accountant/dashboard",
      };

      const redirectUrl = redirectMap[normalizedRole] || "/";

      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    } else {
      setError(res?.error || "Invalid credentials or role.");
      setFormData(prev => ({ ...prev, password: "" }));
    }
  } catch (err) {
    setError("Unexpected error occurred. Please try again.");
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
    </div>
  );
}
