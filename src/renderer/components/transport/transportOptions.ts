import {
  PLACE_KIND_LABELS,
  VEHICLE_PURPOSE_LABELS,
  VEHICLE_TYPE_LABELS,
  type PlaceKind,
  type VehiclePurpose,
  type VehicleType,
} from '@shared/schema'

const opts = <T extends string>(labels: Record<T, string>): ReadonlyArray<{ value: T; label: string }> =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))

export const VEHICLE_TYPE_OPTIONS = opts<VehicleType>(VEHICLE_TYPE_LABELS)
export const PURPOSE_OPTIONS = opts<VehiclePurpose>(VEHICLE_PURPOSE_LABELS)
export const PLACE_OPTIONS = opts<PlaceKind>(PLACE_KIND_LABELS)

export type PersonFilter = 'all' | 'cast' | 'crew'
