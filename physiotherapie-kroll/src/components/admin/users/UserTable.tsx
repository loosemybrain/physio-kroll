"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserRoleEditor, type UserItem } from "./UserRoleEditor"
import { UserStatusEditor } from "./UserStatusEditor"

type Props = {
  users: UserItem[]
  currentUserId: string
  canManageOwner: boolean
  onRolesSaved: (userId: string, roles: string[]) => void
  onStatusSaved: (userId: string, status: UserItem["status"]) => void
  onError: (message: string) => void
}

function statusBadgeVariant(status: UserItem["status"]): "default" | "secondary" | "destructive" {
  if (status === "active") return "default"
  if (status === "invited") return "secondary"
  return "destructive"
}

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" | "destructive" {
  if (role === "owner") return "destructive"
  if (role === "admin") return "default"
  if (role === "editor") return "secondary"
  return "outline"
}

export function UserTable({ users, currentUserId, canManageOwner, onRolesSaved, onStatusSaved, onError }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>E-Mail</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rollen</TableHead>
          <TableHead>Erstellt</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.userId}>
            <TableCell>
              <div className="font-medium">{user.displayName || "—"}</div>
              <div className="text-xs text-muted-foreground">{user.userId}</div>
            </TableCell>
            <TableCell>{user.email || "—"}</TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(user.status)}>{user.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={`${user.userId}-${role}`} variant={roleBadgeVariant(role)}>
                    {role}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleString("de-DE")}</TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-2">
                <UserStatusEditor
                  user={user}
                  currentUserId={currentUserId}
                  canManageOwner={canManageOwner}
                  onError={onError}
                  onSaved={(status) => onStatusSaved(user.userId, status)}
                />
                <UserRoleEditor
                  user={user}
                  currentUserId={currentUserId}
                  canManageOwner={canManageOwner}
                  onError={onError}
                  onSaved={(roles) => onRolesSaved(user.userId, roles)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

