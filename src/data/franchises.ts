export interface Franchise {
  id: string
  name: string
  shortName: string
  color: string
  logo: string
  purseRemaining: number
  rtmCards: number
  playersBought: number
  players: string[]
}

export const IPL_FRANCHISES: Omit<Franchise, 'purseRemaining' | 'rtmCards' | 'playersBought' | 'players'>[] = [
  { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0', logo: 'MI' },
  { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', color: '#FCCA06', logo: 'CSK' },
  { id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', color: '#EC1C24', logo: 'RCB' },
  { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#3A225D', logo: 'KKR' },
  { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', color: '#004C93', logo: 'DC' },
  { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#FF822A', logo: 'SRH' },
  { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', color: '#ED1B24', logo: 'PBKS' },
  { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', color: '#EA1A85', logo: 'RR' },
  { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#A72056', logo: 'LSG' },
  { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', color: '#1C1C1C', logo: 'GT' },
]

export function createFranchise(base: typeof IPL_FRANCHISES[number], purse = 100): Franchise {
  return {
    ...base,
    purseRemaining: purse,
    rtmCards: 2,
    playersBought: 0,
    players: [],
  }
}
