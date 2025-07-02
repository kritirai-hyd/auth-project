import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import validator from "validator";
import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/user";

// List of allowed roles
const allowedRoles = ["user", "manager", "accountant"];

export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, role } = credentials ?? {};

        if (!email || !password || !role) {
          throw new Error("All fields are required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRole = role.trim().toLowerCase();

        if (!validator.isEmail(normalizedEmail)) {
          throw new Error("Invalid email format.");
        }

        if (!allowedRoles.includes(normalizedRole)) {
          throw new Error("Invalid role.");
        }

        await connectMongoDB();

        const user = await User.findOne({ email: normalizedEmail }).select("+password +role +name");

        // Prevent timing attacks by always calling bcrypt
        const passwordHash = user?.password || "$2a$10$invalidhashforconsistency1234567890abcdef";
        const isPasswordValid = await bcrypt.compare(password, passwordHash);

        if (!user || !isPasswordValid || user.role.toLowerCase() !== normalizedRole) {
          throw new Error("Invalid credentials.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Prevent redirects to external URLs
      return url.startsWith(baseUrl) || url === `${baseUrl}/login`
        ? url
        : baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // shows error query param on failure
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Handle both GET and POST for the route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
