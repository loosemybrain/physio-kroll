import { describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import {
  countOperationalAdminCapableUsers,
  isOperationalAdminCapable,
} from "../adminUsers"

describe("adminUsers semantics", () => {
  it("treats admin/owner with non-disabled status as operational admin-capable", () => {
    expect(isOperationalAdminCapable(["admin"], "active")).toBe(true)
    expect(isOperationalAdminCapable(["owner"], "invited")).toBe(true)
    expect(isOperationalAdminCapable(["editor"], "active")).toBe(false)
    expect(isOperationalAdminCapable(["admin"], "disabled")).toBe(false)
  })

  it("counts only operational admin-capable users", async () => {
    const fromMock = vi.fn((table: string) => {
      if (table === "user_roles") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { user_id: "u1", role_id: "admin" },
              { user_id: "u2", role_id: "owner" },
              { user_id: "u3", role_id: "admin" },
              { user_id: "u4", role_id: "editor" },
            ],
            error: null,
          }),
        }
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [
            { user_id: "u1", status: "active" },
            { user_id: "u2", status: "disabled" },
            { user_id: "u3", status: "invited" },
            { user_id: "u4", status: "active" },
          ],
          error: null,
        }),
      }
    })

    const client = { from: fromMock } as any
    await expect(countOperationalAdminCapableUsers(client)).resolves.toBe(2)
  })
})

