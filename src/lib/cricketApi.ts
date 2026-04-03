// Live Cricket Stats API service - mock-ready
// Wire CricketData.org or Cricsheet.org when API key is available

const CRICKET_API_KEY = import.meta.env.VITE_CRICKET_API_KEY || ''

export const isCricketApiConfigured = () => !!CRICKET_API_KEY

// Real implementation (uncomment when API key is ready):
// const BASE_URL = 'https://api.cricapi.com/v1'
//
// export async function fetchPlayerStats(playerName: string) {
//   const res = await fetch(`${BASE_URL}/players_info?apikey=${CRICKET_API_KEY}&name=${encodeURIComponent(playerName)}`)
//   return res.json()
// }
//
// export async function fetchLiveMatches() {
//   const res = await fetch(`${BASE_URL}/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`)
//   return res.json()
// }

// Mock live match data
export interface LiveMatch {
  id: string
  teams: [string, string]
  score: string
  status: string
  venue: string
}

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  await new Promise(r => setTimeout(r, 500))
  return [
    { id: '1', teams: ['Mumbai Indians', 'Chennai Super Kings'], score: 'MI 185/4 (18.2 ov)', status: 'In Progress', venue: 'Wankhede Stadium, Mumbai' },
    { id: '2', teams: ['Royal Challengers Bengaluru', 'Kolkata Knight Riders'], score: 'RCB 142/6 (20 ov) | KKR 98/3 (12.4 ov)', status: 'In Progress', venue: 'M. Chinnaswamy Stadium, Bengaluru' },
    { id: '3', teams: ['Rajasthan Royals', 'Delhi Capitals'], score: 'RR 201/3 (20 ov) | DC 156/8 (20 ov)', status: 'RR won by 45 runs', venue: 'Sawai Mansingh Stadium, Jaipur' },
  ]
}

// Mock player season stats
export interface SeasonStat {
  season: string
  matches: number
  runs?: number
  avg?: number
  sr?: number
  wickets?: number
  economy?: number
}

export async function fetchPlayerSeasonHistory(_playerName: string): Promise<SeasonStat[]> {
  await new Promise(r => setTimeout(r, 400))
  // Generic mock data - will be replaced with real API data
  return [
    { season: 'IPL 2021', matches: 14, runs: 440, avg: 33.8, sr: 138.4 },
    { season: 'IPL 2022', matches: 16, runs: 521, avg: 37.2, sr: 142.1 },
    { season: 'IPL 2023', matches: 14, runs: 485, avg: 34.6, sr: 151.3 },
    { season: 'IPL 2024', matches: 15, runs: 557, avg: 39.8, sr: 158.7 },
    { season: 'IPL 2025', matches: 12, runs: 398, avg: 36.2, sr: 145.2 },
  ]
}
