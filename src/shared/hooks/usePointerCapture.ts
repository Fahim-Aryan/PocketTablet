import { useRef, useCallback, useEffect } from 'react'
import type { StrokePoint, ToolState } from '../types/drawing'

interface UsePointerCaptureOptions {
  onStrokeStart: (point: StrokePoint, tool: ToolState) => void
  onStrokeMove: (points: StrokePoint[]) => void
  onStrokeEnd: () => void
  tool: ToolState
  enabled?: boolean
  canDraw?: boolean
}

function normalizePoint(e: PointerEvent, rect: DOMRect): StrokePoint {
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
    pressure: e.pressure || 0.5,
    tiltX: e.tiltX,
    tiltY: e.tiltY,
    timestamp: performance.now(),
  }
}

export function usePointerCapture({
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  tool,
  enabled = true,
  canDraw = true,
}: UsePointerCaptureOptions) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const strokeIdRef = useRef<string>('')
  const isDrawingRef = useRef(false)
  const pointBufferRef = useRef<StrokePoint[]>([])
  const rafIdRef = useRef<number | null>(null)
  const onStrokeStartRef = useRef(onStrokeStart)
  const onStrokeMoveRef = useRef(onStrokeMove)
  const onStrokeEndRef = useRef(onStrokeEnd)
  const toolRef = useRef(tool)
  const canDrawRef = useRef(canDraw)

  onStrokeStartRef.current = onStrokeStart
  onStrokeMoveRef.current = onStrokeMove
  onStrokeEndRef.current = onStrokeEnd
  toolRef.current = tool
  canDrawRef.current = canDraw

  const flushBuffer = useCallback(() => {
    if (pointBufferRef.current.length > 0 && isDrawingRef.current) {
      onStrokeMoveRef.current(pointBufferRef.current)
      pointBufferRef.current = []
    } else {
      pointBufferRef.current = []
    }
    rafIdRef.current = null
  }, [])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !enabled) return

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      surface.setPointerCapture(e.pointerId)
      const rect = surface.getBoundingClientRect()
      const point = normalizePoint(e, rect)

      if (!canDrawRef.current) {
        isDrawingRef.current = false
        return
      }

      isDrawingRef.current = true
      strokeIdRef.current = crypto.randomUUID()
      onStrokeStartRef.current(point, toolRef.current)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) {
        if (!canDrawRef.current) return
      }
      e.preventDefault()
      const rect = surface.getBoundingClientRect()
      const coalesced = (e as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }).getCoalescedEvents?.() ?? [e]
      const points = coalesced.map((ce) => normalizePoint(ce, rect))

      if (!isDrawingRef.current) return

      pointBufferRef.current.push(...points)
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushBuffer)
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault()
      if (!isDrawingRef.current) {
        surface.releasePointerCapture(e.pointerId)
        return
      }
      isDrawingRef.current = false
      surface.releasePointerCapture(e.pointerId)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      flushBuffer()
      onStrokeEndRef.current()
    }

    const onPointerCancel = (e: PointerEvent) => {
      e.preventDefault()
      if (!isDrawingRef.current) {
        surface.releasePointerCapture(e.pointerId)
        return
      }
      isDrawingRef.current = false
      surface.releasePointerCapture(e.pointerId)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      pointBufferRef.current = []
      onStrokeEndRef.current()
    }

    surface.addEventListener('pointerdown', onPointerDown)
    surface.addEventListener('pointermove', onPointerMove)
    surface.addEventListener('pointerup', onPointerUp)
    surface.addEventListener('pointercancel', onPointerCancel)

    return () => {
      surface.removeEventListener('pointerdown', onPointerDown)
      surface.removeEventListener('pointermove', onPointerMove)
      surface.removeEventListener('pointerup', onPointerUp)
      surface.removeEventListener('pointercancel', onPointerCancel)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [enabled, flushBuffer])

  return { surfaceRef }
}
