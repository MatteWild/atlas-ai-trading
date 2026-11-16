import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from math import isfinite
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

SYMBOLS = ('GC=F', 'EURUSD=X', 'NQ=F', 'SI=F')


def get_json(url):
    request = Request(url, headers={'Accept': 'application/json', 'User-Agent': 'AtlasNeoIndex/4'})
    with urlopen(request, timeout=12) as response:
        return json.load(response)


def get_quote(symbol):
    for host in ('query1.finance.yahoo.com', 'query2.finance.yahoo.com'):
        try:
            url = f'https://{host}/v8/finance/chart/{quote(symbol, safe="")}?range=5d&interval=15m'
            chart = get_json(url)['chart']['result'][0]
            meta = chart['meta']
            values = chart['indicators']['quote'][0]['close']
            samples = [
                (time, value) for time, value in zip(chart['timestamp'], values)
                if isinstance(time, (int, float)) and time > 0
                and isinstance(value, (int, float)) and isfinite(value) and value > 0
            ]
            if not samples:
                raise ValueError('Missing candles')
            candle_time, candle_price = samples[-1]
            price, time = meta.get('regularMarketPrice'), meta.get('regularMarketTime')
            if not isinstance(price, (int, float)) or not isfinite(price) or price <= 0 or not isinstance(time, (int, float)) or time < candle_time:
                price, time = candle_price, candle_time
            return {
                'symbol': symbol, 'status': 'INDICATIVE', 'price': price, 'time': int(time * 1000),
                'closes': [value for _, value in samples], 'decimals': meta.get('priceHint', 2),
            }
        except (OSError, ValueError, TypeError, KeyError, IndexError) as exc:
            print(f'{symbol} from {host}: {exc}')
    return {'symbol': symbol, 'status': 'UNAVAILABLE'}


def get_news():
    params = {
        'query': '("Federal Reserve" OR gold OR dollar OR inflation OR tariffs OR sanctions OR "central bank")',
        'mode': 'ArtList', 'format': 'json', 'maxrecords': 15, 'sort': 'DateDesc',
    }
    try:
        payload = get_json('https://api.gdeltproject.org/api/v2/doc/doc?' + urlencode(params))
        articles = payload.get('articles', [])
        if not isinstance(articles, list):
            raise ValueError('Invalid list of articles')
        return {'articles': [
            {key: article.get(key) for key in ('title', 'url', 'domain', 'seendate')}
            for article in articles if isinstance(article, dict)
        ]}
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        print(f'GDELT: {exc}')
        return {'articles': [], 'error': 'La fonte GDELT non ha risposto. Riprova dopo il prossimo aggiornamento.'}


def publish(directory):
    directory.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=5) as pool:
        news = pool.submit(get_news)
        quotes = list(pool.map(get_quote, SYMBOLS))
        articles = news.result()
    fetched = datetime.now(timezone.utc).isoformat()
    for name, payload in (
        ('quotes', {'source': 'Yahoo Finance', 'quotes': quotes}),
        ('news', {'source': 'GDELT', **articles}),
    ):
        (directory / f'{name}.json').write_text(
            json.dumps({'fetchedAt': fetched, **payload}, ensure_ascii=False, allow_nan=False),
            encoding='utf-8',
        )


if __name__ == '__main__':
    publish(Path('_site/data'))
