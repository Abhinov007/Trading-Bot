"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Transaction {
  _id: string
  email?: string
  action?: string
  ticker?: string
  quantity?: number
  status?: string
  message?: string
  order_id?: string
  time?: string
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://127.0.0.1:8000/transactions")
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || "Failed to fetch transactions")
      setTransactions(json.data || [])
    } catch (err: any) {
      setError("Could not load transaction history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <Card className="bg-[#111111] border-zinc-800 rounded-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-800 px-6 py-4 flex flex-row items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-300">
          Trade History
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
          className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-7 w-7 p-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading trades…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-400">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-600">No trades recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Ticker</th>
                  <th className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Action</th>
                  <th className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Qty</th>
                  <th className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {transactions.map((tx) => {
                  const isBuy = tx.action?.toLowerCase() === "buy"
                  const isSell = tx.action?.toLowerCase() === "sell"
                  return (
                    <tr key={tx._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono font-semibold text-white">
                        {tx.ticker ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase
                          ${isBuy ? "bg-emerald-500/10 text-emerald-400" :
                            isSell ? "bg-red-500/10 text-red-400" :
                            "text-zinc-400"}`}>
                          {tx.action ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-zinc-300 font-mono">{tx.quantity ?? "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs ${tx.status === "filled" ? "text-emerald-400" : "text-zinc-400"}`}>
                          {tx.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-zinc-500 text-xs">
                        {tx.time ? new Date(tx.time).toLocaleString() : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
