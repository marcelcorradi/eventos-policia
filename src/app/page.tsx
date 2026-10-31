import { Radar } from "lucide-react"

import { ClientOnly } from "@/components/client-only"
import { EventsApp } from "@/components/events-app"

export default function Home() {
  return (
    <ClientOnly
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Radar className="size-10 animate-pulse text-primary" />
        </div>
      }
    >
      <EventsApp />
    </ClientOnly>
  )
}
