import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, TrendingUp, TrendingDown, Minus, X,
  Eye, EyeOff, LogIn, UserPlus, RefreshCw, LogOut,
  Activity, BookmarkPlus, BookmarkCheck, Trash2, Lock,
  BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const API = import.meta.env.VITE_API_URL;

const nameToTicker = {
  "APPLE INC": "AAPL",
  "TESLA INC": "TSLA",
  "MICROSOFT CORPORATION": "MSFT",
  "AMAZON.COM INC": "AMZN",
  "NVIDIA CORPORATION": "NVDA",
  "GEO GROUP INC": "GEO",
};

// Stable placeholder chart data
const placeholderData = [
  { date: '1', price: 148 }, { date: '2', price: 152 }, { date: '3', price: 149 },
  { date: '4', price: 161 }, { date: '5', price: 158 }, { date: '6', price: 165 },
  { date: '7', price: 162 }, { date: '8', price: 170 }, { date: '9', price: 168 },
  { date: '10', price: 175 }, { date: '11', price: 172 }, { date: '12', price: 180 },
  { date: '13', price: 178 }, { date: '14', price: 185 }, { date: '15', price: 182 },
  { date: '16', price: 188 }, { date: '17', price: 191 }, { date: '18', price: 186 },
  { date: '19', price: 194 }, { date: '20', price: 197 }, { date: '21', price: 193 },
  { date: '22', price: 201 }, { date: '23', price: 198 }, { date: '24', price: 205 },
  { date: '25', price: 210 }, { date: '26', price: 207 }, { date: '27', price: 215 },
  { date: '28', price: 212 }, { date: '29', price: 218 }, { date: '30', price: 222 },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/* ─── Modal ─────────────────────────────────────────────────────────────── */
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
};

/* ─── Auth Form ──────────────────────────────────────────────────────────── */
const AuthForm = ({ type, onSuccess, onClose }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const endpoint = type === 'login' ? '/login' : '/register';
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.detail || 'Request failed.');
        return;
      }

      if (type === 'login') {
        // Pass token + user back to Dashboard
        onSuccess(data.token, data.user);
        onClose();
      } else {
        setMsg('Account created! You can now sign in.');
      }
    } catch {
      setMsg('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const isError = msg && (
    msg.toLowerCase().includes('error') ||
    msg.toLowerCase().includes('fail') ||
    msg.toLowerCase().includes('invalid') ||
    msg.toLowerCase().includes('already')
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-5">
        {type === 'login' ? 'Welcome back' : 'Create account'}
      </h2>

      {type === 'register' && (
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-700 transition-colors"
            placeholder="johndoe"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-700 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-zinc-700 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-xs ${isError ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-medium rounded-lg py-2.5 text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw size={13} className="animate-spin" /> Processing...
          </span>
        ) : (
          type === 'login' ? 'Sign In' : 'Sign Up'
        )}
      </button>
    </form>
  );
};

/* ─── Signal Badge ───────────────────────────────────────────────────────── */
const SignalBadge = ({ signal }) => {
  if (!signal) return null;
  const config = {
    Buy:  { cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', Icon: TrendingUp },
    Sell: { cls: 'text-red-400 bg-red-400/10 border-red-400/20',            Icon: TrendingDown },
    Hold: { cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',   Icon: Minus },
  };
  const { cls, Icon } = config[signal] ?? config.Hold;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <Icon size={10} /> {signal}
    </span>
  );
};

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-medium">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

/* ─── Spinner ────────────────────────────────────────────────────────────── */
const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-3.5 h-3.5 border' : 'w-5 h-5 border-2';
  return <div className={`${s} border-white/15 border-t-white/70 rounded-full animate-spin`} />;
};

/* ─── Market Overview (sidebar) ──────────────────────────────────────────── */
const MarketOverview = ({ stocks, loading, onSelect }) => (
  <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
    {/* Header */}
    <div className="px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
      <h3 className="text-xs font-semibold text-white flex items-center gap-2">
        <BarChart2 size={13} className="text-blue-400" /> Market Overview
      </h3>
      <span className="text-[10px] text-zinc-600">prev-day</span>
    </div>

    {/* Body */}
    {loading ? (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Spinner />
        <p className="text-[10px] text-zinc-600">Loading…</p>
      </div>
    ) : stocks.length === 0 ? (
      <div className="py-10 px-4 text-center">
        <p className="text-[11px] text-zinc-600">Market data unavailable.</p>
      </div>
    ) : (
      <div className="overflow-y-auto divide-y divide-white/[0.03]" style={{ maxHeight: 'calc(100vh - 130px)' }}>
        {stocks.map((s, i) => {
          const isUp = s.change_pct >= 0;
          return (
            <button
              key={s.ticker}
              onClick={() => onSelect(s.ticker)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-zinc-700 tabular-nums w-4 shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-xs text-white group-hover:text-blue-300 transition-colors leading-none mb-0.5">
                    {s.ticker}
                  </p>
                  <p className="text-[10px] text-zinc-600 truncate leading-none">{s.name}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-semibold tabular-nums text-zinc-100 leading-none mb-0.5">
                  {s.price != null ? `$${s.price.toFixed(2)}` : '—'}
                </p>
                <p className={`text-[10px] font-medium tabular-nums leading-none ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.price != null ? `${isUp ? '+' : ''}${s.change_pct.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

/* ─── News Panel ─────────────────────────────────────────────────────────── */
const sentimentConfig = {
  Bullish: { cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  Bearish: { cls: 'text-red-400 bg-red-400/10 border-red-400/20',             dot: 'bg-red-400' },
  Neutral: { cls: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',          dot: 'bg-zinc-500' },
};

const NewsPanel = ({ ticker, articles, loading }) => {
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Overall sentiment summary
  const counts = articles.reduce((acc, a) => {
    acc[a.sentiment] = (acc[a.sentiment] || 0) + 1; return acc;
  }, {});
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return (
    <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity size={14} className="text-amber-400" />
          News {ticker ? `· ${ticker}` : ''}
        </h3>
        {dominant && !loading && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${sentimentConfig[dominant]?.cls}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${sentimentConfig[dominant]?.dot}`} />
            {dominant} sentiment
          </span>
        )}
      </div>

      {!ticker ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-zinc-600">Search a stock to load news.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : articles.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-zinc-600">No recent news found for {ticker}.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {articles.map((a, i) => {
            const cfg = sentimentConfig[a.sentiment] ?? sentimentConfig.Neutral;
            return (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-3.5 hover:bg-white/[0.018] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.cls}`}>
                        {a.sentiment} {a.compound > 0 ? `+${a.compound}` : a.compound}
                      </span>
                      {a.source && <span className="text-[10px] text-zinc-600">{a.source}</span>}
                      <span className="text-[10px] text-zinc-700">{fmtDate(a.published_utc)}</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Auth Gate Banner ───────────────────────────────────────────────────── */
const AuthGate = ({ message, onSignIn }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto">
      <Lock size={16} className="text-zinc-600" />
    </div>
    <p className="text-xs text-zinc-500">{message}</p>
    <button
      onClick={onSignIn}
      className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white/[0.06] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-xl transition-all"
    >
      <LogIn size={12} /> Sign In
    </button>
  </div>
);

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const [data, setData]               = useState(null);
  const [inputValue, setInputValue]   = useState('');
  const [query, setQuery]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [tradeMsg, setTradeMsg]       = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading]     = useState(false);
  const [authModal, setAuthModal]     = useState(null); // 'login' | 'register' | null
  const [watchlist, setWatchlist]     = useState([]);
  const [livePrices, setLivePrices]   = useState({});
  const [watchMsg, setWatchMsg]       = useState('');
  const [marketStocks, setMarketStocks] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [news, setNews]                 = useState([]);
  const [newsLoading, setNewsLoading]   = useState(false);
  const [alerts, setAlerts]             = useState([]);
  const [alertInput, setAlertInput]     = useState('');
  const [alertCondition, setAlertCondition] = useState('above');
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);  // toasts

  // ── Auth state ────────────────────────────────────────────────────────────
  const [token, setToken]           = useState(() => localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
  });

  const handleLoginSuccess = (newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setTransactions([]);
    setWatchlist([]);
    setLivePrices({});
    setPortfolio(null);
    setAlerts([]);
    setTriggeredAlerts([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /* ── Fetch prediction (public) ─────────────────────────────────────────── */
  const fetchData = async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`${API}/predict?ticker=${ticker}`);
      const result = await res.json();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /* ── Execute trade (protected) ─────────────────────────────────────────── */
  // `signal` can be "Buy", "Sell", or "Hold" — callers pass it explicitly
  const handleTrade = async (signal) => {
    if (!query || !token) return;
    setTradeMsg('');
    setTradeLoading(signal); // store which button is loading ("Buy"/"Sell"/AI signal)
    try {
      const execRes = await fetch(
        `${API}/execute-trade?signal=${encodeURIComponent(signal)}&ticker=${encodeURIComponent(query)}`,
        { method: 'POST', headers: authHeaders(token) }
      );
      const execResult = await execRes.json();

      if (execRes.status === 401) {
        handleLogout();
        setAuthModal('login');
        throw new Error('Session expired. Please sign in again.');
      }
      if (!execRes.ok) throw new Error(execResult.detail || 'Trade execution failed');

      const saveRes = await fetch(`${API}/record-transaction`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(execResult),
      });
      const saveResult = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveResult.detail || 'Save failed');

      setTradeMsg(saveResult.message || 'Trade recorded.');
      fetchTransactions();  // refresh list immediately
    } catch (err) {
      setTradeMsg(err.message || 'Trade failed.');
    } finally {
      setTradeLoading(false);
    }
  };

  /* ── Watchlist (protected) ─────────────────────────────────────────────── */
  const fetchWatchlist = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/watchlist`, { headers: authHeaders(token) });
      if (res.status === 401) { handleLogout(); return; }
      const result = await res.json();
      setWatchlist(result.data || []);
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToWatchlist = async (ticker) => {
    if (!token) { setAuthModal('login'); return; }
    try {
      const res = await fetch(`${API}/watchlist/${ticker}`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      const result = await res.json();
      if (!res.ok) { setWatchMsg(result.detail || 'Already in watchlist'); return; }
      setWatchMsg(`${ticker} added to watchlist`);
      fetchWatchlist();
    } catch { setWatchMsg('Failed to add'); }
    setTimeout(() => setWatchMsg(''), 3000);
  };

  const removeFromWatchlist = async (ticker) => {
    if (!token) return;
    try {
      await fetch(`${API}/watchlist/${ticker}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      setWatchlist(prev => prev.filter(w => w.ticker !== ticker));
      setLivePrices(prev => { const n = { ...prev }; delete n[ticker]; return n; });
    } catch { /* silent */ }
  };

  /* ── Live prices (public) ──────────────────────────────────────────────── */
  const fetchLivePrice = useCallback(async (ticker) => {
    try {
      const res = await fetch(`${API}/price/${ticker}`);
      const result = await res.json();
      if (res.ok) setLivePrices(prev => ({ ...prev, [ticker]: result }));
    } catch { /* silent */ }
  }, []);


  /* ── Price Alerts (protected) ──────────────────────────────────────────── */
  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/alerts`, { headers: authHeaders(token) });
      if (res.ok) setAlerts((await res.json()).data || []);
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const createAlert = async () => {
    if (!token || !query || !alertInput) return;
    const price = parseFloat(alertInput);
    if (isNaN(price) || price <= 0) return;
    try {
      const res = await fetch(`${API}/alerts`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ticker: query, target_price: price, condition: alertCondition }),
      });
      if (res.ok) { setAlertInput(''); fetchAlerts(); }
    } catch { /* silent */ }
  };

  const deleteAlert = async (id) => {
    if (!token) return;
    try {
      await fetch(`${API}/alerts/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch { /* silent */ }
  };

  // Check all active alerts against live prices every 30s
  useEffect(() => {
    if (!token || alerts.length === 0) return;
    const check = async () => {
      for (const alert of alerts) {
        try {
          const res = await fetch(`${API}/price/${alert.ticker}`);
          if (!res.ok) continue;
          const { price } = await res.json();
          if (price == null) continue;
          const hit = alert.condition === 'above' ? price >= alert.target_price
                                                   : price <= alert.target_price;
          if (hit) {
            setTriggeredAlerts(prev => [...prev, { ...alert, current: price, id: Date.now() }]);
            await fetch(`${API}/alerts/${alert._id}/check`, { method: 'POST', headers: authHeaders(token) });
            setAlerts(prev => prev.filter(a => a._id !== alert._id));
          }
        } catch { /* silent */ }
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [alerts, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Transactions (protected) ──────────────────────────────────────────── */
  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/transactions`, { headers: authHeaders(token) });
      if (res.status === 401) { handleLogout(); return; }
      const result = await res.json();
      setTransactions(result.data || []);
    } catch {
      // silent
    } finally {
      setTxLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Effects ───────────────────────────────────────────────────────────── */
  useEffect(() => { fetchData(query); }, [query]);

  useEffect(() => {
    if (!query) { setNews([]); return; }
    setNewsLoading(true);
    fetch(`${API}/news/${query}`)
      .then(r => r.json())
      .then(d => setNews(d.articles || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [query]);


  // Fetch top-20 market data once on mount; backend caches for 5 min
  useEffect(() => {
    const load = async () => {
      setMarketLoading(true);
      try {
        const res = await fetch(`${API}/market/top`);
        const result = await res.json();
        if (res.ok) setMarketStocks(result.data || []);
      } catch { /* silent */ } finally {
        setMarketLoading(false);
      }
    };
    load();
    const id = setInterval(load, 300000); // re-fetch every 5 min
    return () => clearInterval(id);
  }, []);

  // When user logs in/out — refresh protected data
  useEffect(() => {
    if (token) {
      fetchTransactions();
      fetchWatchlist();
      fetchAlerts();
    } else {
      setTransactions([]);
      setWatchlist([]);
      setAlerts([]);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll transactions every 30s while authenticated
  useEffect(() => {
    if (!token) return;
    const id = setInterval(fetchTransactions, 30000);
    return () => clearInterval(id);
  }, [token, fetchTransactions]);

  // Poll live prices every 30s — stagger requests by 700ms each to avoid
  // hitting Polygon's free-tier rate limit (5 req/min) when watchlist grows.
  useEffect(() => {
    if (watchlist.length === 0) return;
    const tickers = watchlist.map(w => w.ticker);

    const pollAll = () => {
      tickers.forEach((t, i) => setTimeout(() => fetchLivePrice(t), i * 700));
    };

    pollAll(); // immediate first run
    const id = setInterval(pollAll, 30000);
    return () => clearInterval(id);
  }, [watchlist, fetchLivePrice]);

  /* ── Search ────────────────────────────────────────────────────────────── */
  const handleSearch = () => {
    const trimmed = inputValue.trim().toUpperCase();
    const matchedKey = Object.keys(nameToTicker).find(k => k.toUpperCase() === trimmed);
    const ticker = matchedKey ? nameToTicker[matchedKey] : trimmed;
    if (ticker) setQuery(ticker);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setInputValue(val);
    const matches = Object.keys(nameToTicker).filter(n => n.toUpperCase().includes(val));
    setSuggestions(val.length > 1 ? matches.slice(0, 6) : []);
  };

  const clearSearch = () => { setInputValue(''); setSuggestions([]); };

  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  const priceDiff = data
    ? ((data.predicted_price - data.current_price) / data.current_price * 100).toFixed(2)
    : null;

  const isWatching = watchlist.some(w => w.ticker === query);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md px-6 py-3.5 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-lg">
            <Activity size={13} className="text-black" />
          </div>
          <span className="font-semibold text-sm tracking-tight">AlphaBot</span>
        </div>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1 shrink-0">
          <Link
            to="/portfolio"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10 rounded-xl transition-all"
          >
            <TrendingUp size={12} className="text-violet-400" /> Portfolio
          </Link>
        </nav>

        {/* Search bar */}
        <div className="flex-1 max-w-lg relative">
          <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 gap-2 focus-within:border-white/20 focus-within:bg-white/[0.07] transition-all">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder="Search ticker or company name..."
              className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
            {inputValue && (
              <button onClick={clearSearch} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X size={12} />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="shrink-0 bg-white/10 hover:bg-white/15 text-white/80 text-xs px-2.5 py-1 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute top-full mt-1.5 left-0 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl py-1">
              {suggestions.map((name) => (
                <li
                  key={name}
                  className="px-3 py-2.5 text-sm hover:bg-white/[0.05] cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => {
                    setInputValue(name);
                    setSuggestions([]);
                    setQuery(nameToTicker[name]);
                  }}
                >
                  <span className="text-white">{name}</span>
                  <span className="text-zinc-500 text-xs font-mono">{nameToTicker[name]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Auth area */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
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
            <>
              <button
                onClick={() => setAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs text-zinc-400 hover:text-white transition-colors border border-white/[0.08] rounded-xl hover:border-white/20 hover:bg-white/[0.04]"
              >
                <LogIn size={12} /> Sign In
              </button>
              <button
                onClick={() => setAuthModal('register')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <UserPlus size={12} /> Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="px-6 py-6 max-w-[1400px] mx-auto flex gap-5 items-start">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-5">
        {/* Row 1: Chart + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart panel */}
          <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    {query || 'Price Chart'}
                  </h2>
                  {loading && <Spinner size="sm" />}
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {query ? 'LSTM Prediction Model · 5-min candles' : 'Search a stock to load predictions'}
                </p>
              </div>
              {data && <SignalBadge signal={data.signal} />}
            </div>

            {loading ? (
              <div className="h-72 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-xs text-zinc-600">Fetching prediction for {query}…</p>
              </div>
            ) : data?.plot_base64 ? (
              <img
                src={`data:image/png;base64,${data.plot_base64}`}
                alt={`${query} prediction chart`}
                className="w-full rounded-xl"
              />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={placeholderData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.07} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="rgba(255,255,255,0.2)"
                      fill="url(#grad)"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3, fill: '#fff', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Stats panel */}
          <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-5 flex flex-col">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-5">
              Analysis
            </h3>

            {data ? (
              <>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-xs text-zinc-600 mb-1">Current Price</p>
                    <p className="text-3xl font-semibold tabular-nums tracking-tight">
                      {fmt(data.current_price)}
                    </p>
                  </div>

                  <div className="h-px bg-white/[0.05]" />

                  <div>
                    <p className="text-xs text-zinc-600 mb-1">Predicted Price</p>
                    <p className="text-xl font-medium tabular-nums text-zinc-200">
                      {fmt(data.predicted_price)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600 mb-1">Expected Move</p>
                    <p className={`text-sm font-semibold ${parseFloat(priceDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(priceDiff) >= 0 ? '+' : ''}{priceDiff}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600 mb-1">Signal</p>
                    <SignalBadge signal={data.signal} />
                  </div>
                </div>

                <div className="mt-6 space-y-2.5">
                  {currentUser ? (
                    <>
                      {/* Manual Buy / Sell buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTrade('Buy')}
                          disabled={!!tradeLoading || !query}
                          className="py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-1.5"
                        >
                          {tradeLoading === 'Buy' ? (
                            <><Spinner size="sm" /> Buying…</>
                          ) : (
                            <><TrendingUp size={13} /> Buy</>
                          )}
                        </button>
                        <button
                          onClick={() => handleTrade('Sell')}
                          disabled={!!tradeLoading || !query}
                          className="py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-red-500 hover:bg-red-400 text-white flex items-center justify-center gap-1.5"
                        >
                          {tradeLoading === 'Sell' ? (
                            <><Spinner size="sm" /> Selling…</>
                          ) : (
                            <><TrendingDown size={13} /> Sell</>
                          )}
                        </button>
                      </div>

                      {/* AI signal button */}
                      {data?.signal && (
                        <button
                          onClick={() => handleTrade(data.signal)}
                          disabled={!!tradeLoading}
                          className={`w-full py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 border flex items-center justify-center gap-1.5 ${
                            data.signal === 'Buy'
                              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              : data.signal === 'Sell'
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                          }`}
                        >
                          {tradeLoading === data.signal ? (
                            <><Spinner size="sm" /> Executing…</>
                          ) : (
                            <><BarChart2 size={11} /> Execute AI Signal: {data.signal}</>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setAuthModal('login')}
                      className="w-full py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Lock size={12} /> Sign in to trade
                    </button>
                  )}

                  {tradeMsg && (
                    <p className="text-xs text-center text-zinc-500">{tradeMsg}</p>
                  )}

                  {/* Watchlist toggle — requires auth */}
                  {query && (
                    <button
                      onClick={() => isWatching ? removeFromWatchlist(query) : addToWatchlist(query)}
                      className="w-full py-2 rounded-xl text-xs font-medium border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isWatching
                        ? <><BookmarkCheck size={12} className="text-emerald-400" /> Watching</>
                        : <><BookmarkPlus size={12} /> Add to Watchlist</>}
                    </button>
                  )}
                  {watchMsg && <p className="text-xs text-center text-zinc-500">{watchMsg}</p>}

                  {/* Price Alert creator */}
                  {currentUser && query && (
                    <div className="border-t border-white/[0.05] pt-3 space-y-2">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Price Alert</p>
                      <div className="flex gap-1.5">
                        <select
                          value={alertCondition}
                          onChange={e => setAlertCondition(e.target.value)}
                          className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20 shrink-0"
                        >
                          <option value="above">Above</option>
                          <option value="below">Below</option>
                        </select>
                        <input
                          type="number"
                          value={alertInput}
                          onChange={e => setAlertInput(e.target.value)}
                          placeholder="Target price"
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 min-w-0"
                        />
                        <button
                          onClick={createAlert}
                          disabled={!alertInput}
                          className="shrink-0 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          Set
                        </button>
                      </div>
                      {/* Active alerts for this ticker */}
                      {alerts.filter(a => a.ticker === query).map(a => (
                        <div key={a._id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] text-zinc-400">
                            {a.condition === 'above' ? '↑' : '↓'} ${a.target_price.toFixed(2)}
                          </span>
                          <button onClick={() => deleteAlert(a._id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto">
                    <Search size={16} className="text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-600">No stock selected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Watchlist — only visible when authenticated and populated */}
        {currentUser && watchlist.length > 0 && (
          <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookmarkCheck size={14} className="text-emerald-400" /> Watchlist
              </h3>
              <span className="text-xs text-zinc-600">{watchlist.length} ticker{watchlist.length !== 1 ? 's' : ''} · updates every 30s</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {watchlist.map(({ ticker }) => {
                const lp = livePrices[ticker];
                const isUp = lp?.change_pct >= 0;
                return (
                  <div
                    key={ticker}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.018] transition-colors cursor-pointer group"
                    onClick={() => setQuery(ticker)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-white">{ticker}</span>
                      {lp && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {isUp ? '+' : ''}{lp.change_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {lp ? (
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-white">${lp.price?.toFixed(2) ?? '—'}</p>
                          <p className={`text-xs tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isUp ? '+' : ''}{lp.change?.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <Spinner size="sm" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(ticker); }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 2: News Sentiment */}
        <NewsPanel ticker={query} articles={news} loading={newsLoading} />

        {/* Trade History */}
        <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Trade History</h3>
            <div className="flex items-center gap-3">
              {txLoading && <Spinner size="sm" />}
              {currentUser && (
                <span className="text-xs text-zinc-600">
                  {transactions.length} {transactions.length === 1 ? 'trade' : 'trades'}
                </span>
              )}
            </div>
          </div>

          {/* Not logged in */}
          {!currentUser ? (
            <AuthGate
              message="Sign in to view your trade history"
              onSignIn={() => setAuthModal('login')}
            />
          ) : txLoading && transactions.length === 0 ? (
            <div className="px-5 py-10 flex items-center justify-center">
              <Spinner />
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-xs text-zinc-600">No trades recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Ticker', 'Action', 'Qty', 'Status', 'Message', 'Order ID', 'Time'].map((h) => (
                      <th key={h} className="text-left text-[11px] text-zinc-600 font-medium px-5 py-3 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.025]">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-white/[0.018] transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">{tx.ticker}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                          tx.action === 'Buy'  ? 'text-emerald-400 bg-emerald-400/10' :
                          tx.action === 'Sell' ? 'text-red-400 bg-red-400/10' :
                                                  'text-zinc-400 bg-zinc-400/10'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-300 tabular-nums">{tx.quantity}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs ${
                          tx.status === 'success' || tx.status === 'filled'
                            ? 'text-emerald-400'
                            : tx.status === 'failed'
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500 max-w-[180px] truncate">
                        {tx.message || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 font-mono">
                        {tx.order_id ? `${tx.order_id.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">
                        {tx.executed_at || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>{/* end left column */}

        {/* ── Right sidebar: Market Overview ── */}
        <div className="hidden xl:block w-64 shrink-0 sticky top-[65px]">
          <MarketOverview
            stocks={marketStocks}
            loading={marketLoading}
            onSelect={(ticker) => {
              setQuery(ticker);
              setInputValue(ticker);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

      </main>

      {/* ── Alert Toasts ── */}
      {triggeredAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {triggeredAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-[#111] border border-violet-500/40 rounded-xl px-4 py-3 shadow-2xl min-w-[260px]"
            >
              <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-white">
                  🔔 {a.ticker} alert triggered
                </p>
                <p className="text-[11px] text-zinc-400">
                  Price {a.condition === 'above' ? 'reached' : 'dropped to'} ${a.current?.toFixed(2)} (target ${a.target_price?.toFixed(2)})
                </p>
              </div>
              <button
                onClick={() => setTriggeredAlerts(prev => prev.filter(t => t.id !== a.id))}
                className="text-zinc-600 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Auth Modals ── */}
      <Modal isOpen={!!authModal} onClose={() => setAuthModal(null)}>
        <AuthForm
          type={authModal}
          onSuccess={handleLoginSuccess}
          onClose={() => setAuthModal(null)}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
