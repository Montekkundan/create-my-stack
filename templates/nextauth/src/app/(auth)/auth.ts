/* eslint-disable @typescript-eslint/no-explicit-any */
import { compare } from 'bcrypt-ts';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface AuthorizedUser {
  id: string;
  email?: string | null;
  subscriptionType: string;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize(credentials: any) {
        const { email, password } = credentials;
        if (!email || !password) return null;

        const users = await getUser(email);
        if (users.length === 0) return null;
        const user = users[0];

        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, user.password!);
        if (!passwordsMatch) return null;

        const authorizedUser: AuthorizedUser = {
          id: user.id,
          email: user.email,
          subscriptionType: user.subscriptionType,
        };
        return authorizedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authorizedUser = user as AuthorizedUser;
        token.id = authorizedUser.id;
        token.subscriptionType = authorizedUser.subscriptionType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
         (session.user as any).id = token.id as string;
         (session.user as any).subscriptionType = token.subscriptionType as string;
      }
      return session;
    },
  },
});