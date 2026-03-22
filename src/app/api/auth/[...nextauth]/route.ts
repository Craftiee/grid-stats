/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username.trim().toLowerCase();

        // Extract client IP for per-IP rate limiting
        const forwarded = req?.headers?.['x-forwarded-for'];
        const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null)
          ?? req?.headers?.['x-real-ip']
          ?? 'unknown';

        // Rate limit by username: 10 attempts per 15 minutes
        if (!(await rateLimit(`login:${username}`, 10, 15 * 60 * 1000))) {
          console.warn(`[AUTH] Rate limited login by username: ${username}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Rate limit by IP: 30 attempts per 15 minutes (catches credential spraying)
        if (!(await rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000))) {
          console.warn(`[AUTH] Rate limited login by IP: ${ip}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user || !user.active) {
          console.warn(`[AUTH] Failed login for "${username}" from ${ip} — user not found or inactive`);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          console.warn(`[AUTH] Failed login for "${username}" from ${ip} — invalid password`);
          return null;
        }

        // Update lastLogin
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        console.info(`[AUTH] Successful login for "${username}" from ${ip}`);

        return {
          id: String(user.id),
          name: user.displayName || user.username,
          username: user.username,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // refresh token every 1 hour
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      // Strip email from client-facing session to prevent PII leakage
      delete (session.user as any).email;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
