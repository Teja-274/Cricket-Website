import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'public' },
      global: { headers: { 'apikey': SUPABASE_ANON_KEY } },
    })
  : null

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    if (!supabase) return { user: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { user: data?.user ?? null, error }
  },

  signUp: async (email: string, password: string, name: string) => {
    if (!supabase) return { user: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { user: data?.user ?? null, error }
  },

  signOut: async () => {
    if (!supabase) return { error: null }
    return await supabase.auth.signOut()
  },

  getUser: async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  },

  onAuthChange: (callback: (user: unknown) => void) => {
    if (!supabase) return { unsubscribe: () => {} }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
    return { unsubscribe: () => data.subscription.unsubscribe() }
  },
}

// Realtime subscriptions
export const realtime = {
  subscribeToBids: (roomId: string, onBid: (bid: unknown) => void) => {
    if (!supabase) {
      console.log('[Supabase] Not configured — using mock mode')
      return { unsubscribe: () => {} }
    }
    const channel = supabase
      .channel(`room-bids-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => onBid(payload.new))
      .subscribe()
    return { unsubscribe: () => supabase.removeChannel(channel) }
  },

  subscribeToRoom: (roomId: string, onUpdate: (room: unknown) => void) => {
    if (!supabase) return { unsubscribe: () => {} }
    const channel = supabase
      .channel(`room-state-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auction_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => onUpdate(payload.new))
      .subscribe()
    return { unsubscribe: () => supabase.removeChannel(channel) }
  },
}

// Database operations
export const db = {
  createRoom: async (room: Record<string, unknown>) => {
    if (!supabase) return { data: room, error: null }
    return await supabase.from('auction_rooms').insert(room).select().single()
  },

  joinRoom: async (roomId: string, franchiseData: Record<string, unknown>) => {
    if (!supabase) return { error: null }
    return await supabase.from('franchises').insert({ room_id: roomId, ...franchiseData })
  },

  placeBid: async (bid: Record<string, unknown>) => {
    if (!supabase) return { error: null }
    return await supabase.from('bids').insert(bid)
  },

  getRoom: async (roomId: string) => {
    if (!supabase) return { data: null, error: null }
    return await supabase.from('auction_rooms').select('*').eq('id', roomId).single()
  },

  getRoomPlayers: async (roomId: string) => {
    if (!supabase) return { data: [], error: null }
    return await supabase.from('auction_players').select('*').eq('room_id', roomId).order('sort_order')
  },

  updatePlayer: async (playerId: string, updates: Record<string, unknown>) => {
    if (!supabase) return { error: null }
    return await supabase.from('auction_players').update(updates).eq('id', playerId)
  },
}
