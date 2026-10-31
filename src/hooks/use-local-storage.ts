"use client"

import * as React from "react"

/** Estado persistido no localStorage do aparelho (nada vai para servidor). */
const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener("storage", cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", cb)
  }
}

function read<T>(key: string, initial: T): T {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    /* storage indisponível */
  }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = initial
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = initial
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function useLocalStorage<T>(key: string, initial: T) {
  const initialRef = React.useRef(initial)
  const value = React.useSyncExternalStore(
    subscribe,
    () => read(key, initialRef.current),
    () => initialRef.current,
  )

  const update = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, initialRef.current)
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        cache.set(key, { raw: null, value: resolved })
      }
      listeners.forEach((l) => l())
    },
    [key],
  )

  return [value, update] as const
}
