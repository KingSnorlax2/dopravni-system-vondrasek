# Feature-Based Architecture Refactoring Summary

## Overview
This document summarizes the refactoring of the Fleet Management System to use a Feature-Based Architecture with Prisma Extensions for Soft Delete and Type-Safe Server Actions.

## Changes Implemented

### 1. Prisma Extensions for Soft Delete (`src/lib/prisma.ts`)

**What Changed:**
- Created extended Prisma Client (`db`) with automatic soft delete handling
- Base client (`prisma`) remains available for hard deletes and special cases

**How It Works:**
- **`findMany()`, `findFirst()`, `findUnique()`**: Automatically filter `aktivni: true` unless explicitly requesting inactive records
- **`delete()`**: Converts to `update({ aktivni: false })` for models with `aktivni` field
- **`deleteMany()`**: Converts to `updateMany({ aktivni: false })` for models with `aktivni` field

**Usage:**
```typescript
// Automatically filters active records
const vehicles = await db.auto.findMany()

// To get inactive records, explicitly request them
const inactiveVehicles = await db.auto.findMany({ where: { aktivni: false } })

// Soft delete (automatic)
await db.auto.delete({ where: { id: 1 } }) // Sets aktivni: false

// Hard delete (use base client)
await prisma.auto.delete({ where: { id: 1 } }) // Actual delete
```

**Models with Soft Delete:**
- `auto` (vehicles)

### 2. Type-Safe Server Action Wrapper (`src/lib/safe-action.ts`)

**What Changed:**
- Created `createSafeAction` wrapper for type-safe Server Actions
- Created `createAuthenticatedAction` for actions requiring authentication
- Created `createAuthorizedAction` for actions requiring specific roles

**Features:**
- Automatic Zod validation
- Standardized error handling
- Redirect error preservation (for Next.js redirects)
- Prisma error handling (e.g., unique constraint violations)
- Type-safe input/output

**Usage:**
```typescript
// Basic safe action
const createVehicle = createSafeAction(
  createVehicleSchema,
  async (data) => {
    return await db.auto.create({ data })
  }
)

// Authenticated action
const createMaintenance = createAuthenticatedAction(
  createMaintenanceSchema,
  async (data, session) => {
    // session.userId and session.role available
    return await db.udrzba.create({ data })
  }
)

// Authorized action (specific roles)
const deleteVehicle = createAuthorizedAction(
  deleteVehicleSchema,
  ['ADMIN'],
  async (data, session) => {
    // Only ADMIN can execute
    await db.auto.delete({ where: { id: data.id } })
  }
)
```

**Return Type:**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string[]> }
```

### 3. Feature-Based Structure

**New Directory Structure:**
```
src/features/
├── fleet/
│   ├── actions/
│   │   └── vehicle-actions.ts
│   ├── components/
│   │   ├── index.ts (re-exports)
│   │   └── VehicleForm.tsx
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── maintenance/
│   ├── actions/
│   │   └── maintenance-actions.ts
│   └── index.ts
└── auth/
    ├── actions/
    │   └── auth-actions.ts
    └── index.ts
```

**Features Created:**
- **`fleet`**: Vehicle/auto management
  - Actions: `createVehicle`, `updateVehicle`, `partialUpdateVehicle`, `deleteVehicle`, `getVehicles`
  - Types: Vehicle-related types and interfaces
  - Components: Re-exports from original locations (for backward compatibility)

- **`maintenance`**: Maintenance/udrzba management
  - Actions: `createMaintenance`, `getMaintenance`

- **`auth`**: Authentication actions
  - Actions: `login`, `register` (placeholders for future use)

### 4. Updated API Routes

**Changed:**
- `src/app/api/auta/route.ts`: Updated to use `db` client instead of `prisma`
  - GET endpoint now uses soft delete filtering automatically
  - POST endpoint uses `db` for consistency

## Migration Guide

### For Server Actions

**Before:**
```typescript
export async function createVehicle(data: CreateVehicleInput) {
  try {
    const validatedData = createVehicleSchema.parse(data)
    const vehicle = await prisma.auto.create({ data: validatedData })
    return { success: true, data: vehicle }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', fields: ... }
    }
    return { success: false, error: 'Internal error' }
  }
}
```

**After:**
```typescript
export const createVehicle = createAuthorizedAction(
  createVehicleSchema,
  ['ADMIN', 'DISPECER'],
  async (data, session) => {
    const vehicle = await db.auto.create({ data })
    revalidatePath('/dashboard/auta')
    return vehicle
  }
)
```

### For API Routes

**Before:**
```typescript
const vehicles = await prisma.auto.findMany({
  where: { aktivni: true }
})

await prisma.auto.delete({ where: { id } })
```

**After:**
```typescript
// Automatically filters aktivni: true
const vehicles = await db.auto.findMany()

// Soft delete (automatic)
await db.auto.delete({ where: { id } })

// Hard delete (if needed)
await prisma.auto.delete({ where: { id } })
```

### For Components

**Before:**
```typescript
import { createVehicle } from '@/app/actions/vehicle-actions'

const result = await createVehicle(data)
if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

**After:**
```typescript
import { createVehicle } from '@/features/fleet'

const result = await createVehicle(data)
if (result.success) {
  // Handle success - result.data available
} else {
  // Handle error - result.error and result.fields available
}
```

## Benefits

1. **Automatic Soft Delete**: No need to manually add `aktivni: true` filters or convert `delete` to `update`
2. **Type Safety**: Full TypeScript inference from Zod schemas
3. **Consistent Error Handling**: Standardized error responses across all Server Actions
4. **Better Organization**: Feature-based structure makes code easier to navigate and maintain
5. **Security**: Built-in authentication and authorization checks
6. **DRY Principle**: No code duplication for validation and error handling

## Next Steps

1. **Migrate Remaining Server Actions**: Update all Server Actions in `src/app/actions/` to use `createSafeAction`
2. **Update API Routes**: Replace all `prisma` imports with `db` where soft delete is desired
3. **Move Components**: Physically move components to feature directories (currently using re-exports)
4. **Add More Features**: Create features for `drivers`, `transactions`, `reports`, etc.
5. **Update Tests**: Ensure all tests use the new structure and patterns

## Notes

- The base `prisma` client is still exported for cases where hard delete is needed (e.g., cleanup scripts, admin operations)
- Components are currently re-exported from original locations to maintain backward compatibility
- All existing imports will continue to work during the migration period
