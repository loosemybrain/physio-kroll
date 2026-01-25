import type { Database } from "./supabase"

/**
 * Re-export database types from generated Supabase types
 * These types are generated from your Supabase schema
 */
export type { Database }

/**
 * Type helpers for database tables
 */
export type PagesTable = Database["public"]["Tables"]["pages"]["Row"]
export type PageBlocksTable = Database["public"]["Tables"]["page_blocks"]["Row"]

export type PagesInsert = Database["public"]["Tables"]["pages"]["Insert"]
export type PageBlocksInsert = Database["public"]["Tables"]["page_blocks"]["Insert"]

export type PagesUpdate = Database["public"]["Tables"]["pages"]["Update"]
export type PageBlocksUpdate = Database["public"]["Tables"]["page_blocks"]["Update"]
