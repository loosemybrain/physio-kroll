import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export const USER_STATUSES = ["active", "invited", "disabled"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const MANAGEABLE_ROLES = ["user", "editor", "admin", "owner"] as const
export type ManageableRole = (typeof MANAGEABLE_ROLES)[number]

export type AdminUserListQuery = {
  search?: string | null
  status?: string | null
  role?: string | null
}

export type AdminUserListItem = {
  userId: string
  email: string
  displayName: string | null
  status: UserStatus
  roles: ManageableRole[]
  createdAt: string
}

type AuthAdminUser = {
  id: string
  email?: string | null
  created_at?: string | null
}

type RoleRow = { user_id: string; role_id: string }
type ProfileRow = { user_id: string; display_name: string | null; status: string | null }
type ProfileStatusRow = { status: string | null }

function isManageableRole(v: string): v is ManageableRole {
  return (MANAGEABLE_ROLES as readonly string[]).includes(v)
}

function normalizeRoles(values: unknown): ManageableRole[] {
  if (!Array.isArray(values)) return []
  const next = new Set<ManageableRole>()
  for (const value of values) {
    if (typeof value === "string" && isManageableRole(value)) {
      next.add(value)
    }
  }
  return [...next]
}

export function parseUserStatus(value: unknown): UserStatus | null {
  if (typeof value !== "string") return null
  return (USER_STATUSES as readonly string[]).includes(value) ? (value as UserStatus) : null
}

export function isAdminRoleSet(roles: readonly string[]): boolean {
  return roles.includes("admin") || roles.includes("owner")
}

export function isOperationalAdminCapable(roles: readonly string[], status: UserStatus): boolean {
  return status !== "disabled" && isAdminRoleSet(roles)
}

export async function listAdminUsers(
  adminClient: SupabaseClient,
  query: AdminUserListQuery
): Promise<AdminUserListItem[]> {
  const collected: AuthAdminUser[] = []
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 500 })
    if (error) throw error
    const users = data?.users ?? []
    collected.push(
      ...users.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
      }))
    )
    if (users.length < 500) break
    page += 1
    if (page > 200) break
  }

  const userIds = collected.map((u) => u.id)
  if (userIds.length === 0) return []

  const [{ data: rolesData, error: rolesError }, { data: profileData, error: profileError }] = await Promise.all([
    adminClient.from("user_roles").select("user_id, role_id").in("user_id", userIds),
    adminClient.from("user_profiles").select("user_id, display_name, status").in("user_id", userIds),
  ])

  if (rolesError) throw rolesError
  if (profileError) throw profileError

  const rolesByUser = new Map<string, ManageableRole[]>()
  for (const row of ((rolesData ?? []) as RoleRow[])) {
    if (!isManageableRole(row.role_id)) continue
    const current = rolesByUser.get(row.user_id) ?? []
    if (!current.includes(row.role_id)) {
      rolesByUser.set(row.user_id, [...current, row.role_id])
    }
  }

  const profileByUser = new Map<string, { displayName: string | null; status: UserStatus }>()
  for (const row of ((profileData ?? []) as ProfileRow[])) {
    const status = parseUserStatus(row.status) ?? "active"
    profileByUser.set(row.user_id, { displayName: row.display_name ?? null, status })
  }

  const normalizedSearch = query.search?.trim().toLowerCase() ?? ""
  const normalizedRole = query.role?.trim().toLowerCase() ?? ""
  const normalizedStatus = parseUserStatus(query.status)

  return collected
    .map((u) => {
      const profile = profileByUser.get(u.id)
      const roles = rolesByUser.get(u.id) ?? ["user"]
      return {
        userId: u.id,
        email: u.email ?? "",
        displayName: profile?.displayName ?? null,
        status: profile?.status ?? "active",
        roles,
        createdAt: u.created_at ?? new Date(0).toISOString(),
      } satisfies AdminUserListItem
    })
    .filter((item) => {
      if (normalizedStatus && item.status !== normalizedStatus) return false
      if (normalizedRole) {
        if (!isManageableRole(normalizedRole)) return false
        if (!item.roles.includes(normalizedRole)) return false
      }
      if (!normalizedSearch) return true
      const haystack = `${item.email} ${item.displayName ?? ""} ${item.status} ${item.roles.join(" ")}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
    .sort((a, b) => {
      const byDate = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (Number.isFinite(byDate) && byDate !== 0) return byDate
      return a.email.localeCompare(b.email)
    })
}

export async function loadUserRoles(adminClient: SupabaseClient, userId: string): Promise<ManageableRole[]> {
  const { data, error } = await adminClient.from("user_roles").select("role_id").eq("user_id", userId)
  if (error) throw error
  return normalizeRoles((data ?? []).map((r: { role_id: string }) => r.role_id))
}

export async function loadUserStatus(adminClient: SupabaseClient, userId: string): Promise<UserStatus> {
  const { data, error } = await adminClient.from("user_profiles").select("status").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return parseUserStatus((data as ProfileStatusRow | null)?.status ?? null) ?? "active"
}

export async function isUserDisabled(adminClient: SupabaseClient, userId: string): Promise<boolean> {
  return (await loadUserStatus(adminClient, userId)) === "disabled"
}

export async function countOperationalAdminCapableUsers(adminClient: SupabaseClient): Promise<number> {
  const [{ data: roleRows, error: roleError }, { data: profileRows, error: profileError }] = await Promise.all([
    adminClient.from("user_roles").select("user_id, role_id"),
    adminClient.from("user_profiles").select("user_id, status"),
  ])
  if (roleError) throw roleError
  if (profileError) throw profileError

  const statusByUser = new Map<string, UserStatus>()
  for (const row of ((profileRows ?? []) as Array<{ user_id: string; status: string | null }>)) {
    statusByUser.set(row.user_id, parseUserStatus(row.status) ?? "active")
  }

  const roleSetByUser = new Map<string, Set<string>>()
  for (const row of (roleRows ?? []) as RoleRow[]) {
    const current = roleSetByUser.get(row.user_id) ?? new Set<string>()
    current.add(row.role_id)
    roleSetByUser.set(row.user_id, current)
  }

  let count = 0
  for (const [userId, roles] of roleSetByUser.entries()) {
    const status = statusByUser.get(userId) ?? "active"
    if (isOperationalAdminCapable([...roles], status)) {
      count += 1
    }
  }
  return count
}

export async function setUserRolesAtomic(
  adminClient: SupabaseClient,
  targetUserId: string,
  roles: readonly ManageableRole[],
  assignedBy: string
): Promise<void> {
  const { error } = await adminClient.rpc("admin_set_user_roles", {
    _target_user_id: targetUserId,
    _roles: [...new Set(roles)],
    _assigned_by: assignedBy,
  })
  if (error) throw error
}

export async function ensureUserExists(adminClient: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId)
  if (error || !data?.user?.id) {
    const err = new Error("USER_NOT_FOUND")
    ;(err as Error & { code?: string }).code = "USER_NOT_FOUND"
    throw err
  }
}

