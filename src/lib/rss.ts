import { hashId, type NewsItem } from "@/lib/topics"

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .trim()
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))
  return m ? decode(m[1]) : null
}

/** Lê os itens de um feed RSS (formato do Google Notícias). */
export function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  for (const [, body] of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const url = tag(body, "link")
    let title = tag(body, "title")
    if (!url || !title) continue
    const source = tag(body, "source")
    // O Google coloca " - Nome do site" no fim do título
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3))
    }
    const pub = tag(body, "pubDate")
    const date = pub ? new Date(pub) : null
    items.push({
      id: hashId(url),
      title,
      url,
      source,
      publishedAt: date && !isNaN(date.getTime()) ? date.toISOString() : null,
    })
  }
  return items
}
