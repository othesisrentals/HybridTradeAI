import { getServerSession } from "next-auth";

import { authOptions } from "./options";

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  name?: string | null;
  image?: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const { id, email, role, name, image } = session.user as CurrentUser;

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    role: role ?? "USER",
    name,
    image,
  };
}
