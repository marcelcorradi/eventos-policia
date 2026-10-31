"use client"

import * as React from "react"

const noop = () => () => {}

/** Renderiza os filhos só no aparelho (o app depende de data/hora e localStorage locais). */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const mounted = React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  return mounted ? children : fallback
}
