import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const mocks = vi.hoisted(() => ({
  requireAdminWithServiceRoleMock: vi.fn(),
  loadUserRolesMock: vi.fn(),
  loadUserStatusMock: vi.fn(),
  countOperationalAdminCapableUsersMock: vi.fn(),
  setUserRolesAtomicMock: vi.fn(),
  ensureUserExistsMock: vi.fn(),
}))

vi.mock("@/lib/api/adminServiceRoute", () => ({
  isUuidString: vi.fn().mockReturnValue(true),
  requireAdminWithServiceRole: mocks.requireAdminWithServiceRoleMock,
}))

vi.mock("@/lib/server/adminUsers", () => ({
  MANAGEABLE_ROLES: ["user", "editor", "admin", "owner"],
  ensureUserExists: mocks.ensureUserExistsMock,
  loadUserRoles: mocks.loadUserRolesMock,
  loadUserStatus: mocks.loadUserStatusMock,
  isAdminRoleSet: (roles: string[]) => roles.includes("admin") || roles.includes("owner"),
  isOperationalAdminCapable: (roles: string[], status: string) =>
    status !== "disabled" && (roles.includes("admin") || roles.includes("owner")),
  countOperationalAdminCapableUsers: mocks.countOperationalAdminCapableUsersMock,
  setUserRolesAtomic: mocks.setUserRolesAtomicMock,
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
      adminClient: {},
    },
  }
}

describe("PUT /api/admin/users/[userId]/roles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue(makeGate())
    mocks.ensureUserExistsMock.mockResolvedValue(undefined)
    mocks.loadUserRolesMock.mockResolvedValueOnce(["admin"]).mockResolvedValueOnce(["user"])
    mocks.loadUserStatusMock.mockResolvedValue("active")
    mocks.countOperationalAdminCapableUsersMock.mockResolvedValue(2)
    mocks.setUserRolesAtomicMock.mockResolvedValue(undefined)
  })

  it("requires AAL2 for writes", async () => {
    mocks.requireAdminWithServiceRoleMock.mockResolvedValue(makeGate({ aal: "aal1" }))
    const request = new Request("http://localhost/api/admin/users/u/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: ["user", "admin"] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(request, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(403)
  })

  it("blocks owner manipulation by non-owner admin", async () => {
    mocks.loadUserRolesMock.mockReset()
    mocks.loadUserRolesMock.mockResolvedValueOnce(["admin"]).mockResolvedValueOnce(["owner"])
    const request = new Request("http://localhost/api/admin/users/u/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: ["user", "admin"] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(request, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(403)
    expect(mocks.setUserRolesAtomicMock).not.toHaveBeenCalled()
  })

  it("blocks self lockout for own admin capability", async () => {
    const request = new Request("http://localhost/api/admin/users/u/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: ["user"] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(request, { params: Promise.resolve({ userId: "actor-1" }) })
    expect(res.status).toBe(409)
    expect(mocks.setUserRolesAtomicMock).not.toHaveBeenCalled()
  })

  it("updates roles for normal user (admin -> editor) successfully", async () => {
    const request = new Request("http://localhost/api/admin/users/u/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: ["user", "editor"] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(request, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(200)
    expect(mocks.setUserRolesAtomicMock).toHaveBeenCalledWith(expect.anything(), "u-1", ["user", "editor"], "actor-1")
  })

  it("blocks removing last operational admin capability", async () => {
    mocks.loadUserStatusMock.mockResolvedValue("active")
    mocks.loadUserRolesMock.mockReset()
    // actor roles then target roles
    mocks.loadUserRolesMock.mockResolvedValueOnce(["admin"]).mockResolvedValueOnce(["admin"])
    mocks.countOperationalAdminCapableUsersMock.mockResolvedValue(1)

    const request = new Request("http://localhost/api/admin/users/u/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: ["user"] }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(request, { params: Promise.resolve({ userId: "u-1" }) })
    expect(res.status).toBe(409)
    expect(mocks.setUserRolesAtomicMock).not.toHaveBeenCalled()
  })
})

