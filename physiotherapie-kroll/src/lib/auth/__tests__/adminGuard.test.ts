import { describe, it, expect, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { requireAdminGuard } from "../adminGuard"

describe("requireAdminGuard", () => {
  it("401 when no user", async () => {
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      rpc: vi.fn(),
    } as any
    const r = await requireAdminGuard(supabase)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it("403 when user present but not admin", async () => {
    const uid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: uid, email: "x@y.z" } },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    } as any
    const r = await requireAdminGuard(supabase)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(403)
    expect(supabase.rpc).toHaveBeenCalledWith("is_admin", { _user_id: uid })
  })

  it("ok when is_admin returns true", async () => {
    const uid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    const user = { id: uid, email: "admin@example.com" }
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as any
    const r = await requireAdminGuard(supabase)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.user).toBe(user)
  })
})
