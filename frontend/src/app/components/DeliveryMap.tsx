import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, AlertCircle, Navigation2, Search, PenLine } from 'lucide-react';

// ── Store location (Bugo, CDO) ─────────────────────────────────────────────────
const STORE_LAT = 8.4577;
const STORE_LNG = 124.6596;

// ── Delivery fee rule ──────────────────────────────────────────────────────────
function calcFee(km: number): number {
  if (km <= 5) return 40;
  return 40 + Math.ceil(km - 5) * 10;
}

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Custom SVG pin icons ───────────────────────────────────────────────────────
function makeCustomerIcon() {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 30 16 30s16-19.333 16-30C32 7.163 24.837 0 16 0z" fill="#b88917" stroke="#fff" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#b88917"/>
    </svg>`,
    className: '',
    iconSize: [32, 46],
    iconAnchor: [16, 46],
    popupAnchor: [0, -46],
  });
}

function makeStoreIcon() {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 38" width="26" height="38">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 8.667 13 25 13 25S26 21.667 26 13C26 5.82 20.18 0 13 0z" fill="#3D6B2A" stroke="#fff" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="5" fill="white"/>
      <text x="13" y="17" text-anchor="middle" font-size="8" font-weight="900" fill="#3D6B2A" font-family="serif">T</text>
    </svg>`,
    className: '',
    iconSize: [26, 38],
    iconAnchor: [13, 38],
  });
}

// ── Nominatim shared headers ───────────────────────────────────────────────────
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en-US,en',
  'User-Agent': 'TeascapeBugo/1.0 (contact@teascape.com)',
};

// ── Nominatim suggestion type ─────────────────────────────────────────────────
interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ── Props ──────────────────────────────────────────────────────────────────────
export interface DeliveryMapProps {
  onLocationChange: (address: string, distKm: number, fee: number) => void;
  hasError?: boolean;
  errorMsg?: string;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DeliveryMap({ onLocationChange, hasError, errorMsg }: DeliveryMapProps) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [isLocating, setIsLocating]       = useState(false);
  const [locationError, setLocationError] = useState('');

  // Autofilled fields (editable)
  const [street, setStreet]     = useState('');
  const [barangay, setBarangay] = useState('');

  // Pin state
  const [distKm, setDistKm]   = useState(0);
  const [fee, setFee]         = useState(0);
  const [pinSet, setPinSet]   = useState(false);

  // Map refs
  const mapContainerRef      = useRef<HTMLDivElement>(null);
  const mapRef               = useRef<L.Map | null>(null);
  const customerMarkerRef    = useRef<L.Marker | null>(null);
  const searchDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef       = useRef<HTMLDivElement>(null);

  // ── Init map on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;
      const map = L.map(mapContainerRef.current, {
        center: [STORE_LAT, STORE_LNG],
        zoom: 14,
        zoomControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      L.marker([STORE_LAT, STORE_LNG], { icon: makeStoreIcon() })
        .addTo(map)
        .bindPopup('<b>Teascape Bugo</b><br>Bugo Highway, CDO');
      mapRef.current = map;
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        customerMarkerRef.current = null;
      }
    };
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Apply a pinned location ──────────────────────────────────────────────────
  const applyLocation = useCallback(
    (lat: number, lng: number, displayName: string) => {
      const d = Math.round(haversineKm(STORE_LAT, STORE_LNG, lat, lng) * 10) / 10;
      const f = calcFee(d);
      setDistKm(d);
      setFee(f);
      setPinSet(true);

      // Parse street and barangay from display name
      const parts = displayName.split(',').map(s => s.trim());
      setStreet(parts[0] || displayName);
      // Try to find a known CDO barangay in the display name
      const foundBarangay = parts.find(p =>
        p.toLowerCase().includes('bugo') ||
        p.toLowerCase().includes('gusa') ||
        p.toLowerCase().includes('cugman') ||
        p.toLowerCase().includes('lapasan') ||
        p.toLowerCase().includes('bulua')
      ) || parts[1] || '';
      setBarangay(foundBarangay);

      const shortAddr = parts.slice(0, 3).join(', ');
      onLocationChange(shortAddr, d, f);

      const map = mapRef.current;
      if (!map) return;

      if (customerMarkerRef.current) {
        customerMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: makeCustomerIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`,
              { headers: NOMINATIM_HEADERS }  // ← fix 1: dragend reverse geocode
            );
            const data = await res.json();
            const newAddr: string = data.display_name ?? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
            applyLocation(pos.lat, pos.lng, newAddr);
          } catch {
            applyLocation(pos.lat, pos.lng, `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
          }
        });

        customerMarkerRef.current = marker;
      }
      map.flyTo([lat, lng], 16, { duration: 1.0 });
    },
    [onLocationChange]
  );

  // ── Search input with debounce ───────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setLocationError('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val.trim() || val.length < 3) { setSuggestions([]); return; }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = encodeURIComponent(`${val}, Cagayan de Oro, Philippines`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=ph&limit=5`,
          { headers: NOMINATIM_HEADERS }  // ← fix 2: search debounce
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 400);
  };

  const handleSuggestionSelect = (s: Suggestion) => {
    setSearchQuery(s.display_name.split(',')[0]);
    setSuggestions([]);
    applyLocation(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
  };

  // ── GPS / Use My Current Location ───────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: NOMINATIM_HEADERS }  // ← fix 3: GPS reverse geocode
          );
          const data = await res.json();
          const addr = data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSearchQuery(addr.split(',')[0]);
          applyLocation(latitude, longitude, addr);
        } catch {
          applyLocation(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('Location access denied. Please allow location or search manually.');
        } else {
          setLocationError('Could not get your location. Please search manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">

      {/* ── 1. Smart Search + GPS ─────────────────────────────────────────── */}
      <div className="relative" ref={suggestionsRef}>
        <div className="flex gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#9C7A5A' }}
            />
            {isSearching && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none"
                style={{ color: '#b88917' }}
              />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search for your street or building..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: hasError && !pinSet ? '#e53e3e' : 'rgba(61,32,16,0.2)',
                backgroundColor: hasError && !pinSet ? '#fff5f5' : '#FAFAFA',
                color: '#3D2010',
              }}
            />
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            title="Use my current location"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-60 shrink-0"
            style={{
              backgroundColor: '#3D2010',
              borderColor: '#3D2010',
              color: '#fff',
              minWidth: 44,
            }}
          >
            {isLocating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Navigation2 className="w-4 h-4" />
            }
            <span className="hidden sm:inline">
              {isLocating ? 'Locating...' : 'My Location'}
            </span>
          </button>
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-xl shadow-2xl border overflow-hidden"
            style={{ backgroundColor: '#fff', borderColor: 'rgba(61,32,16,0.15)' }}
          >
            {suggestions.map(s => (
              <button
                key={s.place_id}
                type="button"
                onMouseDown={() => handleSuggestionSelect(s)}
                className="w-full text-left px-3 py-2.5 flex items-start gap-2 border-b last:border-0 transition-colors hover:bg-amber-50"
                style={{ borderColor: 'rgba(61,32,16,0.06)' }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
                <span className="text-xs leading-snug" style={{ color: '#3D2010' }}>
                  {s.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location / search error */}
      {locationError && (
        <p className="flex items-center gap-1 text-xs" style={{ color: '#e53e3e' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {locationError}
        </p>
      )}

      {/* ── 2. Interactive Map (always visible) ──────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(61,32,16,0.15)' }}
      >
        <div ref={mapContainerRef} style={{ height: 260, width: '100%' }} />

        {/* Overlay hint when pin not set */}
        {!pinSet && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-1 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(250,245,238,0.85) 0%, transparent 55%)' }}
          >
            <MapPin className="w-5 h-5" style={{ color: '#b88917' }} />
            <p className="text-xs font-semibold" style={{ color: '#3D2010' }}>
              Drag the map to place the pin on your exact door
            </p>
          </div>
        )}

        {/* Fee badge when pin is set */}
        {pinSet && (
          <div
            className="absolute top-2 right-2 z-[999] px-2.5 py-1 rounded-full text-xs font-semibold shadow"
            style={{ backgroundColor: '#b88917', color: '#fff' }}
          >
            {distKm} km · ₱{fee} fee
          </div>
        )}
      </div>

      {/* ── 3. Autofilled Fields ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <label className="text-xs font-semibold block mb-1" style={{ color: '#3D2010' }}>
            Street / Landmark
          </label>
          <div className="relative">
            <input
              type="text"
              value={street}
              onChange={e => {
                setStreet(e.target.value);
                if (pinSet) onLocationChange(`${e.target.value}, ${barangay}`, distKm, fee);
              }}
              placeholder="Auto-filled from map..."
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: 'rgba(61,32,16,0.2)',
                backgroundColor: pinSet ? '#FAFFF5' : '#FAFAFA',
                color: '#3D2010',
              }}
            />
            <PenLine
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: '#b88917', opacity: pinSet ? 1 : 0.3 }}
            />
          </div>
        </div>

        <div className="relative">
          <label className="text-xs font-semibold block mb-1" style={{ color: '#3D2010' }}>
            Barangay
          </label>
          <div className="relative">
            <input
              type="text"
              value={barangay}
              onChange={e => {
                setBarangay(e.target.value);
                if (pinSet) onLocationChange(`${street}, ${e.target.value}`, distKm, fee);
              }}
              placeholder="Auto-filled from map..."
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: 'rgba(61,32,16,0.2)',
                backgroundColor: pinSet ? '#FAFFF5' : '#FAFAFA',
                color: '#3D2010',
              }}
            />
            <PenLine
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: '#b88917', opacity: pinSet ? 1 : 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Area restriction notice ───────────────────────────────────── */}
      <div
        className="rounded-xl p-3 flex items-center gap-2"
        style={{ backgroundColor: '#EBF3FF', border: '1px solid rgba(0,122,255,0.2)' }}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#007AFF' }} />
        <p className="text-xs" style={{ color: '#007AFF' }}>
          Delivery is available within Cagayan de Oro only.
        </p>
      </div>

      {/* Parent error (no address set) */}
      {hasError && errorMsg && !pinSet && (
        <p className="flex items-center gap-1 text-xs" style={{ color: '#e53e3e' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
        </p>
      )}
    </div>
  );
}