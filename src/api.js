// ─── src/api.js ───────────────────────────────────────────────────────────────
// API utility functions for EuroMove (does NOT modify App.jsx)
//
//   searchLocations(query)                         → Nominatim geocoding
//   searchRoutes(fromLat, fromLon, toLat, toLon,   → Transitous / MOTIS routing
//                date, time)

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────
const NOMINATIM_URL  = 'https://nominatim.openstreetmap.org/search';
const TRANSITOUS_URL = 'https://api.transitous.org/api/v1/plan';

// ─── SHARED CONFIG ────────────────────────────────────────────────────────────
const TIMEOUT_MS    = 8_000;   // abort any request after 8 s
const DEBOUNCE_MS   = 300;     // wait 300 ms of silence before firing Nominatim
const RATE_LIMIT_MS = 1_000;   // Nominatim ToS: ≤ 1 request / second

const HEADERS = {
  'User-Agent': 'EuroMove-Prototype/1.0',
  'Accept':     'application/json',
};

// ─── LOOKUP TABLES ────────────────────────────────────────────────────────────

/** ISO 3166-1 alpha-2 → flag emoji */
const COUNTRY_EMOJI = {
  de: '🇩🇪', fr: '🇫🇷', it: '🇮🇹', nl: '🇳🇱',
  cz: '🇨🇿', be: '🇧🇪', at: '🇦🇹', ch: '🇨🇭',
  es: '🇪🇸', pl: '🇵🇱', hu: '🇭🇺', sk: '🇸🇰',
  pt: '🇵🇹', dk: '🇩🇰', se: '🇸🇪', no: '🇳🇴',
};

/** MOTIS / GTFS mode string → EuroMove leg type */
const MODE_TO_TYPE = {
  RAIL:           'rail',
  HIGHSPEED_RAIL: 'rail',
  INTERCITY_RAIL: 'rail',
  COMMUTER_RAIL:  'rail',
  BUS:            'bus',
  COACH:          'bus',
  FERRY:          'bus',
  SUBWAY:         'metro',
  TRAM:           'metro',
  CABLE_CAR:      'metro',
  GONDOLA:        'metro',
  WALK:           'walk',
};

/**
 * Agency name (lowercase) → our OPERATORS key.
 * Falls back to null → caller renders a generic badge.
 */
const AGENCY_TO_OP = {
  'deutsche bahn':       'db',
  'db fernverkehr':      'db',
  'db':                  'db',
  'sncf':                'sncf',
  'sncf voyageurs':      'sncf',
  'trenitalia':          'trit',
  'trenord':             'trenord',
  'trenord lombardia':   'trenord',
  'flixbus':             'flix',
  'flixbus/flixtrain':   'flix',
  'thalys':              'thal',
  'eurostar':            'thal',
  'bvg':                 'bvg',
  'ratp':                'ratp',
  'atm':                 'atm',
  'atm milano':          'atm',
  'gvb':                 'gvb',
  'české dráhy':         'cd',
  'cd':                  'cd',
  'nmbs':                'nmbs',
  'sncb':                'nmbs',
  'italo':               'italo',
  'italo ntv':           'italo',
  'mvg':                 'mvg',
  'münchner verkehrsgesellschaft': 'mvg',
  'öbb':                 'obb',
  'oebb':                'obb',
  'ns':                  'ns',
  'ns dutch railways':   'ns',
};

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

/**
 * fetch() wrapped with an AbortController timeout.
 * Throws DOMException with name 'AbortError' on timeout.
 */
async function fetchWithTimeout(url, options = {}) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Format a Unix-millisecond timestamp (or anything new Date() accepts)
 * to 'HH:MM'.
 */
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 5);
}

/** Resolve agency name → our operator id, or null. */
function resolveOperator(agencyName = '') {
  return AGENCY_TO_OP[agencyName.toLowerCase().trim()] ?? null;
}

// ─── 1. NOMINATIM GEOCODING ───────────────────────────────────────────────────

let _debounceTimer   = null;
let _lastNominatimTs = 0;

/**
 * Search for locations using the Nominatim OSM geocoding API.
 *
 * Debounced (300 ms) so it is safe to call on every keystroke.
 * Rate-limited to ≤ 1 request / second as required by the Nominatim ToS.
 *
 * @param   {string} query  User-typed search string (min 2 chars)
 * @returns {Promise<{ data: Array<{
 *   id: string, label: string, short: string,
 *   lat: number, lon: number,
 *   type: string, city: string, country: string, emoji: string
 * }>, error: string|null }>}
 */
export function searchLocations(query) {
  return new Promise((resolve) => {
    // Cancel any previously scheduled request
    if (_debounceTimer) clearTimeout(_debounceTimer);

    if (!query || query.trim().length < 2) {
      return resolve({ data: [], error: null });
    }

    _debounceTimer = setTimeout(async () => {
      // Enforce ≤ 1 req/sec
      const gap = RATE_LIMIT_MS - (Date.now() - _lastNominatimTs);
      if (gap > 0) await new Promise(r => setTimeout(r, gap));
      _lastNominatimTs = Date.now();

      try {
        const params = new URLSearchParams({
          q:              query.trim(),
          format:         'json',
          addressdetails: '1',
          limit:          '6',
          countrycodes:   'de,fr,it,nl,cz,be,at',
        });

        const res = await fetchWithTimeout(`${NOMINATIM_URL}?${params}`, {
          headers: HEADERS,
        });

        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

        const json = await res.json();

        const data = json.map((item, i) => {
          const addr        = item.address || {};
          const countryCode = (addr.country_code || '').toLowerCase();
          const city        =
            addr.city   || addr.town || addr.village ||
            addr.municipality || addr.county || '';

          // First token of display_name is usually the place name
          const placeName   = item.display_name.split(',')[0].trim();
          const short       = city ? `${placeName}, ${city}` : placeName;

          return {
            id:      `nom-${item.place_id ?? i}`,
            label:   item.display_name,
            short,
            lat:     parseFloat(item.lat),
            lon:     parseFloat(item.lon),
            type:    item.type || item.class || 'place',
            city,
            country: countryCode,
            emoji:   COUNTRY_EMOJI[countryCode] ?? '📍',
          };
        });

        resolve({ data, error: null });
      } catch (err) {
        const error =
          err.name === 'AbortError'
            ? 'Location search timed out (8 s)'
            : err.message || 'Location search failed';
        resolve({ data: [], error });
      }
    }, DEBOUNCE_MS);
  });
}

// ─── 2. TRANSITOUS / MOTIS ROUTING ───────────────────────────────────────────

/**
 * Search for journeys using the Transitous MOTIS routing API.
 *
 * @param   {number} fromLat
 * @param   {number} fromLon
 * @param   {number} toLat
 * @param   {number} toLon
 * @param   {string} date   'YYYY-MM-DD'
 * @param   {string} time   'HH:MM'
 * @returns {Promise<{ data: Array<{
 *   id: string, origin: string, destination: string,
 *   label: string, legs: Array, totalDur: number,
 *   totalPrice: null, transfers: number, isLive: boolean
 * }>, error: string|null }>}
 */
export async function searchRoutes(fromLat, fromLon, toLat, toLon, date, time) {
  try {
    const params = new URLSearchParams({
      fromPlace: `${fromLat},${fromLon}`,
      toPlace:   `${toLat},${toLon}`,
      date,
      time,
    });

    const res = await fetchWithTimeout(`${TRANSITOUS_URL}?${params}`, {
      headers: HEADERS,
    });

    if (!res.ok) throw new Error(`Transitous HTTP ${res.status}`);

    const json = await res.json();

    // MOTIS may nest itineraries under plan.itineraries or at top level
    const itineraries =
      json?.plan?.itineraries ??
      json?.itineraries        ??
      [];

    const data = itineraries.map((itin, idx) => {
      const allLegs     = itin.legs ?? [];
      const transitLegs = allLegs.filter(l => l.mode !== 'WALK');
      // Use transit-only legs for display; fall back to all legs if walk-only
      const displayLegs = transitLegs.length > 0 ? transitLegs : allLegs;

      // Total duration: first dep → last arr (ms → minutes)
      const firstDep   = allLegs[0]?.startTime;
      const lastArr    = allLegs[allLegs.length - 1]?.endTime;
      const totalDur   =
        firstDep && lastArr
          ? Math.round((lastArr - firstDep) / 60_000)
          : Math.round((itin.duration ?? 0) / 60);

      const legs = displayLegs.map((leg) => {
        const opId  = resolveOperator(leg.agencyName);
        const type  = MODE_TO_TYPE[leg.mode] ?? 'rail';

        // Build vehicle string from routeShortName + headsign
        const vehicle = [leg.routeShortName, leg.tripHeadsign]
          .filter(Boolean)
          .join(' ') || leg.mode || 'Service';

        return {
          // Our standard leg fields
          operator: opId ?? 'generic',
          vehicle,
          type,
          from:     leg.from?.name ?? 'Departure',
          to:       leg.to?.name   ?? 'Arrival',
          dep:      fmtTime(leg.startTime),
          arr:      fmtTime(leg.endTime),
          dur:      Math.round((leg.endTime - leg.startTime) / 60_000),
          platform: leg.from?.stopCode ?? '',

          // Extra fields available from live API (not in mock routes)
          agencyName: leg.agencyName ?? '',
          fromCoords: leg.from?.lat != null
            ? [leg.from.lat, leg.from.lon] : null,
          toCoords:   leg.to?.lat != null
            ? [leg.to.lat, leg.to.lon]   : null,
          geometry:   leg.legGeometry?.points ?? null, // encoded polyline
        };
      });

      // Human-readable label for the result card
      const LABELS = ['Fastest', 'Alternative', 'Budget'];
      const label  = LABELS[idx] ?? `Option ${idx + 1}`;

      return {
        id:          `live-${idx}-${Date.now()}`,
        origin:      allLegs[0]?.from?.name                      ?? 'Origin',
        destination: allLegs[allLegs.length - 1]?.to?.name       ?? 'Destination',
        label,
        legs,
        totalDur,
        totalPrice:  null,   // Transitous does not provide fare data
        transfers:   Math.max(0, transitLegs.length - 1),
        isLive:      true,   // distinguishes from mock ROUTES in App.jsx
      };
    });

    return { data, error: null };
  } catch (err) {
    const error =
      err.name === 'AbortError'
        ? 'Route search timed out (8 s)'
        : err.message || 'Route search failed';
    return { data: [], error };
  }
}
