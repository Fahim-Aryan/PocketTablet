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
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: event.type,
        payload: event,
      })
    } catch (err) {
      console.warn('PocketTablet: send failed', err)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) return

    try {
      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false, ack: false } },
      })

      channelRef.current = channel

      channel
        .on('broadcast', { event: '*' }, ({ payload }) => {
          try {
            onEventRef.current(payload as BroadcastEvent)
          } catch (err) {
            console.warn('PocketTablet: event handler error', err)
          }
        })
        .subscribe()

      return () => {
        try {
          supabase!.removeChannel(channel)
        } catch (err) {
          console.warn('PocketTablet: removeChannel error', err)
        }
      }
    } catch (err) {
      console.warn('PocketTablet: channel creation error', err)
    }
  }, [roomId, enabled])

  return { send }
}
