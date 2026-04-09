import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Trophy, Zap, Target, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/line-chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getTopBatsmen, getTopBowlers, getOverviewStats } from '@/lib/queries'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [batsmen, setBatsmen] = useState<any[]>([])
  const [bowlers, setBowlers] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const [b, w, o] = await Promise.all([
        getTopBatsmen(15),
        getTopBowlers(15),
        getOverviewStats(),
      ])
      setBatsmen(b)
      setBowlers(w)
      setOverview(o)
      setLoading(false)
    }
    fetch()
  }, [])

  const batConfig: ChartConfig = { runs: { label: 'Runs', color: '#f5a623' } }
  const bowlConfig: ChartConfig = { wickets: { label: 'Wickets', color: '#22c55e' } }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <BarChart3 className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
            IPL ANALYTICS
          </h1>
          <p className="text-muted-foreground mt-1">Real stats from 1,175 IPL matches and 279,586 deliveries.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground">Loading analytics from Supabase...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Matches', value: overview.totalMatches, icon: Trophy, color: 'text-primary' },
                  { label: 'Total Deliveries', value: overview.totalDeliveries, icon: Target, color: 'text-chart-2' },
                  { label: 'Total Wickets', value: overview.totalWickets, icon: Zap, color: 'text-chart-5' },
                  { label: 'Total Sixes', value: overview.totalSixes, icon: BarChart3, color: 'text-chart-3' },
                ].map(s => (
                  <motion.div key={s.label} whileHover={{ scale: 1.03, y: -2 }}
                    className="relative p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden">
                    <BorderBeam size={100} duration={10} colorFrom="#f5a623" colorTo="#22c55e" className="opacity-30" />
                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <div className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>
                      <NumberTicker value={s.value} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Top Batsmen */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <span className="text-primary">🧡</span> TOP RUN SCORERS — ALL TIME
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batsmen.length > 0 ? (
                    <ChartContainer config={batConfig} className="h-[350px]">
                      <BarChart data={batsmen.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 10 }}>
                        <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={95} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="runs" fill="#f5a623" radius={[0, 4, 4, 0]} barSize={16}
                          filter="url(#glow-a)" />
                        <defs>
                          <filter id="glow-a" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                      </BarChart>
                    </ChartContainer>
                  ) : <p className="text-muted-foreground text-center py-8">No data available</p>}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <span className="text-chart-4">💜</span> TOP WICKET TAKERS — ALL TIME
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bowlers.length > 0 ? (
                    <ChartContainer config={bowlConfig} className="h-[350px]">
                      <BarChart data={bowlers.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 10 }}>
                        <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={95} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="wickets" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={16}
                          filter="url(#glow-b)" />
                        <defs>
                          <filter id="glow-b" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                      </BarChart>
                    </ChartContainer>
                  ) : <p className="text-muted-foreground text-center py-8">No data available</p>}
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Tables */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Batting Table */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>BATTING LEADERBOARD</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Player</th>
                        <th className="text-right p-3">Mat</th>
                        <th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">Avg</th>
                        <th className="text-right p-3">SR</th>
                        <th className="text-right p-3">6s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batsmen.slice(0, 15).map((b, i) => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="border-b border-border/10 hover:bg-background/30 cursor-pointer"
                          onClick={() => navigate(`/player/${b.id}`)}>
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-right">{b.matches}</td>
                          <td className="p-3 text-right font-bold text-primary">{b.runs}</td>
                          <td className="p-3 text-right">{b.avg}</td>
                          <td className="p-3 text-right">{b.sr}</td>
                          <td className="p-3 text-right">{b.sixes}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Table */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>BOWLING LEADERBOARD</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Player</th>
                        <th className="text-right p-3">Mat</th>
                        <th className="text-right p-3">Wkts</th>
                        <th className="text-right p-3">Econ</th>
                        <th className="text-right p-3">Avg</th>
                        <th className="text-right p-3">Dots</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlers.slice(0, 15).map((b, i) => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="border-b border-border/10 hover:bg-background/30 cursor-pointer"
                          onClick={() => navigate(`/player/${b.id}`)}>
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-right">{b.matches}</td>
                          <td className="p-3 text-right font-bold text-chart-2">{b.wickets}</td>
                          <td className="p-3 text-right">{b.economy}</td>
                          <td className="p-3 text-right">{b.avg}</td>
                          <td className="p-3 text-right">{b.dots}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
