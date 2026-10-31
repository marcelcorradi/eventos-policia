"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  CATEGORIES,
  CONFIDENCE_LABELS,
  RISK_LABELS,
  type EventItem,
} from "@/lib/events"
import { cn } from "@/lib/utils"

function formatDate(date: string) {
  try {
    const s = format(parseISO(date), "EEE, dd 'de' MMM", { locale: ptBR })
    return s.charAt(0).toUpperCase() + s.slice(1)
  } catch {
    return date
  }
}

const riskStyles: Record<EventItem["riskLevel"], string> = {
  baixo: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  medio: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  alto: "border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400",
}

export function EventCard({
  event,
  saved,
  onToggleSave,
}: {
  event: EventItem
  saved: boolean
  onToggleSave: (event: EventItem) => void
}) {
  const place = [event.venue, event.address].filter(Boolean).join(" — ")
  const mapsQuery = encodeURIComponent(
    [event.venue, event.address, event.city].filter(Boolean).join(", "),
  )

  const shareText = [
    `📍 ${event.title}`,
    `🗓 ${formatDate(event.date)}${event.startTime ? ` às ${event.startTime}` : ""}`,
    place && `📌 ${place}`,
    event.estimatedAttendance && `👥 ${event.estimatedAttendance}`,
    `⚠️ ${RISK_LABELS[event.riskLevel]} — ${event.policeNotes}`,
    event.sourceUrl,
  ]
    .filter(Boolean)
    .join("\n")

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
        toast.success("Resumo copiado")
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn(riskStyles[event.riskLevel])}>
            <ShieldAlert />
            {RISK_LABELS[event.riskLevel]}
          </Badge>
          <Badge variant="secondary">{CATEGORIES[event.category]}</Badge>
          {event.confidence !== "confirmado" && (
            <Badge variant="outline" className="text-muted-foreground">
              {CONFIDENCE_LABELS[event.confidence]}
            </Badge>
          )}
        </div>
        <CardTitle className="pt-1 text-base leading-snug">{event.title}</CardTitle>
        <CardDescription>{event.description}</CardDescription>
        <CardAction>
          <Button
            variant={saved ? "default" : "ghost"}
            size="icon"
            aria-label={saved ? "Remover dos salvos" : "Salvar evento"}
            onClick={() => onToggleSave(event)}
          >
            {saved ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2 px-4 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            {formatDate(event.date)}
            {event.endDate && event.endDate !== event.date && ` → ${formatDate(event.endDate)}`}
          </span>
          {event.startTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              {event.startTime}
            </span>
          )}
          {event.estimatedAttendance && (
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              {event.estimatedAttendance}
            </span>
          )}
        </div>
        {place && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {place}
          </p>
        )}
        <div className="rounded-md border bg-muted/50 p-2.5 text-[13px]">
          <span className="font-medium">Atenção: </span>
          {event.policeNotes}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 px-4">
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation /> Mapa
          </a>
        </Button>
        {event.sourceUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={event.sourceUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              <span className="max-w-32 truncate">{event.sourceName ?? "Fonte"}</span>
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={share}>
          <Share2 /> Compartilhar
        </Button>
      </CardFooter>
    </Card>
  )
}
