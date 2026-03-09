#!/usr/bin/env python3
import json, urllib.request

BASE = 'https://clarityco.co.uk'

def fetch(path):
    import ssl
    ctx = ssl.create_default_context()
    return json.loads(urllib.request.urlopen(BASE + path, context=ctx).read())

def check_news():
    data = fetch('/api/news')
    arts = data.get('articles', [])
    proph = [a for a in arts if a.get('prophecyRelated')]
    coords = [a for a in arts if a.get('coordinates')]
    src = data.get('sources', {})
    print(f'=== NEWS ===')
    print(f'Total articles: {len(arts)}')
    print(f'With coordinates: {len(coords)}')
    print(f'Prophecy-related: {len(proph)}')
    print(f'Sources: newsapi={src.get("newsapi",0)}, currents={src.get("currents",0)}, rss={src.get("rss",0)}')
    print('--- Sample prophecy articles ---')
    for a in proph[:6]:
        ref = a.get('prophecyRef', '')
        print(f'  [{a["sentiment"]}] {a["title"][:75]}')
        if ref:
            print(f'    REF: {ref[:90]}')

def check_conflicts():
    data = fetch('/api/intelligence/conflicts')
    c = data.get('conflicts', [])
    print(f'\n=== CONFLICTS ===')
    print(f'Total: {len(c)}')
    for x in c[:5]:
        print(f'  {x.get("name","?")} - events:{x.get("eventCount",0)} - {str(x.get("captionfull",""))[:70]}')

def check_aircraft():
    data = fetch('/api/intelligence/aircraft')
    ac = data.get('aircraft', [])
    mil = [a for a in ac if a.get('military')]
    print(f'\n=== AIRCRAFT ===')
    print(f'Total: {len(ac)}, Military: {len(mil)}')
    for a in mil[:3]:
        print(f'  {a["callsign"]} ({a["country"]}) alt={a.get("altitude")} zone={a.get("zone")}')

def check_earthquakes():
    data = fetch('/api/intelligence/earthquakes')
    eq = data.get('earthquakes', [])
    print(f'\n=== EARTHQUAKES ===')
    print(f'Total: {len(eq)}')
    for e in eq[:3]:
        print(f'  M{e["magnitude"]} - {e["place"][:50]}')

def check_naval():
    data = fetch('/api/intelligence/naval')
    v = data.get('vessels', [])
    print(f'\n=== NAVAL ===')
    print(f'Total vessels: {len(v)}')
    for x in v[:3]:
        print(f'  {x["name"][:40]} ({x["type"]}) - {x.get("area","")}')

def check_calendar():
    data = fetch('/api/intelligence/economic-calendar')
    ev = data.get('events', [])
    print(f'\n=== ECONOMIC CALENDAR ===')
    print(f'Total events: {len(ev)}')
    for e in ev[:3]:
        print(f'  {e["date"]} {e["country"]} - {e["event"][:50]} [{e.get("impact","")}]')

def check_logo():
    try:
        import ssl
        ctx = ssl.create_default_context()
        req = urllib.request.urlopen(BASE + '/api/settings/logo/serve', context=ctx)
        ct = req.headers.get('Content-Type', '')
        length = len(req.read())
        print(f'\n=== LOGO SERVE ===')
        print(f'Status: OK, Content-Type: {ct}, Size: {length} bytes')
    except Exception as e:
        print(f'\n=== LOGO SERVE ===')
        print(f'Error: {e}')

if __name__ == '__main__':
    check_news()
    check_conflicts()
    check_aircraft()
    check_earthquakes()
    check_naval()
    check_calendar()
    check_logo()
