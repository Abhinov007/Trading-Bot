"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Shield, BarChart2, Cpu } from "lucide-react"

interface PredictionPanelProps {
  signal?: string
  rmse?: number
  f1?: number
  var95?: number
  ticker?: string
}

const Stat = ({
  icon: Icon, label, value, valueClass = "text-white"
}: {
  icon: any, label: string, value: string, valueClass?: string
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
    <div className="mt-0.5 w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5 text-zinc-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{label}</p>
      <p className={`text-sm font-mono font-semibold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  </div>
)

export default function PredictionPanel({ signal, rmse, f1, var95, ticker }: PredictionPanelProps) {
  const hasData = !!signal

  const signalColor =
    signal?.toLowerCase() === "buy" ? "text-emerald-400" :
    signal?.toLowerCase() === "sell" ? "text-red-400" :
    "text-zinc-400"

  const SignalIcon =
    signal?.toLowerCase() === "buy" ? TrendingUp :
    signal?.toLowerCase() === "sell" ? TrendingDown :
    Activity

  return (
    <Card className="bg-[#111111] border-zinc-800 rounded-xl overflow-hidden h-full">
      <CardHeader className="border-b border-zinc-800 px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          AI Analysis
        </h2>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-600">
            <Activity className="w-8 h-8 opacity-20" />
            <p className="text-xs text-center">Search a ticker to see AI predictions</p>
          </div>
        ) : (
          <div>
            {ticker && (
              <p className="text-xs text-zinc-500 mb-3 uppercase tracking-widest">
                Analysis for <span className="text-white font-semibold">{ticker}</span>
              </p>
            )}

            <Stat
              icon={SignalIcon}
              label="Signal"
              value={signal?.toUpperCase() ?? "—"}
              valueClass={signalColor}
            />
            <Stat
              icon={BarChart2}
              label="RMSE"
              value={rmse != null ? rmse.toFixed(4) : "—"}
              valueClass="text-zinc-200"
            />
            <Stat
              icon={Activity}
              label="F1 Score"
              value={f1 != null ? f1.toFixed(4) : "—"}
              valueClass="text-zinc-200"
            />
            <Stat
              icon={Shield}
              label="VaR (95%)"
              value={var95 != null ? `${(var95 * 100).toFixed(2)}%` : "—"}
              valueClass="text-yellow-400"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
