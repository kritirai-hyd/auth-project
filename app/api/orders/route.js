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


const handleError = (label, err) => {
  console.error(`${label} error:`, err.message);
  console.error(err.stack);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
};

// ✅ PATCH — Approve / Reject by Manager
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role.toLowerCase() !== "manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!isValidObjectId(orderId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const { status: newStatus } = await req.json();

    if (!["pending", "approved", "rejected"].includes(newStatus)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: newStatus,
        approved_by: newStatus === "approved" ? session.user.id : null,
        approved_at: newStatus === "approved" ? new Date() : null,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ================= GET: List Orders =================
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
    return handleError("GET", err);
  }
}

// ================= POST: Create Order =================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();
    const body = await req.json();
    const { username, name, description, price, quantity } = body;

    if (!username || !name || !description || price == null || quantity == null) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
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
    return handleError("POST", err);
  }
}

// ================= PUT: Update Own Order =================
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!isValidObjectId(orderId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const updates = await req.json();
    delete updates.status;
    delete updates.approved_by;
    delete updates.approved_at;

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    if (order.username !== getUsername(session)) {
      return NextResponse.json({ message: "Forbidden: Not your order" }, { status: 403 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    return handleError("PUT", err);
  }
}


// ================= DELETE: Delete Own Order =================
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!allowRoles(session, ["user"]))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!isValidObjectId(orderId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    if (order.username !== getUsername(session)) {
      return NextResponse.json({ message: "Forbidden: Not your order" }, { status: 403 });
    }

    await Order.findByIdAndDelete(orderId);
    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (err) {
    return handleError("DELETE", err);
  }
}
