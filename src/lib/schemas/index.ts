/**
 * Centralized Schema Exports
 * Barrel pattern for easier imports
 * 
 * @example
 * import { vehicleSchema, VehicleFormValues } from '@/lib/schemas'
 * import { loginSchema } from '@/lib/schemas'
 */

// Vehicle schemas
export {
  vehicleSchema,
  createVehicleSchema,
  updateVehicleSchema,
  partialUpdateVehicleSchema,
  vehicleFormSchema,
  VehicleStatus,
  type Vehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
  type PartialUpdateVehicleInput,
  type VehicleFormValues,
  type VehicleStatusType,
} from "./vehicle"

// Auth schemas
export {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ChangePasswordFormData,
} from "./auth"


