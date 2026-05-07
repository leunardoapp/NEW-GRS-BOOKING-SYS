import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      phone: string;
      role: 'user' | 'admin';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'user' | 'admin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'user' | 'admin';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        identifier: { label: 'ایمیل یا شماره موبایل', type: 'text' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('لطفا ایمیل/شماره موبایل و رمز عبور را وارد کنید');
        }

        const { identifier, password } = credentials;

        // Find user by email or phone
        const user = await db.query.users.findFirst({
          where: or(
            eq(users.email, identifier.toLowerCase()),
            eq(users.phone, identifier)
          ),
        });

        if (!user) {
          throw new Error('کاربری با این مشخصات یافت نشد');
        }

        if (!user.isActive) {
          throw new Error('حساب کاربری شما غیرفعال شده است');
        }

        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('رمز عبور اشتباه است');
        }

        // Update last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.phone = user.phone;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          phone: token.phone,
          role: token.role,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
