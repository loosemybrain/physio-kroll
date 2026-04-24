import { NextResponse } from "next/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { runAndWriteHealthCheck } from "@/lib/server/db/adminWrites"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const result = await runAndWriteHealthCheck("admin_manual_probe", "ok")
    return NextResponse.json(
      {
        ok: result.status !== "error",
        result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("admin system health route failed:", error)
    return NextResponse.json({ error: "Health-Check konnte nicht ausgefuehrt werden." }, { status: 500 })
  }
}
