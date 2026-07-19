import { useEffect, useRef, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { BroadcastEvent } from '../types/drawing'

type BroadcastHandler = (event: BroadcastEvent) => void

interface UseRealtimeRoomOptions {
  roomId: string
  onEvent: BroadcastHandler
  enabled?: boolean
}

export function useRealtimeRoom({
  roomId,
  onEvent,
  enabled = true,
}: UseRealtimeRoomOptions) {
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const send = useCallback((event: BroadcastEvent) => {
    if (!isSupabaseConfigured) return
    channelRef.current?.send({
      type: 'broadcast',
      event: event.type,
      payload: event,
    })
  }, [])

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) return

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false, ack: false } },
    })

    channelRef.current = channel

    channel
      .on('broadcast', { event: '*' }, ({ payload }) => {
        onEventRef.current(payload as BroadcastEvent)
      })
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [roomId, enabled])

  return { send }
}
