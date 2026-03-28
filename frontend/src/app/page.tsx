"use client"
import { useState } from "react"
import Header from "@/app/components/Header"
import StockChart from "@/app/components/StockChart"
import TransactionTable from "@/app/components/TransactionTable"
import PredictionPanel from "@/app/components/PredictionPanel"

export default function HomePage() {
  const [predictionData, setPredictionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearchResult = (data: any) => {
    setPredictionData(data)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <Header onSearchResult={handleSearchResult} onLoadingChange={setLoading} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <StockChart
          data={predictionData?.chart_data || []}
          stockSymbol={predictionData?.ticker || "—"}
          currentPrice={predictionData?.current_price}
          predictedPrice={predictionData?.predicted_price}
          signal={predictionData?.signal}
          loading={loading}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionTable />
          </div>
          <div>
            <PredictionPanel
              signal={predictionData?.signal}
              rmse={predictionData?.rmse}
              f1={predictionData?.f1_score}
              var95={predictionData?.VaR_95_percent}
              ticker={predictionData?.ticker}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
