import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { UserRole } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Forbidden: Super Admin access required');
  }
  
  return user;
}

export async function checkRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return user;
}
