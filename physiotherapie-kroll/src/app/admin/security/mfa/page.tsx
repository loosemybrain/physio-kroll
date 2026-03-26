import { MfaManagerClient } from "./MfaManagerClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function AdminMfaPage() {
  return <MfaManagerClient />
}
