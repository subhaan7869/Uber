import { Location } from '../types';

export interface GeocodedAddress {
  id: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  location: Location;
  type: 'address' | 'landmark' | 'station' | 'airport' | 'city' | 'commercial';
  distanceMi?: number;
  estimatedMinutes?: number;
}

// Calculate haversine distance in miles between two coordinates
export function calculateDistanceMiles(start: Location, end: Location): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
  const dLon = (end.longitude - start.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.latitude * (Math.PI / 180)) *
      Math.cos(end.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Estimate drive time in minutes based on distance
export function estimateDriveMinutes(distanceMiles: number): number {
  // Average urban speed ~ 18-22 mph with stops + traffic
  return Math.max(3, Math.round(distanceMiles * 3.2 + 2));
}

// High-priority local landmark database for immediate zero-latency feedback
const CURATED_LANDMARKS: Array<{
  name: string;
  subtitle: string;
  location: Location;
  type: GeocodedAddress['type'];
  keywords: string[];
}> = [
  {
    name: 'Heathrow Airport Terminal 5',
    subtitle: 'Wellington Road, Longford, Hounslow TW6 2GA',
    location: { latitude: 51.4700, longitude: -0.4543 },
    type: 'airport',
    keywords: ['heathrow', 'lhr', 'terminal 5', 'airport', 't5']
  },
  {
    name: 'Heathrow Airport Terminals 2 & 3',
    subtitle: 'Inner Ring East, Hounslow TW6 1QG',
    location: { latitude: 51.4712, longitude: -0.4530 },
    type: 'airport',
    keywords: ['heathrow', 'lhr', 'terminal 2', 'terminal 3', 't2', 't3']
  },
  {
    name: 'Gatwick Airport (South Terminal)',
    subtitle: 'Perimeter Rd S, Horley, Gatwick RH6 0NP',
    location: { latitude: 51.1537, longitude: -0.1821 },
    type: 'airport',
    keywords: ['gatwick', 'lgw', 'south terminal', 'airport']
  },
  {
    name: 'London City Airport',
    subtitle: 'Hartmann Rd, London E16 2PX',
    location: { latitude: 51.5048, longitude: 0.0495 },
    type: 'airport',
    keywords: ['london city', 'lcy', 'docklands', 'airport']
  },
  {
    name: 'St Pancras International Station',
    subtitle: 'Euston Rd, London N1C 4QP',
    location: { latitude: 51.5314, longitude: -0.1261 },
    type: 'station',
    keywords: ['st pancras', 'eurostar', 'kings cross', 'station']
  },
  {
    name: 'London Waterloo Station',
    subtitle: 'Waterloo Rd, London SE1 8SW',
    location: { latitude: 51.5031, longitude: -0.1123 },
    type: 'station',
    keywords: ['waterloo', 'station', 'south bank']
  },
  {
    name: 'London Victoria Station',
    subtitle: 'Victoria St, London SW1E 5ND',
    location: { latitude: 51.4952, longitude: -0.1439 },
    type: 'station',
    keywords: ['victoria', 'station', 'coach station']
  },
  {
    name: 'London Paddington Station',
    subtitle: 'Praed St, London W2 1HQ',
    location: { latitude: 51.5154, longitude: -0.1755 },
    type: 'station',
    keywords: ['paddington', 'station', 'heathrow express']
  },
  {
    name: 'London Liverpool Street Station',
    subtitle: 'Liverpool St, London EC2M 7PY',
    location: { latitude: 51.5188, longitude: -0.0814 },
    type: 'station',
    keywords: ['liverpool street', 'city', 'station', 'shoreditch']
  },
  {
    name: 'London Bridge Station & The Shard',
    subtitle: '32 London Bridge St, London SE1 9SG',
    location: { latitude: 51.5045, longitude: -0.0865 },
    type: 'landmark',
    keywords: ['london bridge', 'the shard', 'borough market', 'shard']
  },
  {
    name: 'Canary Wharf Financial District',
    subtitle: 'One Canada Square, Canary Wharf, London E14 5AA',
    location: { latitude: 51.5054, longitude: -0.0209 },
    type: 'commercial',
    keywords: ['canary wharf', 'one canada square', 'docklands', 'banking']
  },
  {
    name: 'Westfield London (White City)',
    subtitle: 'Ariel Way, London W12 7GF',
    location: { latitude: 51.5074, longitude: -0.2215 },
    type: 'commercial',
    keywords: ['westfield', 'white city', 'shepherds bush', 'shopping']
  },
  {
    name: 'Westfield Stratford City',
    subtitle: 'Montfichet Rd, London E20 1EJ',
    location: { latitude: 51.5435, longitude: -0.0072 },
    type: 'commercial',
    keywords: ['westfield', 'stratford', 'olympic park', 'shopping']
  },
  {
    name: 'Piccadilly Circus & Regent Street',
    subtitle: 'Westminster, London W1D 7ET',
    location: { latitude: 51.5101, longitude: -0.1340 },
    type: 'landmark',
    keywords: ['piccadilly', 'piccadilly circus', 'regent street', 'soho']
  },
  {
    name: '221B Baker Street',
    subtitle: 'Marylebone, London NW1 6XE',
    location: { latitude: 51.5237, longitude: -0.1585 },
    type: 'landmark',
    keywords: ['baker street', 'sherlock', '221b', 'marylebone']
  },
  {
    name: '10 Downing Street',
    subtitle: 'Westminster, London SW1A 2AA',
    location: { latitude: 51.5034, longitude: -0.1276 },
    type: 'landmark',
    keywords: ['downing street', 'whitehall', 'westminster', '10 downing']
  },
  {
    name: 'Tower Bridge & Tower of London',
    subtitle: 'Tower Bridge Rd, London SE1 2UP',
    location: { latitude: 51.5055, longitude: -0.0754 },
    type: 'landmark',
    keywords: ['tower bridge', 'tower of london', 'river thames']
  },
  {
    name: 'Oxford Street (Selfridges)',
    subtitle: '400 Oxford St, London W1A 1AB',
    location: { latitude: 51.5144, longitude: -0.1528 },
    type: 'commercial',
    keywords: ['oxford street', 'selfridges', 'shopping', 'mayfair']
  },
  {
    name: 'Shoreditch High Street Hub',
    subtitle: 'Shoreditch, London E1 6JJ',
    location: { latitude: 51.5246, longitude: -0.0781 },
    type: 'landmark',
    keywords: ['shoreditch', 'boxpark', 'brick lane', 'nightlife']
  },
  {
    name: 'Cardiff Central Station',
    subtitle: 'Central Square, Cardiff CF10 1EP',
    location: { latitude: 51.4769, longitude: -3.1791 },
    type: 'station',
    keywords: ['cardiff', 'cardiff central', 'wales', 'station']
  },
  {
    name: 'Cardiff Bay Mermaid Quay',
    subtitle: 'Mermaid Quay, Cardiff CF10 5BZ',
    location: { latitude: 51.4646, longitude: -3.1652 },
    type: 'landmark',
    keywords: ['cardiff bay', 'mermaid quay', 'wales']
  },
  {
    name: 'Nottingham Railway Station',
    subtitle: 'Carrington St, Nottingham NG2 3AQ',
    location: { latitude: 52.9472, longitude: -1.1465 },
    type: 'station',
    keywords: ['nottingham', 'nottingham station', 'station']
  }
];

export async function searchRealAddresses(
  query: string,
  userLocation?: Location | null
): Promise<GeocodedAddress[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: GeocodedAddress[] = [];
  const seenIds = new Set<string>();

  // 1. Instant check against curated local landmarks for instant UI response
  CURATED_LANDMARKS.forEach((item) => {
    const matchesKeyword = item.keywords.some((kw) => kw.includes(trimmed) || trimmed.includes(kw));
    const matchesName = item.name.toLowerCase().includes(trimmed);
    const matchesSubtitle = item.subtitle.toLowerCase().includes(trimmed);

    if (matchesKeyword || matchesName || matchesSubtitle) {
      const id = `curated-${item.name}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const dist = userLocation ? calculateDistanceMiles(userLocation, item.location) : undefined;
        results.push({
          id,
          title: item.name,
          subtitle: item.subtitle,
          fullAddress: `${item.name}, ${item.subtitle}`,
          location: item.location,
          type: item.type,
          distanceMi: dist,
          estimatedMinutes: dist ? estimateDriveMinutes(dist) : undefined
        });
      }
    }
  });

  // 2. Query Live OpenStreetMap Geocoding APIs (Photon + Nominatim in parallel for maximum speed & global coverage)
  const photonPromise = (async () => {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
      const pRes = await fetch(photonUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData?.features && Array.isArray(pData.features)) {
          return pData.features.map((feat: any) => {
            const coords = feat.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            const lon = coords[0];
            const lat = coords[1];
            const props = feat.properties || {};

            const title = props.name || props.street || props.city || 'Address';
            const sub = [props.street, props.city, props.postcode, props.country].filter(Boolean).join(', ');
            const loc: Location = { latitude: lat, longitude: lon };
            const dist = userLocation ? calculateDistanceMiles(userLocation, loc) : undefined;

            let type: GeocodedAddress['type'] = 'address';
            if (props.osm_value === 'aerodrome') type = 'airport';
            else if (props.osm_value === 'station') type = 'station';
            else if (props.osm_key === 'tourism' || props.osm_key === 'historic') type = 'landmark';
            else if (props.osm_key === 'shop' || props.osm_key === 'commercial') type = 'commercial';
            else if (props.osm_value === 'city' || props.osm_value === 'town') type = 'city';

            return {
              id: `photon-${lat.toFixed(5)}-${lon.toFixed(5)}`,
              title,
              subtitle: sub || 'Destination',
              fullAddress: `${title}, ${sub}`,
              location: loc,
              type,
              distanceMi: dist,
              estimatedMinutes: dist ? estimateDriveMinutes(dist) : undefined
            } as GeocodedAddress;
          }).filter(Boolean);
        }
      }
    } catch {}
    return [];
  })();

  const nominatimPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=6`;

      const res = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((item: any) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            if (isNaN(lat) || isNaN(lon)) return null;

            const addr = item.address || {};
            const title =
              addr.road ||
              addr.building ||
              addr.amenity ||
              addr.attraction ||
              addr.suburb ||
              item.name ||
              item.display_name.split(',')[0];

            const subtitleParts: string[] = [];
            if (addr.suburb && addr.suburb !== title) subtitleParts.push(addr.suburb);
            if (addr.city || addr.town || addr.village) subtitleParts.push(addr.city || addr.town || addr.village);
            if (addr.postcode) subtitleParts.push(addr.postcode);
            if (addr.country && subtitleParts.length < 2) subtitleParts.push(addr.country);

            const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') : item.display_name;
            const loc: Location = { latitude: lat, longitude: lon };
            const dist = userLocation ? calculateDistanceMiles(userLocation, loc) : undefined;

            let type: GeocodedAddress['type'] = 'address';
            if (item.type === 'aerodrome' || item.class === 'aeroway') type = 'airport';
            else if (item.type === 'station' || item.class === 'railway') type = 'station';
            else if (item.class === 'tourism' || item.class === 'historic') type = 'landmark';
            else if (item.class === 'shop' || item.class === 'commercial') type = 'commercial';
            else if (item.type === 'city' || item.type === 'town') type = 'city';

            return {
              id: `osm-${item.place_id || `${lat.toFixed(5)}-${lon.toFixed(5)}`}`,
              title: title || item.display_name.split(',')[0],
              subtitle,
              fullAddress: item.display_name,
              location: loc,
              type,
              distanceMi: dist,
              estimatedMinutes: dist ? estimateDriveMinutes(dist) : undefined
            } as GeocodedAddress;
          }).filter(Boolean);
        }
      }
    } catch {}
    return [];
  })();

  const [photonRes, nominatimRes] = await Promise.allSettled([photonPromise, nominatimPromise]);

  const addUnique = (items: (GeocodedAddress | null | undefined)[]) => {
    items.forEach((item) => {
      if (!item) return;
      const key = `${item.location.latitude.toFixed(3)},${item.location.longitude.toFixed(3)}`;
      if (!seenIds.has(key) && !seenIds.has(item.id)) {
        seenIds.add(key);
        seenIds.add(item.id);
        results.push(item);
      }
    });
  };

  if (photonRes.status === 'fulfilled' && Array.isArray(photonRes.value)) {
    addUnique(photonRes.value);
  }
  if (nominatimRes.status === 'fulfilled' && Array.isArray(nominatimRes.value)) {
    addUnique(nominatimRes.value);
  }

  // Sort by closest distance if user location is available
  if (userLocation) {
    results.sort((a, b) => (a.distanceMi || 999) - (b.distanceMi || 999));
  }

  return results;
}

