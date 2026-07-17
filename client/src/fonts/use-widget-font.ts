import { useEffect, useState } from 'react'

import { ensureWidgetFontLoaded, type WidgetFontId } from '@/fonts/registry'

/** Loads the selected widget font on demand; returns whether it is ready to render. */
export function useWidgetFont(id: WidgetFontId): boolean {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    ensureWidgetFontLoaded(id)
      .then(() => {
        if (!cancelled) setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return loaded
}
