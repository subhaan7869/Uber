import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Eye, Compass, AlertCircle, Info, Settings, ShieldCheck, Utensils, User, HelpCircle, CheckCircle2 } from 'lucide-react';
import { AcceptanceZone } from './AcceptanceRateHeatmapOverlay';

interface Location {
  latitude: number;
  longitude: number;
}

interface ActiveStop {
  location: Location;
  label: string;
  type: 'pickup' | 'dropoff';
  orderId: string;
}

export interface OtherDriver {
  uid: string;
  name: string;
  rating: number;
  tier: string;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  heading?: number;
  todayEarnings?: number;
  todayDeliveries?: number;
}

export interface InteractiveMapProps {
  location: Location | null;
  heading?: number;
  isOnline: boolean;
  isNavigating: boolean;
  currentStops: ActiveStop[];
  pendingOrder: any;
  theme?: 'light' | 'dark';
  otherDrivers?: OtherDriver[];
  activeBrand?: 'uber' | 'both' | 'hyper';
  useRealGPS?: boolean;
  setUseRealGPS?: (val: boolean) => void;
  activeCityCenter?: Location;
  activeSurgeAreas?: any[];
  onNavigateToSurgeArea?: (area: any) => void;
  routeWaypoints?: Location[];
  zoom?: number;
  setZoom?: (zoom: number) => void;
  iosMapKitEngine?: 'rendered' | 'suspended';
  hideOverlays?: boolean;
  showAcceptanceOverlay?: boolean;
  acceptanceZones?: AcceptanceZone[];
  onSelectAcceptanceZone?: (zone: AcceptanceZone) => void;
  radarOrders?: any[];
  onSelectRadarOrder?: (order: any) => void;
}

// 1. Custom Driver Icon Constructor using the highly realistic green car design
const getDriverIcon = (heading: number, isOnline?: boolean) => {
  if (isOnline === false) {
    // Elegant white circle compass marker with black navigation arrow inside
    return L.divIcon({
      html: `
        <div id="leaflet-car-marker" class="relative w-12 h-12 flex items-center justify-center">
          <div class="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-300">
            <svg class="w-5 h-5 text-neutral-800 fill-current" viewBox="0 0 24 24" style="transform: rotate(${(heading || 0) - 45}deg); transition: transform 0.3s ease-out">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      `,
      className: 'clear-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }

  return L.divIcon({
    html: `
      <div id="leaflet-car-marker" class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-[#0066ff]/40 rounded-full animate-ping opacity-75" style="animation-duration: 2s"></div>
        <div class="w-5 h-5 bg-[#0066ff] border-2 border-white rounded-full shadow-[0_0_12px_rgba(0,102,255,0.8)] flex items-center justify-center transition-all" style="transform: rotate(${(heading || 0)}deg)">
          <svg class="w-2.5 h-2.5 text-white fill-white" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'clear-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// 2. Other Rival Drivers Icon Builder
const getOtherDriverIcon = (dr: OtherDriver) => {
  const name = dr.name ? dr.name.split(' ')[0] : 'Rider';
  const rating = dr.rating ? dr.rating.toFixed(1) : '4.9';
  const heading = dr.heading || 0;
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none pointer-events-none" style="width: 120px; margin-left: -60px; margin-top: -36px;">
        <div class="px-2 py-0.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg text-white font-extrabold text-[8px] uppercase tracking-wide shadow-lg whitespace-nowrap mb-1">
          ${name} ⭐${rating}
        </div>
        
        <div class="w-7 h-7 bg-amber-500 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center animate-pulse">
          <svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24" style="transform: rotate(${heading - 45}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 3. Active Stop Icon Builder
const getStopIcon = (stop: ActiveStop) => {
  const isPickup = stop.type === 'pickup';
  const colorClass = isPickup ? 'bg-blue-600 border-blue-500' : 'bg-green-600 border-green-500';
  const bkgClass = isPickup ? 'bg-blue-500' : 'bg-green-500';
  
  const svgIcon = isPickup 
    ? `<svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`
    : `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="flex flex-col items-center" style="width: 140px; margin-left: -70px; margin-top: -50px;">
        <div class="px-2.5 py-1 text-[8px] font-black text-white uppercase tracking-wider rounded-lg border shadow-xl relative z-20 ${colorClass}">
          ${stop.label}
        </div>
        
        <div class="w-8 h-8 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center mt-1 z-10 ${bkgClass}">
          ${svgIcon}
        </div>
        <div class="w-0.5 h-3 ${isPickup ? 'bg-blue-500' : 'bg-green-500'} mt-[-2px]" />
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 4. Offer Pending Alert Icon Constructor
const getPendingOfferIcon = (type: 'pickup' | 'dest', order: any) => {
  const isPickup = type === 'pickup';
  const label = isPickup 
    ? (order.type === 'delivery' ? (order.restaurantName || 'Pickup') : 'Offer Pickup')
    : (order.customerName ? `Drop: ${order.customerName}` : 'Destination');
    
  const isMatch = !!order?.isMatching;
  // Black & white for match job, blue & black for normal job
  const bgClass = isMatch 
    ? 'bg-black text-white' 
    : (isPickup ? 'bg-[#0066ff] text-white' : 'bg-blue-700 text-white');
  const borderClass = isMatch 
    ? 'border-white ring-1 ring-white/50' 
    : 'border-blue-400 ring-1 ring-blue-500/50';
  
  const svgIcon = isPickup
    ? (order.type === 'delivery' 
        ? `<svg class="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`)
    : `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="flex flex-col items-center select-none" style="width: 150px; margin-left: -75px; margin-top: -52px;">
        <div class="px-2.5 py-1 text-[8.5px] font-black ${bgClass} border ${borderClass} rounded-lg shadow-2xl uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          ${isMatch ? '⚡ MATCH: ' : ''}${label}
        </div>
        <div class="w-8 h-8 rounded-full ${bgClass} border-2 ${isMatch ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'border-white shadow-[0_0_14px_rgba(0,102,255,0.8)]'} flex items-center justify-center mt-1">
          ${svgIcon}
        </div>
        <div class="w-0.5 h-3 ${isMatch ? 'bg-white' : 'bg-[#0066ff]'} mt-[-2px]" />
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 5. Surge Area Heatmap Overlay Constructor
const getSurgeAreaIcon = (area: any) => {
  let mainGrad = 'rgba(239, 68, 68, 0.22)';
  let subGrad = 'rgba(249, 115, 22, 0.06)';
  let centerGrad = 'rgba(239, 68, 68, 0.35)';
  let edgeGrad = 'rgba(220, 38, 38, 0.08)';
  let hexFill = '#DC2626';

  if (area.periodId === 'breakfast') {
    mainGrad = 'rgba(245, 158, 11, 0.25)';
    subGrad = 'rgba(251, 191, 36, 0.08)';
    centerGrad = 'rgba(251, 191, 36, 0.4)';
    edgeGrad = 'rgba(251, 191, 36, 0.1)';
    hexFill = '#D97706';
  } else if (area.periodId === 'lunch') {
    mainGrad = 'rgba(249, 115, 22, 0.25)';
    subGrad = 'rgba(217, 119, 6, 0.08)';
    centerGrad = 'rgba(249, 115, 22, 0.4)';
    edgeGrad = 'rgba(217, 119, 6, 0.1)';
    hexFill = '#EA580C';
  } else if (area.periodId === 'dinner') {
    mainGrad = 'rgba(220, 38, 38, 0.25)';
    subGrad = 'rgba(185, 28, 28, 0.08)';
    centerGrad = 'rgba(220, 38, 38, 0.42)';
    edgeGrad = 'rgba(185, 28, 28, 0.12)';
    hexFill = '#B91C1C';
  } else if (area.periodId === 'offpeak') {
    mainGrad = 'rgba(16, 185, 129, 0.15)';
    subGrad = 'rgba(45, 212, 191, 0.05)';
    centerGrad = 'rgba(16, 185, 129, 0.25)';
    edgeGrad = 'rgba(45, 212, 191, 0.06)';
    hexFill = '#059669';
  }

  const surgeCash = Math.max(1.0, Math.round((area.multiplier - 1) * 2.5 * 2) / 2).toFixed(2);

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none" style="width: 280px; height: 280px; margin-left: -140px; margin-top: -140px;">
        <!-- Hexagonal grid translucent layer -->
        <svg class="absolute inset-0 w-[280px] h-[280px] pointer-events-none opacity-40 animate-pulse" style="animation-duration: 4s;" viewBox="0 0 100 100">
          <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="${mainGrad}" stroke="${centerGrad}" stroke-width="1.5" stroke-dasharray="3,3" />
        </svg>

        <!-- Neon heat pulse rings -->
        <div class="absolute w-[280px] h-[280px] rounded-full animate-pulse blur-md pointer-events-none" style="background: radial-gradient(circle, ${mainGrad} 0%, ${subGrad} 50%, transparent 100%); animation-duration: 3.5s; top: 0; left: 0;"></div>
        <div class="absolute w-[140px] h-[140px] rounded-full blur-sm pointer-events-none" style="background: radial-gradient(circle, ${centerGrad} 0%, ${edgeGrad} 50%, transparent 100%); top: 70px; left: 70px;"></div>

        <!-- Official Uber Hexagon Surge Pill -->
        <div class="absolute top-[115px] flex flex-col items-center pointer-events-auto z-40">
          <button class="surge-nav-trigger group flex items-center bg-black/95 hover:bg-neutral-900 text-white rounded-full p-1 pr-3 border border-white/30 shadow-[0_8px_25px_rgba(0,0,0,0.8)] transition-all hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto">
            <!-- Uber Hexagon icon tag -->
            <div class="w-7 h-7 rounded-full flex items-center justify-center mr-1.5 shadow-inner" style="background: ${hexFill};">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
              </svg>
            </div>
            <div class="flex flex-col text-left">
              <span class="font-sans font-black text-[11px] leading-tight text-white tracking-tight">+£${surgeCash}</span>
              <span class="font-sans text-[7.5px] font-bold text-emerald-400 uppercase tracking-widest">${area.multiplier}x Surge</span>
            </div>
          </button>
          <div class="px-2 py-0.5 bg-black/85 rounded-full text-gray-300 font-extrabold text-[7.5px] uppercase tracking-wider mt-1 border border-white/10 shadow-md">
            ${area.name}
          </div>
        </div>
      </div>
    `,
    iconSize: [280, 280],
    iconAnchor: [140, 140]
  });
};

// 6. Order Acceptance Rate Heatmap Zone Icon Constructor
const getAcceptanceZoneIcon = (zone: AcceptanceZone) => {
  const isTop = zone.isHighest || zone.rank === 1;
  const isHigh = zone.acceptanceRate >= 88;

  // Luminous aura gradients
  const mainGrad = isTop 
    ? 'rgba(16, 185, 129, 0.28)' 
    : isHigh 
    ? 'rgba(59, 130, 246, 0.22)' 
    : 'rgba(245, 158, 11, 0.18)';

  const subGrad = isTop 
    ? 'rgba(16, 185, 129, 0.08)' 
    : isHigh 
    ? 'rgba(59, 130, 246, 0.06)' 
    : 'rgba(245, 158, 11, 0.04)';

  const ringColor = isTop 
    ? 'rgba(52, 211, 153, 0.6)' 
    : isHigh 
    ? 'rgba(96, 165, 250, 0.5)' 
    : 'rgba(251, 191, 36, 0.4)';

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none" style="width: 280px; height: 280px; margin-left: -140px; margin-top: -140px;">
        <!-- Neon acceptance heat pulse rings -->
        <div class="absolute w-[280px] h-[280px] rounded-full animate-pulse blur-md pointer-events-none" style="background: radial-gradient(circle, ${mainGrad} 0%, ${subGrad} 55%, transparent 100%); animation-duration: ${isTop ? '2.5s' : '3.8s'}; top: 0; left: 0;"></div>
        <div class="absolute w-[180px] h-[180px] rounded-full pointer-events-none" style="border: 2px dashed ${ringColor}; top: 50px; left: 50px; opacity: 0.85;"></div>

        <!-- Interactive center acceptance badge trigger -->
        <div class="absolute top-[110px] flex flex-col items-center pointer-events-auto z-40">
          <button class="acceptance-zone-trigger px-3 py-1.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.7)] flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto border ${
            isTop 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-500/40' 
              : isHigh 
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-300 shadow-blue-500/30' 
              : 'bg-gradient-to-r from-amber-700 to-orange-700 text-white border-amber-300'
          }">
            <span class="w-2 h-2 rounded-full ${isTop ? 'bg-white animate-ping' : 'bg-emerald-300'} shrink-0"></span>
            <span class="font-sans font-black text-[11px] tracking-tight uppercase">${isTop ? '🏆 ' : '⭐ '}${zone.acceptanceRate}% ACC.</span>
          </button>
          
          <div class="px-2 py-0.5 bg-black/90 rounded-md text-white font-black text-[8px] uppercase tracking-wider mt-1 border ${isTop ? 'border-emerald-400/50 text-emerald-300' : 'border-white/10 text-gray-200'} shadow-lg whitespace-nowrap">
            ${isTop ? '#1 TOP AREA • ' : ''}${zone.name}
          </div>
        </div>
      </div>
    `,
    iconSize: [280, 280],
    iconAnchor: [140, 140]
  });
};

// 7. Radar Order Icon Constructor with Dynamic 'Pulse' Animation for High-Value Orders
const getRadarOrderIcon = (order: any) => {
  const isHighValue = (order.estimatedPay >= 14) || ((order.estimatedPay / (order.estimatedDistance || 1)) >= 2.5);
  const isDelivery = order.type === 'delivery';
  const payFormatted = Number(order.estimatedPay || 0).toFixed(2);

  if (isHighValue) {
    return L.divIcon({
      className: '',
      html: `
        <div class="relative flex flex-col items-center select-none" style="width: 150px; margin-left: -75px; margin-top: -62px;">
          <!-- Multi-tier High-Value Pulse Wave Animation Effect -->
          <div class="absolute w-20 h-20 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" style="top: 10px; left: 35px; animation-duration: 1.8s;"></div>
          <div class="absolute w-24 h-24 rounded-full bg-teal-400/20 blur-sm animate-pulse pointer-events-none" style="top: 2px; left: 27px; animation-duration: 1.4s;"></div>

          <!-- Glowing High-Value Badge -->
          <div class="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black shadow-[0_0_18px_rgba(16,185,129,0.9)] border border-white flex items-center gap-1 z-30 whitespace-nowrap leading-tight">
            <span>💎 £${payFormatted}</span>
            <span class="bg-black/35 text-white px-1 rounded text-[7px] font-mono">HIGH VALUE</span>
          </div>

          <!-- Pulsing Icon Container -->
          <button class="radar-order-marker-trigger relative w-12 h-12 rounded-2xl bg-black border-[2.5px] border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.85)] flex items-center justify-center mt-1 cursor-pointer pointer-events-auto transition-transform hover:scale-115 active:scale-95 group">
            <span class="text-xl leading-none filter drop-shadow">${isDelivery ? '🍕' : '🚗'}</span>
          </button>
          
          <div class="w-2 h-2 bg-emerald-400 rounded-full mt-0.5 shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
        </div>
      `,
      iconSize: [1, 1],
      iconAnchor: [0, 0]
    });
  }

  // Standard Radar Order Icon
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none" style="width: 120px; margin-left: -60px; margin-top: -50px;">
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping pointer-events-none" style="top: 12px; left: 36px; animation-duration: 2.5s;"></div>
        <div class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-900/95 text-blue-300 border border-blue-400/60 shadow-md whitespace-nowrap z-20">
          £${payFormatted}
        </div>
        <button class="radar-order-marker-trigger relative w-10 h-10 rounded-2xl bg-[#090d16] border-2 border-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.6)] flex items-center justify-center mt-0.5 cursor-pointer pointer-events-auto transition-transform hover:scale-110 active:scale-95">
          <span class="text-base leading-none">${isDelivery ? '🍕' : '🚗'}</span>
        </button>
        <div class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-0.5 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  heading = 0,
  isOnline,
  isNavigating,
  currentStops,
  pendingOrder,
  theme = 'dark',
  otherDrivers,
  activeBrand = 'uber',
  useRealGPS = false,
  setUseRealGPS,
  activeCityCenter,
  activeSurgeAreas,
  onNavigateToSurgeArea,
  routeWaypoints,
  zoom,
  setZoom,
  iosMapKitEngine = 'rendered',
  hideOverlays = false,
  showAcceptanceOverlay = false,
  acceptanceZones,
  onSelectAcceptanceZone,
  radarOrders,
  onSelectRadarOrder
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [viewAngle, setViewAngle] = useState<'top' | 'tilt'>('top');

  // Refs for persistent Leaflet layers
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const otherDriversMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const stopsMarkersRef = useRef<L.Marker[]>([]);
  const surgeAreasMarkersRef = useRef<L.Marker[]>([]);
  const acceptanceZoneMarkersRef = useRef<L.Marker[]>([]);
  const radarOrdersMarkersRef = useRef<L.Marker[]>([]);

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const routePolylineRef = useRef<L.Polyline | null>(null);
  const dashPolylineRef = useRef<L.Polyline | null>(null);

  const pendingOfferMarkerPickupRef = useRef<L.Marker | null>(null);
  const pendingOfferMarkerDestRef = useRef<L.Marker | null>(null);
  const pendingOfferPolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const startLat = location?.latitude || 51.5074;
    const startLng = location?.longitude || -0.1278;

    const initialZoom = typeof zoom === 'number'
      ? Math.round(12 + (zoom - 0.4) * (6 / 2.6))
      : 15;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true
    });

    // Official OpenStreetMap Tiles (100% Free, Zero API Keys, No Watermarks)
    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      minZoom: 1,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    // Listen to map zoom changes to sync back to parent
    map.on('zoomend', () => {
      const currentLeafletZoom = map.getZoom();
      const newMultiplier = 0.4 + (currentLeafletZoom - 12) * (2.6 / 6);
      setZoom?.(Math.max(0.4, Math.min(3.0, newMultiplier)));
    });

    return () => {
      radarOrdersMarkersRef.current.forEach(m => m.remove());
      radarOrdersMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Bidirectional sync for outer Zoom Controls
  useEffect(() => {
    if (mapRef.current && typeof zoom === 'number') {
      const targetLeafletZoom = Math.round(12 + (zoom - 0.4) * (6 / 2.6));
      if (mapRef.current.getZoom() !== targetLeafletZoom) {
        mapRef.current.setZoom(targetLeafletZoom);
      }
    }
  }, [zoom]);

  // Zoom to turn-by-turn view level when starting navigation
  useEffect(() => {
    if (isNavigating && mapRef.current && location) {
      const driverLatLng = L.latLng(location.latitude, location.longitude);
      mapRef.current.setView(driverLatLng, 17.5, { animate: true });
    }
  }, [isNavigating]);

  // Synchronize dynamic Layers upon prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;
    if (iosMapKitEngine === 'suspended') {
      // Keep driver marker but freeze updates
      return;
    }

    const driverLatLng = L.latLng(location.latitude, location.longitude);

    // 1. Update/Add Driver Marker
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(driverLatLng, { icon: getDriverIcon(heading, isOnline) }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(driverLatLng);
      driverMarkerRef.current.setIcon(getDriverIcon(heading, isOnline));
    }

    // Smoothly pan camera during active turn-by-turn navigation
    if (isNavigating) {
      map.panTo(driverLatLng, { animate: true, duration: 0.15 });
    }

    // 2. Sync rival drivers
    const currentOtherDriverUids = new Set((otherDrivers || []).map(d => d.uid));
    otherDriversMarkersRef.current.forEach((marker, uid) => {
      if (!currentOtherDriverUids.has(uid)) {
        marker.remove();
        otherDriversMarkersRef.current.delete(uid);
      }
    });

    const seenIds = new Set<string>();
    const uniqueOtherDrivers = (otherDrivers || []).filter(dr => {
      if (!dr || !dr.uid || seenIds.has(dr.uid)) return false;
      seenIds.add(dr.uid);
      return true;
    });

    uniqueOtherDrivers.forEach(dr => {
      if (dr.latitude && dr.longitude) {
        const latlng = L.latLng(dr.latitude, dr.longitude);
        let marker = otherDriversMarkersRef.current.get(dr.uid);
        if (!marker) {
          marker = L.marker(latlng, { icon: getOtherDriverIcon(dr) }).addTo(map);
          otherDriversMarkersRef.current.set(dr.uid, marker);
        } else {
          marker.setLatLng(latlng);
          marker.setIcon(getOtherDriverIcon(dr));
        }
      }
    });

    // 3. Sync Navigation Stops & Drawing Routes
    stopsMarkersRef.current.forEach(m => m.remove());
    stopsMarkersRef.current = [];

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (dashPolylineRef.current) {
      dashPolylineRef.current.remove();
      dashPolylineRef.current = null;
    }

    if (isNavigating && routeWaypoints && routeWaypoints.length > 0) {
      const pathPoints = [driverLatLng, ...routeWaypoints.map(wp => L.latLng(wp.latitude, wp.longitude))];

      currentStops.forEach(st => {
        const stLatLng = L.latLng(st.location.latitude, st.location.longitude);
        const marker = L.marker(stLatLng, { icon: getStopIcon(st) }).addTo(map);
        stopsMarkersRef.current.push(marker);
      });

      routePolylineRef.current = L.polyline(pathPoints, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      dashPolylineRef.current = L.polyline(pathPoints, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10',
        lineJoin: 'round'
      }).addTo(map);

      // Fit bounds to show route path beautifully only when the route is constructed or recalulated.
      // We check route length and first waypoint to identify recalculations, preventing jumping while moving.
      const bounds = L.latLngBounds(pathPoints);
      const boundsKey = routeWaypoints.length + "_" + (routeWaypoints[0]?.latitude || 0);
      if ((map as any).lastBoundsKey !== boundsKey) {
        (map as any).lastBoundsKey = boundsKey;
        map.fitBounds(bounds, { 
          paddingTopLeft: [30, isNavigating ? 150 : 60], 
          paddingBottomRight: [30, 140] 
        });
      }
    } else if (isNavigating && currentStops.length > 0) {
      const stopLatLngs = currentStops.map(s => L.latLng(s.location.latitude, s.location.longitude));
      const pathPoints = [driverLatLng, ...stopLatLngs];

      currentStops.forEach(st => {
        const stLatLng = L.latLng(st.location.latitude, st.location.longitude);
        const marker = L.marker(stLatLng, { icon: getStopIcon(st) }).addTo(map);
        stopsMarkersRef.current.push(marker);
      });

      routePolylineRef.current = L.polyline(pathPoints, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      dashPolylineRef.current = L.polyline(pathPoints, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10',
        lineJoin: 'round'
      }).addTo(map);

      const bounds = L.latLngBounds(pathPoints);
      map.fitBounds(bounds, { 
        paddingTopLeft: [30, isNavigating ? 150 : 60], 
        paddingBottomRight: [30, 140] 
      });
    }

    // 4. Offer Pending Preview Layer
    if (pendingOfferMarkerPickupRef.current) {
      pendingOfferMarkerPickupRef.current.remove();
      pendingOfferMarkerPickupRef.current = null;
    }
    if (pendingOfferMarkerDestRef.current) {
      pendingOfferMarkerDestRef.current.remove();
      pendingOfferMarkerDestRef.current = null;
    }
    if (pendingOfferPolylineRef.current) {
      pendingOfferPolylineRef.current.remove();
      pendingOfferPolylineRef.current = null;
    }

    if (pendingOrder) {
      const pLoc = L.latLng(pendingOrder.pickupLocation.latitude, pendingOrder.pickupLocation.longitude);
      const dLoc = L.latLng(pendingOrder.customerLocation.latitude, pendingOrder.customerLocation.longitude);
      const points = [driverLatLng, pLoc, dLoc];

      pendingOfferMarkerPickupRef.current = L.marker(pLoc, {
        icon: getPendingOfferIcon('pickup', pendingOrder)
      }).addTo(map);

      pendingOfferMarkerDestRef.current = L.marker(dLoc, {
        icon: getPendingOfferIcon('dest', pendingOrder)
      }).addTo(map);

      pendingOfferPolylineRef.current = L.polyline(points, {
        color: pendingOrder.isMatching ? '#ffffff' : '#0066ff',
        weight: 5,
        dashArray: '6, 8',
        opacity: 0.95,
        lineJoin: 'round'
      }).addTo(map);

      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 5. Surge Heatmap Layers
    surgeAreasMarkersRef.current.forEach(m => m.remove());
    surgeAreasMarkersRef.current = [];

    if (activeSurgeAreas && activeSurgeAreas.length > 0) {
      const baseCenter = activeCityCenter || location || { latitude: 51.5074, longitude: -0.1278 };
      activeSurgeAreas.forEach(area => {
        const lat = baseCenter.latitude + area.lat;
        const lng = baseCenter.longitude + area.lng;
        const latlng = L.latLng(lat, lng);

        const surgeMarker = L.marker(latlng, { icon: getSurgeAreaIcon(area) }).addTo(map);

        // Bind interactive event handler dynamically
        setTimeout(() => {
          const el = surgeMarker.getElement();
          if (el) {
            const btn = el.querySelector('.surge-nav-trigger');
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onNavigateToSurgeArea?.(area);
              });
            }
          }
        }, 80);

        surgeAreasMarkersRef.current.push(surgeMarker);
      });
    }

    // 6. Order Acceptance Rate Heatmap Overlay Layers
    acceptanceZoneMarkersRef.current.forEach(m => m.remove());
    acceptanceZoneMarkersRef.current = [];

    if (showAcceptanceOverlay && acceptanceZones && acceptanceZones.length > 0) {
      acceptanceZones.forEach(zone => {
        const latlng = L.latLng(zone.center.latitude, zone.center.longitude);
        const zoneMarker = L.marker(latlng, { icon: getAcceptanceZoneIcon(zone) }).addTo(map);

        setTimeout(() => {
          const el = zoneMarker.getElement();
          if (el) {
            const btn = el.querySelector('.acceptance-zone-trigger');
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelectAcceptanceZone?.(zone);
              });
            }
          }
        }, 80);

        acceptanceZoneMarkersRef.current.push(zoneMarker);
      });
    }

    // 7. Radar Order Pins Layer with 'Pulse' Animation
    radarOrdersMarkersRef.current.forEach(m => m.remove());
    radarOrdersMarkersRef.current = [];

    if (isOnline && !isNavigating && radarOrders && radarOrders.length > 0) {
      radarOrders.forEach(order => {
        const pickup = order.pickupLocation || order.pickupPos;
        if (!pickup) return;
        const lat = pickup.latitude ?? pickup.lat;
        const lng = pickup.longitude ?? pickup.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const pos = L.latLng(lat, lng);
        const marker = L.marker(pos, { icon: getRadarOrderIcon(order) }).addTo(map);

        setTimeout(() => {
          const el = marker.getElement();
          if (el) {
            const btn = el.querySelector('.radar-order-marker-trigger');
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelectRadarOrder?.(order);
              });
            }
          }
        }, 80);

        marker.on('click', () => {
          onSelectRadarOrder?.(order);
        });

        radarOrdersMarkersRef.current.push(marker);
      });
    }

    // 8. Center map camera on driver if static
    if (!isNavigating && !pendingOrder) {
      map.panTo(driverLatLng);
    }

  }, [
    location?.latitude, 
    location?.longitude, 
    heading, 
    otherDrivers, 
    isOnline, 
    isNavigating, 
    currentStops, 
    pendingOrder, 
    activeSurgeAreas, 
    activeBrand,
    routeWaypoints,
    iosMapKitEngine,
    showAcceptanceOverlay,
    acceptanceZones,
    radarOrders
  ]);

  return (
    <div className="w-full h-full min-h-[380px] rounded-[32px] overflow-hidden border border-white/10 bg-[#020617] flex flex-col relative group select-none">
      
      {/* Dispatch Core Brand Banner */}
      {!hideOverlays && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#111216]/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-2xl pointer-events-none">
          <div className="flex -space-x-1.5 overflow-hidden">
            {activeBrand === 'both' ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-black" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#00ca72] border border-black" />
              </>
            ) : (
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-black ${activeBrand === 'hyper' ? 'bg-[#00ca72]' : 'bg-blue-500'}`}>
                <ShieldCheck size={10} className="text-white" />
              </span>
            )}
          </div>
          <div className="text-left leading-none">
            <p className={`text-[9px] font-black tracking-wider uppercase ${activeBrand === 'hyper' ? 'text-[#00ff88]' : activeBrand === 'both' ? 'text-[#a855f7]' : 'text-blue-400'}`}>
              {activeBrand === 'both' ? 'Dual-Dispatch GPS Core' : activeBrand === 'hyper' ? 'Hyper Driver GPS Core' : 'Uber Driver GPS Core'}
            </p>
            <p className="text-[10px] font-bold text-gray-300 mt-0.5">Tracking Drivers GPS Core</p>
          </div>
        </div>
      )}

      {/* Leaflet Map Viewer Canvas Core - Always styled with Hyper Blue & Black dark-tiles */}
      <div 
        className="w-full h-full relative overflow-hidden transition-all duration-500 origin-bottom dark-tiles"
        style={{ 
          height: '100%', 
          minHeight: '380px',
          transform: viewAngle === 'tilt' ? 'perspective(800px) rotateX(25deg) translateY(-12px) scale(1.03)' : 'none',
          boxShadow: viewAngle === 'tilt' ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : 'none'
        }}
      >
        <div ref={mapContainerRef} className="w-full h-full" style={{ width: '100%', height: '100%', outline: 'none' }} />
      </div>

      {/* iOS Apple MapKit Suspended Overlay */}
      {iosMapKitEngine === 'suspended' && (
        <div className="absolute inset-0 z-[6000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-2xl mb-4">
            <Compass size={32} className="animate-pulse" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Apple MapKit Context Suspended</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
            Vector tiles and route intersection lines are frozen in cache memory. Re-enable render state in the iOS systems panel to hot-reload maps.
          </p>
          <div className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest text-amber-400">
            Thread Suspended (0Hz Tick)
          </div>
        </div>
      )}

    </div>
  );
};
