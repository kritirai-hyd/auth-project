import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import validator from "validator";
import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/user";

const allowedRoles = ["user", "manager", "accountant"]; // ✅ strict role validation
const BASE_URL = process.env.NEXTAUTH_URL || "https://auth-project-virid.vercel.app";

export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(creds) {
        const { email, password, role } = creds ?? {};
        if (!email || !password || !role) throw new Error("All fields are required.");

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRole = role.trim().toLowerCase();

        if (!validator.isEmail(normalizedEmail)) throw new Error("Invalid email format.");
        if (!allowedRoles.includes(normalizedRole)) throw new Error("Invalid role.");

        await connectMongoDB();

        const user = await User.findOne({ email: normalizedEmail }).select("+password +role +name");

        // Always return generic error to prevent enumeration
        if (!user) throw new Error("Invalid credentials.");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid || user.role.toLowerCase() !== normalizedRole) {
          throw new Error("Invalid credentials.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
        };
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist user data in token after login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach custom user data to session
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Prevent redirecting to external sites
      if (url.startsWith(`${BASE_URL}/api/auth`) || url === `${BASE_URL}/login`) return baseUrl;
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },

  pages: {
    signIn: `${BASE_URL}/login`,
    error: `${BASE_URL}/login`, // Will pass ?error= code
  },

  secret: process.env.NEXTAUTH_SECRET
};

// Handler for both GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
