import mongoose from "mongoose";
import { connectMongoDB } from "../../../lib/mongodb";
import Order from "../../../models/order";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getRole = (session) => session?.user?.role?.toLowerCase();
const getUsername = (session) => session?.user?.name?.trim();
const allowRoles = (session, roles) => roles.includes(getRole(session));

/** GET: Fetch orders by role */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 100);
    const skip = (page - 1) * limit;

    const role = getRole(session);
    const username = getUsername(session);
    const query = {};

    if (role === "manager") query.status = "pending";
    else if (role === "accountant") query.status = "approved";
    else if (role === "user") query.username = username;
    else return NextResponse.json({ message: "Invalid role" }, { status: 403 });

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      orders,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}

/** POST: Create a new order (user only) */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { username, name, description, price, quantity } = await req.json();

    if (!username || !name || !description || price == null || quantity == null) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const newOrder = await Order.create({
      username: username.trim(),
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      status: "pending",
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({ message: "Creation failed" }, { status: 500 });
  }
}

/** PUT: Update an order (user only, own orders only) */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!isValidObjectId(orderId))
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const updates = await req.json();
    delete updates.status;
    delete updates.approved_by;
    delete updates.approved_at;

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (order.username !== getUsername(session)) {
      return NextResponse.json({ message: "Forbidden: not your order" }, { status: 403 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

/** PATCH: Approve/Reject order (manager only) */
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["manager"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!isValidObjectId(orderId))
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const { status: newStatus } = await req.json();
    if (!["pending", "approved", "rejected"].includes(newStatus)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: newStatus,
        approved_by: session.user.name,
        approved_at: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json({ message: "Status update failed" }, { status: 500 });
  }
}

/** DELETE: Delete order (user only, own orders) */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!isValidObjectId(orderId))
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    if (order.username !== getUsername(session)) {
      return NextResponse.json({ message: "Forbidden: not your order" }, { status: 403 });
    }

    await Order.findByIdAndDelete(orderId);
    return NextResponse.json({ message: "Order deleted" });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
