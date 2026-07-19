import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    university?: string | null;
  }
  interface Session {
    user: {
      id: string;
      university?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    university?: string | null;
  }
}
