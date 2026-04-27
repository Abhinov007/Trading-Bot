import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, TrendingUp, TrendingDown, RefreshCw,
  LogIn, LogOut, Lock, ArrowLeft, UserPlus,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (v) =>
  v != null
    ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';
const pct = (v) =>
  v != null ? `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%` : '—';
const isUp = (v) => v == null || v >= 0;

/* ─── Spinner ────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
);

/* ─── Portfolio Page ─────────────────────────────────────────────────────── */
const Portfolio = () => {
  const navigate = useNavigate();

  // Pull auth state from localStorage (same pattern as Dashboard)
  const [token, setToken]           = useState(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const [portfolio, setPortfolio]           = useState(null);
  const [loading, setLoading]               = useState(false);
  const [lastRefreshed, setLastRefreshed]   = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setPortfolio(null);
  };

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/portfolio`, { headers: authHeaders(token) });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        setPortfolio(await res.json());
        setLastRefreshed(new Date());
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token) fetchPortfolio();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60 s
  useEffect(() => {
    if (!token) return;
    const id = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(id);
  }, [token, fetchPortfolio]);

  const summary  = portfolio?.summary  ?? {};
  const holdings = portfolio?.holdings ?? [];

  /* ── Summary cards ─────────────────────────────────────────────────────── */
  const SummaryCard = ({ label, value, sub, up }) => (
    <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl px-5 py-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
      {sub && (
        <p className={`text-xs font-medium tabular-nums mt-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md px-6 py-3.5 flex items-center gap-4">
        {/* Logo / back */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-lg">
            <Activity size={13} className="text-black" />
          </div>
          <span className="font-semibold text-sm tracking-tight">AlphaBot</span>
        </Link>

        {/* Page title */}
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-zinc-700">/</span>
          <TrendingUp size={13} className="text-violet-400" />
          <span className="text-sm font-medium text-white">Portfolio</span>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="flex items-center gap-1.5 ml-2 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={12} /> Dashboard
        </Link>

        {/* Refresh + auth */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {token && (
            <button
              onClick={fetchPortfolio}
              disabled={loading}
              title="Refresh portfolio"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-xl transition-all disabled:opacity-40"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}

          {currentUser ? (
            <>
              <span className="text-xs text-zinc-400 hidden sm:block">
                {currentUser.username || currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 border border-white/[0.08] hover:border-red-400/30 rounded-xl transition-all"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
            >
              <LogIn size={12} /> Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-6 py-8 max-w-[1100px] mx-auto space-y-6">

        {/* Not logged in */}
        {!token ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto">
              <Lock size={18} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400">Sign in to view your portfolio</p>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
            >
              <LogIn size={13} /> Go to Dashboard &amp; Sign In
            </Link>
          </div>

        ) : loading && !portfolio ? (
          /* Initial load spinner */
          <div className="flex justify-center py-32">
            <Spinner />
          </div>

        ) : (
          <>
            {/* Last refreshed */}
            {lastRefreshed && (
              <p className="text-[11px] text-zinc-600">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                label="Total Value"
                value={fmt(summary.total_value)}
              />
              <SummaryCard
                label="Total Cost"
                value={fmt(summary.total_cost)}
              />
              <SummaryCard
                label="Unrealised P&amp;L"
                value={fmt(summary.total_pnl)}
                sub={pct(summary.total_pnl_pct)}
                up={isUp(summary.total_pnl)}
              />
              <SummaryCard
                label="Open Positions"
                value={holdings.length}
              />
            </div>

            {/* Holdings table */}
            <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp size={14} className="text-violet-400" /> Holdings
                </h2>
                {loading && <Spinner />}
              </div>

              {holdings.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <p className="text-sm text-zinc-600">
                    No open positions — execute a trade from the Dashboard to get started.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-2 text-xs bg-white/[0.06] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-xl transition-all"
                  >
                    <ArrowLeft size={12} /> Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {['Ticker', 'Side', 'Qty', 'Avg Cost', 'Current Price', 'Mkt Value', 'P&L', 'P&L %'].map(h => (
                          <th
                            key={h}
                            className="text-left text-[11px] text-zinc-600 font-medium px-5 py-3 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.025]">
                      {holdings.map(h => (
                        <tr key={h.ticker} className="hover:bg-white/[0.018] transition-colors">
                          <td className="px-5 py-4 font-mono font-semibold text-sm text-white">
                            {h.ticker}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-md font-medium ${h.side === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {h.side}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-zinc-300 tabular-nums">{h.quantity}</td>
                          <td className="px-5 py-4 text-sm text-zinc-400 tabular-nums">{fmt(h.avg_cost)}</td>
                          <td className="px-5 py-4 text-sm text-zinc-200 tabular-nums">{fmt(h.current_price)}</td>
                          <td className="px-5 py-4 text-sm text-zinc-200 tabular-nums">{fmt(h.market_value)}</td>
                          <td className={`px-5 py-4 text-sm font-medium tabular-nums ${isUp(h.pnl) ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className="flex items-center gap-1">
                              {isUp(h.pnl) ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {fmt(h.pnl)}
                            </span>
                          </td>
                          <td className={`px-5 py-4 text-sm font-semibold tabular-nums ${isUp(h.pnl_pct) ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pct(h.pnl_pct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Portfolio;
