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
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TournamentFilterProps {
  /** Display mode: 'chips' shows colored pills, 'dropdown' shows a single button */
  variant?: 'chips' | 'dropdown'
  className?: string
}

// Hardcoded fallback so the UI works even if the Supabase fetch fails or returns empty
const FALLBACK_TOURNAMENTS: Tournament[] = [
  { code: 'IPL',  name: 'Indian Premier League',    country: 'India',       format: 'T20', short_name: 'IPL',  color: '#FF6B35', is_active: true, sort_order: 1 },
  { code: 'SMAT', name: 'Syed Mushtaq Ali Trophy',  country: 'India',       format: 'T20', short_name: 'SMAT', color: '#1F4E8C', is_active: true, sort_order: 2 },
  { code: 'T20I', name: 'T20 Internationals (Men)', country: 'World',       format: 'T20', short_name: 'T20I', color: '#0EA5E9', is_active: true, sort_order: 3 },
  { code: 'BBL',  name: 'Big Bash League',          country: 'Australia',   format: 'T20', short_name: 'BBL',  color: '#F59E0B', is_active: true, sort_order: 4 },
  { code: 'PSL',  name: 'Pakistan Super League',    country: 'Pakistan',    format: 'T20', short_name: 'PSL',  color: '#16A34A', is_active: true, sort_order: 5 },
  { code: 'CPL',  name: 'Caribbean Premier League', country: 'West Indies', format: 'T20', short_name: 'CPL',  color: '#7C3AED', is_active: true, sort_order: 6 },
]

/**
 * Global tournament filter — drives which leagues' data the user sees.
 * Backed by useTournamentStore (persisted to localStorage).
 */
export function TournamentFilter({ variant = 'dropdown', className }: TournamentFilterProps) {
  const { tournaments: storeTournaments, selected, loaded, setTournaments, toggle, selectOnly, selectAll } =
    useTournamentStore()

  // Always have a usable list — even if Supabase fetch fails or DB is empty
  const tournaments = storeTournaments.length > 0 ? storeTournaments : FALLBACK_TOURNAMENTS

  // Lazy-load tournament list on first mount
  useEffect(() => {
    if (loaded || !supabase) {
      // Seed store with fallback so other components can read it too
      if (!loaded) setTournaments(FALLBACK_TOURNAMENTS)
      return
    }
    ;(async () => {
      try {
        const { data, error } = await supabase!
          .from('tournaments')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        if (error) {
          console.warn('[TournamentFilter] Supabase fetch failed, using fallback:', error)
          setTournaments(FALLBACK_TOURNAMENTS)
        } else if (data && data.length > 0) {
          setTournaments(data as Tournament[])
        } else {
          console.warn('[TournamentFilter] Empty tournaments table, using fallback')
          setTournaments(FALLBACK_TOURNAMENTS)
        }
      } catch (e) {
        console.warn('[TournamentFilter] Fetch threw, using fallback:', e)
        setTournaments(FALLBACK_TOURNAMENTS)
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
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 bg-zinc-950 border border-zinc-800 z-[100]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-zinc-500">
            Filter by tournament
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {tournaments.map((t) => {
          const isSelected = selected.includes(t.code)
          return (
            <DropdownMenuCheckboxItem
              key={t.code}
              checked={isSelected}
              closeOnClick={false}
              onClick={(e) => {
                e.preventDefault()
                toggle(t.code)
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-sm">{t.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto" />}
            </DropdownMenuCheckboxItem>
          )
        })}
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onClick={() => selectAll()}
          className="text-xs text-zinc-400 cursor-pointer"
        >
          Select all
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => selectOnly('IPL')}
          className="text-xs text-zinc-400 cursor-pointer"
        >
          IPL only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
