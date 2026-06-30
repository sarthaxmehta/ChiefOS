import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLandingPage = nextUrl.pathname === '/';
      const isAuthRoute = nextUrl.pathname.startsWith('/api/auth');

      if (isOnLandingPage || isAuthRoute) {
        return true;
      }

      if (isLoggedIn) {
        return true;
      }

      // Redirect unauthenticated users to the landing page
      return Response.redirect(new URL('/', nextUrl));
    },
  },
})
