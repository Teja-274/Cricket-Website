import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/line-chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { IPL_FRANCHISES } from '@/data/franchises'
import { supabase } from '@/lib/supabase'

export function OverAnalysisPage() {
  const [selected, setSelected] = useState(IPL_FRANCHISES[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!supabase) return
      setLoading(true)
      const { data: rows, error } = await supabase.rpc('get_team_over_stats', { team_name: selected.name })
      if (error) console.error(error)
      setData((rows as any[] || []).map(r => ({
        over: Number(r.over_num) + 1,
        runsPerMatch: Number(r.avg_runs),
        totalRuns: Number(r.total_runs),
        wicketsLost: Number(r.wickets_lost),
      })))
      setLoading(false)
    }
    fetch()
  }, [selected])

  const chartConfig: ChartConfig = {
    runsPerMatch: { label: 'Avg Runs', color: '#f5a623' },
    wicketsLost: { label: 'Wickets', color: '#ef4444' },
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Activity className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />OVER-BY-OVER
          </h1>
          <p className="text-muted-foreground mt-1">How teams score and lose wickets across all 20 overs.</p>
        </div>

        {/* Team selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {IPL_FRANCHISES.map(team => (
            <motion.button
              key={team.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(team)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                selected.id === team.id ? '' : 'border-border/50'
              }`}
              style={{
                background: `linear-gradient(135deg, ${team.color}${selected.id === team.id ? '20' : '08'}, transparent)`,
                borderColor: selected.id === team.id ? team.color : undefined,
              }}
            >
              <div className="text-lg font-bold" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>{team.shortName}</div>
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
            <span className="text-muted-foreground">Loading over-by-over data...</span>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-6">
            {/* Runs per over chart */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span style={{ color: selected.color }}>{selected.shortName}</span> — AVG RUNS PER OVER
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={data} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                    <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="runsPerMatch" stroke={selected.color} strokeWidth={3} dot={{ fill: selected.color, r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Wickets lost per over */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span style={{ color: selected.color }}>{selected.shortName}</span> — WICKETS LOST PER OVER
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={data} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                    <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="wicketsLost" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center py-12 text-muted-foreground">No data for {selected.name}</p>
        )}
      </motion.div>
    </div>
  )
}
