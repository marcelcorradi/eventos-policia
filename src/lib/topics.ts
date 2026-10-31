export const TOPICS = {
  todos: {
    label: "Tudo",
    terms: [
      "manifestação", "protesto", "passeata", "greve", "carreata",
      "show", "festa", "festival", "evento", "exposição",
      "procissão", "jogo", "interdição",
    ],
  },
  manifestacao: {
    label: "Manifestações",
    terms: ["manifestação", "protesto", "passeata", "greve", "carreata", "ato", "paralisação"],
  },
  shows: {
    label: "Shows e festas",
    terms: ["show", "festa", "festival", "evento", "exposição", "rodeio", "carnaval"],
  },
  esporte: {
    label: "Esporte",
    terms: ["jogo", "campeonato", "corrida", "torcida", "partida"],
  },
  religioso: {
    label: "Religioso",
    terms: ["procissão", "missa", "festa religiosa", "romaria", "culto"],
  },
  transito: {
    label: "Trânsito",
    terms: ["interdição", "trânsito", "desvio", "bloqueio", "obra"],
  },
} as const

export type TopicKey = keyof typeof TOPICS

export type NewsItem = {
  id: string
  title: string
  url: string
  source: string | null
  publishedAt: string | null
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

export function hashId(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `id_${(h >>> 0).toString(36)}`
}
