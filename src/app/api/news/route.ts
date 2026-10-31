import { NextResponse } from "next/server"

import { parseRss } from "@/lib/rss"
import { TOPICS, type TopicKey } from "@/lib/topics"

// Busca no Google Notícias (RSS público, gratuito, sem chave).
// Precisa passar pelo servidor porque o navegador bloqueia (CORS).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const city = (params.get("city") ?? "").trim().slice(0, 80)
  const topicKey = (params.get("topic") ?? "todos") as TopicKey
  const days = Math.min(Math.max(Number(params.get("days")) || 7, 1), 30)
  const extra = (params.get("q") ?? "").trim().slice(0, 100)

  if (city.length < 2) {
    return NextResponse.json({ error: "Informe a cidade." }, { status: 400 })
  }

  const topic = TOPICS[topicKey] ?? TOPICS.todos
  const terms = extra
    ? extra
    : `(${topic.terms.map((t) => (t.includes(" ") ? `"${t}"` : t)).join(" OR ")})`
  const query = `"${city}" ${terms} when:${days}d`

  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=pt-BR&gl=BR&ceid=BR:pt-419`

  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (RadarDeEventos)" },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const items = parseRss(await res.text())
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
      .slice(0, 60)
    return NextResponse.json({ items, query, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error("news fetch failed", err)
    return NextResponse.json(
      { error: "Não foi possível carregar as notícias agora." },
      { status: 502 },
    )
  }
}
