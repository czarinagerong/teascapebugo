import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, AlertCircle, Navigation2 } from 'lucide-react';

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

// ── Custom SVG pin icon ────────────────────────────────────────────────────────
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

// ── Nominatim result type ──────────────────────────────────────────────────────
interface Prediction {
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

// ── Main component (vanilla Leaflet, no react-leaflet) ─────────────────────────
export function DeliveryMap({ onLocationChange, hasError, errorMsg }: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [distKm, setDistKm] = useState(0);
  const [fee, setFee] = useState(0);
  const [pinSet, setPinSet] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Init Leaflet map once ────────────────────────────────────────────────────
  useEffect(() => {
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

    // Store marker (non-draggable)
    L.marker([STORE_LAT, STORE_LNG], { icon: makeStoreIcon() })
      .addTo(map)
      .bindPopup('<b>Teascape Bugo</b><br>Bugo Highway, CDO');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
    };
  }, []);

  // ── Apply a location (called from prediction select or drag end) ─────────────
  const applyLocation = useCallback(
    (lat: number, lng: number, addr: string) => {
      const d = Math.round(haversineKm(STORE_LAT, STORE_LNG, lat, lng) * 10) / 10;
      const f = calcFee(d);
      setSelectedAddress(addr);
      setDistKm(d);
      setFee(f);
      setPinSet(true);
      onLocationChange(addr, d, f);

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
              { headers: { 'Accept-Language': 'en-US,en' } }
            );
            const data = await res.json();
            const newAddr: string = data.display_name ?? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
            const short = newAddr.split(',').slice(0, 4).join(',');
            setQuery(short);
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

  // ── Nominatim autocomplete ───────────────────────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const encoded = encodeURIComponent(query + ', Cagayan de Oro, Philippines');
        const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&countrycodes=ph&limit=6`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en-US,en' } });
        const data: Prediction[] = await res.json();
        setPredictions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setPredictions([]);
      }
      setIsSearching(false);
    }, 650);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (p: Prediction) => {
    const short = p.display_name.split(',').slice(0, 4).join(',');
    setQuery(short);
    setShowDropdown(false);
    applyLocation(parseFloat(p.lat), parseFloat(p.lon), p.display_name);
  };

  return (
    <div className="space-y-3">
      {/* ── Address search ─────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: '#3D2010' }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="Type your address in CDO (e.g. Limketkai Drive, Nazareth)..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: hasError ? '#e53e3e' : 'rgba(61,32,16,0.2)',
              backgroundColor: hasError ? '#fff5f5' : '#FAFAFA',
              color: '#3D2010',
            }}
          />
          {isSearching && (
            <Loader2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
              style={{ color: '#b88917' }}
            />
          )}
        </div>

        {/* Predictions dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-xl shadow-2xl border overflow-hidden"
            style={{ backgroundColor: '#fff', borderColor: 'rgba(61,32,16,0.15)' }}
          >
            {predictions.map(p => (
              <button
                key={p.place_id}
                type="button"
                onMouseDown={() => handleSelect(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-amber-50 flex items-start gap-2 border-b last:border-0 transition-colors"
                style={{ borderColor: 'rgba(61,32,16,0.06)' }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
                <span className="text-xs leading-snug line-clamp-2" style={{ color: '#3D2010' }}>
                  {p.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {hasError && errorMsg && (
        <p className="flex items-center gap-1 text-xs" style={{ color: '#e53e3e' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
        </p>
      )}

      {/* ── Map container ──────────────────────────────────────────────────── */}
      <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(61,32,16,0.15)' }}>
        <div ref={mapContainerRef} style={{ height: 270, width: '100%' }} />

        {/* Overlay hint when no pin is set */}
        {!pinSet && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-end pb-5 gap-1.5 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(250,245,238,0.9) 0%, transparent 50%)' }}
          >
            <Navigation2 className="w-5 h-5" style={{ color: '#b88917' }} />
            <p className="text-xs font-semibold" style={{ color: '#3D2010' }}>
              Search your address above to drop the pin
            </p>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: '#9C7A5A' }}>
        Drag the amber pin to fine-tune your exact delivery location.
      </p>

      {/* ── Result chip ────────────────────────────────────────────────────── */}
      {selectedAddress && (
        <div
          className="rounded-xl p-3.5 flex items-start gap-3"
          style={{ backgroundColor: '#FFF8EC', border: '1.5px solid rgba(184,137,23,0.3)' }}
        >
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-snug mb-1.5" style={{ color: '#3D2010' }}>
              {selectedAddress.split(',').slice(0, 4).join(', ')}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(61,32,16,0.08)', color: '#3D2010' }}
              >
                {distKm} km from store
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: '#b88917', color: '#fff' }}
              >
                Delivery Fee: ₱{fee}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
