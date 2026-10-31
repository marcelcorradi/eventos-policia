import { parseRss } from "@/lib/rss"
import { hashId, TOPICS, type NewsItem, type TopicKey } from "@/lib/topics"

// O app é estático (GitHub Pages), então o RSS do Google Notícias é lido por
// serviços públicos gratuitos que liberam o acesso do navegador (CORS).
// Se um falhar, tenta o próximo.

export function newsQuery(city: string, topic: TopicKey, days: number, keyword?: string) {
  const t = TOPICS[topic] ?? TOPICS.todos
  const terms = keyword?.trim()
    ? keyword.trim()
    : `(${t.terms.map((x) => (x.includes(" ") ? `"${x}"` : x)).join(" OR ")})`
  return `"${city}" ${terms} when:${days}d`
}

function rssUrl(query: string) {
  return (
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}` +
    `&hl=pt-BR&gl=BR&ceid=BR:pt-419`
  )
}

async function viaRss2Json(feed: string, signal: AbortSignal): Promise<NewsItem[]> {
  const res = await fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`,
    { signal },
  )
  const data = await res.json()
  if (!res.ok || data.status !== "ok") throw new Error("rss2json")
  return (data.items as Array<Record<string, string>>).map((it) => {
    const source = it.author || null
    let title = it.title ?? ""
    const dash = title.lastIndexOf(" - ")
    const src = source ?? (dash > 0 ? title.slice(dash + 3) : null)
    if (dash > 0 && (!source || title.endsWith(` - ${source}`))) title = title.slice(0, dash)
    const date = it.pubDate ? new Date(it.pubDate.replace(" ", "T") + "Z") : null
    return {
      id: hashId(it.link),
      title,
      url: it.link,
      source: src,
      publishedAt: date && !isNaN(date.getTime()) ? date.toISOString() : null,
    }
  })
}

async function viaRawProxy(proxy: string, feed: string, signal: AbortSignal) {
  const res = await fetch(proxy + encodeURIComponent(feed), { signal })
  if (!res.ok) throw new Error(`proxy ${res.status}`)
  const text = await res.text()
  if (!text.includes("<rss")) throw new Error("not rss")
  return parseRss(text)
}

export async function fetchNews(query: string, signal: AbortSignal): Promise<NewsItem[]> {
  const feed = rssUrl(query)
  const attempts = [
    () => viaRawProxy("https://api.allorigins.win/raw?url=", feed, signal),
    () => viaRawProxy("https://corsproxy.io/?url=", feed, signal),
    () => viaRss2Json(feed, signal),
  ]
  for (const attempt of attempts) {
    try {
      const items = await attempt()
      return items
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
        .slice(0, 60)
    } catch (e) {
      if (signal.aborted) throw e
    }
  }
  throw new Error("Não foi possível carregar as notícias agora. Use os atalhos acima.")
}
