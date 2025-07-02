import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import validator from "validator";
import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/user";

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

        if (!validator.isEmail(normalizedEmail)) throw new Error("Invalid email.");
        await connectMongoDB();

        const user = await User.findOne({ email: normalizedEmail }).select("+password +role +name");
        if (!user) throw new Error("Invalid credentials.");

        const match = await bcrypt.compare(password, user.password);
        if (!match || user.role.toLowerCase() !== normalizedRole) throw new Error("Invalid credentials.");

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
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("✅ [jwt] user:", user);
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("✅ [session] token:", token);
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/api/auth") || url === "/login") return baseUrl;
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login"
  },

  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
