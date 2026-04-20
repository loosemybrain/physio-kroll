import { AdminDashboardContent } from "@/components/admin/dashboard"
import { loadDashboardViewModel } from "@/lib/admin/dashboard"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AdminDashboardPage() {
  const dashboardData = await loadDashboardViewModel()
  return <AdminDashboardContent data={dashboardData} />
}
