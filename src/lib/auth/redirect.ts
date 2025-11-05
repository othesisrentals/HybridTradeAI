import { UserRole } from '@prisma/client'

/**
 * Get the appropriate redirect path based on user role
 * @param role - User role (ADMIN, SUPER_ADMIN, or USER)
 * @returns Path to redirect to
 */
export function getRedirectPath(role: string | undefined): string {
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    return '/admin'
  }
  return '/dashboard'
}
