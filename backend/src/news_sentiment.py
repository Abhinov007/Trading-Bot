"""
Fetch recent news for a ticker from Polygon and score each article with VADER.

VADER (Valence Aware Dictionary and sEntiment Reasoner) is specifically designed
for short social/news texts. compound score ranges -1 (most negative) to +1 (most
positive). Thresholds used:
  compound >= 0.05  → Bullish
  compound <= -0.05 → Bearish
  otherwise         → Neutral
"""

import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from config import POLYGON_API_KEY

_analyzer = SentimentIntensityAnalyzer()

# ── Domain-specific boosts: words that carry extra weight in financial news ───
_FINANCIAL_BOOSTER = {
    "beats":      2.0, "beat":       1.5, "surges":    2.0, "surge":     1.5,
    "soars":      2.0, "rally":      1.5, "outperform":1.5, "upgrade":   1.5,
    "record":     1.2, "profit":     1.0, "dividend":  0.8,
    "misses":    -2.0, "miss":      -1.5, "plunges":  -2.0, "plunge":   -1.5,
    "crash":     -2.0, "downgrade": -1.5, "loss":     -1.0, "layoffs":  -1.2,
    "recall":    -1.5, "fraud":     -2.5, "lawsuit":  -1.5,
}
for word, boost in _FINANCIAL_BOOSTER.items():
    _analyzer.lexicon[word] = boost


def _label(compound: float) -> str:
    if compound >= 0.05:
        return "Bullish"
    if compound <= -0.05:
        return "Bearish"
    return "Neutral"


def fetch_news(ticker: str, limit: int = 8) -> list[dict]:
    """
    Return up to `limit` recent news articles for `ticker` with sentiment scores.
    Each item: title, description, url, published_utc, source, sentiment, compound
    """
    try:
        r = requests.get(
            "https://api.polygon.io/v2/reference/news",
            params={
                "ticker":  ticker.upper(),
                "limit":   limit,
                "order":   "desc",
                "sort":    "published_utc",
                "apiKey":  POLYGON_API_KEY,
            },
            timeout=8,
        )
        if not r.ok:
            print(f"[WARN] news {ticker}: HTTP {r.status_code}")
            return []

        articles = r.json().get("results", [])
    except Exception as e:
        print(f"[WARN] news {ticker}: {e}")
        return []

    results = []
    for a in articles:
        text     = f"{a.get('title', '')}. {a.get('description', '')}"
        scores   = _analyzer.polarity_scores(text)
        compound = round(scores["compound"], 3)
        results.append({
            "title":         a.get("title", ""),
            "description":   a.get("description", ""),
            "url":           a.get("article_url", ""),
            "published_utc": a.get("published_utc", ""),
            "source":        a.get("publisher", {}).get("name", ""),
            "sentiment":     _label(compound),
            "compound":      compound,
        })

    return results
