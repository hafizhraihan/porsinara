import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production'

// Create client only if environment variables are available
let supabase: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  if (isBuildTime) {
    // During build time, create a mock client
    supabase = createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: { persistSession: false },
        global: { fetch: () => Promise.resolve(new Response('{}')) }
      }
    )
  } else {
    throw new Error('Missing Supabase environment variables')
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: !isBuildTime,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'porsinara'
      }
    }
  })
}

export { supabase }

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
