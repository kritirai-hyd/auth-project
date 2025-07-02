"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import "../assets/css/style.css";
import "../assets/css/user.css";

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // Track order updating status

  // Redirect if not authenticated or not manager
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const role = session?.user?.role?.toLowerCase();
      if (role !== "manager") {
        const redirectMap = {
          accountant: "/accountant/dashboard",
          user: "/user/dashboard",
        };
        router.push(redirectMap[role] || "/login");
      }
    }
  }, [status, session, router]);

  // Fetch orders when authenticated as manager
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role?.toLowerCase() === "manager") {
      fetchOrders();
    }
  }, [status, session]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders?page=1&limit=10");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load orders");

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const confirmed = confirm(`Are you sure you want to ${newStatus} this order?`);
    if (!confirmed) return;

    setUpdatingOrderId(id);
    setError("");

    try {
      const res = await fetch(`/api/orders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      await fetchOrders(); // refresh orders after update
    } catch (err) {
      setError(err.message || "Error updating order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (status === "loading") {
    return <p className="loading-message">Checking session...</p>;
  }

  if (!session || session?.user?.role?.toLowerCase() !== "manager") {
    return <p className="error-message">Access denied.</p>;
  }

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="logo">Manager Dashboard</div>
        <div className="nav">
          <button
            className="toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="menu"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div id="menu" className={`menu ${menuOpen ? "active" : ""}`}>
            <Link href="/manager/dashboard">Manager</Link>
            <Link href="/accountant/dashboard">Accountant</Link>
            <p>
              👤 <strong>{session.user.name}</strong>
            </p>
            <button className="btn-delete" onClick={() => signOut()} disabled={loading}>
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <h1 style={{ textAlign: "center", padding: "2rem 0" }}>Pending Orders</h1>

      <main className="products-container" style={{ padding: "2rem" }}>
        {error && <p className="error-message" role="alert">{error}</p>}

        {loading ? (
          <p className="loading-message">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: "center" }}>No pending orders.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card" style={{ marginBottom: "1rem" }}>
              <h3>{order.name}</h3>
              <p>{order.description}</p>
              <p>
                Price: ₹{order.price} × Qty: {order.quantity}
              </p>
              <p>
                Requested by: <strong>{order.username}</strong>
              </p>
              <p>
                Status: <strong>{order.status}</strong>
              </p>

              {order.status === "approved" && order.approved_by?.name && (
                <p>
                  ✅ Approved by: <strong>{order.approved_by.name}</strong>
                  <br />
                  at: {order.approved_at ? new Date(order.approved_at).toLocaleString() : "N/A"}
                </p>
              )}

              {order.status === "pending" && (
                <div className="actions" style={{ marginTop: ".5rem" }}>
                  <button
                    onClick={() => handleStatusUpdate(order._id, "approved")}
                    className="btn-approve"
                    disabled={updatingOrderId === order._id}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order._id, "rejected")}
                    className="btn-reject"
                    disabled={updatingOrderId === order._id}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </>
  );
}
