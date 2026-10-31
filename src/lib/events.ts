import { z } from "zod"

export const CATEGORIES = {
  manifestacao: "Manifestação / protesto",
  show: "Show / música",
  festa: "Festa / balada",
  esporte: "Esporte",
  religioso: "Religioso",
  feira: "Feira / exposição",
  politico: "Político / audiência",
  cultural: "Cultural / teatro",
  transito: "Trânsito / interdição",
  outro: "Outro",
} as const

export type Category = keyof typeof CATEGORIES

export const RISK_LABELS = {
  baixo: "Risco baixo",
  medio: "Risco médio",
  alto: "Risco alto",
} as const

export const CONFIDENCE_LABELS = {
  confirmado: "Confirmado",
  provavel: "Provável",
  rumor: "Não confirmado",
} as const

export const eventSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string().nullable(), // HH:MM
  endDate: z.string().nullable(),
  venue: z.string().nullable(),
  address: z.string().nullable(),
  estimatedAttendance: z.string().nullable(),
  riskLevel: z.enum(["baixo", "medio", "alto"]),
  policeNotes: z.string(),
  confidence: z.enum(["confirmado", "provavel", "rumor"]),
  sourceUrl: z.string().nullable(),
  sourceName: z.string().nullable(),
})

export type EventItem = z.infer<typeof eventSchema> & { id: string; city: string }

export const searchRequestSchema = z.object({
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  query: z.string().max(200).optional(),
  category: z.string().max(40).optional(),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

export type SearchResponse = {
  events: EventItem[]
  summary: string
  searchedAt: string
}

export function eventId(e: { title: string; date: string; city: string }) {
  const raw = `${e.city}|${e.date}|${e.title}`.toLowerCase()
  let h = 0
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  return `ev_${(h >>> 0).toString(36)}`
}
