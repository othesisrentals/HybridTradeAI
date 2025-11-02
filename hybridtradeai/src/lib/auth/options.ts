import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};

// TODO: Configure providers, callbacks, and database/session adapters.
