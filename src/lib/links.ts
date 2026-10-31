import { TOPICS, slugify, type TopicKey } from "@/lib/topics"

export type QuickLink = {
  id: string
  label: string
  hint: string
  url: string
}

const g = (q: string, extra = "") =>
  `https://www.google.com/search?q=${encodeURIComponent(q)}${extra}`

/** Monta os atalhos de busca já preenchidos com cidade, período e assunto. */
export function buildLinks(opts: {
  city: string
  state: string
  topic: TopicKey
  periodText: string
  keyword?: string
}): QuickLink[] {
  const { city, state, topic, periodText } = opts
  const what = opts.keyword?.trim()
    ? opts.keyword.trim()
    : topic === "todos"
      ? "eventos"
      : TOPICS[topic].terms.slice(0, 3).join(" OR ")
  const orTerms = opts.keyword?.trim()
    ? opts.keyword.trim()
    : `(${TOPICS[topic].terms.slice(0, 6).join(" OR ")})`
  const place = `${city} ${state}`
  const tag = slugify(city)

  return [
    {
      id: "google-events",
      label: "Google Eventos",
      hint: "Agenda de eventos que o Google conhece",
      url: g(`eventos em ${place} ${periodText}`, "&ibp=htl;events"),
    },
    {
      id: "google",
      label: "Google",
      hint: `${what} · ${periodText}`,
      url: g(`${what} ${place} ${periodText}`),
    },
    {
      id: "instagram-google",
      label: "Posts do Instagram",
      hint: "Divulgações no Instagram achadas pelo Google",
      url: g(`site:instagram.com "${city}" ${orTerms}`),
    },
    {
      id: "instagram-tag",
      label: `Instagram #${tag}`,
      hint: "Hashtag da cidade (precisa estar logado)",
      url: `https://www.instagram.com/explore/tags/${tag}/`,
    },
    {
      id: "facebook",
      label: "Eventos no Facebook",
      hint: "Eventos criados no Facebook",
      url: `https://www.facebook.com/events/search/?q=${encodeURIComponent(city)}`,
    },
    {
      id: "sympla",
      label: "Ingressos (Sympla e outros)",
      hint: "Shows e festas com venda de ingresso",
      url: g(`"${city}" (site:sympla.com.br OR site:ingresse.com OR site:eventbrite.com.br OR site:bilheteriadigital.com)`),
    },
    {
      id: "prefeitura",
      label: "Prefeitura e Câmara",
      hint: "Agenda oficial, interdições, eventos da cidade",
      url: g(`prefeitura ${place} agenda eventos ${periodText}`),
    },
    {
      id: "x",
      label: "X / Twitter (ao vivo)",
      hint: "O que estão postando agora",
      url: `https://x.com/search?q=${encodeURIComponent(`${city} ${orTerms}`)}&f=live`,
    },
  ]
}
