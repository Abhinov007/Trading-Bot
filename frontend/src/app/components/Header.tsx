"use client"
import { useState } from "react"
import { TrendingUp, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AuthDialog from "./AuthDialog"

interface HeaderProps {
  onSearchResult: (data: any) => void
  onLoadingChange: (loading: boolean) => void
}

export default function Header({ onSearchResult, onLoadingChange }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    onLoadingChange(true)
    setError(null)

    try {
      const res = await fetch(`http://127.0.0.1:8000/predict?ticker=${searchQuery.trim().toUpperCase()}`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || "Failed to fetch stock data")
      onSearchResult(result)
    } catch (err: any) {
      console.error("Error fetching stock:", err)
      setError("Ticker not found or server unavailable.")
    } finally {
      setLoading(false)
      onLoadingChange(false)
    }
  }

  return (
    <header className="border-b border-zinc-800 bg-[#0a0a0a] sticky top-0 z-50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span className="text-base font-bold tracking-widest uppercase text-white">
            Trading<span className="text-emerald-400">Bot</span>
          </span>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              placeholder="Search ticker  (e.g. AAPL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 rounded-md focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md px-4 shrink-0 h-9"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Auth */}
        <AuthDialog />
      </div>

      {error && (
        <div className="border-t border-zinc-800 px-6 py-2 text-center text-xs text-red-400 bg-red-950/20">
          {error}
        </div>
      )}
    </header>
  )
}
