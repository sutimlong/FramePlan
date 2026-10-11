import { z } from 'zod'
import type { RichText } from '@shared/schema'
import { emptyRich } from './utils'

const rich = z
  .array(z.custom<RichText[number]>((v) => typeof v === 'object' && v !== null))
  .catch(() => emptyRich())

const time = z.string().catch('')
const str = z.string().catch('')
const optStr = z.string().optional().catch(undefined)
const id = z.string().min(1)

const place = z.object({
  label: str,
  address: str,
  notes: optStr,
  lat: z.number().optional().catch(undefined),
  lng: z.number().optional().catch(undefined),
})

const scene = z.object({
  id,
  kind: z.literal('scene'),
  time,
  endTime: optStr,
  sceneNumber: str,
  intExt: z.enum(['INT', 'EXT', 'INT/EXT']).catch('INT'),
  dayNight: z.enum(['D', 'N', 'DAWN', 'DUSK']).catch('D'),
  setName: str,
  description: rich,
  castIds: z.array(z.string()).catch([]),
  extrasNote: str,
  pages: str,
  location: str,
})
const brk = z.object({
  id,
  kind: z.literal('break'),
  time,
  label: str,
  durationMin: z.number().optional().catch(undefined),
})

const castCall = z.object({
  working: z.boolean().catch(false),
  status: z.enum(['SW', 'W', 'WF', 'SWF', 'H', 'R', '-']).catch('-'),
  transpo: str,
  callTime: time,
  blkRhs: time,
  muWard: time,
  onSet: time,
  remarks: str,
})
const crewCall = z.object({ working: z.boolean().catch(true), callTime: time })

const placeKind = z.enum(['', 'pickup', 'office', 'basecamp', 'main', 'parking', 'hospital', 'custom']).catch('')
const vehicle = z.object({
  id,
  number: str,
  type: z
    .enum(['talent', 'van', 'equipment', 'lighting', 'art', 'makeup', 'production', 'shuttle', 'custom'])
    .catch('talent'),
  typeLabel: optStr,
  driverName: str,
  driverPhone: optStr,
  plateNumber: optStr,
  seats: z.number().optional().catch(undefined),
  notes: optStr,
})
const passengerDetail = z.object({
  boardTime: time,
  boardPlace: placeKind,
  boardCustom: str,
  alightPlace: placeKind,
  alightCustom: str,
  note: str,
})
const vehicleSchedule = z.object({
  // 舊檔案的既有車表視為「出車」
  running: z.boolean().catch(true),
  purpose: z.enum(['', 'talent-in', 'crew-shuttle', 'equipment', 'transfer', 'wrap', 'errand', 'other']).catch(''),
  departureTime: time,
  pickupLocation: str,
  transferTime: time,
  arrivalTime: time,
  returnTime: time,
  destination: placeKind,
  destinationCustom: str,
  passengerIds: z.array(z.string()).catch([]),
  passengerDetails: z.record(z.string(), passengerDetail).catch({}),
  passengersNote: str,
  landmarks: str,
  parking: str,
  unloadingZone: str,
  notes: str,
})

const day = z.object({
  id,
  date: str,
  crewCall: time,
  generalCallNote: optStr,
  setMedic: str,
  scheduleVersion: str,
  locations: z.object({
    productionOffice: place,
    nearestHospital: place,
    parking: place,
    basecamp: place,
    mainShootLocation: place,
    freeNotes: rich,
  }),
  weather: z.object({
    tempUnit: z.enum(['C', 'F']).catch('C'),
    low: z.number().nullable().catch(null),
    high: z.number().nullable().catch(null),
    condition: z
      .enum(['sunny', 'partly-cloudy', 'cloudy', 'rain', 'snow', 'storm', 'fog'])
      .catch('sunny'),
    summary: str,
    sunrise: time,
    sunset: time,
  }),
  rundown: z.array(z.discriminatedUnion('kind', [scene, brk])),
  extras: z.array(
    z.object({ id, description: str, count: z.number().catch(0), callTime: time, notes: optStr }),
  ),
  castCalls: z.record(z.string(), castCall).catch({}),
  crewCalls: z.record(z.string(), crewCall).catch({}),
  vehicleSchedules: z.record(z.string(), vehicleSchedule).catch({}),
  departmentNotes: z.array(z.object({ id, departmentId: str, content: rich })),
  additionalCrewNotes: rich,
  quoteOfTheDay: str,
})

export const schedSchema = z.object({
  formatVersion: z.number(),
  meta: z.object({ createdAt: str, updatedAt: str, appVersion: str }),
  project: z.object({
    projectName: str,
    companyName: str,
    scriptVersion: str,
    keyPeople: z.array(z.object({ id, title: str, name: str, phone: optStr })).catch([]),
  }),
  safetyBanner: z.array(z.string()).catch([]),
  cast: z.array(
    z.object({
      id,
      number: z.number().catch(0),
      characterName: str,
      actorName: str,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
    }),
  ),
  crew: z.array(
    z.object({
      id,
      departmentId: str,
      position: str,
      name: str,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
      notes: optStr,
    }),
  ),
  departments: z.array(z.object({ id, name: str, color: optStr })),
  vehicles: z.array(vehicle).catch([]),
  usefulContacts: z.array(z.object({ id, label: str, name: str, phone: optStr, email: optStr })),
  assets: z.record(
    z.string(),
    z.object({
      id,
      mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      dataBase64: z.string(),
    }),
  ),
  days: z.array(day).min(1),
})
