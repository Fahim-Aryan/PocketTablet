import { nanoid } from 'nanoid'

export function generateRoomId(): string {
  return crypto.randomUUID()
}

export function generatePairingToken(): string {
  return nanoid(32)
}

export function buildConnectUrl(baseUrl: string, roomId: string, token: string): string {
  const url = new URL('/connect', baseUrl)
  url.searchParams.set('room', roomId)
  url.searchParams.set('token', token)
  return url.toString()
}
