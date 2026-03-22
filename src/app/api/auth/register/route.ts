import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per hour
    // Use only the first (client) IP from x-forwarded-for to prevent header spoofing
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    if (!(await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, email, password, confirmPassword } = body;

    // Validate required fields
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Validate username: 3-30 chars, alphanumeric + underscores
    const usernameClean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(usernameClean)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters (letters, numbers, underscores only).' },
        { status: 400 }
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Validate password length (max 128 to prevent bcrypt CPU exhaustion)
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be 8–128 characters.' }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    // Hash password (cost 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — catch unique constraint violations instead of pre-checking
    try {
      const user = await prisma.user.create({
        data: {
          username: usernameClean,
          email: email.trim().toLowerCase(),
          passwordHash,
          displayName: usernameClean,
          role: 'USER',
          active: true,
          emailVerified: false,
        },
      });

      return NextResponse.json(
        { success: true, username: user.username },
        { status: 201 }
      );
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        // Generic message to prevent account enumeration
        return NextResponse.json({ error: 'Username or email is already taken.' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
