"use client"

import * as React from "react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Newspaper,
  Pencil,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Share2,
  Trash2,
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

import {
  newsDays,
  PeriodPicker,
  periodSearchText,
  resolvePeriod,
  type PeriodKey,
} from "@/components/period-picker"
import {
  newSavedEvent,
  SavedEventDialog,
  type SavedEvent,
} from "@/components/saved-event-dialog"
import { DEFAULT_SETTINGS, SettingsSheet, type Settings } from "@/components/settings-sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { buildLinks } from "@/lib/links"
import { fetchNews, newsQuery } from "@/lib/news"
import { TOPICS, type NewsItem, type TopicKey } from "@/lib/topics"

type NewsState =
  | { key: string; status: "ok"; items: NewsItem[] }
  | { key: string; status: "error"; message: string }

async function shareText(title: string, text: string) {
  try {
    if (navigator.share) await navigator.share({ title, text })
    else {
      await navigator.clipboard.writeText(text)
      toast.success("Copiado")
    }
  } catch {
    /* cancelado */
  }
}

function formatDay(date: string) {
  const s = format(parseISO(date), "EEE, dd 'de' MMM", { locale: ptBR })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function EventsApp() {
  const [settings, setSettings] = useLocalStorage<Settings>("settings", DEFAULT_SETTINGS)
  const [saved, setSaved] = useLocalStorage<SavedEvent[]>("saved-events-v2", [])

  const [tab, setTab] = React.useState("buscar")
  const [periodKey, setPeriodKey] = React.useState<PeriodKey>("hoje")
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [topic, setTopic] = React.useState<TopicKey>("todos")
  const [keyword, setKeyword] = React.useState("")
  const [appliedKeyword, setAppliedKeyword] = React.useState("")
  const [reload, setReload] = React.useState(0)
  const [news, setNews] = React.useState<NewsState | null>(null)
  const [editing, setEditing] = React.useState<SavedEvent | null>(null)

  const period = resolvePeriod(periodKey, range)
  const days = newsDays(period)
  const newsKey = JSON.stringify([settings.city, topic, days, appliedKeyword, reload])
  const newsLoading = news?.key !== newsKey

  React.useEffect(() => {
    const ctrl = new AbortController()
    fetchNews(newsQuery(settings.city, topic, days, appliedKeyword), ctrl.signal)
      .then((items) => setNews({ key: newsKey, status: "ok", items }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setNews({
          key: newsKey,
          status: "error",
          message: e instanceof Error ? e.message : "Falha ao carregar notícias.",
        })
      })
    return () => ctrl.abort()
  }, [newsKey, settings.city, topic, days, appliedKeyword])

  const links = buildLinks({
    city: settings.city,
    state: settings.state,
    topic,
    periodText: periodSearchText(period),
    keyword: appliedKeyword,
  })

  const savedUrls = React.useMemo(
    () => new Set(saved.map((e) => e.url).filter(Boolean)),
    [saved],
  )

  function upsert(ev: SavedEvent) {
    setSaved((prev) => {
      const rest = prev.filter((e) => e.id !== ev.id)
      return [...rest, ev]
    })
    setEditing(null)
    toast.success("Evento salvo neste aparelho")
  }

  function saveNews(item: NewsItem) {
    if (savedUrls.has(item.url)) {
      setSaved((prev) => prev.filter((e) => e.url !== item.url))
      toast("Removido dos salvos")
      return
    }
    setSaved((prev) => [
      ...prev,
      newSavedEvent({ title: item.title, url: item.url, source: item.source }),
    ])
    toast.success("Salvo — abra em Salvos para pôr data e local", {
      action: { label: "Ver", onClick: () => setTab("salvos") },
    })
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const sortedSaved = [...saved].sort((a, b) =>
    `${a.date ?? "9999"} ${a.time ?? ""}`.localeCompare(`${b.date ?? "9999"} ${b.time ?? ""}`),
  )
  const upcoming = sortedSaved.filter((e) => !e.date || e.date >= today)
  const past = sortedSaved.filter((e) => e.date && e.date < today)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radar className="size-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Radar de Eventos</h1>
          </div>
          <SettingsSheet settings={settings} onSave={setSettings} />
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 gap-4 px-4 py-4">
        <TabsList className="w-full">
          <TabsTrigger value="buscar">
            <Search /> Buscar
          </TabsTrigger>
          <TabsTrigger value="salvos">
            <Bookmark /> Salvos
            {saved.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                {saved.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------ BUSCAR ------------------------------ */}
        <TabsContent value="buscar" className="space-y-5 pb-6">
          <Card className="gap-3 py-4">
            <CardContent className="space-y-3 px-4">
              <PeriodPicker
                value={periodKey}
                range={range}
                onChange={(key, r) => {
                  setPeriodKey(key)
                  setRange(r)
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={topic} onValueChange={(v) => setTopic(v as TopicKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOPICS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setAppliedKeyword(keyword.trim())
                  }}
                >
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onBlur={() => setAppliedKeyword(keyword.trim())}
                    placeholder="Palavra-chave"
                    enterKeyHint="search"
                  />
                </form>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Abrir busca pronta · {settings.city} · {periodSearchText(period)}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-0.5 rounded-lg border bg-card p-3 text-left shadow-xs transition-colors hover:bg-accent active:scale-[0.98]"
                >
                  <span className="flex items-center justify-between gap-1 text-sm font-medium">
                    {l.label}
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{l.hint}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Newspaper className="size-4" />
                Notícias dos últimos {days} dias
              </h2>
              <Button
                variant="ghost"
                size="sm"
                disabled={newsLoading}
                onClick={() => setReload((n) => n + 1)}
              >
                <RefreshCw className={newsLoading ? "animate-spin" : undefined} />
                Atualizar
              </Button>
            </div>

            {newsLoading ? (
              [0, 1, 2, 3].map((i) => (
                <Card key={i} className="gap-2 py-3">
                  <CardContent className="space-y-2 px-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : news?.status === "error" ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{news.message}</AlertDescription>
              </Alert>
            ) : news?.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma notícia recente sobre isso em {settings.city}. Use os atalhos acima.
              </p>
            ) : (
              news?.items.map((item) => {
                const isSaved = savedUrls.has(item.url)
                return (
                  <Card key={item.id} className="gap-2 py-3">
                    <CardHeader className="px-4">
                      <CardTitle className="text-[15px] leading-snug font-medium">
                        <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {[
                          item.source,
                          item.publishedAt &&
                            formatDistanceToNow(new Date(item.publishedAt), {
                              locale: ptBR,
                              addSuffix: true,
                            }),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </CardDescription>
                      <CardAction className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Compartilhar"
                          onClick={() => shareText(item.title, `${item.title}\n${item.url}`)}
                        >
                          <Share2 />
                        </Button>
                        <Button
                          variant={isSaved ? "default" : "ghost"}
                          size="icon"
                          aria-label={isSaved ? "Remover dos salvos" : "Salvar"}
                          onClick={() => saveNews(item)}
                        >
                          {isSaved ? <BookmarkCheck /> : <Bookmark />}
                        </Button>
                      </CardAction>
                    </CardHeader>
                  </Card>
                )
              })
            )}
          </section>
        </TabsContent>

        {/* ------------------------------ SALVOS ------------------------------ */}
        <TabsContent value="salvos" className="space-y-3 pb-6">
          <Button className="w-full" onClick={() => setEditing(newSavedEvent())}>
            <Plus /> Adicionar evento
          </Button>

          {saved.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bookmark className="mx-auto mb-3 size-10 opacity-40" />
              Salve notícias na aba Buscar ou adicione um evento que você viu no Instagram,
              WhatsApp etc. Fica guardado só neste aparelho.
            </div>
          ) : (
            <>
              {upcoming.map((ev) => (
                <SavedCard
                  key={ev.id}
                  event={ev}
                  city={`${settings.city} ${settings.state}`}
                  onEdit={() => setEditing(ev)}
                  onDelete={() => setSaved((p) => p.filter((e) => e.id !== ev.id))}
                />
              ))}
              {past.length > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Já aconteceram ({past.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSaved((p) => p.filter((e) => !e.date || e.date >= today))}
                    >
                      <Trash2 /> Limpar
                    </Button>
                  </div>
                  <div className="space-y-3 opacity-60">
                    {past.map((ev) => (
                      <SavedCard
                        key={ev.id}
                        event={ev}
                        city={`${settings.city} ${settings.state}`}
                        onEdit={() => setEditing(ev)}
                        onDelete={() => setSaved((p) => p.filter((e) => e.id !== ev.id))}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <SavedEventDialog event={editing} onClose={() => setEditing(null)} onSave={upsert} />
    </div>
  )
}

function SavedCard({
  event,
  city,
  onEdit,
  onDelete,
}: {
  event: SavedEvent
  city: string
  onEdit: () => void
  onDelete: () => void
}) {
  const text = [
    `📍 ${event.title}`,
    event.date && `🗓 ${formatDay(event.date)}${event.time ? ` às ${event.time}` : ""}`,
    event.place && `📌 ${event.place}`,
    event.notes && `📝 ${event.notes}`,
    event.url,
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base leading-snug">{event.title}</CardTitle>
        {event.source && <CardDescription className="text-xs">{event.source}</CardDescription>}
        <CardAction className="flex">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Excluir" onClick={onDelete}>
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {event.date ? (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatDay(event.date)}
            </span>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-muted-foreground underline-offset-2 hover:underline"
            >
              <CalendarDays className="size-4" /> Sem data — toque para adicionar
            </button>
          )}
          {event.time && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              {event.time}
            </span>
          )}
        </div>
        {event.place && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {event.place}
          </p>
        )}
        {event.notes && (
          <p className="rounded-md border bg-muted/50 p-2.5 text-[13px] whitespace-pre-wrap">
            {event.notes}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 px-4">
        {event.place && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.place}, ${city}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation /> Mapa
            </a>
          </Button>
        )}
        {event.url && (
          <Button variant="outline" size="sm" asChild>
            <a href={event.url} target="_blank" rel="noreferrer">
              <ExternalLink /> Abrir
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => shareText(event.title, text)}>
          <Share2 /> Compartilhar
        </Button>
      </CardFooter>
    </Card>
  )
}
