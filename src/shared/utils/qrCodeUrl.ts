export function getBaseUrl(): string {
  if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL
  return window.location.origin
}
