/**
 * This file contains the generated types from Supabase
 * Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 * 
 * For now, this is a manual type definition based on the schema
 */

import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockType, CMSBlock } from "./cms"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          brand: BrandKey
          meta_description: string | null
          meta_keywords: string[] | null
          created_at: string
          updated_at: string
          published: boolean
        }
        Insert: {
          id?: string
          title: string
          slug: string
          brand: BrandKey
          meta_description?: string | null
          meta_keywords?: string[] | null
          created_at?: string
          updated_at?: string
          published?: boolean
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          brand?: BrandKey
          meta_description?: string | null
          meta_keywords?: string[] | null
          created_at?: string
          updated_at?: string
          published?: boolean
        }
      }
      page_blocks: {
        Row: {
          id: string
          page_id: string
          block_type: BlockType
          block_props: Json
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          block_type: BlockType
          block_props: Json
          sort_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          block_type?: BlockType
          block_props?: Json
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          sans_preset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sans_preset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sans_preset?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
