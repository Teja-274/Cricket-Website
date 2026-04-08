import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { LobbyPage } from '@/pages/LobbyPage'
import { AuctionRoomPage } from '@/pages/AuctionRoomPage'
import { ScoutPage } from '@/pages/ScoutPage'
import { ComparePage } from '@/pages/ComparePage'
import { ShortlistPage } from '@/pages/ShortlistPage'
import { TeamsPage } from '@/pages/TeamsPage'
import { PlayerProfilePage } from '@/pages/PlayerProfilePage'
import { AuctionResultsPage } from '@/pages/AuctionResultsPage'
import { StrategyPage } from '@/pages/StrategyPage'
import { LoginPage } from '@/pages/LoginPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { HeadToHeadPage } from '@/pages/HeadToHeadPage'
import { VenuesPage } from '@/pages/VenuesPage'
import { SeasonPage } from '@/pages/SeasonPage'
import { CricketBallCursor } from '@/components/ui/cricket-ball-cursor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth - no sidebar */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main app with sidebar */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/room/:id" element={<AuctionRoomPage />} />
          <Route path="/results" element={<AuctionResultsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/scout" element={<ScoutPage />} />
          <Route path="/player/:id" element={<PlayerProfilePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/shortlist" element={<ShortlistPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/h2h" element={<HeadToHeadPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/season/:year" element={<SeasonPage />} />
          <Route path="/season" element={<SeasonPage />} />
        </Route>
      </Routes>
      <CricketBallCursor />
      <Toaster richColors position="bottom-right" theme="dark" />
    </BrowserRouter>
  )
}
