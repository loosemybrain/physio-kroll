/**
 * Zentrale Prüfung: Ist die URL eine lokale oder private Adresse?
 * Verwendet von der Admin-Route beim Anlegen von Cookie-Scan-Jobs, damit
 * externe Worker keine unerreichbaren Ziele (localhost, private IPs) erhalten.
 *
 * Abgedeckt:
 * - localhost, 127.0.0.1, ::1
 * - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - .local (mDNS)
 * - IPv6 link-local (fe80::/10), unique-local (fd00::/8)
 */
export function isLocalOrPrivateUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true
    if (host.endsWith(".local")) return true

    if (host.startsWith("10.")) return true

    if (host.startsWith("172.")) {
      const secondOctet = parseInt(host.split(".")[1] ?? "", 10)
      if (secondOctet >= 16 && secondOctet <= 31) return true
    }

    if (host.startsWith("192.168.")) return true

    if (host.startsWith("fe80:") || host.startsWith("fd00:")) return true

    return false
  } catch {
    return false
  }
}