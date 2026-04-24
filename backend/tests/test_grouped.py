import requests, os
from dotenv import load_dotenv
from datetime import date, timedelta
load_dotenv()
key = os.getenv('POLYGON_API_KEY')

# Find last trading day
d = date.today() - timedelta(days=1)
while d.weekday() >= 5:
    d -= timedelta(days=1)

print(f"Fetching grouped daily for {d} ...")
r = requests.get(
    f'https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{d}',
    params={'adjusted': 'true', 'apiKey': key}, timeout=10
)
print('Status:', r.status_code)
body = r.json()
print('Keys:', list(body.keys()))
results = body.get('results', [])
print(f'Total tickers returned: {len(results)}')

idx = {bar['T']: bar for bar in results}
top = ['AAPL','MSFT','NVDA','AMZN','GOOG','META','TSLA','JPM','V','UNH',
       'XOM','JNJ','WMT','MA','PG','ORCL','HD','BAC','COST','AVGO']
print()
for t in top:
    bar = idx.get(t)
    if bar:
        print(f'{t}: close={bar["c"]}, vol={int(bar["v"])}')
    else:
        print(f'{t}: NOT FOUND  (status={body.get("status")})')
