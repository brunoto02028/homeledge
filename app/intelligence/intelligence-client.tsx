'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Globe, Zap, TrendingUp, TrendingDown, Minus,
  X, ExternalLink, Clock, AlertTriangle, Shield, RefreshCw,
  ChevronDown, Newspaper, Activity, Eye, Volume2, VolumeX,
  Plane, BarChart3, CloudRain, Menu,
  Anchor, Ship, DollarSign, ChevronRight, ChevronLeft,
  MapPin, BookOpen, Calendar, Layers, Radio,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface NewsArticle {
  id: string; title: string; description: string; url: string; imageUrl: string | null;
  source: string; sourceId: string; publishedAt: string; category: string;
  country: string; continent: string; coordinates: [number, number] | null;
  sentiment: 'negative' | 'positive' | 'neutral'; ukImpact: boolean;
  prophecyRelated: boolean; prophecyRef: string | null;
}
interface NavalVessel {
  name: string; type: string; nation: string; fleet: string;
  lat: number; lng: number; area: string; status: string; details: string; color: string;
}
interface EconomicEvent {
  id: string; date: string; time: string; country: string; countryCode: string;
  event: string; impact: 'high' | 'medium' | 'low'; category: string; description?: string;
}

const CATEGORIES = [
  { id: '', label: 'All', icon: Globe },
  { id: 'general', label: 'General', icon: Newspaper },
  { id: 'business', label: 'Business', icon: TrendingUp },
  { id: 'technology', label: 'Tech', icon: Zap },
  { id: 'science', label: 'Science', icon: Activity },
  { id: 'health', label: 'Health', icon: Shield },
  { id: 'prophecy', label: 'Prophecy', icon: Eye },
];

const CONTINENTS = ['All Regions', 'Europe', 'Americas', 'Asia', 'Middle East', 'Africa', 'Oceania'];

const SC: Record<string, { fill: string; glow: string; label: string }> = {
  negative: { fill: '#ff2d55', glow: 'rgba(255,45,85,0.6)', label: 'CRISIS' },
  positive: { fill: '#30d158', glow: 'rgba(48,209,88,0.6)', label: 'POSITIVE' },
  neutral: { fill: '#0af', glow: 'rgba(0,170,255,0.5)', label: 'NEUTRAL' },
};

const MAP_STYLES = [
  { id: 'voyager', label: 'COLOR', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', sub: 'abcd' },
  { id: 'dark', label: 'DARK', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', sub: 'abcd' },
  { id: 'satellite', label: 'SAT', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', sub: undefined },
  { id: 'topo', label: 'TERRAIN', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', sub: 'abc' },
];

const OWM_KEY = '9de243494c0b295cca9337e1e96b00e2';
const WEATHER_LAYERS = [
  { id: 'clouds', label: 'Clouds', url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}` },
  { id: 'precip', label: 'Rain', url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}` },
  { id: 'temp', label: 'Temp', url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}` },
  { id: 'wind', label: 'Wind', url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}` },
];

type BottomTab = 'none' | 'calendar' | 'naval' | 'cross-ref' | 'stats';

// ─── Component ──────────────────────────────────────────────────────────────
export default function IntelligenceClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const aircraftMarkersRef = useRef<any[]>([]);
  const aircraftTrailsRef = useRef<any[]>([]);
  const prevAircraftRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const quakeMarkersRef = useRef<any[]>([]);
  const navalMarkersRef = useRef<any[]>([]);
  const conflictMarkersRef = useRef<any[]>([]);
  const weatherLayerRef = useRef<any>(null);

  // Data
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [navalVessels, setNavalVessels] = useState<NavalVessel[]>([]);
  const [navalSummary, setNavalSummary] = useState<any>(null);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [econSummary, setEconSummary] = useState<any>(null);
  const [worldStats, setWorldStats] = useState<any>(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState<any>(null);
  const [selectedAircraftDetail, setSelectedAircraftDetail] = useState<any>(null);
  const [selectedVessel, setSelectedVessel] = useState<NavalVessel | null>(null);
  const [aircraftCount, setAircraftCount] = useState(0);
  const [quakeCount, setQuakeCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);

  // UI
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [continentFilter, setContinentFilter] = useState('All Regions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('voyager');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveTime, setLiveTime] = useState('');

  // Layers
  const [showAircraft, setShowAircraft] = useState(true);
  const [showQuakes, setShowQuakes] = useState(true);
  const [showNaval, setShowNaval] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [weatherLayer, setWeatherLayer] = useState('');
  const [scanLineOn, setScanLineOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>('none');

  // ─── Live clock ───────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }));
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // ─── Filters ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = articles;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter(a => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q));
    }
    if (sentimentFilter === 'negative' || sentimentFilter === 'positive') r = r.filter(a => a.sentiment === sentimentFilter);
    else if (sentimentFilter === 'uk') r = r.filter(a => a.ukImpact);
    else if (sentimentFilter === 'prophecy') r = r.filter(a => a.prophecyRelated);
    if (categoryFilter) r = r.filter(a => a.category === categoryFilter);
    if (continentFilter !== 'All Regions') r = r.filter(a => a.continent === continentFilter);
    return r;
  }, [articles, searchTerm, sentimentFilter, categoryFilter, continentFilter]);

  const stats = useMemo(() => ({
    total: filtered.length, crisis: filtered.filter(a => a.sentiment === 'negative').length,
    opportunity: filtered.filter(a => a.sentiment === 'positive').length,
    ukImpact: filtered.filter(a => a.ukImpact).length, prophecy: filtered.filter(a => a.prophecyRelated).length,
  }), [filtered]);

  const threatLevel = useMemo(() => {
    if (articles.length === 0) return 0;
    const crisisRatio = articles.filter(a => a.sentiment === 'negative').length / articles.length;
    return Math.min(100, Math.round(crisisRatio * 100 + conflictCount * 3 + quakeCount * 0.5));
  }, [articles, conflictCount, quakeCount]);

  const threatColor = threatLevel > 70 ? '#ff2d55' : threatLevel > 40 ? '#f59e0b' : '#30d158';

  // ─── Sound ────────────────────────────────────────────────────────────
  const playBlip = useCallback((freq: number) => {
    if (!sfxOn) return;
    try {
      const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; o.type = 'sine';
      g.gain.value = 0.06; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.12);
    } catch {}
  }, [sfxOn]);

  // ─── Fetch news ───────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) { const d = await res.json(); setArticles(d.articles || []); playBlip(660); }
    } catch (e) { console.error('[News]', e); }
    setLoading(false);
  }, [playBlip]);

  // ─── Init Leaflet ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L) { setTimeout(initMap, 200); return; }
      const map = L.map(mapContainerRef.current, {
        center: [25, 10], zoom: 3, minZoom: 2, maxZoom: 18,
        zoomControl: false, worldCopyJump: true, attributionControl: false,
      });
      const style = MAP_STYLES.find(s => s.id === 'voyager')!;
      const tile = L.tileLayer(style.url, { maxZoom: 19, subdomains: style.sub }).addTo(map);
      tileLayerRef.current = tile;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
      setMapLoaded(true);
    };
    if (!(window as any).L) {
      const link = document.createElement('link'); link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 100); document.head.appendChild(script);
    } else { initMap(); }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // ─── Change map style ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const L = (window as any).L; if (!L) return;
    const style = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(style.url, { maxZoom: 19, subdomains: style.sub }).addTo(mapRef.current);
  }, [mapStyle]);

  // ─── Weather overlay ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    if (weatherLayerRef.current) { mapRef.current.removeLayer(weatherLayerRef.current); weatherLayerRef.current = null; }
    if (!weatherLayer) return;
    const wl = WEATHER_LAYERS.find(w => w.id === weatherLayer);
    if (wl) { weatherLayerRef.current = L.tileLayer(wl.url, { opacity: 0.6, maxZoom: 19 }).addTo(mapRef.current); }
  }, [weatherLayer, mapLoaded]);

  // ─── Fetch data ───────────────────────────────────────────────────────
  useEffect(() => { fetchNews(); }, [fetchNews]);
  useEffect(() => { const i = setInterval(fetchNews, 60000); return () => clearInterval(i); }, [fetchNews]);

  useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/intelligence/economic-calendar'); if (r.ok) { const d = await r.json(); setEconomicEvents(d.upcoming || d.events || []); setEconSummary(d.summary || null); } } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => { try { const r = await fetch('/api/intelligence/world-stats'); if (r.ok) setWorldStats(await r.json()); } catch {} })();
  }, []);

  // ─── Plot news markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];
    filtered.filter(a => a.coordinates).forEach(article => {
      if (!article.coordinates) return;
      const sc = SC[article.sentiment] || SC.neutral;
      const sz = article.ukImpact ? 16 : article.prophecyRelated ? 14 : 11;
      const icon = L.divIcon({
        className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
        html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${sc.fill};
          box-shadow:0 0 ${sz}px ${sc.glow},0 0 ${sz * 3}px ${sc.glow};cursor:pointer;
          animation:cc-pulse 2s ease-in-out infinite;position:relative;">
          ${article.prophecyRelated ? `<div style="position:absolute;top:-3px;right:-3px;width:5px;height:5px;border-radius:50%;background:#fbbf24;box-shadow:0 0 6px #fbbf24;"></div>` : ''}
        </div>`,
      });
      const marker = L.marker([article.coordinates[1], article.coordinates[0]], { icon }).addTo(mapRef.current);
      marker.bindTooltip(`<div style="font-family:'Courier New',monospace;font-size:11px;max-width:300px;padding:10px 12px;background:rgba(5,5,15,0.96);border:1px solid ${sc.fill}50;border-radius:8px;color:#ededed;backdrop-filter:blur(20px);">
        <div style="font-weight:700;margin-bottom:5px;line-height:1.3;border-left:3px solid ${sc.fill};padding-left:8px;">${article.title?.slice(0, 90)}${(article.title?.length || 0) > 90 ? '...' : ''}</div>
        <div style="display:flex;gap:8px;align-items:center;font-size:9px;color:#888;"><span style="color:${sc.fill};font-weight:700;">${sc.label}</span><span>·</span><span>${article.source}</span><span>·</span><span>${article.country?.toUpperCase()}</span></div>
        ${article.prophecyRef ? `<div style="margin-top:6px;padding:4px 8px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:4px;font-size:9px;color:#fbbf24;">📖 ${article.prophecyRef.slice(0, 70)}</div>` : ''}
      </div>`, { direction: 'top', offset: [0, -10], opacity: 1, className: 'cc-tooltip' });
      marker.on('click', () => {
        setSelectedArticle(article); playBlip(article.sentiment === 'negative' ? 440 : 880);
        mapRef.current.flyTo([article.coordinates![1], article.coordinates![0]], 5, { duration: 1.2 });
      });
      markersRef.current.push(marker);
    });
  }, [filtered, mapLoaded, playBlip]);

  // ─── Aircraft layer — live movement with trails ─────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    aircraftMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    aircraftMarkersRef.current = [];
    aircraftTrailsRef.current.forEach(t => mapRef.current.removeLayer(t));
    aircraftTrailsRef.current = [];
    if (!showAircraft) { setAircraftCount(0); prevAircraftRef.current.clear(); return; }

    let interpTimer: any = null;
    const acDataRef: { current: any[] } = { current: [] };

    const fetchAircraft = async () => {
      try {
        const res = await fetch('/api/intelligence/aircraft'); if (!res.ok) return;
        const data = await res.json();
        const aircraft = data.aircraft || [];
        setAircraftCount(aircraft.length);
        acDataRef.current = aircraft;

        // Clear old trails
        aircraftTrailsRef.current.forEach(t => mapRef.current?.removeLayer(t));
        aircraftTrailsRef.current = [];

        // Build new position map + draw trails from prev position
        const newPosMap = new Map<string, { lat: number; lng: number }>();
        aircraft.forEach((ac: any) => {
          const key = ac.icao24 || ac.callsign || `${ac.lat}-${ac.lng}`;
          const prev = prevAircraftRef.current.get(key);
          newPosMap.set(key, { lat: ac.lat, lng: ac.lng });
          // Draw trail line from previous to current position
          if (prev && mapRef.current) {
            const dist = Math.abs(prev.lat - ac.lat) + Math.abs(prev.lng - ac.lng);
            if (dist > 0.01 && dist < 10) {
              const color = ac.military ? '#ff444480' : '#00e5ff50';
              const trail = L.polyline([[prev.lat, prev.lng], [ac.lat, ac.lng]], {
                color, weight: ac.military ? 2 : 1, opacity: 0.6, dashArray: '4 4',
              }).addTo(mapRef.current);
              aircraftTrailsRef.current.push(trail);
              // Fade trail after 20s
              setTimeout(() => { if (mapRef.current) try { mapRef.current.removeLayer(trail); } catch {} }, 20000);
            }
          }
        });
        prevAircraftRef.current = newPosMap;

        // Clear old markers
        aircraftMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
        aircraftMarkersRef.current = [];

        // Create markers
        aircraft.forEach((ac: any) => {
          const isMil = ac.military;
          const color = isMil ? '#ff4444' : '#00e5ff';
          const sz = isMil ? 20 : 14;
          const icon = L.divIcon({
            className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
            html: `<div class="cc-aircraft" style="transform:rotate(${ac.heading || 0}deg);width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;cursor:pointer;filter:drop-shadow(0 0 6px ${color});transition:transform 2s linear;">
              <svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${color}" opacity="${isMil ? 1 : 0.85}">
                <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>`,
          });
          const marker = L.marker([ac.lat, ac.lng], { icon }).addTo(mapRef.current);
          (marker as any)._acData = ac;
          const csLabel = ac.callsign || 'N/A';
          const speedKnots = ac.velocity ? Math.round(ac.velocity / 1.852) : null;
          const altFeet = ac.altitude ? Math.round(ac.altitude * 3.281) : null;
          marker.bindTooltip(`<div style="font-family:'Courier New',monospace;font-size:10px;padding:10px 12px;background:rgba(5,5,15,0.97);border:1px solid ${color}50;border-radius:8px;color:#ededed;backdrop-filter:blur(20px);min-width:200px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid ${color}20;">
              <span style="font-weight:800;color:${color};font-size:14px;">✈ ${csLabel}</span>
              ${isMil ? '<span style="background:rgba(255,68,68,0.15);color:#ff4444;font-size:8px;padding:2px 6px;border-radius:3px;border:1px solid rgba(255,68,68,0.3);font-weight:700;">MILITARY</span>' : '<span style="background:rgba(0,229,255,0.1);color:#00e5ff;font-size:8px;padding:2px 6px;border-radius:3px;border:1px solid rgba(0,229,255,0.2);">CIVILIAN</span>'}
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:3px 8px;font-size:9px;">
              <span style="color:#555;">ORIGIN</span><span style="color:#ddd;font-weight:600;">${ac.country}</span>
              <span style="color:#555;">ALTITUDE</span><span style="color:#ddd;">${ac.altitude ? ac.altitude.toLocaleString() + ' m' : '—'}${altFeet ? ' <span style="color:#666;">(' + altFeet.toLocaleString() + ' ft)</span>' : ''}</span>
              <span style="color:#555;">SPEED</span><span style="color:#ddd;">${ac.velocity ? ac.velocity + ' km/h' : '—'}${speedKnots ? ' <span style="color:#666;">(' + speedKnots + ' kts)</span>' : ''}</span>
              <span style="color:#555;">HEADING</span><span style="color:#ddd;">${ac.heading ? ac.heading + '°' : '—'}</span>
              <span style="color:#555;">ICAO24</span><span style="color:#888;">${ac.icao24 || '—'}</span>
              <span style="color:#555;">ZONE</span><span style="color:#888;">${ac.zone}</span>
              <span style="color:#555;">POSITION</span><span style="color:#888;">${ac.lat?.toFixed(3)}°, ${ac.lng?.toFixed(3)}°</span>
            </div>
          </div>`, { direction: 'top', offset: [0, -10], opacity: 1, className: 'cc-tooltip' });
          marker.on('click', () => { setSelectedAircraftDetail(ac); mapRef.current?.flyTo([ac.lat, ac.lng], 7, { duration: 1 }); });
          aircraftMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Aircraft]', err); }
    };

    // Interpolate positions between fetches — moves aircraft smoothly
    const startInterpolation = () => {
      interpTimer = setInterval(() => {
        aircraftMarkersRef.current.forEach(marker => {
          const ac = (marker as any)._acData;
          if (!ac || !ac.heading || !ac.velocity) return;
          const pos = marker.getLatLng();
          // Move ~1 second of travel: velocity is km/h, convert to deg/s
          const speedDegPerSec = (ac.velocity / 3600) / 111; // ~111km per degree
          const hdgRad = (ac.heading * Math.PI) / 180;
          const newLat = pos.lat + speedDegPerSec * Math.cos(hdgRad);
          const newLng = pos.lng + speedDegPerSec * Math.sin(hdgRad);
          marker.setLatLng([newLat, newLng]);
        });
      }, 1000);
    };

    fetchAircraft().then(startInterpolation);
    const fetchInterval = setInterval(fetchAircraft, 30000); // Refresh every 30s
    return () => {
      clearInterval(fetchInterval);
      if (interpTimer) clearInterval(interpTimer);
    };
  }, [showAircraft, mapLoaded]);

  // ─── Earthquake layer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    quakeMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    quakeMarkersRef.current = [];
    if (!showQuakes) { setQuakeCount(0); return; }
    const fetchQuakes = async () => {
      try {
        const res = await fetch('/api/intelligence/earthquakes'); if (!res.ok) return;
        const data = await res.json();
        setQuakeCount(data.earthquakes?.length || 0);
        quakeMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
        quakeMarkersRef.current = [];
        (data.earthquakes || []).forEach((eq: any) => {
          const mag = eq.magnitude || 0;
          const sz = Math.max(12, Math.min(44, mag * 7));
          const color = mag >= 6 ? '#ff2d55' : mag >= 5 ? '#ff6b35' : mag >= 4 ? '#f59e0b' : '#22c55e';
          const icon = L.divIcon({
            className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
            html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:radial-gradient(circle,${color}40 0%,${color}10 60%,transparent 70%);border:2px solid ${color};box-shadow:0 0 ${sz}px ${color}50;animation:cc-pulse 1.5s ease-in-out infinite;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:${Math.max(9, sz / 3.5)}px;font-weight:800;color:${color};font-family:monospace;text-shadow:0 0 6px ${color};">${mag.toFixed(1)}</span>
            </div>`,
          });
          const marker = L.marker([eq.lat, eq.lng], { icon }).addTo(mapRef.current);
          marker.bindTooltip(`<div style="font-family:monospace;font-size:10px;padding:8px 10px;background:rgba(5,5,15,0.96);border:1px solid ${color}40;border-radius:6px;color:#ededed;backdrop-filter:blur(20px);">
            <div style="font-weight:700;color:${color};font-size:13px;margin-bottom:3px;">⚡ M${mag.toFixed(1)}</div>
            <div style="color:#ccc;margin-bottom:2px;">${eq.place}</div>
            <div style="color:#888;font-size:9px;">${eq.depth?.toFixed(1)}km deep · ${new Date(eq.time).toLocaleString()}</div>
            ${eq.tsunami ? '<div style="color:#06b6d4;font-size:9px;margin-top:3px;font-weight:700;">🌊 TSUNAMI WARNING</div>' : ''}
          </div>`, { direction: 'top', offset: [0, -sz / 2], opacity: 1, className: 'cc-tooltip' });
          marker.on('click', () => { setSelectedEarthquake(eq); mapRef.current?.flyTo([eq.lat, eq.lng], 6, { duration: 1 }); });
          quakeMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Quakes]', err); }
    };
    fetchQuakes();
    const i = setInterval(fetchQuakes, 300000);
    return () => clearInterval(i);
  }, [showQuakes, mapLoaded]);

  // ─── Conflict layer — identified by name, description, source ────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    conflictMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    conflictMarkersRef.current = [];
    if (!showConflicts) { setConflictCount(0); return; }
    const fetchConflicts = async () => {
      try {
        const res = await fetch('/api/intelligence/conflicts'); if (!res.ok) return;
        const data = await res.json();
        setConflictCount(data.conflicts?.length || 0);
        conflictMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
        conflictMarkersRef.current = [];
        (data.conflicts || []).forEach((c: any) => {
          const intensity = Math.min(c.eventCount || 1, 30);
          const sz = Math.max(14, Math.min(28, 10 + intensity * 1.5));
          const caption = c.captionfull || c.name || 'Unknown conflict';
          const shortCaption = caption.length > 50 ? caption.slice(0, 50) + '...' : caption;
          const icon = L.divIcon({
            className: '', iconSize: [sz * 2.5, sz * 2.5], iconAnchor: [sz * 1.25, sz * 1.25],
            html: `<div style="width:${sz * 2.5}px;height:${sz * 2.5}px;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;">
              <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:radial-gradient(circle,rgba(239,68,68,0.6) 0%,rgba(239,68,68,0.15) 50%,transparent 70%);border:2px solid rgba(239,68,68,0.8);box-shadow:0 0 ${sz * 2}px rgba(239,68,68,0.5),0 0 ${sz * 4}px rgba(239,68,68,0.2);animation:cc-pulse 1.8s ease-in-out infinite;"></div>
              <div style="position:absolute;width:${sz * 2}px;height:${sz * 2}px;border:1px solid rgba(239,68,68,0.2);border-radius:50%;animation:cc-ring 2.5s ease-out infinite;"></div>
              <div style="position:absolute;width:${sz * 2.4}px;height:${sz * 2.4}px;border:1px dashed rgba(239,68,68,0.1);border-radius:50%;animation:cc-ring 4s ease-out infinite;"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${Math.max(10, sz * 0.5)}px;pointer-events:none;">⚔</div>
            </div>`,
          });
          const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapRef.current);
          marker.bindTooltip(`<div style="font-family:'Courier New',monospace;font-size:10px;padding:10px 12px;background:rgba(5,5,15,0.97);border:1px solid rgba(239,68,68,0.4);border-radius:8px;color:#ededed;backdrop-filter:blur(20px);max-width:320px;min-width:220px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(239,68,68,0.15);">
              <span style="font-weight:800;color:#ef4444;font-size:13px;">⚔ CONFLICT</span>
              <span style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:8px;padding:2px 6px;border-radius:3px;border:1px solid rgba(239,68,68,0.3);font-weight:700;">${intensity} EVENTS</span>
            </div>
            <div style="color:#ededed;font-weight:600;margin-bottom:4px;line-height:1.4;font-size:11px;">${shortCaption}</div>
            <div style="display:grid;grid-template-columns:60px 1fr;gap:2px 8px;font-size:9px;">
              <span style="color:#555;">LOCATION</span><span style="color:#ccc;">${c.name}</span>
              <span style="color:#555;">COORDS</span><span style="color:#888;">${c.lat?.toFixed(3)}°, ${c.lng?.toFixed(3)}°</span>
              <span style="color:#555;">PERIOD</span><span style="color:#888;">Last 48 hours</span>
            </div>
            ${c.url ? '<div style="margin-top:6px;font-size:8px;color:#666;">Click for source article →</div>' : ''}
          </div>`, { direction: 'top', offset: [0, -sz * 1.25], opacity: 1, className: 'cc-tooltip' });
          marker.on('click', () => {
            if (c.url) window.open(c.url, '_blank');
            else mapRef.current?.flyTo([c.lat, c.lng], 7, { duration: 1 });
          });
          conflictMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Conflicts]', err); }
    };
    fetchConflicts();
    const i = setInterval(fetchConflicts, 600000);
    return () => clearInterval(i);
  }, [showConflicts, mapLoaded]);

  // ─── Naval layer — enhanced ship markers with full info ──────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L; if (!L) return;
    navalMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    navalMarkersRef.current = [];
    if (!showNaval) return;
    const NATION_FLAGS: Record<string, string> = { US: '🇺🇸', UK: '🇬🇧', FR: '🇫🇷', RU: '🇷🇺', CN: '🇨🇳', IN: '🇮🇳', IT: '🇮🇹', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺', TR: '🇹🇷', EG: '🇪🇬', BR: '🇧🇷', MULTI: '🌐', NATO: '🔵' };
    const TYPE_LABELS: Record<string, string> = { carrier: 'AIRCRAFT CARRIER', amphibious: 'AMPHIBIOUS ASSAULT', cruiser: 'CRUISER', frigate: 'FRIGATE', destroyer: 'DESTROYER', patrol_zone: 'STRATEGIC WATERWAY' };
    const fetchNaval = async () => {
      try {
        const res = await fetch('/api/intelligence/naval'); if (!res.ok) return;
        const data = await res.json();
        setNavalVessels(data.vessels || []); setNavalSummary(data.summary || null);
        navalMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
        navalMarkersRef.current = [];
        (data.vessels || []).forEach((v: NavalVessel) => {
          const isP = v.type === 'patrol_zone'; const isC = v.type === 'carrier';
          const isA = v.type === 'amphibious';
          const sz = isP ? 28 : isC ? 24 : isA ? 18 : 16;
          const flag = NATION_FLAGS[v.nation] || '🏴';
          const stColor = v.status === 'deployed' || v.status === 'active' || v.status === 'forward-deployed' ? '#22c55e' : v.status === 'high-alert' ? '#ef4444' : v.status === 'sea-trials' ? '#f59e0b' : '#94a3b8';
          const icon = L.divIcon({
            className: '', iconSize: [sz + 8, sz + 8], iconAnchor: [(sz + 8) / 2, (sz + 8) / 2],
            html: isP
              ? `<div style="width:${sz + 8}px;height:${sz + 8}px;border-radius:6px;border:2px dashed rgba(100,116,139,0.5);background:rgba(100,116,139,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;animation:cc-pulse 3s ease-in-out infinite;"><span style="font-size:12px;">🔒</span></div>`
              : `<div style="width:${sz + 8}px;height:${sz + 8}px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;">
                  <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${v.color}25;border:2px solid ${v.color};box-shadow:0 0 ${sz}px ${v.color}40,0 0 ${sz * 2}px ${v.color}15;display:flex;align-items:center;justify-content:center;">
                    <svg width="${sz * 0.55}" height="${sz * 0.55}" viewBox="0 0 24 24" fill="none" stroke="${v.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
                  </div>
                  <div style="position:absolute;top:-2px;right:-2px;font-size:8px;line-height:1;">${flag}</div>
                </div>`,
          });
          const marker = L.marker([v.lat, v.lng], { icon }).addTo(mapRef.current);
          const typeLabel = TYPE_LABELS[v.type] || v.type.toUpperCase();
          marker.bindTooltip(`<div style="font-family:'Courier New',monospace;font-size:10px;padding:10px 12px;background:rgba(5,5,15,0.97);border:1px solid ${v.color}50;border-radius:8px;color:#ededed;backdrop-filter:blur(20px);min-width:240px;max-width:320px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid ${v.color}20;">
              <span style="font-size:14px;">${flag}</span>
              <span style="font-weight:800;color:${v.color};font-size:12px;">${v.name}</span>
            </div>
            <div style="display:grid;grid-template-columns:60px 1fr;gap:3px 8px;font-size:9px;">
              <span style="color:#555;">TYPE</span><span style="color:#ddd;font-weight:600;">${typeLabel}</span>
              <span style="color:#555;">FLEET</span><span style="color:#ccc;">${v.fleet}</span>
              <span style="color:#555;">AREA</span><span style="color:#ccc;">${v.area}</span>
              <span style="color:#555;">STATUS</span><span style="font-weight:700;color:${stColor};">${v.status.toUpperCase()}</span>
              <span style="color:#555;">COORDS</span><span style="color:#888;">${v.lat.toFixed(3)}°N, ${v.lng.toFixed(3)}°E</span>
              <span style="color:#555;">DETAILS</span><span style="color:#888;">${v.details}</span>
            </div>
            <div style="margin-top:6px;font-size:8px;color:#555;">Click for full intel panel →</div>
          </div>`, { direction: 'top', offset: [0, -(sz + 8) / 2], opacity: 1, className: 'cc-tooltip' });
          marker.on('click', () => { setSelectedVessel(v); mapRef.current?.flyTo([v.lat, v.lng], 6, { duration: 1 }); });
          navalMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Naval]', err); }
    };
    fetchNaval();
    const i = setInterval(fetchNaval, 300000);
    return () => clearInterval(i);
  }, [showNaval, mapLoaded]);

  const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`; };

  const crossRefGroups = useMemo(() => {
    const kws = ['war', 'ukraine', 'russia', 'gaza', 'israel', 'iran', 'china', 'taiwan', 'nato', 'nuclear', 'oil', 'sanctions', 'earthquake', 'famine', 'inflation', 'recession'];
    const groups: { keyword: string; articles: NewsArticle[]; prophecyRef?: string }[] = [];
    kws.forEach(kw => {
      const matched = articles.filter(a => `${a.title} ${a.description}`.toLowerCase().includes(kw));
      if (matched.length >= 2) groups.push({ keyword: kw, articles: matched.slice(0, 10), prophecyRef: matched.find(a => a.prophecyRef)?.prophecyRef || undefined });
    });
    return groups.sort((a, b) => b.articles.length - a.articles.length).slice(0, 12);
  }, [articles]);

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050510]" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* ═══ HUD CORNER BRACKETS ═══ */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <svg className="absolute top-2 left-2 w-12 h-12 text-cyan-400/30"><path d="M0 20 L0 0 L20 0" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        <svg className="absolute top-2 right-2 w-12 h-12 text-cyan-400/30"><path d="M28 0 L48 0 L48 20" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        <svg className="absolute bottom-2 left-2 w-12 h-12 text-cyan-400/30"><path d="M0 28 L0 48 L20 48" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        <svg className="absolute bottom-2 right-2 w-12 h-12 text-cyan-400/30"><path d="M28 48 L48 48 L48 28" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
      </div>

      {/* ═══ GRID + SCAN ═══ */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(0,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.4) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      {scanLineOn && <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"><div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent cc-scan-line" /></div>}

      {/* ═══ RADAR SWEEP ═══ */}
      <div className="absolute bottom-20 left-4 z-[2] pointer-events-none hidden lg:block">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border border-cyan-500/10" />
          <div className="absolute inset-3 rounded-full border border-cyan-500/8" />
          <div className="absolute inset-6 rounded-full border border-cyan-500/6" />
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full cc-radar-sweep" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,255,0.15) 30deg, transparent 60deg)' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.8)]" />
          </div>
        </div>
      </div>

      {/* ═══════════ COMMAND BAR ═══════════ */}
      <div className="absolute top-0 left-0 right-0 z-10" style={{ background: 'linear-gradient(180deg, rgba(5,5,16,0.98) 0%, rgba(5,5,16,0.85) 70%, transparent 100%)' }}>
        {/* Row 1: Title + Clock + Threat */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 border-b border-cyan-500/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-2.5 h-2.5"><div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" /><div className="relative w-2.5 h-2.5 rounded-full bg-red-500" /></div>
            <h1 className="text-white font-mono text-xs sm:text-base font-black tracking-[0.15em] uppercase">COMMAND CENTER</h1>
            <span className="text-red-400 font-mono text-[10px] sm:text-xs font-bold tracking-wider animate-pulse">LIVE</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">THREAT</span>
              <div className="w-20 h-2.5 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/30">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${threatLevel}%`, background: `linear-gradient(90deg, #22c55e, ${threatColor})`, boxShadow: `0 0 8px ${threatColor}40` }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: threatColor }}>{threatLevel}%</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400 text-xs sm:text-sm font-bold tabular-nums tracking-wider">{liveTime}</span>
              <span className="text-zinc-600 text-[9px]">UTC</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-zinc-400 hover:text-white p-1">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Row 2: Controls (desktop) */}
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5`}>
          {/* Layer group */}
          <div className="flex items-center gap-0.5 bg-zinc-900/60 rounded-lg border border-zinc-700/20 p-0.5">
            <span className="text-[8px] font-mono text-zinc-600 px-1.5 hidden sm:block">LAYERS</span>
            {([
              { k: 'air', on: showAircraft, set: setShowAircraft, l: '✈ AIR', c: '#00e5ff', cnt: aircraftCount },
              { k: 'nav', on: showNaval, set: setShowNaval, l: '⚓ NAV', c: '#3b82f6', cnt: navalVessels.length },
              { k: 'qk', on: showQuakes, set: setShowQuakes, l: '⚡ QUAKE', c: '#f97316', cnt: quakeCount },
              { k: 'cf', on: showConflicts, set: setShowConflicts, l: '⚔ WAR', c: '#ef4444', cnt: conflictCount },
            ] as const).map(b => (
              <button key={b.k} onClick={() => b.set(!b.on)}
                className="px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold tracking-wider transition-all relative"
                style={b.on ? { background: `${b.c}15`, color: b.c, borderColor: `${b.c}30`, border: '1px solid' } : { background: 'transparent', color: '#555', border: '1px solid transparent' }}>
                {b.l}
                {b.on && b.cnt > 0 && <span className="ml-1 text-[8px] opacity-60">{b.cnt}</span>}
              </button>
            ))}
          </div>

          {/* Weather group */}
          <div className="flex items-center gap-0.5 bg-zinc-900/60 rounded-lg border border-zinc-700/20 p-0.5">
            <span className="text-[8px] font-mono text-zinc-600 px-1.5 hidden sm:block">WX</span>
            {WEATHER_LAYERS.map(w => (
              <button key={w.id} onClick={() => setWeatherLayer(weatherLayer === w.id ? '' : w.id)}
                className="px-1.5 py-1 rounded-md text-[9px] font-mono tracking-wider transition-all"
                style={weatherLayer === w.id ? { background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)' } : { color: '#555', border: '1px solid transparent' }}>
                {w.label}
              </button>
            ))}
          </div>

          {/* Map style */}
          <div className="flex items-center gap-0.5 bg-zinc-900/60 rounded-lg border border-zinc-700/20 p-0.5">
            <span className="text-[8px] font-mono text-zinc-600 px-1.5 hidden sm:block">MAP</span>
            {MAP_STYLES.map(s => (
              <button key={s.id} onClick={() => setMapStyle(s.id)}
                className="px-1.5 py-1 rounded-md text-[9px] font-mono tracking-wider transition-all"
                style={mapStyle === s.id ? { background: 'rgba(0,255,255,0.1)', color: '#0ff', border: '1px solid rgba(0,255,255,0.2)' } : { color: '#555', border: '1px solid transparent' }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-0.5 bg-zinc-900/60 rounded-lg border border-zinc-700/20 p-0.5">
            <button onClick={() => setScanLineOn(!scanLineOn)} className={`px-1.5 py-1 rounded-md text-[9px] font-mono ${scanLineOn ? 'text-cyan-400' : 'text-zinc-600'}`}>SCAN</button>
            <button onClick={() => setSfxOn(!sfxOn)} className={`px-1.5 py-1 rounded-md text-[9px] font-mono ${sfxOn ? 'text-cyan-400' : 'text-zinc-600'}`}>SFX</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => fetchNews()} disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-cyan-400 transition-all border border-cyan-500/20 hover:bg-cyan-500/10" style={{ background: 'rgba(0,255,255,0.05)' }}>
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-white transition-all border border-zinc-700/30 hover:bg-zinc-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Newspaper className="w-3 h-3" /> INTEL
            </button>
            <a href="/dashboard" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-zinc-500 border border-zinc-800/30 hover:text-zinc-300 transition">← EXIT</a>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS HUD ═══════════ */}
      <div className="absolute top-[88px] sm:top-[96px] left-2 sm:left-5 z-10 flex gap-1.5 flex-wrap max-w-[60%] sm:max-w-[55%]">
        {([
          { label: 'TRACKING', value: stats.total, color: '#ededed', bg: 'rgba(255,255,255,0.04)', f: '' },
          { label: 'CRISIS', value: stats.crisis, color: '#ff2d55', bg: 'rgba(255,45,85,0.08)', f: 'negative' },
          { label: 'POSITIVE', value: stats.opportunity, color: '#30d158', bg: 'rgba(48,209,88,0.08)', f: 'positive' },
          { label: 'UK IMPACT', value: stats.ukImpact, color: '#0ff', bg: 'rgba(0,255,255,0.06)', f: 'uk' },
          { label: 'PROPHECY', value: stats.prophecy, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', f: 'prophecy' },
        ] as const).map(s => (
          <button key={s.label} onClick={() => setSentimentFilter(sentimentFilter === s.f ? '' : s.f)}
            className={`backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 font-mono cursor-pointer transition-all border
              ${sentimentFilter === s.f && s.f ? 'border-white/20 scale-105 ring-1 ring-white/5' : 'border-white/5 hover:border-white/10'}`}
            style={{ background: s.bg }}>
            <div className="text-[8px] sm:text-[9px] tracking-wider" style={{ color: `${s.color}90` }}>{s.label}</div>
            <div className="text-sm sm:text-lg font-black tabular-nums" style={{ color: s.color, textShadow: `0 0 12px ${s.color}30` }}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* ═══════════ BOTTOM TABS ═══════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center gap-0.5 px-2 sm:px-4 pb-0.5">
          {([
            { id: 'calendar' as BottomTab, icon: Calendar, label: 'Economic Calendar', c: '#22c55e' },
            { id: 'naval' as BottomTab, icon: Anchor, label: 'Naval Ops', c: '#3b82f6' },
            { id: 'cross-ref' as BottomTab, icon: BookOpen, label: 'Cross-Ref', c: '#f59e0b' },
            { id: 'stats' as BottomTab, icon: BarChart3, label: 'World Data', c: '#a855f7' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setBottomTab(bottomTab === tab.id ? 'none' : tab.id)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-t-lg text-[9px] sm:text-[10px] font-mono font-bold tracking-wider transition-all"
              style={bottomTab === tab.id ? { background: 'rgba(5,5,16,0.97)', color: tab.c, borderTop: `2px solid ${tab.c}`, borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' } : { background: 'rgba(20,20,30,0.5)', color: '#555' }}>
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {bottomTab !== 'none' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 260, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="overflow-hidden" style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="h-[260px] overflow-y-auto px-3 sm:px-5 py-3 cc-scrollbar">

                {/* ECONOMIC CALENDAR */}
                {bottomTab === 'calendar' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-mono text-white tracking-wider font-bold">ECONOMIC CALENDAR</span>
                      {econSummary && <span className="text-[10px] font-mono text-zinc-600">{econSummary.highImpactUpcoming} HIGH IMPACT · {econSummary.thisWeek} THIS WEEK</span>}
                    </div>
                    <div className="grid gap-1">
                      {economicEvents.slice(0, 20).map(ev => {
                        const today = ev.date === new Date().toISOString().slice(0, 10);
                        return (
                          <div key={ev.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border font-mono text-xs transition-all ${today ? 'bg-green-500/5 border-green-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                            <div className="w-[60px] shrink-0">
                              <div className={`text-[10px] ${today ? 'text-green-400 font-bold' : 'text-zinc-500'}`}>{ev.date.slice(5)}</div>
                              <div className="text-[9px] text-zinc-700">{ev.time}</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${ev.impact === 'high' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' : ev.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold truncate">{ev.event}</div>
                              <div className="text-zinc-600 text-[10px]">{ev.country}</div>
                            </div>
                            <span className={`text-[8px] px-2 py-0.5 rounded border ${ev.impact === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/5' : ev.impact === 'medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' : 'text-green-400 border-green-500/20 bg-green-500/5'}`}>
                              {ev.impact.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NAVAL OPS */}
                {bottomTab === 'naval' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-mono text-white tracking-wider font-bold">NAVAL DEPLOYMENTS</span>
                      </div>
                      {navalSummary && <div className="flex gap-3 text-[10px] font-mono">
                        <span className="text-blue-400">{navalSummary.carriers} CARRIERS</span>
                        <span className="text-cyan-400">{navalSummary.amphibious} AMPHIB</span>
                        <span className="text-green-400">{navalSummary.deployed} DEPLOYED</span>
                      </div>}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {navalVessels.filter(v => v.type !== 'patrol_zone').slice(0, 18).map((v, i) => (
                        <button key={i} onClick={() => { setSelectedVessel(v); mapRef.current?.flyTo([v.lat, v.lng], 6, { duration: 1 }); }}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/5 hover:border-white/10 transition text-left font-mono bg-white/[0.02]">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}40` }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-white font-bold truncate">{v.name}</div>
                            <div className="text-[9px] text-zinc-600 truncate">{v.fleet} · {v.area}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CROSS-REF */}
                {bottomTab === 'cross-ref' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-mono text-white tracking-wider font-bold">INTEL CROSS-REFERENCE</span>
                      <span className="text-[10px] font-mono text-zinc-600">{crossRefGroups.length} TOPICS</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {crossRefGroups.map((g, i) => (
                        <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono font-bold text-amber-400 uppercase">{g.keyword}</span>
                            <span className="text-[8px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{g.articles.length} sources</span>
                          </div>
                          {g.prophecyRef && <div className="text-[9px] font-mono text-amber-300/50 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 mb-2">📖 {g.prophecyRef}</div>}
                          <div className="space-y-1">{g.articles.slice(0, 3).map((a, j) => (
                            <a key={j} href={a.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-mono text-zinc-500 hover:text-white transition truncate">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${a.sentiment === 'negative' ? 'bg-red-400' : a.sentiment === 'positive' ? 'bg-green-400' : 'bg-cyan-400'}`} />
                              {a.title?.slice(0, 80)}
                            </a>
                          ))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WORLD DATA */}
                {bottomTab === 'stats' && worldStats && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-mono text-white tracking-wider font-bold">GLOBAL STATISTICS</span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                            <div className="text-[8px] text-zinc-600 font-mono">WORLD POP</div>
                            <div className="text-sm text-white font-bold font-mono">{(worldStats.worldPopulation / 1e9).toFixed(2)}B</div>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                            <div className="text-[8px] text-zinc-600 font-mono">NATIONS</div>
                            <div className="text-sm text-white font-bold font-mono">{worldStats.totalCountries}</div>
                          </div>
                        </div>
                        {worldStats.regionStats && Object.entries(worldStats.regionStats).sort((a: any, b: any) => b[1].population - a[1].population).map(([region, data]: [string, any]) => (
                          <div key={region} className="flex items-center justify-between py-0.5 font-mono">
                            <span className="text-[10px] text-zinc-500">{region}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full" style={{ width: `${(data.population / worldStats.worldPopulation) * 100}%` }} /></div>
                              <span className="text-[9px] text-zinc-600 w-10 text-right">{(data.population / 1e9).toFixed(1)}B</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>{worldStats.top15byPopulation?.slice(0, 12).map((c: any) => (<div key={c.code} className="flex items-center justify-between py-0.5 font-mono"><span className="text-[10px] text-zinc-500">{c.flag} {c.name}</span><span className="text-[10px] text-zinc-600">{(c.population / 1e6).toFixed(0)}M</span></div>))}</div>
                      <div>{worldStats.topGDP?.slice(0, 12).map((g: any, i: number) => (<div key={g.code} className="flex items-center justify-between py-0.5 font-mono"><span className="text-[10px] text-zinc-500">{i + 1}. {g.country}</span><span className="text-[10px] text-green-400/60">${(g.gdp / 1e12).toFixed(1)}T</span></div>))}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0, x: 340 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 340 }} transition={{ type: 'spring', damping: 25 }}
            className="absolute top-0 right-0 bottom-0 z-20 w-[320px] sm:w-[360px] overflow-y-auto cc-scrollbar"
            style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(0,255,255,0.08)' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-mono text-white tracking-wider font-bold">INTELLIGENCE FEED</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-600 hover:text-white transition"><X className="w-4 h-4" /></button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search global intelligence..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-500/30 transition" />
              </div>

              <div className="mb-3">
                <div className="text-[8px] text-zinc-600 font-mono tracking-wider mb-1.5">REGION</div>
                <div className="flex flex-wrap gap-1">
                  {CONTINENTS.map(c => (<button key={c} onClick={() => setContinentFilter(c)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all border ${continentFilter === c ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}>{c}</button>))}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-[8px] text-zinc-600 font-mono tracking-wider mb-1.5">CATEGORY</div>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.id ? '' : cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all border ${categoryFilter === cat.id ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}>
                    <cat.icon className="w-3 h-3" />{cat.label}</button>))}
                </div>
              </div>

              <div className="text-[8px] text-zinc-600 font-mono tracking-wider mb-2">LIVE FEED ({filtered.length})</div>
              <div className="space-y-1">
                {filtered.slice(0, 50).map(article => {
                  const sc = SC[article.sentiment] || SC.neutral;
                  return (
                    <button key={article.id} onClick={() => { setSelectedArticle(article); if (article.coordinates && mapRef.current) mapRef.current.flyTo([article.coordinates[1], article.coordinates[0]], 5, { duration: 1 }); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-white/[0.03] hover:border-white/10 transition-all group bg-white/[0.01] hover:bg-white/[0.03]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sc.fill, boxShadow: `0 0 6px ${sc.glow}` }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-zinc-300 leading-tight group-hover:text-white transition cc-clamp-2">{article.title}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-600 font-mono">
                            <span style={{ color: sc.fill }}>{sc.label}</span>
                            <span className="text-zinc-800">·</span>
                            <span>{article.source}</span>
                            <span className="text-zinc-800">·</span>
                            <span>{article.country?.toUpperCase()}</span>
                            <span className="text-zinc-800">·</span>
                            <span>{timeAgo(article.publishedAt)}</span>
                            {article.prophecyRelated && <span className="text-amber-500">📖</span>}
                            {article.ukImpact && <span>🇬🇧</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ POPUPS ═══════════ */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute top-[110px] left-3 sm:left-5 z-30 w-[400px] max-w-[calc(100%-1.5rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', border: `1px solid ${SC[selectedArticle.sentiment]?.fill || '#0af'}30` }}>
            <div className="relative p-4">
              <button onClick={() => setSelectedArticle(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center transition"><X className="w-3.5 h-3.5" /></button>
              {selectedArticle.imageUrl && <div className="w-full h-28 rounded-lg overflow-hidden mb-3"><img src={selectedArticle.imageUrl} alt="" className="w-full h-full object-cover" /></div>}
              <h3 className="text-sm font-semibold text-white leading-tight mb-2 pr-8">{selectedArticle.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3 cc-clamp-3">{selectedArticle.description}</p>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded border" style={{ color: SC[selectedArticle.sentiment]?.fill, background: `${SC[selectedArticle.sentiment]?.fill}10`, borderColor: `${SC[selectedArticle.sentiment]?.fill}25` }}>{SC[selectedArticle.sentiment]?.label}</span>
                <span className="text-[9px] font-mono text-zinc-600">{selectedArticle.source} · {selectedArticle.country?.toUpperCase()} · {timeAgo(selectedArticle.publishedAt)}</span>
              </div>
              {selectedArticle.prophecyRef && <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10"><div className="text-[9px] text-amber-400 font-mono font-bold">📖 PROPHECY</div><div className="text-[10px] text-amber-300/60 font-mono">{selectedArticle.prophecyRef}</div></div>}
              {selectedArticle.ukImpact && <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10"><span className="text-[9px] text-cyan-400 font-mono font-bold">🇬🇧 UK MARKET IMPACT</span></div>}
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono hover:bg-cyan-500/15 transition border border-cyan-500/15 w-fit">READ FULL <ExternalLink className="w-3 h-3" /></a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEarthquake && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[110px] left-3 sm:left-5 z-30 w-[380px] max-w-[calc(100%-1.5rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,100,0,0.25)' }}>
            <div className="relative p-4">
              <button onClick={() => setSelectedEarthquake(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black font-mono ${selectedEarthquake.magnitude >= 6 ? 'bg-red-500/15 text-red-400' : selectedEarthquake.magnitude >= 5 ? 'bg-orange-500/15 text-orange-400' : 'bg-yellow-500/15 text-yellow-400'}`}>M{selectedEarthquake.magnitude?.toFixed(1)}</div>
                <div><div className="text-sm font-semibold text-white">{selectedEarthquake.place}</div><div className="text-[10px] font-mono text-zinc-600">{new Date(selectedEarthquake.time).toLocaleString()}</div></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ l: 'DEPTH', v: `${selectedEarthquake.depth?.toFixed(1)}km` }, { l: 'SIG', v: selectedEarthquake.sig || '—' }, { l: 'STATUS', v: selectedEarthquake.status || '—' }].map(d => (
                  <div key={d.l} className="bg-white/[0.03] rounded-lg p-2 border border-white/5"><div className="text-[8px] text-zinc-600 font-mono">{d.l}</div><div className="text-sm font-bold text-white font-mono capitalize">{d.v}</div></div>
                ))}
              </div>
              {selectedEarthquake.tsunami && <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15"><span className="text-cyan-400 font-mono text-xs font-bold">🌊 TSUNAMI WARNING</span></div>}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-600">{selectedEarthquake.lat?.toFixed(3)}°, {selectedEarthquake.lng?.toFixed(3)}°</span>
                <div className="flex-1" />
                <a href={selectedEarthquake.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-mono hover:bg-orange-500/15 border border-orange-500/15">USGS <ExternalLink className="w-3 h-3" /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAircraftDetail && (() => {
          const ac = selectedAircraftDetail;
          const color = ac.military ? '#ff4444' : '#00e5ff';
          const altFt = ac.altitude ? Math.round(ac.altitude * 3.281).toLocaleString() : null;
          const kts = ac.velocity ? Math.round(ac.velocity / 1.852) : null;
          return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[110px] left-3 sm:left-5 z-30 w-[400px] max-w-[calc(100%-1.5rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', border: `1px solid ${ac.military ? 'rgba(255,68,68,0.3)' : 'rgba(0,229,255,0.25)'}` }}>
            <div className="relative p-4">
              <button onClick={() => setSelectedAircraftDetail(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center relative" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                  <Plane className="w-7 h-7" style={{ color, transform: `rotate(${ac.heading || 0}deg)` }} />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-black font-mono" style={{ color }}>{ac.callsign || 'UNKNOWN'}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">{ac.country}</span>
                    <span className="text-[8px] px-2 py-0.5 rounded font-mono font-bold" style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>{ac.military ? 'MILITARY' : 'CIVILIAN'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { l: 'ALTITUDE', v: ac.altitude ? `${ac.altitude.toLocaleString()}m` : '—', s: altFt ? `${altFt} ft` : '' },
                  { l: 'SPEED', v: ac.velocity ? `${ac.velocity} km/h` : '—', s: kts ? `${kts} knots` : '' },
                  { l: 'HEADING', v: ac.heading ? `${ac.heading}°` : '—', s: '' },
                ].map(d => (
                  <div key={d.l} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                    <div className="text-[7px] text-zinc-600 font-mono tracking-wider">{d.l}</div>
                    <div className="text-sm font-bold text-white font-mono">{d.v}</div>
                    {d.s && <div className="text-[9px] text-zinc-600 font-mono">{d.s}</div>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                  <div className="text-[7px] text-zinc-600 font-mono tracking-wider">ICAO24</div>
                  <div className="text-xs font-bold text-white font-mono">{ac.icao24 || '—'}</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                  <div className="text-[7px] text-zinc-600 font-mono tracking-wider">ZONE</div>
                  <div className="text-xs font-bold text-white font-mono">{ac.zone || '—'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
                <span>Position: {ac.lat?.toFixed(4)}°, {ac.lng?.toFixed(4)}°</span>
                <span>Source: OpenSky Network (ADS-B)</span>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVessel && (() => {
          const NF: Record<string, string> = { US: '🇺🇸', UK: '🇬🇧', FR: '🇫🇷', RU: '🇷🇺', CN: '🇨🇳', IN: '🇮🇳', IT: '🇮🇹', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺', TR: '🇹🇷', EG: '🇪🇬', BR: '🇧🇷', MULTI: '🌐', NATO: '🔵' };
          const TL: Record<string, string> = { carrier: 'AIRCRAFT CARRIER', amphibious: 'AMPHIBIOUS ASSAULT SHIP', cruiser: 'GUIDED-MISSILE CRUISER', frigate: 'FRIGATE', destroyer: 'DESTROYER', patrol_zone: 'STRATEGIC WATERWAY' };
          const NN: Record<string, string> = { US: 'United States', UK: 'United Kingdom', FR: 'France', RU: 'Russia', CN: 'China', IN: 'India', IT: 'Italy', JP: 'Japan', KR: 'South Korea', AU: 'Australia', TR: 'Turkey', EG: 'Egypt', BR: 'Brazil', MULTI: 'Multinational', NATO: 'NATO Alliance' };
          const stColor = selectedVessel.status === 'deployed' || selectedVessel.status === 'active' || selectedVessel.status === 'forward-deployed' ? '#22c55e' : selectedVessel.status === 'high-alert' ? '#ef4444' : selectedVessel.status === 'sea-trials' ? '#f59e0b' : '#94a3b8';
          return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[110px] left-3 sm:left-5 z-30 w-[400px] max-w-[calc(100%-1.5rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(5,5,16,0.97)', backdropFilter: 'blur(30px)', border: `1px solid ${selectedVessel.color}40` }}>
            <div className="relative p-4">
              <button onClick={() => setSelectedVessel(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center relative" style={{ background: `${selectedVessel.color}12`, border: `1px solid ${selectedVessel.color}25` }}>
                  <Ship className="w-7 h-7" style={{ color: selectedVessel.color }} />
                  <span className="absolute -top-1 -right-1 text-sm">{NF[selectedVessel.nation] || '🏴'}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold font-mono" style={{ color: selectedVessel.color }}>{selectedVessel.name}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{TL[selectedVessel.type] || selectedVessel.type.toUpperCase()}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: stColor, background: `${stColor}10`, borderColor: `${stColor}25` }}>{selectedVessel.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {[
                  { l: 'NATION', v: `${NF[selectedVessel.nation] || ''} ${NN[selectedVessel.nation] || selectedVessel.nation}` },
                  { l: 'FLEET', v: selectedVessel.fleet },
                  { l: 'AREA OF OPS', v: selectedVessel.area },
                  { l: 'COORDINATES', v: `${selectedVessel.lat.toFixed(3)}°N, ${selectedVessel.lng.toFixed(3)}°E` },
                ].map(d => (
                  <div key={d.l} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5"><div className="text-[7px] text-zinc-600 font-mono tracking-wider">{d.l}</div><div className="text-xs font-bold text-white font-mono">{d.v}</div></div>
                ))}
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 mb-3">
                <div className="text-[7px] text-zinc-600 font-mono tracking-wider mb-1">OPERATIONAL DETAILS</div>
                <div className="text-xs font-mono text-zinc-400 leading-relaxed">{selectedVessel.details}</div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-700">
                <span>Source: OSINT / Public Naval Records</span>
                <span>Approx. position</span>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══════════ CSS ═══════════ */}
      <style jsx global>{`
        .cc-tooltip { background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important; }
        .cc-tooltip .leaflet-tooltip-content { margin:0!important; }
        .leaflet-tooltip-top:before,.leaflet-tooltip-bottom:before,.leaflet-tooltip-left:before,.leaflet-tooltip-right:before { display:none!important; }
        @keyframes cc-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.2); } }
        @keyframes cc-ring { 0% { opacity:0.5; transform:scale(0.8); } 100% { opacity:0; transform:scale(2); } }
        @keyframes cc-scan { 0% { top:-2px; } 100% { top:100%; } }
        @keyframes cc-radar { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
        .cc-scan-line { animation: cc-scan 6s linear infinite; }
        .cc-radar-sweep { animation: cc-radar 4s linear infinite; }
        .cc-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .cc-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .leaflet-control-zoom { border:1px solid rgba(0,255,255,0.1)!important; border-radius:8px!important; overflow:hidden!important; }
        .leaflet-control-zoom a { background:rgba(5,5,16,0.95)!important; color:#0ff!important; border-color:rgba(0,255,255,0.05)!important; width:32px!important; height:32px!important; line-height:32px!important; font-size:15px!important; }
        .leaflet-control-zoom a:hover { background:rgba(0,255,255,0.1)!important; }
        .cc-scrollbar::-webkit-scrollbar { width:3px; }
        .cc-scrollbar::-webkit-scrollbar-track { background:transparent; }
        .cc-scrollbar::-webkit-scrollbar-thumb { background:rgba(0,255,255,0.1); border-radius:3px; }
        .cc-scrollbar::-webkit-scrollbar-thumb:hover { background:rgba(0,255,255,0.2); }
      `}</style>
    </div>
  );
}
