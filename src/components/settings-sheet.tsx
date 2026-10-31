"use client"

import * as React from "react"
import { MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export type Settings = { city: string; state: string; accessCode: string }

export const DEFAULT_SETTINGS: Settings = { city: "Itaúna", state: "MG", accessCode: "" }

export function SettingsSheet({
  settings,
  onSave,
}: {
  settings: Settings
  onSave: (s: Settings) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(settings)

  function handleOpenChange(next: boolean) {
    if (next) setDraft(settings)
    setOpen(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="max-w-[55%]">
          <MapPin />
          <span className="truncate">
            {settings.city} - {settings.state}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>Cidade usada nas buscas. Fica salvo só neste aparelho.</SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.city.trim().length < 2) return
            onSave({ ...draft, city: draft.city.trim() })
            setOpen(false)
          }}
        >
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                placeholder="Ex.: Itaúna"
                autoComplete="address-level2"
              />
            </div>
            <div className="grid gap-2">
              <Label>UF</Label>
              <Select value={draft.state} onValueChange={(state) => setDraft({ ...draft, state })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Código de acesso</Label>
            <Input
              id="code"
              type="password"
              value={draft.accessCode}
              onChange={(e) => setDraft({ ...draft, accessCode: e.target.value })}
              placeholder="Se o app estiver protegido"
            />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit">Salvar</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
