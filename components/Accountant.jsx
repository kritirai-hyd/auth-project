"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from "next/head";

import "../assets/css/style.css";
import "../assets/css/user.css";

export default function AccountantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role?.toLowerCase();

  // Redirect based on role or if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "accountant") {
      const redirectMap = {
        manager: "/manager/dashboard",
        user: "/user/dashboard",
      };
      router.push(redirectMap[role] || "/login");
    }
  }, [status, role, router]);

  // Fetch approved orders
  const fetchApprovedOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders?page=1&limit=10");
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to fetch orders");

      setOrders(Array.isArray(json.orders) ? json.orders : []);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on load if authenticated
  useEffect(() => {
    if (status === "authenticated" && role === "accountant") {
      fetchApprovedOrders();
    }
  }, [status, role]);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      alert("Failed to sign out. Please try again.");
    }
  };

  // Loading session
  if (status === "loading") return <p>Loading session...</p>;

  // Unauthorized
  if (!session || role !== "accountant") {
    return <p style={{ textAlign: "center" }}>Access denied.</p>;
  }

  return (
    <>
      <Head>
        <title>Accountant Dashboard</title>
      </Head>

      <nav className="navbar">
        <div className="logo">Accountant Dashboard</div>

        <div className="nav">
          <div className="toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </div>

          <div className={`menu ${menuOpen ? "active" : ""}`}>
            <a href="/manager/dashboard"><span>Manager</span></a>
            <a href="/accountant/dashboard"><span>Accountant</span></a>

            <p>
              👤 Name: <strong>{session?.user?.name || "N/A"}</strong>
            </p>

            <button
              onClick={handleSignOut}
              className="btn-delete"
              disabled={loading}
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <h1 style={{ textAlign: "center", padding: "2rem" }}>Approved Orders</h1>

      <section className="products-container" style={{ padding: "1rem 2rem" }}>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        {loading && <p style={{ textAlign: "center" }}>Loading approved orders...</p>}

        {!loading && orders.length === 0 && (
          <p style={{ textAlign: "center" }}>No approved orders found.</p>
        )}

        {!loading &&
          orders.map((item) => (
            <div
              key={item._id}
              className="card"
              style={{ marginBottom: "1.5rem" }}
            >
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>
                Price: <strong>₹{item.price?.toFixed(2)}</strong>
              </p>
              <p>
                Quantity: <strong>{item.quantity}</strong>
              </p>
              <p>
                Status:
                <strong
                  style={{
                    color:
                      item.status === "approved"
                        ? "green"
                        : item.status === "rejected"
                        ? "red"
                        : "#ff7700",
                  }}
                >
                  {" " + item.status}
                </strong>
              </p>
              {item.approved_by?.name && (
                <p>
                  Approved by: <strong>{item.approved_by.name}</strong><br />
                  at:{" "}
                  {item.approved_at &&
                    new Date(item.approved_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
      </section>
    </>
  );
}
