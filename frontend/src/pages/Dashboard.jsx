import React, { useEffect, useState } from 'react';

const nameToTicker = {
  "APPLE INC": "AAPL",
  "TESLA INC": "TSLA",
  "MICROSOFT CORPORATION": "MSFT",
  "AMAZON.COM INC": "AMZN",
  "NVIDIA CORPORATION": "NVDA",
  "GEO GROUP INC": "GEO"
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [tradeMessage, setTradeMessage] = useState('');

  const fetchDashboardData = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/predict?ticker=${query}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData(null);
    }
    setLoading(false);
  };

 const handleTrade = async () => {
  setTradeMessage('');

  const signal = data.signal;
  const ticker = query;

  try {
    // 1. Execute the trade
    const execRes = await fetch(`http://127.0.0.1:8000/execute-trade?signal=${encodeURIComponent(signal)}&ticker=${encodeURIComponent(ticker)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const execResult = await execRes.json();

    if (!execRes.ok) throw new Error(execResult.detail || 'Trade execution failed');

    console.log("Trade executed:", execResult);

    // 2. Save transaction in DB by sending the trade_result object
    const saveRes = await fetch('http://127.0.0.1:8000/record-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(execResult),
    });

    const saveResult = await saveRes.json();

    if (!saveRes.ok) throw new Error(saveResult.detail || 'Saving transaction failed');

    setTradeMessage(saveResult.message || 'Trade executed and saved.');
    console.log("Transaction saved:", saveResult);

  } catch (err) {
    console.error("Trade failed:", err);
    setTradeMessage('Trade failed.');
  }
};


  useEffect(() => {
    fetchDashboardData();
  }, [query]);

  const handleSearch = () => {
    const trimmed = inputValue.trim().toUpperCase();
    const matchedKey = Object.keys(nameToTicker).find(
      (key) => key.toUpperCase() === trimmed
    );
    const ticker = matchedKey ? nameToTicker[matchedKey] : trimmed;
    if (ticker) setQuery(ticker);
    setSuggestions([]);
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-200 p-4">
     <div className="flex justify-between items-center mb-4">
  <h2 className="text-2xl font-bold">Stock Prediction Dashboard</h2>
  <div className="space-x-2">
    <button
      onClick={() => alert('Redirect to Register')}
      className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
    >
      Register
    </button>
    <button
      onClick={() => alert('Redirect to Login')}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Login
    </button>
  </div>
</div>

      <div className="mb-4 relative">
        <label htmlFor="stock" className="font-medium block mb-1">Enter Stock:</label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            id="stock"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setInputValue(val);
              const matches = Object.keys(nameToTicker).filter((name) =>
                name.toUpperCase().includes(val)
              );
              setSuggestions(val.length > 1 ? matches.slice(0, 6) : []);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            onBlur={() => setTimeout(() => setSuggestions([]), 100)}
            placeholder="Enter company name or ticker (e.g., Apple Inc or AAPL)"
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute bg-white border shadow rounded w-full mt-1 z-50 max-h-48 overflow-auto">
            {suggestions.map((name) => (
              <li
                key={name}
                className="p-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  setInputValue(name);
                  setSuggestions([]);
                  setQuery(nameToTicker[name]);
                }}
              >
                {name} <span className="text-gray-500 text-sm">({nameToTicker[name]})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : data ? (
        <div className="bg-white shadow rounded p-4">
          <p>
            <strong>Current Price:</strong>{" "}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.current_price)}
          </p>

          <p>
            <strong>Prediction:</strong>{" "}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.predicted_price)}
          </p>

          <p><strong>Signal:</strong> <span className="font-semibold">{data.signal}</span></p>

          <button
            onClick={handleTrade}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Execute Trade
          </button>

          {tradeMessage && (
            <p className="mt-2 font-medium text-blue-600">{tradeMessage}</p>
          )}

          {data.plot_base64 ? (
            <img
              src={`data:image/png;base64,${data.plot_base64}`}
              alt={`${query} prediction plot`}
              className="mt-4 rounded shadow max-w-full"
            />
          ) : (
            <p className="mt-4 text-gray-500">No plot available.</p>
          )}
        </div>
      ) : (
        <p>No data loaded yet.</p>
      )}
    </div>
  );
};

export default Dashboard;
