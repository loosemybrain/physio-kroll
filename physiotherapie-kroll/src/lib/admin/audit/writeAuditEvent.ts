import "server-only"

import type { AdminAuditEventInput } from "./types"
import { writeAuditEventServer } from "@/lib/server/db/adminWrites"

type WriteAuditEventOptions = {
  adminClient?: unknown
}

export async function writeAuditEvent(event: AdminAuditEventInput, options: WriteAuditEventOptions = {}): Promise<void> {
  void options
  await writeAuditEventServer(event)
}
