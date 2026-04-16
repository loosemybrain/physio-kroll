import { NextResponse } from "next/server"
import { requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"
import { listAdminUsers } from "@/lib/server/adminUsers"

export async function GET(request: Request) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { searchParams } = new URL(request.url)
    const users = await listAdminUsers(gate.ctx.adminClient, {
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      role: searchParams.get("role"),
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error("admin users list failed:", error)
    return NextResponse.json({ error: "Benutzerliste konnte nicht geladen werden." }, { status: 500 })
  }
}

