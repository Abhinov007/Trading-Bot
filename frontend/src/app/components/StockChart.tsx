"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, Legend, CartesianGrid
} from "recharts"
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StockChartProps {
  data: any[]
  stockSymbol: string
  currentPrice?: number
  predictedPrice?: number
  signal?: string
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 text-xs shadow-xl">
        <p className="text-zinc-400 mb-1">Index: {label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="font-mono">
            {entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}: ${Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function StockChart({
  data, stockSymbol, currentPrice, predictedPrice, signal, loading
}: StockChartProps) {

  const signalColor =
    signal?.toLowerCase() === "buy" ? "text-emerald-400" :
    signal?.toLowerCase() === "sell" ? "text-red-400" :
    "text-zinc-400"

  const SignalIcon =
    signal?.toLowerCase() === "buy" ? TrendingUp :
    signal?.toLowerCase() === "sell" ? TrendingDown :
    Minus

  // Sample every Nth point to keep the chart readable
  const displayData = data.length > 200
    ? data.filter((_: any, i: number) => i % Math.ceil(data.length / 200) === 0)
    : data

  return (
    <Card className="bg-[#111111] border-zinc-800 rounded-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Ticker + signal */}
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-widest text-white uppercase">
              {stockSymbol !== "—" ? stockSymbol : <span className="text-zinc-600">—</span>}
            </h2>
            {signal && (
              <div className={`flex items-center gap-1 text-sm font-semibold uppercase px-2 py-1 rounded-md bg-zinc-800 ${signalColor}`}>
                <SignalIcon className="w-4 h-4" />
                {signal}
              </div>
            )}
          </div>

          {/* Right: prices */}
          {currentPrice && predictedPrice && (
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Current</p>
                <p className="text-xl font-bold text-white">${currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Predicted</p>
                <p className="text-xl font-bold text-emerald-400">${predictedPrice.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="h-72 flex items-center justify-center text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Fetching model predictions…</span>
          </div>
        ) : displayData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis
                  dataKey="index"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#34d399" }}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <TrendingUp className="w-10 h-10 opacity-20" />
            <p className="text-sm">Search a ticker to load the price chart</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
