import { describe, it, expect, vi } from "vitest"
import { isUserAdminInDatabase } from "../adminAccess"

describe("isUserAdminInDatabase", () => {
  it("returns false when RPC errors", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    } as any
    await expect(isUserAdminInDatabase(supabase, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).resolves.toBe(false)
  })

  it("returns false for empty user id", async () => {
    const supabase = { rpc: vi.fn() } as any
    await expect(isUserAdminInDatabase(supabase, "")).resolves.toBe(false)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it("returns true when RPC returns true", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as any
    const uid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    await expect(isUserAdminInDatabase(supabase, uid)).resolves.toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith("is_admin", { _user_id: uid })
  })

  it("returns false when RPC returns non-true", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any
    await expect(isUserAdminInDatabase(supabase, "cccccccc-cccc-4ccc-8ccc-cccccccccccc")).resolves.toBe(false)
  })
})
