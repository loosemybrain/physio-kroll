import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const mocks = vi.hoisted(() => ({
  requireAdminWithServiceRoleMock: vi.fn(),
  ensureUserExistsMock: vi.fn(),
  loadUserRolesMock: vi.fn(),
  loadUserStatusMock: vi.fn(),
  countOperationalAdminCapableUsersMock: vi.fn(),
  upsertMock: vi.fn(),
}))

const fromMock = vi.fn(() => ({ upsert: mocks.upsertMock }))

vi.mock("@/lib/api/adminServiceRoute", () => ({
  isUuidString: vi.fn().mockReturnValue(true),
  requireAdminWithServiceRole: mocks.requireAdminWithServiceRoleMock,
}))

vi.mock("@/lib/server/adminUsers", () => ({
  ensureUserExists: mocks.ensureUserExistsMock,
  loadUserRoles: mocks.loadUserRolesMock,
  loadUserStatus: mocks.loadUserStatusMock,
  parseUserStatus: (value: string | null | undefined) =>
    value === "active" || value === "invited" || value === "disabled" ? value : null,
  isOperationalAdminCapable: (roles: string[], status: string) =>
    status !== "disabled" && (roles.includes("admin") || roles.includes("owner")),
  countOperationalAdminCapableUsers: mocks.countOperationalAdminCapableUsersMock,
}))

import { PUT } from "./route"

function makeGate(overrides?: { aal?: string }) {
  return {
    ok: true as const,
    ctx: {
      user: { id: "actor-1" },
      sessionClient: {
        auth: {
          mfa: {
            getAuthenticatorAssuranceLevel: vi
              .fn()
              .mockResolvedValue({ data: { currentLevel: overrides?.aal ?? "aal2" }, error: null }),
          },
        },
      },
      adminClient: { from: fromMock },
    },
  }
}

describe("PUT /api/admin/users/[userId]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue(makeGate())
    mocks.ensureUserExistsMock.mockResolvedValue(undefined)
    mocks.loadUserRolesMock.mockResolvedValueOnce(["admin"]).mockResolvedValueOnce(["admin"])
    mocks.loadUserStatusMock.mockResolvedValue("active")
    mocks.countOperationalAdminCapableUsersMock.mockResolvedValue(2)
    mocks.upsertMock.mockResolvedValue({ error: null })
  })

  it("requires AAL2 for writes", async () => {
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue(makeGate({ aal: "aal1" }))
    const req = new Request("http://localhost/api/admin/users/u/status", {
      method: "PUT",
      body: JSON.stringify({ status: "disabled" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(403)
  })

  it("blocks disabling last operational admin", async () => {
    mocks.countOperationalAdminCapableUsersMock.mockResolvedValue(1)
    const req = new Request("http://localhost/api/admin/users/u/status", {
      method: "PUT",
      body: JSON.stringify({ status: "disabled" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(409)
    expect(mocks.upsertMock).not.toHaveBeenCalled()
  })

  it("updates status successfully for non-last admin", async () => {
    const req = new Request("http://localhost/api/admin/users/u/status", {
      method: "PUT",
      body: JSON.stringify({ status: "disabled" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(200)
    expect(mocks.upsertMock).toHaveBeenCalled()
  })

  it("returns 403 for non-admin caller", async () => {
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue({
      ok: false as const,
      response: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
    })
    const req = new Request("http://localhost/api/admin/users/u/status", {
      method: "PUT",
      body: JSON.stringify({ status: "active" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(403)
  })
})

