import {
  VEHICLE_PURPOSE_LABELS,
  VEHICLE_TYPE_LABELS,
  type VehiclePurpose,
  type VehicleType,
} from '@shared/schema'

const opts = <T extends string>(labels: Record<T, string>): ReadonlyArray<{ value: T; label: string }> =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))

export const VEHICLE_TYPE_OPTIONS = opts<VehicleType>(VEHICLE_TYPE_LABELS)
export const PURPOSE_OPTIONS = opts<VehiclePurpose>(VEHICLE_PURPOSE_LABELS)

export type PersonFilter = 'all' | 'cast' | 'crew'
