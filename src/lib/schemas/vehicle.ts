import { z } from "zod"

/**
 * Vehicle Status Enum
 */
export const VehicleStatus = {
  AKTIVNI: "aktivní",
  SERVIS: "servis",
  VYRAZENO: "vyřazeno",
} as const

/**
 * Base Vehicle Schema
 * Matches Prisma Auto model with Czech column names
 */
const baseVehicleSchema = z.object({
  spz: z
    .string()
    .min(1, "SPZ je povinná")
    .max(8, "SPZ může mít maximálně 8 znaků")
    .regex(
      /^[A-Z0-9]{1,2}[0-9]{4,6}$/,
      "SPZ musí být ve formátu: 1-2 písmena/čísla následované 4-6 číslicemi (např. 1A23456, AB12345)"
    )
    .transform((val) => val.toUpperCase().replace(/\s/g, "")), // Uppercase and remove spaces
  
  znacka: z
    .string()
    .min(1, "Značka je povinná")
    .max(50, "Značka může mít maximálně 50 znaků")
    .trim(),
  
  model: z
    .string()
    .min(1, "Model je povinný")
    .max(50, "Model může mít maximálně 50 znaků")
    .trim(),
  
  rokVyroby: z.coerce
    .number({
      required_error: "Rok výroby je povinný",
      invalid_type_error: "Rok výroby musí být číslo",
    })
    .int("Rok výroby musí být celé číslo")
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear() + 1, "Rok výroby nemůže být více než rok vpřed"),
  
  najezd: z.coerce
    .number({
      required_error: "Nájezd je povinný",
      invalid_type_error: "Nájezd musí být číslo",
    })
    .int("Nájezd musí být celé číslo")
    .min(0, "Nájezd nemůže být záporný"),
  
  stav: z.enum([VehicleStatus.AKTIVNI, VehicleStatus.SERVIS, VehicleStatus.VYRAZENO], {
    required_error: "Stav je povinný",
    invalid_type_error: "Neplatný stav vozidla",
  }),
  
  poznamka: z
    .string()
    .max(300, "Poznámka může mít maximálně 300 znaků")
    .optional()
    .nullable()
    .transform((val) => val || null), // Convert empty string to null
  
  datumSTK: z
    .union([
      z.string().transform((val) => (val === "" ? null : new Date(val))),
      z.date(),
      z.null(),
    ])
    .optional()
    .nullable()
    .refine(
      (val) => val === null || val === undefined || val instanceof Date,
      "Datum STK musí být platné datum"
    ),
})

/**
 * Vehicle Schema (base)
 * Use this for general vehicle validation
 */
export const vehicleSchema = baseVehicleSchema

/**
 * Create Vehicle Schema
 * For creating new vehicles (no ID required)
 */
export const createVehicleSchema = baseVehicleSchema.extend({
  // Optional: fotky array for photo uploads
  fotky: z
    .array(z.object({ id: z.string() }))
    .optional(),
})

/**
 * Update Vehicle Schema
 * For updating existing vehicles (ID required)
 */
export const updateVehicleSchema = baseVehicleSchema.extend({
  id: z
    .number()
    .int("ID musí být celé číslo")
    .positive("ID musí být kladné číslo"),
  
  // Optional: fotky array for photo uploads
  fotky: z
    .array(z.object({ id: z.string() }))
    .optional(),
})

/**
 * Partial Update Vehicle Schema
 * For partial updates (all fields optional except ID)
 */
export const partialUpdateVehicleSchema = baseVehicleSchema.partial().extend({
  id: z
    .number()
    .int("ID musí být celé číslo")
    .positive("ID musí být kladné číslo"),
})

/**
 * Vehicle Form Schema (for React Hook Form)
 * Handles string inputs from forms, converts to proper types
 */
export const vehicleFormSchema = z.object({
  spz: z
    .string()
    .min(1, "SPZ je povinná")
    .max(8, "SPZ může mít maximálně 8 znaků")
    .regex(
      /^[A-Z0-9]{1,2}[0-9]{4,6}$/i,
      "SPZ musí být ve formátu: 1-2 písmena/čísla následované 4-6 číslicemi"
    )
    .transform((val) => val.toUpperCase().replace(/\s/g, "")),
  
  znacka: z
    .string()
    .min(1, "Značka je povinná")
    .max(50, "Značka může mít maximálně 50 znaků")
    .trim(),
  
  model: z
    .string()
    .min(1, "Model je povinný")
    .max(50, "Model může mít maximálně 50 znaků")
    .trim(),
  
  rokVyroby: z.coerce
    .number({
      required_error: "Rok výroby je povinný",
      invalid_type_error: "Rok výroby musí být číslo",
    })
    .int("Rok výroby musí být celé číslo")
    .min(1900, "Rok výroby musí být od roku 1900")
    .max(new Date().getFullYear() + 1, "Rok výroby nemůže být více než rok vpřed"),
  
  najezd: z.coerce
    .number({
      required_error: "Nájezd je povinný",
      invalid_type_error: "Nájezd musí být číslo",
    })
    .int("Nájezd musí být celé číslo")
    .min(0, "Nájezd nemůže být záporný"),
  
  stav: z.enum([VehicleStatus.AKTIVNI, VehicleStatus.SERVIS, VehicleStatus.VYRAZENO], {
    required_error: "Stav je povinný",
    invalid_type_error: "Neplatný stav vozidla",
  }),
  
  poznamka: z
    .string()
    .max(300, "Poznámka může mít maximálně 300 znaků")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  
  datumSTK: z
    .union([
      z.string().transform((val) => (val === "" ? null : new Date(val))),
      z.date(),
      z.null(),
    ])
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  
  // Fuel type and dynamic fields
  palivo: z
    .enum(['BENZIN', 'NAFTA', 'LPG', 'CNG', 'HYBRID', 'ELEKTRO'], {
      required_error: "Palivo je povinné",
      invalid_type_error: "Neplatný typ paliva",
    })
    .optional()
    .nullable(),
  
  // Electric vehicle fields (required if palivo === 'ELEKTRO')
  kapacita_baterie: z.coerce
    .number({
      invalid_type_error: "Kapacita baterie musí být číslo",
    })
    .positive("Kapacita baterie musí být kladné číslo")
    .max(200, "Kapacita baterie nemůže být více než 200 kWh")
    .optional()
    .nullable(),
  
  dojezd: z.coerce
    .number({
      invalid_type_error: "Dojezd musí být číslo",
    })
    .int("Dojezd musí být celé číslo")
    .positive("Dojezd musí být kladné číslo")
    .max(1000, "Dojezd nemůže být více než 1000 km")
    .optional()
    .nullable(),
  
  // Combustion engine fields (required if palivo is not ELEKTRO)
  objem_motoru: z.coerce
    .number({
      invalid_type_error: "Objem motoru musí být číslo",
    })
    .positive("Objem motoru musí být kladné číslo")
    .max(10, "Objem motoru nemůže být více než 10 litrů")
    .optional()
    .nullable(),
  
  emisni_norma: z
    .enum(['EURO1', 'EURO2', 'EURO3', 'EURO4', 'EURO5', 'EURO6', 'EURO6D'], {
      invalid_type_error: "Neplatná emisní norma",
    })
    .optional()
    .nullable(),
  
  // VIN number (optional)
  vin: z
    .string()
    .max(17, "VIN může mít maximálně 17 znaků")
    .regex(
      /^[A-HJ-NPR-Z0-9]{17}$/i,
      "VIN musí být ve formátu 17 znaků (písmena a čísla, bez I, O, Q)"
    )
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val?.toUpperCase())),
})

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

/**
 * Base Vehicle type
 */
export type Vehicle = z.infer<typeof vehicleSchema>

/**
 * Create Vehicle input type
 */
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

/**
 * Update Vehicle input type
 */
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>

/**
 * Partial Update Vehicle input type
 */
export type PartialUpdateVehicleInput = z.infer<typeof partialUpdateVehicleSchema>

/**
 * Vehicle Form Values type (for React Hook Form)
 */
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

/**
 * Vehicle Status type
 */
export type VehicleStatusType = typeof VehicleStatus[keyof typeof VehicleStatus]


