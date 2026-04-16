import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, ChevronLeft, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { getAllVenues, getVenueStats } from '@/lib/queries'

export function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [venueStats, setVenueStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    getAllVenues().then(v => { setVenues(v); setLoading(false) })
  }, [])

  const handleSelectVenue = async (venue: any) => {
    setSelectedVenue(venue)
    setLoadingStats(true)
    const stats = await getVenueStats(venue.id)
    setVenueStats(stats)
    setLoadingStats(false)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <MapPin className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />VENUE INTELLIGENCE
          </h1>
          <p className="text-muted-foreground mt-1">Performance data for every IPL stadium.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
            <span className="text-muted-foreground">Loading venues...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Venue List */}
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
              {venues.map((v, i) => (
                <motion.button key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  whileHover={{ x: 4 }} onClick={() => handleSelectVenue(v)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedVenue?.id === v.id ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-border/60 bg-card/50'
                  }`}>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{v.city}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Venue Details */}
            <AnimatePresence mode="wait">
              {selectedVenue ? (
                <motion.div key={selectedVenue.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
                  <BorderBeam size={200} duration={10} colorFrom="#c0c8d4" colorTo="#22c55e" />

                  <div className="p-6 border-b border-border/30" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05), transparent)' }}>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedVenue(null); setVenueStats(null) }} className="lg:hidden mb-2">
                      <ChevronLeft className="w-4 h-4 mr-1" />Back
                    </Button>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{selectedVenue.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{selectedVenue.city}</p>
                  </div>

                  {loadingStats ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : venueStats ? (
                    <div className="p-6 space-y-6">
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={venueStats.totalMatches} /></div>
                          <div className="text-xs text-muted-foreground">Matches Played</div>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={venueStats.avgFirstInnings} /></div>
                          <div className="text-xs text-muted-foreground">Avg 1st Innings</div>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold text-chart-3" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={venueStats.avgSecondInnings} /></div>
                          <div className="text-xs text-muted-foreground">Avg 2nd Innings</div>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold text-chart-5" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={venueStats.highestScore} /></div>
                          <div className="text-xs text-muted-foreground">Highest Score</div>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{venueStats.batFirstWinPct}%</div>
                          <div className="text-xs text-muted-foreground">Bat First Win %</div>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50">
                          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{venueStats.fieldFirstWinPct}%</div>
                          <div className="text-xs text-muted-foreground">Field First Win %</div>
                        </div>
                      </div>

                      {/* Top scorers */}
                      {venueStats.topScorers.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                            <Trophy className="w-3.5 h-3.5 text-primary" />TOP SCORERS AT THIS VENUE
                          </h3>
                          <div className="space-y-1.5">
                            {venueStats.topScorers.map((s: any, i: number) => (
                              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-background/30 text-sm">
                                <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                                <span className="font-medium flex-1">{s.name}</span>
                                <span className="font-bold text-primary">{s.runs} runs</span>
                                <span className="text-xs text-muted-foreground">{s.matches} mat</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <MapPin className="w-16 h-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>SELECT A VENUE</h3>
                  <p className="text-sm text-muted-foreground mt-2">Click on a stadium to view its stats.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
