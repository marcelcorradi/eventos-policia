"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertCircle, Bookmark, Loader2, Radar, Search, Trash2 } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { EventCard } from "@/components/event-card"
import {
  describePeriod,
  PeriodPicker,
  resolvePeriod,
  type PeriodKey,
} from "@/components/period-picker"
import { DEFAULT_SETTINGS, SettingsSheet, type Settings } from "@/components/settings-sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { CATEGORIES, type EventItem, type SearchResponse } from "@/lib/events"

const LOADING_MESSAGES = [
  "Pesquisando no Google…",
  "Olhando perfis do Instagram…",
  "Checando agenda da prefeitura…",
  "Procurando shows e festas…",
  "Buscando manifestações e protestos…",
  "Verificando portais de notícia locais…",
  "Organizando os resultados…",
]

type LastSearch = SearchResponse & { label: string; place: string }

export function EventsApp() {
  const [settings, setSettings] = useLocalStorage<Settings>("settings", DEFAULT_SETTINGS)
  const [saved, setSaved] = useLocalStorage<EventItem[]>("saved-events", [])
  const [last, setLast] = useLocalStorage<LastSearch | null>("last-search", null)

  const [periodKey, setPeriodKey] = React.useState<PeriodKey>("hoje")
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [category, setCategory] = React.useState("todos")
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [msgIndex, setMsgIndex] = React.useState(0)
  const [tab, setTab] = React.useState("buscar")

  React.useEffect(() => {
    if (!loading) return
    const t = setInterval(
      () => setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1)),
      7000,
    )
    return () => clearInterval(t)
  }, [loading])

  const savedIds = React.useMemo(() => new Set(saved.map((e) => e.id)), [saved])

  function toggleSave(event: EventItem) {
    if (savedIds.has(event.id)) {
      setSaved((prev) => prev.filter((e) => e.id !== event.id))
      toast("Removido dos salvos")
    } else {
      setSaved((prev) =>
        [...prev, event].sort((a, b) => a.date.localeCompare(b.date)),
      )
      toast.success("Evento salvo neste aparelho")
    }
  }

  async function search() {
    const period = resolvePeriod(periodKey, range)
    setMsgIndex(0)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(settings.accessCode ? { "x-access-code": settings.accessCode } : {}),
        },
        body: JSON.stringify({
          city: settings.city,
          state: settings.state,
          from: period.from,
          to: period.to,
          category,
          query: query.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Não foi possível buscar agora.")
      }
      setLast({
        ...(data as SearchResponse),
        label: describePeriod(period),
        place: `${settings.city} - ${settings.state}`,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.")
    } finally {
      setLoading(false)
    }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const upcomingSaved = saved.filter((e) => (e.endDate ?? e.date) >= today)
  const pastSaved = saved.filter((e) => (e.endDate ?? e.date) < today)

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

        <TabsContent value="buscar" className="space-y-4">
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
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Palavra-chave"
                  onKeyDown={(e) => e.key === "Enter" && !loading && search()}
                />
              </div>
              <Button className="w-full" size="lg" onClick={search} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                {loading ? "Buscando…" : `Buscar em ${settings.city}`}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Erro na busca</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {LOADING_MESSAGES[msgIndex]} (pode levar até 1–2 min)
              </p>
              {[0, 1, 2].map((i) => (
                <Card key={i} className="gap-3 py-4">
                  <CardHeader className="px-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent className="px-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : last ? (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium">
                  {last.events.length} evento{last.events.length === 1 ? "" : "s"} · {last.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {last.place} ·{" "}
                  {format(new Date(last.searchedAt), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
              {last.summary && (
                <p className="rounded-lg border bg-muted/40 p-3 text-sm">{last.summary}</p>
              )}
              {last.events.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nada encontrado para esse período. Tente ampliar as datas.
                </p>
              )}
              {last.events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  saved={savedIds.has(ev.id)}
                  onToggleSave={toggleSave}
                />
              ))}
              <p className="pb-6 text-center text-xs text-muted-foreground">
                Resultados gerados por IA a partir de buscas na web. Confirme sempre na fonte.
              </p>
            </section>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Radar className="mx-auto mb-3 size-10 opacity-40" />
              Escolha o período e toque em buscar para ver eventos, shows e manifestações
              em {settings.city}.
            </div>
          )}
        </TabsContent>

        <TabsContent value="salvos" className="space-y-3 pb-6">
          {saved.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bookmark className="mx-auto mb-3 size-10 opacity-40" />
              Toque no marcador de um evento para salvá-lo aqui. Fica guardado só neste
              aparelho.
            </div>
          ) : (
            <>
              {upcomingSaved.map((ev) => (
                <EventCard key={ev.id} event={ev} saved onToggleSave={toggleSave} />
              ))}
              {pastSaved.length > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Já aconteceram ({pastSaved.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSaved((prev) => prev.filter((e) => (e.endDate ?? e.date) >= today))
                      }
                    >
                      <Trash2 /> Limpar
                    </Button>
                  </div>
                  <div className="space-y-3 opacity-60">
                    {pastSaved.map((ev) => (
                      <EventCard key={ev.id} event={ev} saved onToggleSave={toggleSave} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
