"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type SavedEvent = {
  id: string
  title: string
  date: string | null // YYYY-MM-DD
  time: string | null // HH:MM
  place: string | null
  notes: string | null
  url: string | null
  source: string | null
  savedAt: string
}

export function newSavedEvent(partial: Partial<SavedEvent> = {}): SavedEvent {
  return {
    id: `ev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title: "",
    date: null,
    time: null,
    place: null,
    notes: null,
    url: null,
    source: null,
    savedAt: new Date().toISOString(),
    ...partial,
  }
}

const orNull = (s: string) => (s.trim() ? s.trim() : null)

export function SavedEventDialog({
  event,
  onClose,
  onSave,
}: {
  event: SavedEvent | null
  onClose: () => void
  onSave: (e: SavedEvent) => void
}) {
  return (
    <Dialog open={event !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {event && <EventForm key={event.id} event={event} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EventForm({
  event,
  onSave,
}: {
  event: SavedEvent
  onSave: (e: SavedEvent) => void
}) {
  const [f, setF] = React.useState({
    title: event.title,
    date: event.date ?? "",
    time: event.time ?? "",
    place: event.place ?? "",
    notes: event.notes ?? "",
    url: event.url ?? "",
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!f.title.trim()) return
        onSave({
          ...event,
          title: f.title.trim(),
          date: orNull(f.date),
          time: orNull(f.time),
          place: orNull(f.place),
          notes: orNull(f.notes),
          url: orNull(f.url),
        })
      }}
    >
      <DialogHeader>
        <DialogTitle>{event.title ? "Editar evento" : "Novo evento"}</DialogTitle>
        <DialogDescription>Fica guardado só neste aparelho.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="ev-title">O quê</Label>
        <Input id="ev-title" value={f.title} onChange={set("title")} placeholder="Ex.: Show na praça" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="ev-date">Data</Label>
          <Input id="ev-date" type="date" value={f.date} onChange={set("date")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ev-time">Horário</Label>
          <Input id="ev-time" type="time" value={f.time} onChange={set("time")} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ev-place">Local</Label>
        <Input id="ev-place" value={f.place} onChange={set("place")} placeholder="Ex.: Praça da Matriz" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ev-notes">Observações</Label>
        <Textarea
          id="ev-notes"
          value={f.notes}
          onChange={set("notes")}
          rows={3}
          placeholder="Público esperado, bebida, rota da passeata…"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ev-url">Link</Label>
        <Input id="ev-url" type="url" value={f.url} onChange={set("url")} placeholder="https://…" />
      </div>

      <DialogFooter>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  )
}
