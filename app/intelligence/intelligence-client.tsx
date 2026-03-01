'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Globe, Zap, TrendingUp, TrendingDown, Minus,
  X, ExternalLink, Clock, AlertTriangle, Shield, RefreshCw,
  ChevronDown, Newspaper, Activity, Eye, Volume2, VolumeX,
  Plane, BarChart3, CloudRain,
  Anchor, Ship, DollarSign, ChevronRight, ChevronLeft,
  MapPin, BookOpen, Calendar,
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

const SENTIMENT_COLORS: Record<string, { fill: string; glow: string; label: string; ring: string }> = {
  negative: { fill: '#ff2d55', glow: 'rgba(255,45,85,0.5)', label: 'Crisis', ring: 'rgba(255,45,85,0.15)' },
  positive: { fill: '#30d158', glow: 'rgba(48,209,88,0.5)', label: 'Opportunity', ring: 'rgba(48,209,88,0.15)' },
  neutral: { fill: '#0af', glow: 'rgba(0,170,255,0.4)', label: 'Neutral', ring: 'rgba(0,170,255,0.1)' },
};

const MAP_STYLES = [
  { id: 'dark', label: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'voyager', label: 'Color', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'satellite', label: 'Sat', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'topo', label: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
];

type BottomTab = 'none' | 'calendar' | 'naval' | 'cross-ref' | 'stats';

// ─── Component ──────────────────────────────────────────────────────────────
export default function IntelligenceClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const aircraftMarkersRef = useRef<any[]>([]);
  const quakeMarkersRef = useRef<any[]>([]);
  const navalMarkersRef = useRef<any[]>([]);
  const conflictMarkersRef = useRef<any[]>([]);
  const weatherLayerRef = useRef<any>(null);

  // Data state
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

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [continentFilter, setContinentFilter] = useState('All Regions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark');

  // Layer toggles
  const [showAircraft, setShowAircraft] = useState(true);
  const [showQuakes, setShowQuakes] = useState(true);
  const [showNaval, setShowNaval] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [scanLineOn, setScanLineOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(false);

  // Bottom panel
  const [bottomTab, setBottomTab] = useState<BottomTab>('none');

  // ─── Filter articles ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = articles;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q)
      );
    }
    if (sentimentFilter === 'negative' || sentimentFilter === 'positive') {
      result = result.filter(a => a.sentiment === sentimentFilter);
    } else if (sentimentFilter === 'uk') {
      result = result.filter(a => a.ukImpact);
    } else if (sentimentFilter === 'prophecy') {
      result = result.filter(a => a.prophecyRelated);
    }
    if (categoryFilter) result = result.filter(a => a.category === categoryFilter);
    if (continentFilter !== 'All Regions') result = result.filter(a => a.continent === continentFilter);
    return result;
  }, [articles, searchTerm, sentimentFilter, categoryFilter, continentFilter]);

  // ─── Stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: filtered.length,
    crisis: filtered.filter(a => a.sentiment === 'negative').length,
    opportunity: filtered.filter(a => a.sentiment === 'positive').length,
    ukImpact: filtered.filter(a => a.ukImpact).length,
    prophecy: filtered.filter(a => a.prophecyRelated).length,
  }), [filtered]);

  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => {
      const c = a.country?.toUpperCase() || '??';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  // ─── Sound effects ────────────────────────────────────────────────────
  const playBlip = useCallback((freq: number) => {
    if (!sfxOn) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.value = 0.08;
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [sfxOn]);

  // ─── Fetch news ──────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        playBlip(660);
      }
    } catch (e) { console.error('[News]', e); }
    setLoading(false);
  }, [playBlip]);

  // ─── Initialize Leaflet Map ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L) { setTimeout(initMap, 200); return; }

      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        worldCopyJump: true,
        attributionControl: false,
      });

      // Default dark tiles
      const tile = L.tileLayer(MAP_STYLES[0].url, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      tileLayerRef.current = tile;

      // Zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
    };

    // Load Leaflet from CDN
    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 100);
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ─── Change map style ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const style = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(style.url, {
      maxZoom: 19,
      subdomains: style.id === 'satellite' ? undefined : 'abcd',
    }).addTo(mapRef.current);
  }, [mapStyle]);

  // ─── Fetch initial data ──────────────────────────────────────────────
  useEffect(() => { fetchNews(); }, [fetchNews]);

  // ─── Plot news markers ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear old markers
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];

    const articlesWithCoords = filtered.filter(a => a.coordinates);

    articlesWithCoords.forEach(article => {
      if (!article.coordinates) return;
      const sc = SENTIMENT_COLORS[article.sentiment] || SENTIMENT_COLORS.neutral;
      const size = article.ukImpact ? 14 : article.prophecyRelated ? 12 : 10;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:${size}px; height:${size}px; border-radius:50%;
          background:${sc.fill}; box-shadow:0 0 ${size}px ${sc.glow}, 0 0 ${size * 2}px ${sc.ring};
          animation: pulse-marker 2s ease-in-out infinite;
          cursor:pointer; position:relative;
        ">
          ${article.prophecyRelated ? `<div style="position:absolute;top:-4px;right:-4px;width:6px;height:6px;border-radius:50%;background:#fbbf24;box-shadow:0 0 4px #fbbf24;"></div>` : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      // Leaflet uses [lat, lng] — API gives [lng, lat]
      const marker = L.marker([article.coordinates[1], article.coordinates[0]], { icon })
        .addTo(mapRef.current);

      const tooltipHtml = `
        <div style="font-family:ui-monospace,monospace;font-size:11px;max-width:280px;padding:8px 10px;
          background:rgba(10,10,20,0.95);border:1px solid ${sc.fill}40;border-radius:8px;
          backdrop-filter:blur(20px);color:#ededed;">
          <div style="font-weight:700;margin-bottom:4px;line-height:1.3;">${article.title?.slice(0, 80)}${(article.title?.length || 0) > 80 ? '...' : ''}</div>
          <div style="display:flex;gap:6px;align-items:center;font-size:9px;color:#888;">
            <span style="color:${sc.fill};font-weight:700;">${sc.label.toUpperCase()}</span>
            <span>·</span>
            <span>${article.source}</span>
            <span>·</span>
            <span>${article.country?.toUpperCase()}</span>
          </div>
          ${article.prophecyRef ? `<div style="margin-top:5px;padding:4px 6px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:4px;font-size:9px;color:#fbbf24;">📖 ${article.prophecyRef.slice(0, 60)}...</div>` : ''}
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top', offset: [0, -8], opacity: 1,
        className: 'intel-tooltip',
      });

      marker.on('click', () => {
        setSelectedArticle(article);
        playBlip(article.sentiment === 'negative' ? 440 : article.ukImpact ? 660 : 880);
        mapRef.current.flyTo([article.coordinates![1], article.coordinates![0]], 5, { duration: 1 });
      });

      markersRef.current.push(marker);
    });
  }, [filtered, mapLoaded, playBlip]);

  // ─── Aircraft layer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    aircraftMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    aircraftMarkersRef.current = [];

    if (!showAircraft) return;

    const fetchAircraft = async () => {
      try {
        const res = await fetch('/api/intelligence/aircraft');
        if (!res.ok) return;
        const data = await res.json();

        (data.aircraft || []).forEach((ac: any) => {
          const isMil = ac.military;
          const rotation = ac.heading || 0;
          const color = isMil ? '#ff4444' : '#facc15';

          const icon = L.divIcon({
            className: 'aircraft-icon',
            html: `<div style="transform:rotate(${rotation}deg);width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1">
                <path d="M12 2L8 10H2L6 14L4 22L12 18L20 22L18 14L22 10H16L12 2Z"/>
              </svg>
            </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const marker = L.marker([ac.lat, ac.lng], { icon }).addTo(mapRef.current);

          marker.bindTooltip(`
            <div style="font-family:monospace;font-size:10px;padding:6px 8px;background:rgba(10,10,20,0.95);
              border:1px solid ${isMil ? 'rgba(255,68,68,0.3)' : 'rgba(250,204,21,0.3)'};border-radius:6px;color:#ededed;">
              <div style="font-weight:700;color:${color};">${ac.callsign || 'N/A'} ${isMil ? '[MIL]' : ''}</div>
              <div style="color:#888;font-size:9px;">${ac.country} · ${ac.altitude ? ac.altitude + 'm' : '—'} · ${ac.velocity ? ac.velocity + 'km/h' : '—'}</div>
            </div>
          `, { direction: 'top', offset: [0, -6], opacity: 1, className: 'intel-tooltip' });

          marker.on('click', () => setSelectedAircraftDetail(ac));
          aircraftMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Aircraft]', err); }
    };

    fetchAircraft();
    const interval = setInterval(fetchAircraft, 120000);
    return () => clearInterval(interval);
  }, [showAircraft, mapLoaded]);

  // ─── Earthquake layer ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    quakeMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    quakeMarkersRef.current = [];

    if (!showQuakes) return;

    const fetchQuakes = async () => {
      try {
        const res = await fetch('/api/intelligence/earthquakes');
        if (!res.ok) return;
        const data = await res.json();

        (data.earthquakes || []).forEach((eq: any) => {
          const mag = eq.magnitude || 0;
          const size = Math.max(10, Math.min(40, mag * 6));
          const color = mag >= 6 ? '#ef4444' : mag >= 5 ? '#f97316' : mag >= 4 ? '#eab308' : '#22c55e';

          const icon = L.divIcon({
            className: 'quake-icon',
            html: `<div style="width:${size}px;height:${size}px;border-radius:50%;
              background:${color}30;border:2px solid ${color};
              box-shadow:0 0 ${size}px ${color}40;
              animation:pulse-marker 1.5s ease-in-out infinite;cursor:pointer;
              display:flex;align-items:center;justify-content:center;">
              <span style="font-size:${Math.max(8, size / 3)}px;font-weight:700;color:${color};font-family:monospace;">${mag.toFixed(1)}</span>
            </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([eq.lat, eq.lng], { icon }).addTo(mapRef.current);

          marker.bindTooltip(`
            <div style="font-family:monospace;font-size:10px;padding:6px 8px;background:rgba(10,10,20,0.95);
              border:1px solid ${color}40;border-radius:6px;color:#ededed;">
              <div style="font-weight:700;color:${color};">M${mag.toFixed(1)} Earthquake</div>
              <div style="color:#888;font-size:9px;">${eq.place}</div>
              <div style="color:#666;font-size:8px;">${eq.depth?.toFixed(1)}km deep · ${new Date(eq.time).toLocaleString()}</div>
              ${eq.tsunami ? '<div style="color:#06b6d4;font-size:9px;margin-top:2px;">🌊 Tsunami warning</div>' : ''}
            </div>
          `, { direction: 'top', offset: [0, -size / 2], opacity: 1, className: 'intel-tooltip' });

          marker.on('click', () => {
            setSelectedEarthquake(eq);
            mapRef.current.flyTo([eq.lat, eq.lng], 6, { duration: 1 });
          });

          quakeMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Quakes]', err); }
    };

    fetchQuakes();
    const interval = setInterval(fetchQuakes, 300000);
    return () => clearInterval(interval);
  }, [showQuakes, mapLoaded]);

  // ─── Conflict layer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    conflictMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    conflictMarkersRef.current = [];

    if (!showConflicts) return;

    const fetchConflicts = async () => {
      try {
        const res = await fetch('/api/intelligence/conflicts');
        if (!res.ok) return;
        const data = await res.json();

        (data.conflicts || []).forEach((c: any) => {
          const size = Math.min(20, 8 + (c.eventCount || 1) * 2);
          const icon = L.divIcon({
            className: 'conflict-icon',
            html: `<div style="width:${size}px;height:${size}px;border-radius:50%;
              background:rgba(239,68,68,0.25);border:1.5px solid rgba(239,68,68,0.6);
              box-shadow:0 0 ${size}px rgba(239,68,68,0.3);cursor:pointer;
              animation:pulse-marker 2s ease-in-out infinite;"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapRef.current);
          marker.bindTooltip(`
            <div style="font-family:monospace;font-size:10px;padding:6px 8px;background:rgba(10,10,20,0.95);
              border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ededed;">
              <div style="font-weight:700;color:#ef4444;">⚔ ${c.name}</div>
              <div style="color:#888;font-size:9px;">${c.eventCount} event(s) reported</div>
            </div>
          `, { direction: 'top', offset: [0, -6], opacity: 1, className: 'intel-tooltip' });

          conflictMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Conflicts]', err); }
    };

    fetchConflicts();
    const interval = setInterval(fetchConflicts, 900000);
    return () => clearInterval(interval);
  }, [showConflicts, mapLoaded]);

  // ─── Naval layer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    navalMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    navalMarkersRef.current = [];

    if (!showNaval) return;

    const fetchNaval = async () => {
      try {
        const res = await fetch('/api/intelligence/naval');
        if (!res.ok) return;
        const data = await res.json();
        setNavalVessels(data.vessels || []);
        setNavalSummary(data.summary || null);

        (data.vessels || []).forEach((v: NavalVessel) => {
          const isPatrol = v.type === 'patrol_zone';
          const isCarrier = v.type === 'carrier';
          const size = isPatrol ? 24 : isCarrier ? 20 : 14;
          const emoji = isPatrol ? '🔒' : isCarrier ? '⚓' : v.type === 'amphibious' ? '🚢' : '🔱';

          const icon = L.divIcon({
            className: 'naval-icon',
            html: `<div style="width:${size}px;height:${size}px;border-radius:${isPatrol ? '4px' : '50%'};
              background:${isPatrol ? 'rgba(100,116,139,0.2)' : v.color + '25'};
              border:${isPatrol ? '1.5px dashed' : '2px solid'} ${isPatrol ? 'rgba(100,116,139,0.5)' : v.color};
              box-shadow:0 0 ${size}px ${v.color}30;cursor:pointer;
              display:flex;align-items:center;justify-content:center;font-size:${size * 0.5}px;
              ${isPatrol ? 'animation:pulse-marker 3s ease-in-out infinite;' : ''}">
              ${emoji}
            </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([v.lat, v.lng], { icon }).addTo(mapRef.current);

          marker.bindTooltip(`
            <div style="font-family:monospace;font-size:10px;padding:8px 10px;background:rgba(10,10,20,0.95);
              border:1px solid ${v.color}40;border-radius:6px;color:#ededed;max-width:260px;">
              <div style="font-weight:700;color:${v.color};margin-bottom:3px;">${v.name}</div>
              <div style="color:#888;font-size:9px;">${v.fleet} · ${v.area}</div>
              <div style="display:flex;gap:6px;margin-top:4px;">
                <span style="font-size:8px;padding:1px 4px;border-radius:3px;
                  background:${v.status === 'deployed' || v.status === 'active' ? 'rgba(34,197,94,0.15)' : v.status === 'high-alert' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)'};
                  color:${v.status === 'deployed' || v.status === 'active' ? '#22c55e' : v.status === 'high-alert' ? '#ef4444' : '#94a3b8'};
                  border:1px solid ${v.status === 'deployed' || v.status === 'active' ? 'rgba(34,197,94,0.3)' : v.status === 'high-alert' ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'};">
                  ${v.status.toUpperCase()}
                </span>
                <span style="font-size:8px;color:#666;">${v.type}</span>
              </div>
              <div style="color:#666;font-size:8px;margin-top:3px;">${v.details}</div>
            </div>
          `, { direction: 'top', offset: [0, -size / 2], opacity: 1, className: 'intel-tooltip' });

          marker.on('click', () => {
            setSelectedVessel(v);
            mapRef.current.flyTo([v.lat, v.lng], 6, { duration: 1 });
          });

          navalMarkersRef.current.push(marker);
        });
      } catch (err) { console.error('[Naval]', err); }
    };

    fetchNaval();
    const interval = setInterval(fetchNaval, 300000);
    return () => clearInterval(interval);
  }, [showNaval, mapLoaded]);

  // ─── Weather overlay ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (weatherLayerRef.current) {
      mapRef.current.removeLayer(weatherLayerRef.current);
      weatherLayerRef.current = null;
    }

    if (!showWeather) return;

    const owmKey = ''; // OpenWeatherMap key optional
    if (!owmKey) {
      // Use CartoDB's free cloud layer as fallback
      weatherLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        { opacity: 0.3, subdomains: 'abcd' }
      ).addTo(mapRef.current);
    }
  }, [showWeather, mapLoaded]);

  // ─── Fetch economic calendar ─────────────────────────────────────────
  useEffect(() => {
    const fetchEcon = async () => {
      try {
        const res = await fetch('/api/intelligence/economic-calendar');
        if (!res.ok) return;
        const data = await res.json();
        setEconomicEvents(data.upcoming || []);
        setEconSummary(data.summary || null);
      } catch (err) { console.error('[Econ Calendar]', err); }
    };
    fetchEcon();
  }, []);

  // ─── Fetch world stats ───────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/intelligence/world-stats');
        if (res.ok) setWorldStats(await res.json());
      } catch {}
    };
    fetchStats();
  }, []);

  // ─── Auto-refresh news ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // ─── Cross-reference: group by topic ─────────────────────────────────
  const crossRefGroups = useMemo(() => {
    const keywords = ['war', 'ukraine', 'russia', 'gaza', 'israel', 'iran', 'china', 'taiwan', 'nato', 'nuclear', 'oil', 'sanctions', 'earthquake', 'famine', 'inflation', 'recession'];
    const groups: { keyword: string; articles: NewsArticle[]; prophecyRef?: string }[] = [];

    keywords.forEach(kw => {
      const matched = articles.filter(a => {
        const text = `${a.title} ${a.description}`.toLowerCase();
        return text.includes(kw);
      });
      if (matched.length >= 2) {
        const prophecy = matched.find(a => a.prophecyRef);
        groups.push({ keyword: kw, articles: matched.slice(0, 10), prophecyRef: prophecy?.prophecyRef || undefined });
      }
    });

    return groups.sort((a, b) => b.articles.length - a.articles.length).slice(0, 12);
  }, [articles]);

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] h-[calc(100vh-3.5rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden bg-[#0a0a0a]">
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ background: '#0a0a0a' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,170,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

      {/* Scan line */}
      {scanLineOn && (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-scan-line" />
        </div>
      )}

      {/* ═══════════ TOP BAR ═══════════ */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 sm:px-6 py-2"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0) 100%)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-[#ededed] font-mono text-sm sm:text-lg font-bold tracking-wider uppercase">
              Global Intelligence
            </h1>
            <span className="text-cyan-400 font-mono text-[10px]">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono text-cyan-400">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC</span>
            </div>
          </div>
        </div>

        {/* Toggle buttons row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Layer toggles */}
          {[
            { key: 'scan', on: scanLineOn, set: setScanLineOn, label: 'SCAN', color: 'cyan' },
            { key: 'sfx', on: sfxOn, set: setSfxOn, label: 'SFX', color: 'cyan' },
            { key: 'air', on: showAircraft, set: setShowAircraft, label: 'AIR', color: 'yellow' },
            { key: 'naval', on: showNaval, set: setShowNaval, label: 'NAVAL', color: 'blue' },
            { key: 'quake', on: showQuakes, set: setShowQuakes, label: 'QUAKE', color: 'orange' },
            { key: 'conflict', on: showConflicts, set: setShowConflicts, label: 'CONFLICT', color: 'red' },
            { key: 'weather', on: showWeather, set: setShowWeather, label: 'WEATHER', color: 'sky' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => btn.set(!btn.on)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all border
                ${btn.on
                  ? `bg-${btn.color}-500/20 text-${btn.color}-400 border-${btn.color}-500/30`
                  : 'bg-zinc-800/60 text-zinc-600 border-zinc-700/30 hover:text-zinc-400'}`}
              style={btn.on ? {
                background: `rgba(${btn.color === 'cyan' ? '0,255,255' : btn.color === 'yellow' ? '250,204,21' : btn.color === 'blue' ? '59,130,246' : btn.color === 'orange' ? '249,115,22' : btn.color === 'red' ? '239,68,68' : btn.color === 'sky' ? '14,165,233' : '0,170,255'},0.1)`,
                color: btn.color === 'cyan' ? '#0ff' : btn.color === 'yellow' ? '#facc15' : btn.color === 'blue' ? '#3b82f6' : btn.color === 'orange' ? '#f97316' : btn.color === 'red' ? '#ef4444' : btn.color === 'sky' ? '#0ea5e9' : '#0af',
                borderColor: `rgba(${btn.color === 'cyan' ? '0,255,255' : btn.color === 'yellow' ? '250,204,21' : btn.color === 'blue' ? '59,130,246' : btn.color === 'orange' ? '249,115,22' : btn.color === 'red' ? '239,68,68' : btn.color === 'sky' ? '14,165,233' : '0,170,255'},0.3)`,
              } : {}}
            >
              {btn.label}
            </button>
          ))}

          {/* Map style selector */}
          <div className="flex items-center border border-zinc-700/30 rounded overflow-hidden ml-1">
            {MAP_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setMapStyle(s.id)}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider transition-all
                  ${mapStyle === s.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800/40 text-zinc-600 hover:text-zinc-400'}`}
              >
                {s.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <button onClick={() => fetchNews()} disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/60 text-cyan-400 text-[10px] font-mono hover:bg-zinc-700/60 transition border border-zinc-700/30">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/60 text-[#ededed] text-[10px] font-mono hover:bg-zinc-700/60 transition border border-zinc-700/30">
            <Filter className="w-3 h-3" /> FILTERS
          </button>
          <a href="/dashboard"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/60 text-zinc-400 text-[10px] font-mono hover:bg-zinc-700/60 transition border border-zinc-700/30">
            ← BACK
          </a>
        </div>
      </div>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <div className="absolute top-[80px] left-3 sm:left-6 z-10 flex gap-1.5 flex-wrap max-w-[calc(100%-24rem)]">
        {[
          { label: 'TRACKING', value: stats.total, color: 'text-[#ededed]', bg: 'rgba(39,39,42,0.6)', filter: '' },
          { label: 'CRISIS', value: stats.crisis, color: 'text-red-400', bg: 'rgba(127,29,29,0.4)', filter: 'negative' },
          { label: 'OPPORTUNITY', value: stats.opportunity, color: 'text-green-400', bg: 'rgba(20,83,45,0.4)', filter: 'positive' },
          { label: 'UK IMPACT', value: stats.ukImpact, color: 'text-cyan-400', bg: 'rgba(8,51,68,0.4)', filter: 'uk' },
          { label: 'PROPHECY', value: stats.prophecy, color: 'text-amber-400', bg: 'rgba(120,53,15,0.4)', filter: 'prophecy' },
        ].map(s => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSentimentFilter(sentimentFilter === s.filter ? '' : s.filter)}
            className={`backdrop-blur-sm border rounded px-2.5 py-1 font-mono cursor-pointer transition-all
              ${sentimentFilter === s.filter && s.filter ? 'border-white/30 ring-1 ring-white/10 scale-105' : 'border-zinc-700/30 hover:border-zinc-600/50'}`}
            style={{ background: s.bg }}
          >
            <div className="text-[9px] text-zinc-500 tracking-wider">{s.label}</div>
            <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
          </motion.button>
        ))}

        {/* Top country badges */}
        <div className="flex items-end gap-1 ml-1">
          {topCountries.map(([code, count]) => (
            <motion.button key={code}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => { setContinentFilter('All Regions'); setSearchTerm(code.toLowerCase()); }}
              className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/20 rounded px-1.5 py-0.5 font-mono hover:border-cyan-500/30 hover:bg-cyan-500/5 transition cursor-pointer"
              title={`${count} articles from ${code}`}
            >
              <div className="text-[8px] text-zinc-500">{code}</div>
              <div className="text-[10px] font-bold text-zinc-300">{count}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══════════ BOTTOM TABS ═══════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Tab buttons */}
        <div className="flex items-center gap-1 px-4 pb-1">
          {[
            { id: 'calendar' as BottomTab, icon: Calendar, label: 'Economic Calendar', color: '#22c55e' },
            { id: 'naval' as BottomTab, icon: Anchor, label: 'Naval Tracker', color: '#3b82f6' },
            { id: 'cross-ref' as BottomTab, icon: BookOpen, label: 'Cross-Reference', color: '#f59e0b' },
            { id: 'stats' as BottomTab, icon: BarChart3, label: 'World Data', color: '#a855f7' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setBottomTab(bottomTab === tab.id ? 'none' : tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[10px] font-mono font-bold tracking-wider transition-all border-t border-x
                ${bottomTab === tab.id
                  ? 'border-zinc-700/50 text-[#ededed]'
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
              style={bottomTab === tab.id ? { background: 'rgba(10,10,15,0.95)', color: tab.color } : { background: 'rgba(30,30,35,0.6)' }}
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence>
          {bottomTab !== 'none' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 280, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-zinc-700/30"
              style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }}
            >
              <div className="h-[280px] overflow-y-auto px-4 py-3">

                {/* ECONOMIC CALENDAR TAB */}
                {bottomTab === 'calendar' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono text-[#ededed] tracking-wider">ECONOMIC CALENDAR</span>
                        {econSummary && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {econSummary.highImpactUpcoming} HIGH IMPACT · {econSummary.thisWeek} THIS WEEK
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      {economicEvents.slice(0, 20).map(ev => {
                        const isToday = ev.date === new Date().toISOString().slice(0, 10);
                        const isPast = ev.date < new Date().toISOString().slice(0, 10);
                        return (
                          <div key={ev.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border font-mono text-xs transition-all
                              ${isToday ? 'bg-green-500/10 border-green-500/20' : isPast ? 'bg-zinc-800/30 border-zinc-800/30 opacity-50' : 'bg-zinc-800/40 border-zinc-700/20 hover:border-zinc-600/40'}`}
                          >
                            <div className="w-[70px] shrink-0">
                              <div className={`text-[10px] ${isToday ? 'text-green-400 font-bold' : 'text-zinc-500'}`}>{ev.date.slice(5)}</div>
                              <div className="text-[9px] text-zinc-600">{ev.time} UTC</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${ev.impact === 'high' ? 'bg-red-500' : ev.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[#ededed] font-semibold truncate">{ev.event}</div>
                              <div className="text-zinc-500 text-[10px]">{ev.country}</div>
                            </div>
                            <div className={`text-[9px] px-2 py-0.5 rounded border
                              ${ev.impact === 'high' ? 'text-red-400 bg-red-500/10 border-red-500/20' : ev.impact === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20'}`}>
                              {ev.impact.toUpperCase()}
                            </div>
                          </div>
                        );
                      })}
                      {economicEvents.length === 0 && (
                        <div className="text-center text-zinc-600 text-xs font-mono py-8">Loading economic calendar...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* NAVAL TRACKER TAB */}
                {bottomTab === 'naval' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-mono text-[#ededed] tracking-wider">NAVAL DEPLOYMENT TRACKER</span>
                      </div>
                      {navalSummary && (
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="text-blue-400">{navalSummary.carriers} CARRIERS</span>
                          <span className="text-cyan-400">{navalSummary.amphibious} AMPHIBIOUS</span>
                          <span className="text-amber-400">{navalSummary.patrolZones} PATROL ZONES</span>
                          <span className="text-green-400">{navalSummary.deployed} DEPLOYED</span>
                        </div>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {navalVessels.filter(v => v.type !== 'patrol_zone').slice(0, 18).map((v, i) => (
                        <button key={i}
                          onClick={() => {
                            setSelectedVessel(v);
                            if (mapRef.current) mapRef.current.flyTo([v.lat, v.lng], 6, { duration: 1 });
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/20 hover:border-zinc-600/40 transition text-left font-mono"
                        >
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: v.color, boxShadow: `0 0 6px ${v.color}40` }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-[#ededed] font-bold truncate">{v.name}</div>
                            <div className="text-[9px] text-zinc-500 truncate">{v.fleet} · {v.area}</div>
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border shrink-0
                            ${v.status === 'deployed' || v.status === 'active' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                              v.status === 'high-alert' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                              'text-zinc-500 bg-zinc-800/40 border-zinc-700/30'}`}>
                            {v.status.toUpperCase().replace('-', ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CROSS-REFERENCE TAB */}
                {bottomTab === 'cross-ref' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-mono text-[#ededed] tracking-wider">NEWS CROSS-REFERENCE</span>
                      <span className="text-[10px] font-mono text-zinc-500">{crossRefGroups.length} TOPICS TRACKED</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {crossRefGroups.map((group, i) => (
                        <div key={i} className="rounded-lg bg-zinc-800/40 border border-zinc-700/20 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-400 uppercase">{group.keyword}</span>
                              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-700/30 px-1.5 py-0.5 rounded">{group.articles.length} sources</span>
                            </div>
                          </div>
                          {group.prophecyRef && (
                            <div className="text-[9px] font-mono text-amber-300/60 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 mb-2">
                              📖 {group.prophecyRef}
                            </div>
                          )}
                          <div className="space-y-1">
                            {group.articles.slice(0, 3).map((a, j) => (
                              <a key={j} href={a.url} target="_blank" rel="noopener noreferrer"
                                className="block text-[10px] font-mono text-zinc-400 hover:text-[#ededed] transition truncate">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5
                                  ${a.sentiment === 'negative' ? 'bg-red-400' : a.sentiment === 'positive' ? 'bg-green-400' : 'bg-cyan-400'}`} />
                                {a.title?.slice(0, 70)}{(a.title?.length || 0) > 70 ? '...' : ''}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                      {crossRefGroups.length === 0 && (
                        <div className="text-center text-zinc-600 text-xs font-mono py-8 col-span-2">Loading cross-references...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* WORLD STATS TAB */}
                {bottomTab === 'stats' && worldStats && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-mono text-[#ededed] tracking-wider">WORLD DATA</span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Overview */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-zinc-800/40 rounded px-2.5 py-1.5 border border-zinc-700/20">
                            <div className="text-[9px] text-zinc-500 font-mono">WORLD POP</div>
                            <div className="text-sm text-[#ededed] font-bold font-mono">{(worldStats.worldPopulation / 1e9).toFixed(2)}B</div>
                          </div>
                          <div className="bg-zinc-800/40 rounded px-2.5 py-1.5 border border-zinc-700/20">
                            <div className="text-[9px] text-zinc-500 font-mono">COUNTRIES</div>
                            <div className="text-sm text-[#ededed] font-bold font-mono">{worldStats.totalCountries}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-1">BY REGION</div>
                          {worldStats.regionStats && Object.entries(worldStats.regionStats)
                            .sort((a: any, b: any) => b[1].population - a[1].population)
                            .map(([region, data]: [string, any]) => (
                              <div key={region} className="flex items-center justify-between py-0.5">
                                <span className="text-[10px] text-zinc-400 font-mono">{region}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-zinc-800 rounded overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded" style={{ width: `${(data.population / worldStats.worldPopulation) * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">{(data.population / 1e9).toFixed(1)}B</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* Top populations */}
                      <div>
                        <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-1.5">TOP POPULATION</div>
                        {worldStats.top15byPopulation?.slice(0, 12).map((c: any) => (
                          <div key={c.code} className="flex items-center justify-between py-0.5 font-mono">
                            <span className="text-[10px] text-zinc-400">{c.flag} {c.name}</span>
                            <span className="text-[10px] text-zinc-500">{(c.population / 1e6).toFixed(0)}M</span>
                          </div>
                        ))}
                      </div>
                      {/* GDP */}
                      <div>
                        <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-1.5">TOP ECONOMIES (GDP)</div>
                        {worldStats.topGDP?.slice(0, 12).map((g: any, i: number) => (
                          <div key={g.code} className="flex items-center justify-between py-0.5 font-mono">
                            <span className="text-[10px] text-zinc-400">{i + 1}. {g.country}</span>
                            <span className="text-[10px] text-green-400/70">${(g.gdp / 1e12).toFixed(1)}T</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ SIDEBAR / FILTERS ═══════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 bottom-0 z-20 w-[340px] sm:w-[380px] overflow-y-auto"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-mono text-[#ededed] tracking-wider">FILTERS & NEWS</span>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-[#ededed]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search news..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/30 text-xs font-mono text-[#ededed] placeholder-zinc-600 focus:outline-none focus:border-cyan-500/30"
                />
              </div>

              {/* Region */}
              <div className="mb-3">
                <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-1.5">REGION</div>
                <div className="flex flex-wrap gap-1">
                  {CONTINENTS.map(c => (
                    <button key={c}
                      onClick={() => setContinentFilter(c)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-all border
                        ${continentFilter === c ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/20 hover:text-zinc-400'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-1.5">CATEGORY</div>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id}
                      onClick={() => setCategoryFilter(categoryFilter === cat.id ? '' : cat.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all border
                        ${categoryFilter === cat.id ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/20 hover:text-zinc-400'}`}
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* News feed */}
              <div className="text-[9px] text-zinc-500 font-mono tracking-wider mb-2">NEWS FEED ({filtered.length})</div>
              <div className="space-y-1.5">
                {filtered.slice(0, 40).map((article) => {
                  const sc = SENTIMENT_COLORS[article.sentiment] || SENTIMENT_COLORS.neutral;
                  return (
                    <button
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article);
                        if (article.coordinates && mapRef.current) {
                          mapRef.current.flyTo([article.coordinates[1], article.coordinates[0]], 5, { duration: 1 });
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700/10 hover:border-zinc-600/30 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sc.fill }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-[#ededed] leading-tight group-hover:text-cyan-300 transition line-clamp-2">
                            {article.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-500 font-mono">
                            <span>{article.source}</span>
                            <span>·</span>
                            <span>{article.country?.toUpperCase()}</span>
                            <span>·</span>
                            <span>{timeAgo(article.publishedAt)}</span>
                            {article.prophecyRelated && <span className="text-amber-400">📖</span>}
                            {article.ukImpact && <span className="text-cyan-400">🇬🇧</span>}
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

      {/* ═══════════ ARTICLE DETAIL POPUP ═══════════ */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute top-[130px] left-4 sm:left-6 z-30 w-[420px] max-w-[calc(100%-2rem)] rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10,10,15,0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${SENTIMENT_COLORS[selectedArticle.sentiment]?.fill || '#0af'}30`,
            }}
          >
            <div className="relative p-4">
              <button onClick={() => setSelectedArticle(null)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-[#ededed] flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>

              {selectedArticle.imageUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                  <img src={selectedArticle.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <h3 className="text-sm font-semibold text-[#ededed] leading-tight mb-2 pr-6">{selectedArticle.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-3">{selectedArticle.description}</p>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    color: SENTIMENT_COLORS[selectedArticle.sentiment]?.fill,
                    background: `${SENTIMENT_COLORS[selectedArticle.sentiment]?.fill}15`,
                    borderColor: `${SENTIMENT_COLORS[selectedArticle.sentiment]?.fill}30`,
                  }}>
                  {SENTIMENT_COLORS[selectedArticle.sentiment]?.label.toUpperCase()}
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{selectedArticle.source}</span>
                <span className="text-[9px] font-mono text-zinc-600">{selectedArticle.country?.toUpperCase()}</span>
                <span className="text-[9px] font-mono text-zinc-600">{timeAgo(selectedArticle.publishedAt)} ago</span>
              </div>

              {selectedArticle.prophecyRef && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-[9px] text-amber-400 font-mono font-bold mb-0.5">📖 PROPHECY CONNECTION</div>
                  <div className="text-[10px] text-amber-300/70 font-mono">{selectedArticle.prophecyRef}</div>
                </div>
              )}

              {selectedArticle.ukImpact && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <span className="text-[9px] text-cyan-400 font-mono font-bold">🇬🇧 UK MARKET IMPACT DETECTED</span>
                </div>
              )}

              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition border border-cyan-500/20 w-fit">
                READ FULL ARTICLE <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ EARTHQUAKE POPUP ═══════════ */}
      <AnimatePresence>
        {selectedEarthquake && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[130px] left-4 sm:left-6 z-30 w-[400px] max-w-[calc(100%-2rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,100,0,0.3)' }}
          >
            <div className="relative p-4">
              <button onClick={() => setSelectedEarthquake(null)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-[#ededed] flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold font-mono
                  ${selectedEarthquake.magnitude >= 6 ? 'bg-red-500/20 text-red-400' : selectedEarthquake.magnitude >= 5 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  M{selectedEarthquake.magnitude?.toFixed(1)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#ededed]">{selectedEarthquake.place}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{new Date(selectedEarthquake.time).toLocaleString()}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">DEPTH</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedEarthquake.depth?.toFixed(1)}km</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">SIGNIFICANCE</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedEarthquake.sig || '—'}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">STATUS</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono capitalize">{selectedEarthquake.status || '—'}</div>
                </div>
              </div>
              {selectedEarthquake.tsunami ? (
                <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-cyan-400 font-mono text-xs font-bold">🌊 TSUNAMI WARNING ISSUED</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-mono text-zinc-500">{selectedEarthquake.lat?.toFixed(3)}°, {selectedEarthquake.lng?.toFixed(3)}°</div>
                <div className="flex-1" />
                <a href={selectedEarthquake.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-orange-500/10 text-orange-400 text-[10px] font-mono hover:bg-orange-500/20 transition border border-orange-500/20">
                  USGS DETAILS <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ AIRCRAFT POPUP ═══════════ */}
      <AnimatePresence>
        {selectedAircraftDetail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[130px] left-4 sm:left-6 z-30 w-[360px] max-w-[calc(100%-2rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', border: `1px solid ${selectedAircraftDetail.military ? 'rgba(255,0,0,0.3)' : 'rgba(250,204,21,0.2)'}` }}
          >
            <div className="relative p-4">
              <button onClick={() => setSelectedAircraftDetail(null)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-[#ededed] flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedAircraftDetail.military ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                  <Plane className={`w-5 h-5 ${selectedAircraftDetail.military ? 'text-red-400' : 'text-yellow-400'}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold font-mono ${selectedAircraftDetail.military ? 'text-red-400' : 'text-yellow-400'}`}>
                    {selectedAircraftDetail.callsign || 'UNKNOWN'} {selectedAircraftDetail.military ? '[MIL]' : ''}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">{selectedAircraftDetail.country} · Zone: {selectedAircraftDetail.zone}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">ALTITUDE</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedAircraftDetail.altitude ? `${selectedAircraftDetail.altitude}m` : '—'}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">SPEED</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedAircraftDetail.velocity ? `${selectedAircraftDetail.velocity}km/h` : '—'}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">HEADING</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedAircraftDetail.heading ? `${selectedAircraftDetail.heading}°` : '—'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ VESSEL POPUP ═══════════ */}
      <AnimatePresence>
        {selectedVessel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-[130px] left-4 sm:left-6 z-30 w-[380px] max-w-[calc(100%-2rem)] rounded-xl overflow-hidden"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', border: `1px solid ${selectedVessel.color}40` }}
          >
            <div className="relative p-4">
              <button onClick={() => setSelectedVessel(null)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-[#ededed] flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${selectedVessel.color}20` }}>
                  <Anchor className="w-5 h-5" style={{ color: selectedVessel.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold font-mono" style={{ color: selectedVessel.color }}>{selectedVessel.name}</div>
                  <div className="text-[10px] font-mono text-zinc-500">{selectedVessel.fleet}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">TYPE</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono capitalize">{selectedVessel.type.replace('_', ' ')}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">AREA</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedVessel.area}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">STATUS</div>
                  <div className={`text-sm font-bold font-mono capitalize ${selectedVessel.status === 'deployed' || selectedVessel.status === 'active' ? 'text-green-400' : selectedVessel.status === 'high-alert' ? 'text-red-400' : 'text-zinc-400'}`}>
                    {selectedVessel.status}
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/20">
                  <div className="text-[9px] text-zinc-500 font-mono">NATION</div>
                  <div className="text-sm font-bold text-[#ededed] font-mono">{selectedVessel.nation}</div>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-400 bg-zinc-800/30 rounded-lg p-2 border border-zinc-700/10">
                {selectedVessel.details}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ CSS ═══════════ */}
      <style jsx global>{`
        .intel-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .intel-tooltip .leaflet-tooltip-content {
          margin: 0 !important;
        }
        .leaflet-tooltip-top:before,
        .leaflet-tooltip-bottom:before,
        .leaflet-tooltip-left:before,
        .leaflet-tooltip-right:before {
          display: none !important;
        }
        @keyframes pulse-marker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes scan-line {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 8s linear infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10,10,15,0.9) !important;
          color: #ededed !important;
          border-color: rgba(255,255,255,0.05) !important;
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
          font-size: 14px !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(30,30,40,0.95) !important;
        }
        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
