"use client"

import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarRange } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type PeriodKey = "hoje" | "amanha" | "fds" | "semana" | "mes" | "custom"

export type Period = { key: PeriodKey; from: string; to: string }

const ymd = (d: Date) => format(d, "yyyy-MM-dd")

export function resolvePeriod(key: PeriodKey, custom?: DateRange): Period {
  const today = startOfDay(new Date())
  switch (key) {
    case "hoje":
      return { key, from: ymd(today), to: ymd(today) }
    case "amanha":
      return { key, from: ymd(addDays(today, 1)), to: ymd(addDays(today, 1)) }
    case "fds": {
      const dow = today.getDay() // 0 = domingo
      const friday = dow === 0 ? today : addDays(today, (5 - dow + 7) % 7)
      const start = dow === 6 || dow === 0 ? today : friday
      const sunday = dow === 0 ? today : addDays(today, 7 - dow)
      return { key, from: ymd(start), to: ymd(sunday) }
    }
    case "semana":
      return {
        key,
        from: ymd(today),
        to: ymd(endOfWeek(today, { weekStartsOn: 1 })),
      }
    case "mes":
      return { key, from: ymd(today), to: ymd(endOfMonth(today)) }
    case "custom": {
      const from = custom?.from ?? today
      const to = custom?.to ?? from
      return { key, from: ymd(from), to: ymd(to) }
    }
  }
}

export function describePeriod(p: Period) {
  const f = (s: string) => format(new Date(`${s}T12:00:00`), "dd/MM", { locale: ptBR })
  return p.from === p.to ? f(p.from) : `${f(p.from)} a ${f(p.to)}`
}

const OPTIONS: [PeriodKey, string][] = [
  ["hoje", "Hoje"],
  ["amanha", "Amanhã"],
  ["fds", "Fim sem."],
  ["semana", "Semana"],
  ["mes", "Mês"],
]

export function PeriodPicker({
  value,
  range,
  onChange,
}: {
  value: PeriodKey
  range: DateRange | undefined
  onChange: (key: PeriodKey, range?: DateRange) => void
}) {
  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(v) => v && onChange(v as PeriodKey, range)}
        className="grid w-full grid-cols-5"
      >
        {OPTIONS.map(([k, label]) => (
          <ToggleGroupItem
            key={k}
            value={k}
            className="px-1 text-xs sm:text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={value === "custom" ? "default" : "outline"}
            className="w-full justify-start font-normal"
          >
            <CalendarRange />
            {value === "custom" && range?.from
              ? describePeriod(resolvePeriod("custom", range))
              : "Escolher período específico"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={ptBR}
            selected={range}
            disabled={{ before: startOfDay(new Date()) }}
            onSelect={(r) => onChange("custom", r)}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
