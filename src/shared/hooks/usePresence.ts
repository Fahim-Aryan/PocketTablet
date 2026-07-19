import { useEffect, useRef, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { PresencePayload, ConnectionStatus } from '../types/drawing'

interface UsePresenceOptions {
  roomId: string
  role: 'desktop' | 'mobile'
  deviceId: string
  onStatusChange: (status: ConnectionStatus) => void
  onOtherPresence?: (present: boolean) => void
}

export function usePresence({
  roomId,
  role,
  deviceId,
  onStatusChange,
  onOtherPresence,
}: UsePresenceOptions) {
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const onStatusChangeRef = useRef(onStatusChange)
  const onOtherPresenceRef = useRef(onOtherPresence)
  onStatusChangeRef.current = onStatusChange
  onOtherPresenceRef.current = onOtherPresence

  const trackPresence = useCallback(async () => {
    if (!isSupabaseConfigured || !channelRef.current) return
    try {
      const payload: PresencePayload = { role, deviceId, joinedAt: Date.now() }
      await channelRef.current.track(payload)
    } catch (err) {
      console.warn('PocketTablet: trackPresence error', err)
    }
  }, [role, deviceId])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      onStatusChangeRef.current(role === 'desktop' ? 'waiting_for_device' : 'disconnected')
      return
    }

    try {
      const channel = supabase.channel(`presence:${roomId}`, {
        config: { broadcast: { self: false, ack: false } },
      })

      channelRef.current = channel

      channel
        .on('presence', { event: 'sync' }, () => {
          try {
            const state = channel.presenceState()
            const entries = Object.values(state) as unknown as PresencePayload[][]
            const mobilePresent = entries.some((list) =>
              list.some((p) => p.role === 'mobile')
            )
            const desktopPresent = entries.some((list) =>
              list.some((p) => p.role === 'desktop')
            )

            if (role === 'desktop') {
              onStatusChangeRef.current(mobilePresent ? 'connected' : 'waiting_for_device')
              onOtherPresenceRef.current?.(mobilePresent)
            } else {
              onStatusChangeRef.current(desktopPresent ? 'connected' : 'waiting_for_device')
              onOtherPresenceRef.current?.(desktopPresent)
            }
          } catch (err) {
            console.warn('PocketTablet: presence sync error', err)
          }
        })

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await trackPresence()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onStatusChangeRef.current('disconnected')
        }
      })

      return () => {
        try {
          supabase!.removeChannel(channel)
        } catch (err) {
          console.warn('PocketTablet: removeChannel error', err)
        }
      }
    } catch (err) {
      console.warn('PocketTablet: channel creation error', err)
      onStatusChangeRef.current('disconnected')
    }
  }, [roomId, role, deviceId, trackPresence])

  return { trackPresence }
}
