import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint. admin_access_verified wird ausschließlich serverseitig nach finalem MFA/AAL2 geschrieben.",
    },
    { status: 410 }
  )
}
