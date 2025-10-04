import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      faculties: {
        Row: {
          id: string
          name: string
          short_name: string
          color: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          color: string
          icon: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          name: string
          type: 'sport' | 'art'
          category: 'team' | 'individual' | 'mixed'
          max_participants?: number
          icon: string
          format: 'elimination' | 'table'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'sport' | 'art'
          category: 'team' | 'individual' | 'mixed'
          max_participants?: number
          icon: string
          format: 'elimination' | 'table'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'sport' | 'art'
          category?: 'team' | 'individual' | 'mixed'
          max_participants?: number
          icon?: string
          format?: 'elimination' | 'table'
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          competition_id: string
          faculty1_id: string
          faculty2_id: string
          score1?: number
          score2?: number
          status: 'scheduled' | 'live' | 'completed'
          date: string
          time: string
          location: string
          round?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          faculty1_id: string
          faculty2_id: string
          score1?: number
          score2?: number
          status?: 'scheduled' | 'live' | 'completed'
          date: string
          time: string
          location: string
          round?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          faculty1_id?: string
          faculty2_id?: string
          score1?: number
          score2?: number
          status?: 'scheduled' | 'live' | 'completed'
          date?: string
          time?: string
          location?: string
          round?: string
          created_at?: string
          updated_at?: string
        }
      }
      faculty_standings: {
        Row: {
          id: string
          faculty_id: string
          competition_id: string
          gold: number
          silver: number
          bronze: number
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          faculty_id: string
          competition_id: string
          gold?: number
          silver?: number
          bronze?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          faculty_id?: string
          competition_id?: string
          gold?: number
          silver?: number
          bronze?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      table_standings: {
        Row: {
          id: string
          faculty_id: string
          competition_id: string
          points: number
          rank: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          faculty_id: string
          competition_id: string
          points?: number
          rank?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          faculty_id?: string
          competition_id?: string
          points?: number
          rank?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
