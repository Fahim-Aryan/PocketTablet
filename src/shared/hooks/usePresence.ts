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
    const payload: PresencePayload = { role, deviceId, joinedAt: Date.now() }
    await channelRef.current.track(payload)
  }, [role, deviceId])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      if (role === 'desktop') {
        onStatusChangeRef.current('waiting_for_device')
      } else {
        onStatusChangeRef.current('disconnected')
      }
      return
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false, ack: false } },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const mobilePresent = Object.values(state).some((presences) =>
          (presences as unknown as PresencePayload[]).some((p) => p.role === 'mobile')
        )
        const desktopPresent = Object.values(state).some((presences) =>
          (presences as unknown as PresencePayload[]).some((p) => p.role === 'desktop')
        )

        if (role === 'desktop') {
          onStatusChangeRef.current(mobilePresent ? 'connected' : 'waiting_for_device')
          onOtherPresenceRef.current?.(mobilePresent)
        } else {
          onStatusChangeRef.current(desktopPresent ? 'connected' : 'waiting_for_device')
          onOtherPresenceRef.current?.(desktopPresent)
        }
      })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackPresence()
      }
    })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [roomId, role, deviceId, trackPresence])

  return { trackPresence }
}
