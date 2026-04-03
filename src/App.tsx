import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { LobbyPage } from '@/pages/LobbyPage'
import { AuctionRoomPage } from '@/pages/AuctionRoomPage'
import { ScoutPage } from '@/pages/ScoutPage'
import { ComparePage } from '@/pages/ComparePage'
import { ShortlistPage } from '@/pages/ShortlistPage'
import { TeamsPage } from '@/pages/TeamsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/room/:id" element={<AuctionRoomPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/scout" element={<ScoutPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/shortlist" element={<ShortlistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
