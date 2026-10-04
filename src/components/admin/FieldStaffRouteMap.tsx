import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  IndianRupee,
  Layers,
  Calendar,
  Clock,
  Compass,
  Store,
  Building,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  Maximize2,
} from 'lucide-react';
import { PartyVisit, Staff, Party, Order, Payment } from '../../types';
import { db } from '../../services/db';

// Kapila Medical Agencies HQ Coordinates
const KMA_HQ = {
  name: 'Kapila Medical Agencies HQ',
  address: 'Court Road, Sirsi – 581401',
  lat: 14.619,
  lng: 74.835,
};

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

interface FieldStaffRouteMapProps {
  staffList: Staff[];
  selectedStaffId: string;
  onSelectStaffId: (id: string) => void;
}

export const FieldStaffRouteMap: React.FC<FieldStaffRouteMapProps> = ({
  staffList,
  selectedStaffId,
  onSelectStaffId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const playbackMarkerRef = useRef<L.Marker | null>(null);

  const allVisits = db.getVisits();
  const parties = db.getParties();
  const orders = db.getOrders();
  const payments = db.getPayments();

  // Filter States
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(allVisits.map((v) => v.date))).sort().reverse();
    return dates.length > 0 ? dates : [new Date().toISOString().split('T')[0]];
  }, [allVisits]);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] || '2026-10-03');
  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'satellite'>('streets');
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showRoutePolyline, setShowRoutePolyline] = useState<boolean>(true);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Animation Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Filter visits by selected staff and date
  const filteredVisits = useMemo(() => {
    return allVisits
      .filter((v) => {
        const matchesStaff = selectedStaffId === 'all' || v.staffId === selectedStaffId;
        const matchesDate = !selectedDate || v.date === selectedDate;
        return matchesStaff && matchesDate;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [allVisits, selectedStaffId, selectedDate]);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  // Compute Route Metrics
  const routeMetrics = useMemo(() => {
    if (filteredVisits.length === 0) {
      return { totalDistanceKm: 0, ordersCount: 0, ordersTotal: 0, paymentsTotal: 0, verifiedPercent: 100 };
    }

    let dist = 0;
    let prevLat = KMA_HQ.lat;
    let prevLng = KMA_HQ.lng;

    filteredVisits.forEach((v) => {
      dist += calculateDistanceKm(prevLat, prevLng, v.gpsLatitude, v.gpsLongitude);
      prevLat = v.gpsLatitude;
      prevLng = v.gpsLongitude;
    });

    // Back to HQ
    dist += calculateDistanceKm(prevLat, prevLng, KMA_HQ.lat, KMA_HQ.lng);

    const bookedVisits = filteredVisits.filter((v) => v.orderBooked);
    const paymentVisits = filteredVisits.filter((v) => v.paymentCollected);

    // Sum order amounts matching these visits
    const ordersTotal = bookedVisits.reduce((sum, v) => {
      const ord = orders.find((o) => o.id === v.orderId);
      return sum + (ord ? ord.grandTotal : 14500);
    }, 0);

    const paymentsTotal = paymentVisits.reduce((sum, v) => {
      const pay = payments.find((p) => p.id === v.paymentId);
      return sum + (pay ? pay.amount : 12000);
    }, 0);

    const withinGeofence = filteredVisits.filter((v) => !v.isFarWarning).length;
    const verifiedPercent = Math.round((withinGeofence / filteredVisits.length) * 100);

    return {
      totalDistanceKm: Number(dist.toFixed(1)),
      ordersCount: bookedVisits.length,
      ordersTotal,
      paymentsTotal,
      verifiedPercent,
    };
  }, [filteredVisits, orders, payments]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [KMA_HQ.lat, KMA_HQ.lng],
        zoom: 14,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      markersLayerRef.current = L.layerGroup().addTo(map);
      geofenceLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer and re-add according to selected style
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapTileStyle === 'streets') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors • Kapila Medical Agencies ERP',
        maxZoom: 19,
      }).addTo(map);
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
          maxZoom: 18,
        }
      ).addTo(map);
    }

    return () => {
      // Clean up map on unmount
    };
  }, [mapTileStyle]);

  // Render Markers, Polylines, and Geofences whenever visits change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const geofenceLayer = geofenceLayerRef.current;
    if (!map || !markersLayer || !geofenceLayer) return;

    markersLayer.clearLayers();
    geofenceLayer.clearLayers();

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (playbackMarkerRef.current) {
      map.removeLayer(playbackMarkerRef.current);
      playbackMarkerRef.current = null;
    }

    const latLngs: [number, number][] = [];

    // 1. Add Kapila Medical Agencies HQ Marker
    latLngs.push([KMA_HQ.lat, KMA_HQ.lng]);

    const hqIcon = L.divIcon({
      className: 'custom-hq-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-slate-900 border-2 border-amber-400 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl transform -translate-x-1/2 -translate-y-1/2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <span class="absolute top-6 left-0 transform -translate-x-1/2 bg-slate-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-400/40 whitespace-nowrap shadow">
            HQ Origin (09:15 AM)
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const hqMarker = L.marker([KMA_HQ.lat, KMA_HQ.lng], { icon: hqIcon });
    hqMarker.bindPopup(`
      <div class="p-2 text-xs font-sans">
        <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Central Base</span>
        <h4 class="font-bold text-sm text-slate-900">${KMA_HQ.name}</h4>
        <p class="text-slate-600 mt-0.5">${KMA_HQ.address}</p>
        <div class="mt-2 pt-2 border-t border-slate-200 text-[11px] text-emerald-700 font-semibold">
          Tour Boy Morning Departure: 09:15 AM
        </div>
      </div>
    `);
    markersLayer.addLayer(hqMarker);

    // 2. Add Stop Markers and Geofences
    filteredVisits.forEach((visit, index) => {
      const stopNumber = index + 1;
      latLngs.push([visit.gpsLatitude, visit.gpsLongitude]);

      const party = parties.find((p) => p.id === visit.partyId);
      const isVerified = !visit.isFarWarning;

      // Geofence Circle around party registered location (200m)
      if (showGeofences) {
        const geofenceCircle = L.circle([visit.partyLatitude, visit.partyLongitude], {
          radius: 200,
          color: isVerified ? '#10b981' : '#f59e0b',
          fillColor: isVerified ? '#34d399' : '#fbbf24',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        });

        geofenceCircle.bindTooltip(`200m Geofence: ${visit.partyName}`, {
          direction: 'top',
          className: 'text-xs font-sans',
        });
        geofenceLayer.addLayer(geofenceCircle);

        // Verification distance dashed line
        if (visit.distanceMeters > 5) {
          const distanceLine = L.polyline(
            [
              [visit.partyLatitude, visit.partyLongitude],
              [visit.gpsLatitude, visit.gpsLongitude],
            ],
            {
              color: isVerified ? '#10b981' : '#ef4444',
              weight: 2,
              dashArray: '3, 6',
            }
          );
          geofenceLayer.addLayer(distanceLine);
        }
      }

      // Stop Waypoint Marker
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-full ${
              isVerified ? 'bg-sky-600 border-2 border-white' : 'bg-amber-500 border-2 border-white'
            } text-white font-bold text-xs flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition group-hover:scale-110">
              ${stopNumber}
            </div>
            ${
              visit.orderBooked
                ? `<span class="absolute -top-4 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] shadow" title="Order Booked">📦</span>`
                : ''
            }
            ${
              visit.paymentCollected
                ? `<span class="absolute -bottom-2 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow" title="Payment Collected">₹</span>`
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const stopMarker = L.marker([visit.gpsLatitude, visit.gpsLongitude], { icon: stopIcon });

      const popupContent = `
        <div class="p-3 text-xs font-sans max-w-xs space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Stop #${stopNumber} • ${visit.time}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }">
              ${visit.distanceMeters}m from Shop
            </span>
          </div>

          <h4 class="font-bold text-sm text-slate-900 leading-tight">${visit.partyName}</h4>
          <p class="text-[11px] text-slate-500">${party?.address || 'Sirsi Market Area'}</p>

          <div class="p-2 bg-slate-50 rounded-xl space-y-1 border border-slate-200 text-[11px]">
            <div><strong class="text-slate-700">Met:</strong> ${visit.personMet}</div>
            <div><strong class="text-slate-700">Purpose:</strong> ${visit.purpose}</div>
            <div class="text-slate-600 italic">"${visit.discussion}"</div>
          </div>

          <div class="flex items-center space-x-2 pt-1">
            ${
              visit.orderBooked
                ? '<span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded">✅ Order Booked</span>'
                : ''
            }
            ${
              visit.paymentCollected
                ? '<span class="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded">💰 Payment Collected</span>'
                : ''
            }
          </div>

          <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span class="text-[10px] text-slate-400">Rep: ${visit.staffName}</span>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${visit.gpsLatitude},${visit.gpsLongitude}" target="_blank" class="text-sky-600 font-bold hover:underline flex items-center space-x-0.5">
              <span>Directions</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>
        </div>
      `;

      stopMarker.bindPopup(popupContent);
      markersLayer.addLayer(stopMarker);
    });

    // 3. Draw Route Polyline connecting all stops
    if (showRoutePolyline && latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#0284c7', // Sky-600
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;
    }

    // 4. Fit map bounds to show full route
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [filteredVisits, showGeofences, showRoutePolyline, parties]);

  // Route Playback Animation Loop
  useEffect(() => {
    let timer: any = null;

    if (isPlaying) {
      const totalSteps = filteredVisits.length;
      if (totalSteps === 0) {
        setIsPlaying(false);
        return;
      }

      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          const next = prev + 1;
          if (next >= totalSteps) {
            setIsPlaying(false);
            return totalSteps - 1;
          }
          return next;
        });
      }, 2000 / playbackSpeed);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, filteredVisits, playbackSpeed]);

  // Update animated bike marker on playback index change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || filteredVisits.length === 0) return;

    const currentVisit = filteredVisits[playbackIndex];
    if (!currentVisit) return;

    if (playbackMarkerRef.current) {
      map.removeLayer(playbackMarkerRef.current);
    }

    const bikeIcon = L.divIcon({
      className: 'playback-bike-marker',
      html: `
        <div class="relative flex items-center justify-center animate-bounce">
          <div class="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center text-lg shadow-2xl transform -translate-x-1/2 -translate-y-1/2">
            🏍️
          </div>
          <span class="absolute -top-7 left-0 transform -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow whitespace-nowrap">
            Stop ${playbackIndex + 1}: ${currentVisit.time}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([currentVisit.gpsLatitude, currentVisit.gpsLongitude], {
      icon: bikeIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    playbackMarkerRef.current = marker;

    if (isPlaying) {
      map.panTo([currentVisit.gpsLatitude, currentVisit.gpsLongitude], { animate: true });
    }
  }, [playbackIndex, filteredVisits, isPlaying]);

  // Handle clicking on a stop card to focus map
  const handleFocusStop = (visit: PartyVisit, index: number) => {
    setSelectedVisitId(visit.id);
    setPlaybackIndex(index);
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([visit.gpsLatitude, visit.gpsLongitude], 16, { animate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Staff Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Field Rep:</span>
          <button
            onClick={() => onSelectStaffId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedStaffId === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Staff
          </button>
          {staffList.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectStaffId(s.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedStaffId === s.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <img src={s.photoUrl} alt={s.fullName} className="w-4 h-4 rounded-full object-cover" />
              <span>{s.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Date Selector & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date === new Date().toISOString().split('T')[0] ? `Today (${date})` : date}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Polyline */}
          <button
            onClick={() => setShowRoutePolyline(!showRoutePolyline)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1 transition ${
              showRoutePolyline
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Route Line</span>
          </button>

          {/* Toggle Geofence Circles */}
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1 transition ${
              showGeofences
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">200m Geofence</span>
          </button>

          {/* Satellite vs Street Tile Style */}
          <button
            onClick={() => setMapTileStyle(mapTileStyle === 'streets' ? 'satellite' : 'streets')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white flex items-center space-x-1 hover:bg-slate-800 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapTileStyle === 'streets' ? 'Satellite View' : 'Street Map'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Total Site Stops</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {filteredVisits.length} <span className="text-xs font-normal text-slate-500">pharmacies</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Route Distance</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {routeMetrics.totalDistanceKm} <span className="text-xs font-normal text-slate-500">km total</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Geofence Compliance</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {routeMetrics.verifiedPercent}% <span className="text-xs font-normal text-slate-500">&lt;200m radius</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <ShoppingBag className="w-4 h-4 text-sky-600" />
            <span>Orders Booked</span>
          </div>
          <div className="text-xl font-bold text-sky-700 mt-1">
            ₹{routeMetrics.ordersTotal.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Collections Picked</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{routeMetrics.paymentsTotal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Visual Map & Controls Canvas */}
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[580px]">
        {/* Left Map View Area */}
        <div className="flex-1 relative min-h-[420px] lg:min-h-[580px]">
          {/* Map Target Div */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Interactive Route Playback Bar (Floating on Map) */}
          <div className="absolute bottom-4 inset-x-4 z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!isPlaying && playbackIndex >= filteredVisits.length - 1) {
                    setPlaybackIndex(0);
                  }
                  setIsPlaying(!isPlaying);
                }}
                className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition shadow ${
                  isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={isPlaying ? 'Pause Animation' : 'Play Animated Tour'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setPlaybackIndex(0);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Reset to HQ Origin"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Tour Route Simulation
                </span>
                <span className="text-xs font-bold">
                  {filteredVisits[playbackIndex]
                    ? `Stop ${playbackIndex + 1}: ${filteredVisits[playbackIndex].partyName} (${filteredVisits[playbackIndex].time})`
                    : 'Origin: Kapila Medical Agencies HQ'}
                </span>
              </div>
            </div>

            {/* Timeline Progress Slider */}
            <div className="flex items-center space-x-3 w-full sm:w-64">
              <input
                type="range"
                min="0"
                max={Math.max(0, filteredVisits.length - 1)}
                value={playbackIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackIndex(parseInt(e.target.value, 10));
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex space-x-1 text-[10px] font-bold">
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded ${
                      playbackSpeed === spd ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Stops Timeline Side Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col h-auto lg:h-[580px]">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Itinerary & Chronological Log</h3>
              <p className="text-[11px] text-slate-500">
                {selectedDate} • {selectedStaff?.fullName || 'All Field Force'}
              </p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {filteredVisits.length} Stops
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* Origin Card */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-[10px] uppercase text-amber-600 flex items-center space-x-1">
                  <Building className="w-3 h-3" />
                  <span>Start Station (HQ)</span>
                </span>
                <span className="font-mono text-[10px]">09:15 AM</span>
              </div>
              <p className="font-bold text-slate-900">{KMA_HQ.name}</p>
              <p className="text-[11px] text-slate-500">{KMA_HQ.address}</p>
            </div>

            {/* Visit Stops */}
            {filteredVisits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30 text-sky-500" />
                <p className="font-semibold text-slate-600">No visits recorded for this day</p>
                <p className="text-[11px] text-slate-400 mt-1">Select another date or field representative.</p>
              </div>
            ) : (
              filteredVisits.map((v, index) => {
                const isSelected = selectedVisitId === v.id || playbackIndex === index;
                const isVerified = !v.isFarWarning;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleFocusStop(v, index)}
                    className={`p-3 rounded-2xl border transition cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-300 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[170px]">
                          {v.partyName}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{v.time}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[180px]">Met: {v.personMet}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.distanceMeters}m geofence
                      </span>
                    </div>

                    {/* Order & Payment badges */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      {v.orderBooked && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-0.5">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Order Booked</span>
                        </span>
                      )}

                      {v.paymentCollected && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center space-x-0.5">
                          <IndianRupee className="w-2.5 h-2.5" />
                          <span>Payment Done</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
