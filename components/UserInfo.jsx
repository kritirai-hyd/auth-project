"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import "../assets/css/style.css";
import "../assets/css/user.css";

export default function UserInfo() {
  const { data: session, status } = useSession();
  const username = session?.user?.name || "";

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    username,
    name: "",
    description: "",
    price: "",
    quantity: "",
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (status === "authenticated") {
      setForm((prev) => ({ ...prev, username }));
      fetchOrders();
    }
  }, [status, username]);

  useEffect(() => {
    if (editId && firstInputRef.current) firstInputRef.current.focus();
  }, [editId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders");
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const data = contentType.includes("application/json") ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setItems(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      username,
      name: "",
      description: "",
      price: "",
      quantity: "",
    });
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, quantity } = form;

    if (!name || !description || !price || !quantity) {
      alert("All fields are required.");
      return;
    }

    const payload = {
      username,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
    };

    if (isNaN(payload.price) || payload.price < 0) return alert("Invalid price");
    if (isNaN(payload.quantity) || payload.quantity < 1) return alert("Invalid quantity");

    const method = editId ? "PUT" : "POST";
    const endpoint = editId ? `/api/orders?id=${editId}` : "/api/orders";

    if (!editId) {
      // Optimistic UI
      const tempId = "temp-" + Date.now();
      setItems((prev) => [...prev, { ...payload, _id: tempId, status: "pending" }]);
    }

    try {
      setLoading(true);
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const data = contentType.includes("application/json") ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.message || "Failed to submit");

      await fetchOrders();
      resetForm();
    } catch (err) {
      alert(err.message || "Error occurred");
      if (!editId) {
        setItems((prev) => prev.filter((i) => !i._id.startsWith("temp-")));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      username: item.username,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
    });
    setEditId(item._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setItems((prev) => prev.filter((item) => item._id !== id));
      if (editId === id) resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const userItems = items.filter((i) => i.username === username);

  if (status === "loading") return <p>Loading session...</p>;

  if (!session)
    return (
      <main className="user-login-container">
        <p>Please log in to continue.</p>
        <Link href="/login"><div className="btn">Login</div></Link>
      </main>
    );

  return (
    <>
      <nav className="navbar">
        <div className="logo">User Dashboard</div>
        <div className="nav">
          <div className="toggle" onClick={() => setIsOpen(!isOpen)}>☰</div>
          <div className={`menu ${isOpen ? "active" : ""}`}>
            <Link href="/manager/dashboard">Manager</Link>
            <Link href="/accountant/dashboard">Accountant</Link>
            <p>👤 <strong>{session.user.name}</strong></p>
            <button onClick={() => signOut()} className="btn-delete" disabled={loading}>Log Out</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="user-container">
          <form onSubmit={handleSubmit} className="user-info-form">
            <h2>{editId ? "Edit Product" : "Add Product"}</h2>

            {["name", "description", "price", "quantity"].map((field) => (
              <input
                key={field}
                name={field}
                type={["price", "quantity"].includes(field) ? "number" : "text"}
                ref={field === "name" ? firstInputRef : null}
                value={form[field]}
                onChange={handleChange}
                placeholder={field[0].toUpperCase() + field.slice(1)}
                required
                min={field === "price" ? "0" : field === "quantity" ? "1" : undefined}
                step={field === "price" ? "0.01" : "1"}
                className="user-info-input"
              />
            ))}

            <div className="actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {editId ? "Update" : "Add"}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="btn-cancel" disabled={loading}>
                  Cancel
                </button>
              )}
            </div>

            {error && <p className="error" role="alert">{error}</p>}
            {loading && <p>Loading...</p>}
          </form>
        </div>

        <section className="products-container">
          {userItems.length === 0 && !loading && <p>No products found.</p>}

          {userItems.map((item) => (
            <div key={item._id} className="card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Price: ₹{item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Status: <strong style={{
                color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "#ff7700"
              }}>{item.status}</strong></p>
              {item.approved_by && (
                <p>
                  Approved by: <strong>{item.approved_by}</strong><br />
                  at: {item.approved_at && new Date(item.approved_at).toLocaleString()}
                </p>
              )}
              {item.status === "pending" && (
                <div className="actions">
                  <button onClick={() => handleEdit(item)} className="btn-edit" disabled={loading}>Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="btn-delete" disabled={loading}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
