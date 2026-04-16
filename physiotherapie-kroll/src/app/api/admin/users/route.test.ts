import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const mocks = vi.hoisted(() => ({
  requireAdminWithServiceRoleMock: vi.fn(),
  listAdminUsersMock: vi.fn(),
}))

vi.mock("@/lib/api/adminServiceRoute", () => ({
  requireAdminWithServiceRole: mocks.requireAdminWithServiceRoleMock,
}))

vi.mock("@/lib/server/adminUsers", () => ({
  listAdminUsers: mocks.listAdminUsersMock,
}))

import { GET } from "./route"

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue({
      ok: false as const,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    })
    const req = new Request("http://localhost/api/admin/users", { method: "GET" })
    const res = await GET(req)
    expect(res.status).toBe(403)
    expect(mocks.listAdminUsersMock).not.toHaveBeenCalled()
  })

  it("returns users for admin", async () => {
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue({
      ok: true as const,
      ctx: { adminClient: { __x: true } },
    })
    mocks.listAdminUsersMock.mockResolvedValue([
      {
        userId: "u1",
        email: "a@b.c",
        displayName: "A",
        status: "active",
        roles: ["user"],
        createdAt: new Date().toISOString(),
      },
    ])
    const req = new Request("http://localhost/api/admin/users?search=a", { method: "GET" })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const payload = await res.json()
    expect(Array.isArray(payload.users)).toBe(true)
    expect(mocks.listAdminUsersMock).toHaveBeenCalled()
  })
})

