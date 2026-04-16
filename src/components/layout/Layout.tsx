import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Gavel, Search, BarChart3, Trophy, Swords, MapPin, Calendar,
  Shield, Star, Target, GitCompareArrows, Activity, Crosshair, MoreHorizontal, X,
} from 'lucide-react'
import { StarsBackground } from '@/components/ui/stars'
import { LimelightNav } from '@/components/ui/limelight-nav'
import type { NavItem } from '@/components/ui/limelight-nav'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SoundToggle } from '@/components/ui/sound-toggle'

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}

const primaryRoutes = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/lobby', icon: Gavel, label: 'Auction' },
  { path: '/scout', icon: Search, label: 'Scout' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/h2h', icon: Swords, label: 'H2H' },
  { path: '/season', icon: Calendar, label: 'Seasons' },
]

const secondaryRoutes = [
  { path: '/teams', icon: Shield, label: 'Team Squads' },
  { path: '/compare', icon: GitCompareArrows, label: 'Compare' },
  { path: '/shortlist', icon: Star, label: 'Shortlist' },
  { path: '/strategy', icon: Target, label: 'Strategy' },
  { path: '/venues', icon: MapPin, label: 'Venues' },
  { path: '/matchups', icon: Crosshair, label: 'Matchups' },
  { path: '/franchises', icon: Trophy, label: 'Franchises' },
  { path: '/overs', icon: Activity, label: 'Over Analysis' },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    setShowMore(false)
  }, [location.pathname])

  const activeIndex = primaryRoutes.findIndex(r =>
    r.path === '/' ? location.pathname === '/' : location.pathname.startsWith(r.path)
  )

  const navItems: NavItem[] = primaryRoutes.map(r => ({
    id: r.path,
    icon: <r.icon />,
    label: r.label,
    onClick: () => navigate(r.path),
  }))

  navItems.push({
    id: 'more',
    icon: <MoreHorizontal />,
    label: 'More',
    onClick: () => setShowMore(prev => !prev),
  })

  return (
    <StarsBackground
      className="min-h-screen bg-background"
      starColor="rgba(255, 255, 255, 0.8)"
      speed={80}
      factor={0.03}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card/60 backdrop-blur-xl border-b border-border/30 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          <span className="text-sm font-bold text-primary tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
            SCOUT INDIA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SoundToggle />
        </div>
      </div>

      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 p-4 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  MORE PAGES
                </span>
                <button onClick={() => setShowMore(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {secondaryRoutes.map(r => {
                  const isActive = location.pathname.startsWith(r.path)
                  return (
                    <motion.button
                      key={r.path}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { navigate(r.path); setShowMore(false) }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{r.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-h-screen pt-14 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <LimelightNav
          items={navItems}
          defaultActiveIndex={activeIndex >= 0 ? activeIndex : 0}
          className="shadow-2xl shadow-black/30"
        />
      </div>
    </StarsBackground>
  )
}
