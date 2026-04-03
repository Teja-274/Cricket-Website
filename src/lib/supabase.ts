// Supabase client - mock-ready, wire real keys when available
// Replace these with real values from your Supabase project

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY

// When ready: npm install @supabase/supabase-js
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Mock auth service
export const auth = {
  signIn: async (_email: string, _password: string) => {
    // Mock - returns success after delay
    await new Promise(r => setTimeout(r, 800))
    return { user: { id: 'mock-user', email: _email }, error: null }
  },
  signUp: async (_email: string, _password: string, _name: string) => {
    await new Promise(r => setTimeout(r, 800))
    return { user: { id: 'mock-user', email: _email, name: _name }, error: null }
  },
  signOut: async () => {
    await new Promise(r => setTimeout(r, 300))
    return { error: null }
  },
  getUser: () => {
    return null // No user when mocked
  },
}

// Mock realtime subscription
export const realtime = {
  subscribeToBids: (_roomId: string, _onBid: (bid: unknown) => void) => {
    console.log('[Supabase Mock] Would subscribe to bids for room:', _roomId)
    return { unsubscribe: () => {} }
  },
  subscribeToRoom: (_roomId: string, _onUpdate: (room: unknown) => void) => {
    console.log('[Supabase Mock] Would subscribe to room state:', _roomId)
    return { unsubscribe: () => {} }
  },
}

// Mock database operations
export const db = {
  createRoom: async (room: unknown) => {
    console.log('[Supabase Mock] Would create room:', room)
    return { data: room, error: null }
  },
  joinRoom: async (_roomId: string, _franchiseId: string) => {
    console.log('[Supabase Mock] Would join room')
    return { error: null }
  },
  placeBid: async (bid: unknown) => {
    console.log('[Supabase Mock] Would place bid:', bid)
    return { error: null }
  },
  getRoom: async (_roomId: string) => {
    return { data: null, error: null }
  },
}
