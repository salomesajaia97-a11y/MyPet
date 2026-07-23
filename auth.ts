import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { verifyPassword } from "@/lib/utils/crypto";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["state"],
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Coerce to string BEFORE querying — a raw object like {$ne:null} would
        // be a NoSQL operator injection. Lowercase to match the stored (also
        // lowercased) email so mixed-case logins succeed.
        if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
          return null;
        }
        const email = credentials.email.toLowerCase();
        await connectDB();
        const user = await UserModel.findOne({ email });
        if (!user || !user.passwordHash) return null;
        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existing = await UserModel.findOne({ email: user.email });
          if (!existing) {
            await UserModel.create({
              name: user.name ?? user.email,
              email: user.email,
              passwordHash: "",
            });
          }
        } catch (err) {
          console.error("Google signIn DB error:", err);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        try {
          await connectDB();
          const dbUser = await UserModel.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role ?? "user";
          } else if (account?.provider !== "google") {
            token.id = user.id;
            token.role = "user";
          }
        } catch (err) {
          console.error("JWT DB error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        const u = session.user as typeof session.user & { id: string; role: string };
        u.id = token.id as string;
        u.role = (token.role as "user" | "admin") ?? "user";
      }
      return session;
    },
  },
});
