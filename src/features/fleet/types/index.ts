/**
 * Fleet Feature Types
 * Type definitions for vehicle/fleet management
 */

import { z } from 'zod'
import { vehicleSchema, VehicleFormValues } from '@/lib/schemas/vehicle'

// Re-export vehicle types from schemas
export type {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  PartialUpdateVehicleInput,
  VehicleFormValues,
  VehicleStatusType,
} from '@/lib/schemas/vehicle'

export { VehicleStatus } from '@/lib/schemas/vehicle'

// Additional fleet-specific types
export interface VehicleWithRelations {
  id: number
  spz: string
  znacka: string
  model: string
  rokVyroby: number
  najezd: number
  stav: string
  poznamka: string | null
  datumSTK: string | null
  aktivni: boolean
  createdAt: string
  updatedAt: string
  // Relations
  fotky?: Array<{ id: string }>
  poznatky?: Array<{ id: number; text: string; createdAt: string }>
  _count?: {
    gpsZaznamy: number
    udrzby: number
    tankovani: number
  }
}


