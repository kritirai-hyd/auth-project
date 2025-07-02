// pages/api/register.js

import { connectMongoDB } from "../../../lib/mongodb";
import User from "../../../models/user";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body;

    // Basic validation
    if (!name || !email || !phone || !password || !role) {
      return new Response(JSON.stringify({ error: "All fields are required." }), { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedRole = role.trim().toLowerCase();

    if (!/^\d{10,15}$/.test(trimmedPhone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number format." }), { status: 400 });
    }

    await connectMongoDB();

    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return new Response(JSON.stringify({ error: "Email already registered." }), { status: 400 });
    }

    const existingPhone = await User.findOne({ phone: trimmedPhone });
    if (existingPhone) {
      return new Response(JSON.stringify({ error: "Phone number already registered." }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
      role: trimmedRole,
    });

    await newUser.save();

    return new Response(JSON.stringify({ message: "User registered successfully." }), { status: 201 });

  } catch (error) {
    console.error("Error registering user:", error);
    return new Response(JSON.stringify({ error: "Registration failed. Please try again later." }), {
      status: 500,
    });
  }
}
