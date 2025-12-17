# Prisma Browser Error Fix

## Problem
```
Error: PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `unknown`).
```

This error occurs when Prisma Client code is accidentally bundled for the browser, which is not allowed since Prisma Client can only run in Node.js environments.

## Root Cause

The import chain was:
1. `UnifiedLayout.tsx` (Client Component) 
2. → `useAccessControl.ts` (Client Hook)
3. → `accessControl.ts` 
4. → `auth.ts` (imported `ROLE_PERMISSIONS`)
5. → `prisma.ts` (server-only)

## Solution

### 1. Installed `server-only` Package
```bash
npm install server-only
```

### 2. Created `src/lib/auth-constants.ts`
- Moved all client-safe constants (`ROLE_PERMISSIONS`, `PERMISSIONS`, `EXAMPLE_ROLE_CONFIG`, `Role` interface) to a separate file
- This file does NOT import Prisma and can be safely used in Client Components

### 3. Updated `src/lib/auth.ts`
- Added `import 'server-only'` at the top
- Removed constants (moved to `auth-constants.ts`)
- Re-exports constants for backward compatibility (but file is server-only)

### 4. Updated `src/lib/accessControl.ts`
- Changed import from `@/lib/auth` to `@/lib/auth-constants`
- Now safe to use in Client Components

### 5. Protected `src/lib/prisma.ts`
- Added `import 'server-only'`
- Added runtime check `typeof window !== 'undefined'`

## File Structure

```
src/lib/
├── prisma.ts          # Server-only (imports Prisma Client)
├── auth.ts            # Server-only (imports prisma, re-exports constants)
├── auth-constants.ts  # Client-safe (no Prisma imports)
└── accessControl.ts   # Client-safe (imports from auth-constants)
```

## How It Works

- **Build Time**: `server-only` package detects if a server-only file is imported in a Client Component and throws an error during build
- **Runtime**: The `typeof window !== 'undefined'` check provides a fallback safety mechanism

## Usage Guidelines

### ✅ Safe to Import in Client Components
- `@/lib/auth-constants` - All constants (ROLE_PERMISSIONS, PERMISSIONS, etc.)
- `@/lib/accessControl` - Access control utilities

### ❌ Never Import in Client Components
- `@/lib/prisma` - Prisma Client (server-only)
- `@/lib/auth` - Auth config with Prisma (server-only)
- `@/lib/auth.config` - NextAuth config (server-only)

### ✅ Safe to Import in Server Components/Actions/API Routes
- All files in `@/lib/` are safe for server use

## Testing

After this fix:
1. The build should complete successfully
2. Client Components can use `useAccessControl` hook without errors
3. If you accidentally import `prisma.ts` or `auth.ts` in a Client Component, you'll get a clear error message
4. The application should run without browser errors

## Migration Notes

- All existing imports of `ROLE_PERMISSIONS` from `@/lib/auth` will continue to work (re-exported)
- However, Client Components should import directly from `@/lib/auth-constants` for clarity
- Server Components/Actions can continue using `@/lib/auth` as before
