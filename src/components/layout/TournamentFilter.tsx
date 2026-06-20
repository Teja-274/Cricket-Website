import { useEffect } from 'react'
import { Trophy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTournamentStore, type Tournament } from '@/store/tournamentStore'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TournamentFilterProps {
  /** Display mode: 'chips' shows colored pills, 'dropdown' shows a single button */
  variant?: 'chips' | 'dropdown'
  className?: string
}

/**
 * Global tournament filter — drives which leagues' data the user sees.
 * Backed by useTournamentStore (persisted to localStorage).
 */
export function TournamentFilter({ variant = 'dropdown', className }: TournamentFilterProps) {
  const { tournaments, selected, loaded, setTournaments, toggle, selectOnly, selectAll } =
    useTournamentStore()

  // Lazy-load tournament list on first mount
  useEffect(() => {
    if (loaded || !supabase) return
    ;(async () => {
      const { data, error } = await supabase!
        .from('tournaments')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setTournaments(data as Tournament[])
      }
    })()
  }, [loaded, setTournaments])

  if (variant === 'chips') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tournaments.map((t) => {
          const isSelected = selected.includes(t.code)
          return (
            <button
              key={t.code}
              onClick={() => toggle(t.code)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              )}
              style={
                isSelected
                  ? { backgroundColor: t.color, borderColor: t.color }
                  : undefined
              }
              title={t.name}
            >
              {t.short_name || t.code}
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown mode
  const label =
    selected.length === tournaments.length
      ? 'All tournaments'
      : selected.length === 1
        ? tournaments.find((t) => t.code === selected[0])?.short_name || selected[0]
        : `${selected.length} tournaments`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-900 transition-colors',
          className
        )}
      >
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
        <span>{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800">
        <DropdownMenuLabel className="text-xs text-zinc-500">
          Filter by tournament
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {tournaments.map((t) => {
          const isSelected = selected.includes(t.code)
          return (
            <DropdownMenuItem
              key={t.code}
              onSelect={(e) => {
                e.preventDefault()
                toggle(t.code)
              }}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-sm">{t.name}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            selectAll()
          }}
          className="text-xs text-zinc-400 cursor-pointer"
        >
          Select all
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            selectOnly('IPL')
          }}
          className="text-xs text-zinc-400 cursor-pointer"
        >
          IPL only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
