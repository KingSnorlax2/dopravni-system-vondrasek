import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { UzivatelRole } from "@prisma/client"
import { NextResponse } from "next/server"

/**
 * Extended Session type with role
 */
export interface AuthenticatedSession {
  user: {
    id: string
    email: string
    name: string | null
    role: UzivatelRole
  }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Neautorizovaný přístup") {
    super(message)
    this.name = "AuthenticationError"
  }
}

/**
 * Custom error for authorization failures
 */
export class AuthorizationError extends Error {
  constructor(message: string = "Nemáte oprávnění k této akci") {
    super(message)
    this.name = "AuthorizationError"
  }
}

/**
 * Validates user session and returns it
 * Throws AuthenticationError if user is not logged in
 * 
 * @returns Promise<AuthenticatedSession>
 * @throws AuthenticationError
 * 
 * @example
 * ```typescript
 * const session = await validateUserSession()
 * // session.user.id, session.user.role are now available
 * ```
 */
export async function validateUserSession(): Promise<AuthenticatedSession> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new AuthenticationError("Nejste přihlášeni. Prosím přihlaste se.")
  }

  return session as AuthenticatedSession
}

/**
 * Validates user session and checks if user has required role(s)
 * Throws AuthenticationError if not logged in
 * Throws AuthorizationError if user doesn't have required role
 * 
 * @param allowedRoles - Array of roles that are allowed to access
 * @returns Promise<AuthenticatedSession>
 * @throws AuthenticationError | AuthorizationError
 * 
 * @example
 * ```typescript
 * // Only ADMIN can access
 * const session = await authorizeRole([UzivatelRole.ADMIN])
 * 
 * // ADMIN or DISPECER can access
 * const session = await authorizeRole([UzivatelRole.ADMIN, UzivatelRole.DISPECER])
 * ```
 */
export async function authorizeRole(
  allowedRoles: UzivatelRole[]
): Promise<AuthenticatedSession> {
  const session = await validateUserSession()

  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(
      `Tato akce vyžaduje roli: ${allowedRoles.join(", ")}. Vaše role: ${session.user.role}`
    )
  }

  return session
}

/**
 * Helper to check if user has a specific role
 * Returns false if not authenticated
 * 
 * @param role - Role to check
 * @returns Promise<boolean>
 */
export async function hasRole(role: UzivatelRole): Promise<boolean> {
  try {
    const session = await validateUserSession()
    return session.user.role === role
  } catch {
    return false
  }
}

/**
 * Helper to check if user has any of the specified roles
 * Returns false if not authenticated
 * 
 * @param roles - Array of roles to check
 * @returns Promise<boolean>
 */
export async function hasAnyRole(roles: UzivatelRole[]): Promise<boolean> {
  try {
    const session = await validateUserSession()
    return roles.includes(session.user.role)
  } catch {
    return false
  }
}

/**
 * Creates a NextResponse error for API routes
 * 
 * @param error - Error instance
 * @param statusCode - HTTP status code (default: 401 for auth, 403 for authorization)
 * @returns NextResponse
 */
export function createErrorResponse(
  error: Error,
  statusCode: number = 401
): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  return NextResponse.json(
    { error: error.message || "Interní chyba serveru" },
    { status: statusCode }
  )
}

