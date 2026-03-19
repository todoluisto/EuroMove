import { useState, useEffect, useReducer } from 'react';
import {
  Train, Bus, MapPin, Clock, CreditCard, Search, Home, Ticket,
  User, Map, AlertTriangle, ChevronRight, ArrowRight,
  Check, Plus, Minus, X, ChevronDown, ChevronUp, Navigation,
  Shuffle, RotateCcw,
} from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary: '#003366',
  accent: '#F5A623',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#1A1A2E',
  muted: '#6B7280',
  border: '#E5E7EB',
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const OPERATORS = {
  db:    { id: 'db',    name: 'DB',         fullName: 'Deutsche Bahn',  color: '#E30614', type: 'rail'  },
  sncf:  { id: 'sncf',  name: 'SNCF',       fullName: 'SNCF',           color: '#C0001B', type: 'rail'  },
  trit:  { id: 'trit',  name: 'Trenitalia', fullName: 'Trenitalia',     color: '#006940', type: 'rail'  },
  flix:  { id: 'flix',  name: 'FlixBus',    fullName: 'FlixBus',        color: '#73D700', type: 'bus'   },
  thal:  { id: 'thal',  name: 'Thalys',     fullName: 'Thalys',         color: '#E2001A', type: 'rail'  },
  bvg:   { id: 'bvg',   name: 'BVG',        fullName: 'BVG Berlin',     color: '#FFCC00', type: 'metro' },
  ratp:  { id: 'ratp',  name: 'RATP',       fullName: 'RATP Paris',     color: '#0064B0', type: 'metro' },
  atm:   { id: 'atm',   name: 'ATM',        fullName: 'ATM Milan',      color: '#D52B1E', type: 'metro' },
  gvb:   { id: 'gvb',   name: 'GVB',        fullName: 'GVB Amsterdam',  color: '#00A0DE', type: 'metro' },
  cd:    { id: 'cd',    name: 'ČD',         fullName: 'České dráhy',    color: '#003D7E', type: 'rail'  },
  nmbs:  { id: 'nmbs',  name: 'NMBS',       fullName: 'NMBS Belgium',   color: '#0070C0', type: 'rail'  },
  italo: { id: 'italo', name: 'Italo',      fullName: 'Italo NTV',      color: '#E4003B', type: 'rail'  },
};

const CITIES = [
  { id: 'berlin',    name: 'Berlin',    country: 'DE', emoji: '🇩🇪', transitPass: { name: 'BVG Day Pass',          price: 9.00, op: 'bvg'  } },
  { id: 'paris',     name: 'Paris',     country: 'FR', emoji: '🇫🇷', transitPass: { name: 'Paris Metro Day Pass',  price: 3.50, op: 'ratp' } },
  { id: 'milan',     name: 'Milan',     country: 'IT', emoji: '🇮🇹', transitPass: { name: 'ATM Day Pass',          price: 4.50, op: 'atm'  } },
  { id: 'amsterdam', name: 'Amsterdam', country: 'NL', emoji: '🇳🇱', transitPass: { name: 'GVB Day Pass',          price: 8.00, op: 'gvb'  } },
  { id: 'prague',    name: 'Prague',    country: 'CZ', emoji: '🇨🇿', transitPass: { name: 'Prague Metro Day',      price: 3.00, op: 'cd'   } },
  { id: 'brussels',  name: 'Brussels',  country: 'BE', emoji: '🇧🇪', transitPass: { name: 'STIB Day Pass',         price: 5.00, op: 'nmbs' } },
  { id: 'rome',      name: 'Rome',      country: 'IT', emoji: '🇮🇹', transitPass: { name: 'ATAC Day Pass',         price: 4.00, op: 'trit' } },
  { id: 'lyon',      name: 'Lyon',      country: 'FR', emoji: '🇫🇷', transitPass: { name: 'TCL Day Pass',          price: 3.00, op: 'sncf' } },
];

const getCityById  = (id)   => CITIES.find(c => c.id === id);
const getCityByName = (name) => CITIES.find(c => c.name.toLowerCase() === name?.toLowerCase());

const ROUTES = [
  // Berlin → Paris
  { id:'r1', origin:'berlin', destination:'paris', label:'Fastest', tags:['fastest'],
    legs:[
      { operator:'db',   vehicle:'ICE 573',    type:'rail', from:'Berlin Hbf',    to:'Frankfurt Hbf', dep:'07:00', arr:'11:00', dur:240, platform:'7'  },
      { operator:'sncf', vehicle:'TGV 9561',   type:'rail', from:'Frankfurt Hbf', to:'Paris GdE',     dep:'11:47', arr:'15:30', dur:223, platform:'12' },
    ], totalDur:510, totalPrice:89,  transfers:1 },
  { id:'r2', origin:'berlin', destination:'paris', label:'Cheapest', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 421',type:'bus',  from:'Berlin ZOB',   to:'Paris Bercy',    dep:'22:00', arr:'09:30', dur:690, platform:'Bay 4' },
    ], totalDur:690, totalPrice:29,  transfers:0 },
  { id:'r3', origin:'berlin', destination:'paris', label:'Via Cologne', tags:['fewest'],
    legs:[
      { operator:'db',   vehicle:'EC 175',     type:'rail', from:'Berlin Hbf',   to:'Cologne Hbf',   dep:'09:30', arr:'13:10', dur:220, platform:'3' },
      { operator:'thal', vehicle:'Thalys 9431',type:'rail', from:'Cologne Hbf',  to:'Paris Nord',    dep:'14:20', arr:'17:30', dur:190, platform:'8' },
    ], totalDur:480, totalPrice:109, transfers:1 },
  // Amsterdam → Brussels
  { id:'r4', origin:'amsterdam', destination:'brussels', label:'Thalys', tags:['fastest','fewest'],
    legs:[
      { operator:'thal', vehicle:'Thalys 9301',type:'rail', from:'Amsterdam CS',        to:'Brussels Midi',   dep:'10:20', arr:'12:17', dur:117, platform:'15' },
    ], totalDur:117, totalPrice:49, transfers:0 },
  { id:'r5', origin:'amsterdam', destination:'brussels', label:'Budget', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 210',type:'bus',  from:'Amsterdam Sloterdijk', to:'Brussels Nord',  dep:'09:00', arr:'12:45', dur:225, platform:'Bay 2' },
    ], totalDur:225, totalPrice:15, transfers:0 },
  // Milan → Rome
  { id:'r6', origin:'milan', destination:'rome', label:'Frecciarossa', tags:['fastest','fewest'],
    legs:[
      { operator:'trit', vehicle:'FR 9539',    type:'rail', from:'Milano Centrale', to:'Roma Termini', dep:'08:00', arr:'10:55', dur:175, platform:'9'  },
    ], totalDur:175, totalPrice:59, transfers:0 },
  { id:'r7', origin:'milan', destination:'rome', label:'Cheapest', tags:['cheapest'],
    legs:[
      { operator:'italo',vehicle:'Italo 9935', type:'rail', from:'Milano Centrale', to:'Roma Termini', dep:'13:00', arr:'16:10', dur:190, platform:'11' },
    ], totalDur:190, totalPrice:39, transfers:0 },
  // Paris → Lyon
  { id:'r8', origin:'paris', destination:'lyon', label:'TGV Direct', tags:['fastest','fewest'],
    legs:[
      { operator:'sncf', vehicle:'TGV 6611',   type:'rail', from:'Paris GdL',    to:'Lyon Part-Dieu', dep:'07:04', arr:'09:02', dur:118, platform:'6' },
    ], totalDur:118, totalPrice:39, transfers:0 },
  { id:'r9', origin:'paris', destination:'lyon', label:'Cheapest', tags:['cheapest'],
    legs:[
      { operator:'sncf', vehicle:'TGV 6633',   type:'rail', from:'Paris GdL',    to:'Lyon Part-Dieu', dep:'09:04', arr:'11:05', dur:121, platform:'4' },
    ], totalDur:121, totalPrice:19, transfers:0 },
  // Berlin → Prague
  { id:'r10', origin:'berlin', destination:'prague', label:'EC Train', tags:['fastest','fewest'],
    legs:[
      { operator:'db',   vehicle:'EC 179',     type:'rail', from:'Berlin Hbf',   to:'Praha hl.n.',    dep:'08:00', arr:'12:30', dur:270, platform:'14' },
    ], totalDur:270, totalPrice:29, transfers:0 },
  { id:'r11', origin:'berlin', destination:'prague', label:'Budget Bus', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 312',type:'bus',  from:'Berlin ZOB',   to:'Prague Florenc', dep:'09:30', arr:'14:15', dur:285, platform:'Bay 1' },
    ], totalDur:285, totalPrice:14, transfers:0 },
];

const INSPIRATION = [
  { id:'i1', title:'Weekend in Prague',  subtitle:'Direct from Berlin',   from:'berlin',    to:'prague',   price:19,  dur:'4h 30m', gradient:'linear-gradient(135deg,#003D7E 0%,#6B7280 100%)' },
  { id:'i2', title:'Paris → Lyon',       subtitle:'TGV in 2 hours',       from:'paris',     to:'lyon',     price:19,  dur:'2h',     gradient:'linear-gradient(135deg,#C0001B 0%,#F5A623 100%)' },
  { id:'i3', title:'Milan Day Trip',     subtitle:'Frecciarossa fast',     from:'milan',     to:'rome',     price:39,  dur:'2h 55m', gradient:'linear-gradient(135deg,#006940 0%,#34C759 100%)' },
  { id:'i4', title:'Amsterdam Break',    subtitle:'via Thalys',            from:'amsterdam', to:'brussels', price:29,  dur:'2h',     gradient:'linear-gradient(135deg,#00A0DE 0%,#003366 100%)' },
  { id:'i5', title:'Berlin → Paris',     subtitle:'ICE + TGV combo',       from:'berlin',    to:'paris',    price:59,  dur:'8h 30m', gradient:'linear-gradient(135deg,#E30614 0%,#003366 100%)' },
];

const INIT_TICKETS = [
  { id:'t1', ref:'EM-2024-A1B2',
    origin:'amsterdam', destination:'brussels',
    date:'2026-03-22', depTime:'10:20', arrTime:'12:17',
    status:'upcoming',
    route: ROUTES.find(r => r.id === 'r4'),
    passengers:{ adults:1, children:0, students:0 },
    price:49, addOn:null, purchaseDate:'2026-03-15' },
  { id:'t2', ref:'EM-2024-C3D4',
    origin:'paris', destination:'lyon',
    date:'2026-03-10', depTime:'07:04', arrTime:'09:02',
    status:'completed',
    route: ROUTES.find(r => r.id === 'r8'),
    passengers:{ adults:2, children:0, students:0 },
    price:78, addOn:null, purchaseDate:'2026-03-05' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDur = mins => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const transferMins = (leg1, leg2) => {
  const [h1, m1] = leg1.arr.split(':').map(Number);
  const [h2, m2] = leg2.dep.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const OperatorBadge = ({ opId }) => {
  const op = OPERATORS[opId];
  if (!op) return null;
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold"
      style={{ background: op.color + '20', color: op.color, border: `1px solid ${op.color}40` }}>
      {op.name}
    </span>
  );
};

const JourneyBar = ({ legs, totalDur }) => (
  <div className="flex rounded-full overflow-hidden h-2.5 w-full gap-px">
    {legs.map((leg, i) => (
      <div key={i} style={{ background: OPERATORS[leg.operator]?.color || '#999', flex: leg.dur / totalDur }} />
    ))}
  </div>
);

const VehicleIcon = ({ type, size = 16 }) =>
  type === 'bus' ? <Bus size={size} /> : <Train size={size} />;

const StatusBadge = ({ status }) => {
  const cfg = { upcoming:['#003366','Upcoming'], active:['#34C759','Active'], completed:['#6B7280','Completed'] };
  const [bg, label] = cfg[status] || cfg.completed;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: bg }}>{label}</span>;
};

// Deterministic mock QR code
const MockQR = ({ value }) => {
  const S = 11, CS = 18;
  const hash = (r, c) => Math.abs(Math.sin(value.charCodeAt(0) * 7 + r * 17 + c * 31)) > 0.45;
  const cells = [];
  for (let r = 0; r < S; r++) {
    for (let c = 0; c < S; c++) {
      const inTL = r < 3 && c < 3;
      const inTR = r < 3 && c >= S - 3;
      const inBL = r >= S - 3 && c < 3;
      const inCorner = inTL || inTR || inBL;
      let filled;
      if (inCorner) {
        const lr = inTL ? r : inTR ? r : r - (S - 3);
        const lc = inTL ? c : inTR ? c - (S - 3) : c;
        filled = lr === 0 || lr === 2 || lc === 0 || lc === 2 || (lr === 1 && lc === 1);
      } else {
        filled = hash(r, c);
      }
      cells.push({ r, c, filled });
    }
  }
  return (
    <svg width={S * CS} height={S * CS} viewBox={`0 0 ${S * CS} ${S * CS}`}>
      <rect width={S * CS} height={S * CS} fill="white" rx="4" />
      {cells.map(({ r, c, filled }) =>
        filled ? <rect key={`${r}-${c}`} x={c * CS + 1} y={r * CS + 1} width={CS - 2} height={CS - 2} rx="2" fill="#1A1A2E" /> : null
      )}
    </svg>
  );
};

// ─── SCREEN: HOME ─────────────────────────────────────────────────────────────
function HomeScreen({ appState, dispatch }) {
  const { mode } = appState;
  const [fromVal, setFromVal] = useState('');
  const [toVal,   setToVal]   = useState('');
  const [fromSug, setFromSug] = useState([]);
  const [toSug,   setToSug]   = useState([]);

  const suggest = val => val.length < 1 ? [] : CITIES.filter(c => c.name.toLowerCase().startsWith(val.toLowerCase()));

  const doSearch = (from, to) => {
    if (!from || !to) return;
    dispatch({ type: 'SEARCH', from, to });
  };

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      {/* Header */}
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-6 rounded-b-3xl">
        <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs mb-1">Good morning 👋</p>
        <h1 className="text-white text-xl font-bold mb-4">Where to next?</h1>

        {/* Mode Toggle */}
        <div className="flex rounded-xl p-1 mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {[['intercity','🌍 Intercity'],['incity','🏙️ In-City']].map(([m, lbl]) => (
            <button key={m} onClick={() => dispatch({ type:'SET_MODE', mode:m })}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={mode === m ? { background: C.accent, color: C.primary } : { color: 'rgba(255,255,255,0.7)' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl p-3 space-y-2 shadow-lg relative" style={{ zIndex: 10 }}>
          {/* From */}
          <div className="relative" style={{ zIndex: 20 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.bg }}>
              <div className="w-2 h-2 rounded-full border-2 flex-shrink-0" style={{ borderColor: C.primary }} />
              <input className="flex-1 text-sm outline-none bg-transparent" style={{ color: C.text }}
                placeholder={mode === 'incity' ? 'Your location' : 'From city or station'}
                value={fromVal}
                onChange={e => { setFromVal(e.target.value); setFromSug(suggest(e.target.value)); }} />
              {fromVal && <button onClick={() => { setFromVal(''); setFromSug([]); }}><X size={14} color={C.muted} /></button>}
            </div>
            {fromSug.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden" style={{ borderColor: C.border, zIndex: 30 }}>
                {fromSug.map(c => (
                  <button key={c.id} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2"
                    style={{ ':hover': { background: C.bg } }}
                    onClick={() => { setFromVal(c.name); setFromSug([]); }}>
                    <span>{c.emoji}</span><span style={{ color: C.text }}>{c.name}</span>
                    <span className="text-xs ml-auto" style={{ color: C.muted }}>{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap */}
          <div className="flex items-center gap-2 px-3">
            <div className="flex-1 h-px" style={{ background: C.border }} />
            <button onClick={() => { const t = fromVal; setFromVal(toVal); setToVal(t); }}
              className="w-7 h-7 rounded-full flex items-center justify-center shadow"
              style={{ background: C.primary }}>
              <Shuffle size={12} color="white" />
            </button>
            <div className="flex-1 h-px" style={{ background: C.border }} />
          </div>

          {/* To */}
          <div className="relative" style={{ zIndex: 19 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.bg }}>
              <MapPin size={14} color={C.accent} className="flex-shrink-0" />
              <input className="flex-1 text-sm outline-none bg-transparent" style={{ color: C.text }}
                placeholder={mode === 'incity' ? 'Destination stop' : 'To city or station'}
                value={toVal}
                onChange={e => { setToVal(e.target.value); setToSug(suggest(e.target.value)); }} />
              {toVal && <button onClick={() => { setToVal(''); setToSug([]); }}><X size={14} color={C.muted} /></button>}
            </div>
            {toSug.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden" style={{ borderColor: C.border, zIndex: 29 }}>
                {toSug.map(c => (
                  <button key={c.id} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2"
                    onClick={() => { setToVal(c.name); setToSug([]); }}>
                    <span>{c.emoji}</span><span style={{ color: C.text }}>{c.name}</span>
                    <span className="text-xs ml-auto" style={{ color: C.muted }}>{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => doSearch(fromVal, toVal)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
            style={{ background: (fromVal && toVal) ? C.accent : C.border, color: (fromVal && toVal) ? C.primary : C.muted }}>
            <Search size={16} /> Search routes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-5 space-y-5">
        {/* Inspiration */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: C.text }}>Trip ideas ✨</h2>
            <span className="text-xs font-medium" style={{ color: C.accent }}>See all</span>
          </div>
          <div className="flex gap-3 scroll-x -mx-4 px-4 pb-1">
            {INSPIRATION.map(card => (
              <button key={card.id} onClick={() => dispatch({ type:'SEARCH', from: getCityById(card.from)?.name, to: getCityById(card.to)?.name })}
                className="flex-shrink-0 w-44 rounded-2xl overflow-hidden shadow text-left">
                <div className="h-24 flex items-end p-3" style={{ background: card.gradient }}>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{card.title}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{card.subtitle}</p>
                  </div>
                </div>
                <div className="bg-white px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: C.primary }}>from €{card.price}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{card.dur}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent trips */}
        <div>
          <h2 className="font-bold text-base mb-3" style={{ color: C.text }}>Recent trips</h2>
          {[
            { from:'Paris',     to:'Lyon',     date:'Mar 10', price:'€39' },
            { from:'Amsterdam', to:'Brussels', date:'Mar 5',  price:'€49' },
          ].map((trip, i) => (
            <div key={i} className="bg-white rounded-2xl px-4 py-3 mb-2 flex items-center justify-between"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primary + '15' }}>
                  <Train size={14} color={C.primary} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{trip.from} → {trip.to}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{trip.date} · {trip.price}</p>
                </div>
              </div>
              <button onClick={() => dispatch({ type:'SEARCH', from: trip.from, to: trip.to })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: C.primary + '10', color: C.primary }}>
                <RotateCcw size={11} /> Rebook
              </button>
            </div>
          ))}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ─── SCREEN: SEARCH RESULTS ───────────────────────────────────────────────────
function ResultsScreen({ appState, dispatch }) {
  const [filter, setFilter] = useState('fastest');
  const [expanded, setExpanded] = useState(null);
  const { searchFrom, searchTo } = appState;

  const fromCity = getCityByName(searchFrom);
  const toCity   = getCityByName(searchTo);
  const allRoutes = ROUTES.filter(r => r.origin === fromCity?.id && r.destination === toCity?.id);

  const sorted = [...allRoutes].sort((a, b) => {
    if (filter === 'fastest')  return a.totalDur   - b.totalDur;
    if (filter === 'cheapest') return a.totalPrice - b.totalPrice;
    return a.transfers - b.transfers;
  });

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-4 rounded-b-3xl">
        <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> Back
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-white font-bold text-lg">{searchFrom}</h1>
          <ArrowRight size={16} color="rgba(255,255,255,0.6)" />
          <h1 className="text-white font-bold text-lg">{searchTo}</h1>
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{allRoutes.length} routes · Today</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3">
        {[['fastest','⚡ Fastest'],['cheapest','💶 Cheapest'],['fewest','↔️ Transfers']].map(([k,lbl]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={filter === k
              ? { background: C.primary, color: 'white' }
              : { background: 'white', color: C.muted, border: `1px solid ${C.border}` }}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 space-y-3 pb-4">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Train size={40} color={C.muted} />
            <p className="mt-3 font-semibold" style={{ color: C.text }}>No routes found</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>Try searching different cities</p>
            <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.primary }}>
              New search
            </button>
          </div>
        )}

        {sorted.map((route, i) => {
          const isExp = expanded === route.id;
          const first = route.legs[0];
          const last  = route.legs[route.legs.length - 1];
          return (
            <div key={route.id} className="bg-white rounded-2xl overflow-hidden fade-in"
              style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)', animationDelay:`${i*0.05}s` }}>
              <button className="w-full text-left p-4" onClick={() => setExpanded(isExp ? null : route.id)}>
                {/* Times */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold" style={{ color: C.text }}>{first.dep}</span>
                    <span className="text-sm mx-2" style={{ color: C.muted }}>→</span>
                    <span className="text-lg font-bold" style={{ color: C.text }}>{last.arr}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: C.accent }}>€{route.totalPrice}</span>
                </div>
                {/* Bar */}
                <JourneyBar legs={route.legs} totalDur={route.totalDur} />
                {/* Meta */}
                <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock size={12} color={C.muted} />
                    <span className="text-xs" style={{ color: C.muted }}>{fmtDur(route.totalDur)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shuffle size={12} color={C.muted} />
                    <span className="text-xs" style={{ color: C.muted }}>{route.transfers === 0 ? 'Direct' : `${route.transfers} transfer`}</span>
                  </div>
                  {route.legs.map((l,j) => <OperatorBadge key={j} opId={l.operator} />)}
                  {route.label && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: C.accent + '20', color: C.accent }}>{route.label}</span>
                  )}
                </div>
              </button>

              {/* Expanded legs */}
              {isExp && (
                <div className="border-t px-4 pb-3" style={{ borderColor: C.border }}>
                  {route.legs.map((leg, j) => (
                    <div key={j}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: OPERATORS[leg.operator].color + '20' }}>
                          <VehicleIcon type={leg.type} size={13} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold" style={{ color: C.text }}>{leg.from}</span>
                            <ArrowRight size={11} color={C.muted} />
                            <span className="text-xs font-bold" style={{ color: C.text }}>{leg.to}</span>
                          </div>
                          <p className="text-xs" style={{ color: C.muted }}>{OPERATORS[leg.operator].fullName} · {leg.vehicle} · Plat. {leg.platform}</p>
                          <p className="text-xs" style={{ color: C.muted }}>{leg.dep}–{leg.arr} · {fmtDur(leg.dur)}</p>
                        </div>
                        <OperatorBadge opId={leg.operator} />
                      </div>
                      {j < route.legs.length - 1 && (
                        <div className="flex items-center gap-2 ml-10 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.muted }} />
                          <span className="text-xs" style={{ color: C.muted }}>
                            {transferMins(route.legs[j], route.legs[j+1])} min transfer at {leg.to}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => dispatch({ type:'SELECT_ROUTE', route })}
                    className="w-full mt-2 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
                    style={{ background: C.primary }}>
                    See journey details <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {!isExp && (
                <button onClick={() => dispatch({ type:'SELECT_ROUTE', route })}
                  className="w-full border-t py-3 text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ borderColor: C.border, color: C.primary }}>
                  View details <ChevronRight size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN: JOURNEY DETAIL ───────────────────────────────────────────────────
function DetailScreen({ appState, dispatch }) {
  const [addOn, setAddOn] = useState(false);
  const { selectedRoute, searchFrom, searchTo } = appState;
  const route = selectedRoute;
  if (!route) return null;

  const destCity   = getCityByName(searchTo);
  const transitPass = destCity?.transitPass;
  const total = route.totalPrice + (addOn && transitPass ? transitPass.price : 0);

  return (
    <div className="flex flex-col flex-1 pb-28 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-5 rounded-b-3xl">
        <button onClick={() => dispatch({ type:'GOTO', screen:'results' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> Back to results
        </button>
        <h1 className="text-white font-bold text-lg">{searchFrom} → {searchTo}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtDur(route.totalDur)}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{route.transfers === 0 ? 'Direct' : `${route.transfers} transfer`}</span>
          <span className="text-lg font-bold text-white ml-auto">€{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4 space-y-3">
        {route.legs.map((leg, i) => {
          const op   = OPERATORS[leg.operator];
          const tight = i < route.legs.length - 1 && transferMins(route.legs[i], route.legs[i+1]) < 10;
          return (
            <div key={i}>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: op.color }}>
                      <VehicleIcon type={leg.type} size={14} />
                    </div>
                    <div className="w-0.5 h-8 rounded" style={{ background: op.color + '40' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm" style={{ color: C.text }}>{leg.dep} · {leg.from}</span>
                      <OperatorBadge opId={leg.operator} />
                    </div>
                    <p className="text-xs mb-1" style={{ color: C.muted }}>{op.fullName} · {leg.vehicle}</p>
                    <p className="text-xs" style={{ color: C.muted }}>Platform {leg.platform} · {fmtDur(leg.dur)}</p>
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: C.border }}>
                      <span className="font-bold text-sm" style={{ color: C.text }}>{leg.arr} · {leg.to}</span>
                    </div>
                  </div>
                </div>
              </div>
              {i < route.legs.length - 1 && (
                <div className={`mx-4 my-1 px-3 py-2 rounded-xl flex items-center gap-2 ${tight ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                  {tight && <AlertTriangle size={14} color={C.warning} />}
                  <span className="text-xs font-medium" style={{ color: tight ? C.warning : C.muted }}>
                    {tight ? 'Tight connection — ' : ''}{transferMins(route.legs[i], route.legs[i+1])} min at {leg.to}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add-on */}
        {transitPass && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.accent + '20' }}>
                <Ticket size={18} color={C.accent} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: C.text }}>{transitPass.name}</p>
                <p className="text-xs" style={{ color: C.muted }}>Get around {searchTo} on arrival</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: C.accent }}>+€{transitPass.price.toFixed(2)}</span>
                <button onClick={() => setAddOn(!addOn)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: addOn ? C.success : C.border }}>
                  {addOn ? <Check size={14} color="white" /> : <Plus size={14} color={C.muted} />}
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-2" style={{ zIndex: 10 }}>
        <div className="bg-white rounded-2xl p-3 shadow-xl border" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: C.muted }}>Total</span>
            <span className="text-xl font-bold" style={{ color: C.text }}>€{total.toFixed(2)}</span>
          </div>
          <button onClick={() => dispatch({ type:'START_CHECKOUT', price: total, addOn: addOn ? transitPass : null })}
            className="w-full py-3.5 rounded-xl text-base font-bold"
            style={{ background: C.accent, color: C.primary }}>
            Book this journey
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: CHECKOUT ─────────────────────────────────────────────────────────
function CheckoutScreen({ appState, dispatch }) {
  const { checkoutStep, checkoutPrice, checkoutAddOn, selectedRoute } = appState;
  const [pax, setPax] = useState({ adults:1, children:0, students:0 });
  const route = selectedRoute;

  const totalPax  = pax.adults + pax.children + pax.students;
  const finalPrice = ((checkoutPrice || 0) * (totalPax || 1)).toFixed(2);
  const bookingRef = 'EM-' + Math.random().toString(36).toUpperCase().slice(2, 10);

  const PaxRow = ({ label, sub, field }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: C.border }}>
      <div>
        <p className="text-sm font-medium" style={{ color: C.text }}>{label}</p>
        <p className="text-xs" style={{ color: C.muted }}>{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setPax(p => ({ ...p, [field]: Math.max(0, p[field] - 1) }))}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.border }}>
          <Minus size={14} />
        </button>
        <span className="w-5 text-center font-bold text-sm" style={{ color: C.text }}>{pax[field]}</span>
        <button onClick={() => setPax(p => ({ ...p, [field]: p[field] + 1 }))}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.primary }}>
          <Plus size={14} color="white" />
        </button>
      </div>
    </div>
  );

  // Confirmation step
  if (checkoutStep === 4) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center pb-20 px-6 fade-in">
        <div className="scale-in flex flex-col items-center w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: C.success }}>
            <Check size={36} color="white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Booking confirmed!</h1>
          <p className="text-sm mb-4" style={{ color: C.muted }}>Your tickets are in the wallet</p>
          <p className="font-mono text-sm font-bold px-4 py-2 rounded-xl mb-6"
            style={{ background: C.primary + '10', color: C.primary }}>{bookingRef}</p>

          <div className="bg-white w-full rounded-2xl p-4 shadow-sm mb-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
            <p className="font-semibold text-sm mb-3" style={{ color: C.text }}>Journey summary</p>
            {route?.legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: OPERATORS[leg.operator].color }} />
                <span className="text-xs flex-1" style={{ color: C.muted }}>{leg.from} → {leg.to}</span>
                <OperatorBadge opId={leg.operator} />
              </div>
            ))}
            {checkoutAddOn && (
              <div className="flex items-center gap-2 py-1.5 border-t mt-1" style={{ borderColor: C.border }}>
                <Ticket size={12} color={C.accent} />
                <span className="text-xs" style={{ color: C.muted }}>{checkoutAddOn.name}</span>
              </div>
            )}
            <div className="flex justify-between mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
              <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid</span>
              <span className="text-sm font-bold" style={{ color: C.accent }}>€{finalPrice}</span>
            </div>
          </div>

          <button onClick={() => dispatch({ type:'CONFIRM_BOOKING', ref:bookingRef, passengers:pax, price:parseFloat(finalPrice), addOn:checkoutAddOn })}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-2" style={{ background: C.primary }}>
            View ticket in wallet
          </button>
          <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
            className="w-full py-3 rounded-xl font-semibold text-sm" style={{ color: C.muted }}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Review','Passengers','Payment'];

  return (
    <div className="flex flex-col flex-1 pb-28 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-5 rounded-b-3xl">
        <button onClick={() => checkoutStep > 1 ? dispatch({ type:'PREV_STEP' }) : dispatch({ type:'GOTO', screen:'detail' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> {checkoutStep > 1 ? 'Back' : 'Back to journey'}
        </button>
        <h1 className="text-white font-bold text-xl">Checkout</h1>
        {/* Step indicators */}
        <div className="flex gap-2 mt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex-1">
              <div className="h-1 rounded-full" style={{ background: i < checkoutStep ? 'white' : 'rgba(255,255,255,0.25)' }} />
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4">
        {/* Step 1: Review */}
        {checkoutStep === 1 && (
          <div className="space-y-3 fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>Journey review</p>
              {route?.legs.map((leg, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: C.border }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: OPERATORS[leg.operator].color }}>
                    <VehicleIcon type={leg.type} size={12} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{leg.from} → {leg.to}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{OPERATORS[leg.operator].fullName} · {leg.dep}–{leg.arr}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>Price breakdown</p>
              {route?.legs.map((leg, i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <span className="text-sm" style={{ color: C.muted }}>{OPERATORS[leg.operator].name} fare</span>
                  <span className="text-sm font-medium" style={{ color: C.text }}>€{(route.totalPrice / route.legs.length).toFixed(2)}</span>
                </div>
              ))}
              {checkoutAddOn && (
                <div className="flex justify-between py-1.5">
                  <span className="text-sm" style={{ color: C.muted }}>{checkoutAddOn.name}</span>
                  <span className="text-sm font-medium" style={{ color: C.text }}>€{checkoutAddOn.price.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1 border-t" style={{ borderColor: C.border }}>
                <span className="text-sm font-bold" style={{ color: C.text }}>Total</span>
                <span className="text-base font-bold" style={{ color: C.accent }}>€{(checkoutPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Passengers */}
        {checkoutStep === 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm fade-in">
            <p className="font-bold text-sm mb-3" style={{ color: C.text }}>Passengers</p>
            <PaxRow label="Adults"   sub="Full fare"            field="adults"   />
            <PaxRow label="Children" sub="Under 15, 50% off"   field="children" />
            <PaxRow label="Students" sub="Valid ID required"    field="students" />
            <div className="mt-4 p-3 rounded-xl" style={{ background: C.primary + '08' }}>
              <p className="text-xs" style={{ color: C.muted }}>
                {totalPax} passenger{totalPax !== 1 ? 's' : ''} · Total: <strong style={{ color: C.accent }}>€{finalPrice}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {checkoutStep === 3 && (
          <div className="space-y-3 fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>Saved payment</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border-2" style={{ borderColor: C.primary }}>
                <div className="w-10 h-7 rounded flex items-center justify-center" style={{ background: '#1A1F71' }}>
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>•••• •••• •••• 4242</p>
                  <p className="text-xs" style={{ color: C.muted }}>Expires 09/27</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: C.primary }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>Or pay with</p>
              <div className="flex gap-3">
                <button className="flex-1 py-3.5 rounded-xl bg-black flex items-center justify-center gap-2 font-semibold text-sm text-white">
                  <span className="text-lg">🍎</span> Pay
                </button>
                <button className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white" style={{ background: '#4285F4' }}>
                  <span className="text-base font-bold">G</span> Pay
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Check size={14} color={C.success} />
              <p className="text-xs" style={{ color: C.muted }}>Your details are saved — one-tap checkout next time</p>
            </div>
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-2" style={{ zIndex: 10 }}>
        <div className="bg-white rounded-2xl p-3 shadow-xl border" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: C.muted }}>
              {checkoutStep === 3 ? 'Pay now' : 'Total'}
            </span>
            <span className="text-lg font-bold" style={{ color: C.text }}>€{finalPrice}</span>
          </div>
          <button onClick={() => dispatch({ type:'NEXT_STEP' })}
            className="w-full py-3.5 rounded-xl text-base font-bold"
            style={{ background: C.accent, color: C.primary }}>
            {checkoutStep === 1 ? 'Continue' : checkoutStep === 2 ? 'Continue to payment' : `Pay €${finalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: WALLET ───────────────────────────────────────────────────────────
function WalletScreen({ appState, dispatch }) {
  const { tickets } = appState;
  const [expandedId, setExpandedId] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const active = tickets.filter(t => t.status !== 'completed');
  const past   = tickets.filter(t => t.status === 'completed');

  const TicketCard = ({ ticket }) => {
    const isExp = expandedId === ticket.id;
    const orig  = getCityById(ticket.origin);
    const dest  = getCityById(ticket.destination);
    return (
      <div className="bg-white rounded-2xl overflow-hidden fade-in" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <button className="w-full text-left p-4" onClick={() => setExpandedId(isExp ? null : ticket.id)}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-base font-bold mb-1" style={{ color: C.text }}>
                {orig?.emoji} {orig?.name} → {dest?.emoji} {dest?.name}
              </p>
              <p className="text-xs" style={{ color: C.muted }}>{ticket.date} · {ticket.depTime}–{ticket.arrTime}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: C.muted }}>{ticket.ref}</p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
          {ticket.route && <JourneyBar legs={ticket.route.legs} totalDur={ticket.route.totalDur} />}
        </button>

        {isExp && (
          <div className="border-t px-4 pb-4" style={{ borderColor: C.border }}>
            <div className="flex justify-center my-4">
              <div className="p-3 bg-white rounded-2xl shadow-inner border" style={{ borderColor: C.border }}>
                <MockQR value={ticket.ref} />
                <p className="text-center text-xs mt-2 font-mono" style={{ color: C.muted }}>{ticket.ref}</p>
              </div>
            </div>
            {ticket.route?.legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: C.border }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: OPERATORS[leg.operator]?.color }} />
                <span className="text-xs flex-1" style={{ color: C.muted }}>{leg.from} → {leg.to} · {leg.dep}</span>
                <OperatorBadge opId={leg.operator} />
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
              <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid</span>
              <span className="text-sm font-bold" style={{ color: C.accent }}>€{ticket.price.toFixed(2)}</span>
            </div>
            {ticket.status === 'upcoming' && (
              <button onClick={() => dispatch({ type:'GOTO', screen:'map' })}
                className="w-full mt-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white"
                style={{ background: C.primary }}>
                <Navigation size={15} /> Track journey
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-5 rounded-b-3xl">
        <h1 className="text-white font-bold text-xl">My tickets</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{active.length} active · {past.length} past</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4 space-y-3">
        {active.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket size={40} color={C.muted} />
            <p className="mt-3 font-semibold" style={{ color: C.text }}>No active tickets</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>Book a journey to see your tickets here</p>
            <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.primary }}>
              Find a trip
            </button>
          </div>
        )}
        {active.map(t => <TicketCard key={t.id} ticket={t} />)}

        {past.length > 0 && (
          <div>
            <button onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 py-2 w-full">
              <span className="text-sm font-semibold" style={{ color: C.muted }}>Past tickets ({past.length})</span>
              {showPast ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
            </button>
            {showPast && past.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ─── SCREEN: MAP ──────────────────────────────────────────────────────────────
function MapScreen({ appState, dispatch }) {
  const [progress, setProgress] = useState(35);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 95 ? 95 : +(p + 0.3).toFixed(1)), 400);
    return () => clearInterval(t);
  }, []);

  const pct = progress / 100;

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      {/* Disruption */}
      <div className="mx-4 mt-4 p-3 rounded-2xl flex items-start gap-3"
        style={{ background:'#FFF3CD', border:'1px solid #FFE082' }}>
        <AlertTriangle size={16} color={C.warning} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold" style={{ color:'#856404' }}>12 min delay on ICE 573</p>
          <p className="text-xs" style={{ color:'#856404' }}>Connection at Frankfurt still possible</p>
        </div>
      </div>

      {/* Map */}
      <div className="relative mx-4 mt-3 rounded-3xl overflow-hidden shadow-lg" style={{ minHeight: 260, background:'linear-gradient(135deg,#e8f4f8 0%,#d4e8f0 50%,#c8e0ea 100%)' }}>
        <svg width="100%" height="260" viewBox="0 0 380 260" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {[...Array(7)].map((_,i) => <line key={`h${i}`} x1="0" y1={i*38} x2="380" y2={i*38} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />)}
          {[...Array(7)].map((_,i) => <line key={`v${i}`} x1={i*54} y1="0" x2={i*54} y2="260" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />)}
          {/* Route dashed line */}
          <line x1="60" y1="200" x2="320" y2="50" stroke={C.primary} strokeWidth="3" strokeDasharray="10 5" strokeLinecap="round" />
          {/* Completed segment */}
          <line x1="60" y1="200" x2={60 + 260 * pct} y2={200 - 150 * pct} stroke={C.success} strokeWidth="4" strokeLinecap="round" />
          {/* Origin */}
          <circle cx="60" cy="200" r="9" fill={C.primary} />
          <circle cx="60" cy="200" r="16" fill="none" stroke={C.primary} strokeWidth="2" opacity="0.3" />
          {/* Destination */}
          <circle cx="320" cy="50" r="9" fill={C.accent} />
          <circle cx="320" cy="50" r="16" fill="none" stroke={C.accent} strokeWidth="2" opacity="0.3" />
          {/* Vehicle */}
          <circle cx={60 + 260 * pct} cy={200 - 150 * pct} r="11" fill={C.success} />
          <circle cx={60 + 260 * pct} cy={200 - 150 * pct} r="18" fill="none" stroke={C.success} strokeWidth="2.5" opacity="0.4" />
          <circle cx={60 + 260 * pct} cy={200 - 150 * pct} r="5" fill="white" />
        </svg>
        {/* Labels */}
        <div className="absolute" style={{ bottom: 16, left: 72 }}>
          <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 shadow-sm">
            <p className="text-xs font-bold" style={{ color: C.primary }}>Berlin Hbf</p>
            <p className="text-xs" style={{ color: C.muted }}>Dept 07:00</p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: C.success, animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>ICE 573 — Live</span>
          </div>
          <OperatorBadge opId="db" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <p className="text-xs" style={{ color: C.muted }}>Next stop</p>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Hannover Hbf</p>
            <p className="text-xs" style={{ color: C.muted }}>in ~22 min</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: C.muted }}>Arrival</p>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Frankfurt Hbf</p>
            <p className="text-xs font-semibold" style={{ color: C.warning }}>~11:12 (+12 min)</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs" style={{ color: C.muted }}>Progress</p>
            <p className="text-xl font-bold" style={{ color: C.primary }}>{Math.round(progress)}%</p>
            <div className="w-16 h-2 rounded-full mt-1" style={{ background: C.border }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ background: C.success, width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE ──────────────────────────────────────────────────────────
function ProfileScreen({ appState, dispatch }) {
  const [prefs,  setPrefs]  = useState({ transfers:false, cheapest:false, fastest:true });
  const [notifs, setNotifs] = useState({ delays:true, promos:false, reminders:true });
  const [lang,   setLang]   = useState('English');

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-colors"
      style={{ background: value ? C.primary : C.border }}>
      <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
        style={{ left: value ? '24px' : '4px' }} />
    </button>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>{title}</p>
      {children}
    </div>
  );

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: C.border }}>
      <span className="text-sm" style={{ color: C.text }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: C.accent, color: C.primary }}>LC</div>
          <div>
            <h1 className="text-white font-bold text-lg">Luis Campos</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>luis@euromove.eu</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4 space-y-3">
        <Section title="Payment methods">
          <Row label="•••• 4242 (Visa)">
            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: C.success + '15', color: C.success }}>Default</span>
          </Row>
          <button className="flex items-center gap-2 mt-2 text-sm font-semibold" style={{ color: C.primary }}>
            <Plus size={14} /> Add payment method
          </button>
        </Section>

        <Section title="Travel preferences">
          <Row label="Prefer fewer transfers"><Toggle value={prefs.transfers} onChange={v => setPrefs(p => ({...p, transfers:v}))} /></Row>
          <Row label="Prefer cheapest route"><Toggle value={prefs.cheapest}  onChange={v => setPrefs(p => ({...p, cheapest:v}))}  /></Row>
          <Row label="Prefer fastest route"><Toggle value={prefs.fastest}   onChange={v => setPrefs(p => ({...p, fastest:v}))}   /></Row>
        </Section>

        <Section title="Notifications">
          <Row label="Delay & disruption alerts"><Toggle value={notifs.delays}     onChange={v => setNotifs(p => ({...p, delays:v}))}     /></Row>
          <Row label="Promotional offers">       <Toggle value={notifs.promos}     onChange={v => setNotifs(p => ({...p, promos:v}))}     /></Row>
          <Row label="Journey reminders">        <Toggle value={notifs.reminders}  onChange={v => setNotifs(p => ({...p, reminders:v}))}  /></Row>
        </Section>

        <Section title="App settings">
          <Row label="Language">
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="text-sm rounded-lg px-2 py-1 border outline-none" style={{ borderColor: C.border, color: C.text }}>
              {['English','Français','Deutsch','Italiano','Nederlands'].map(l => <option key={l}>{l}</option>)}
            </select>
          </Row>
          <Row label="Home city">
            <select className="text-sm rounded-lg px-2 py-1 border outline-none" style={{ borderColor: C.border, color: C.text }}>
              {CITIES.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
          </Row>
        </Section>

        <div className="pb-4 text-center">
          <p className="text-xs" style={{ color: C.muted }}>EuroMove v1.0.0 · Privacy Policy · Terms</p>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, dispatch, ticketCount }) {
  const tabs = [
    { id:'home',    icon:Home,   label:'Home'    },
    { id:'results', icon:Search, label:'Search'  },
    { id:'wallet',  icon:Ticket, label:'Tickets', badge: ticketCount },
    { id:'map',     icon:Map,    label:'Map'     },
    { id:'profile', icon:User,   label:'Profile' },
  ];

  const isActive = (tabId) => {
    if (tabId === 'results') return ['results','detail','checkout'].includes(screen);
    return screen === tabId;
  };

  return (
    <div className="bg-white border-t flex flex-shrink-0" style={{ borderColor: C.border, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
      {tabs.map(({ id, icon: Icon, label, badge }) => {
        const active = isActive(id);
        return (
          <button key={id} onClick={() => dispatch({ type:'GOTO', screen: id })}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
            <div className="relative">
              <Icon size={22} color={active ? C.primary : C.muted} strokeWidth={active ? 2.5 : 1.8} />
              {badge > 0 && (
                <div className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ background: C.accent, fontSize: 9, fontWeight: 700, color: C.primary }}>{badge}</div>
              )}
            </div>
            <span className="text-xs font-medium" style={{ color: active ? C.primary : C.muted }}>{label}</span>
            {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: C.primary }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── REDUCER ──────────────────────────────────────────────────────────────────
const initialState = {
  screen: 'home',
  mode: 'intercity',
  searchFrom: '',
  searchTo: '',
  selectedRoute: null,
  checkoutStep: 1,
  checkoutPrice: 0,
  checkoutAddOn: null,
  passengers: { adults:1, children:0, students:0 },
  tickets: INIT_TICKETS,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':   return { ...state, mode: action.mode };
    case 'GOTO':       return { ...state, screen: action.screen };
    case 'SEARCH':     return { ...state, screen:'results', searchFrom: action.from, searchTo: action.to };
    case 'SELECT_ROUTE': return { ...state, screen:'detail', selectedRoute: action.route };
    case 'START_CHECKOUT': return { ...state, screen:'checkout', checkoutStep:1, checkoutPrice: action.price, checkoutAddOn: action.addOn };
    case 'NEXT_STEP':  return { ...state, checkoutStep: Math.min(4, state.checkoutStep + 1) };
    case 'PREV_STEP':  return { ...state, checkoutStep: Math.max(1, state.checkoutStep - 1) };
    case 'CONFIRM_BOOKING': {
      const route = state.selectedRoute;
      const newTicket = {
        id: 't' + Date.now(),
        ref: action.ref,
        origin:      getCityByName(state.searchFrom)?.id || 'berlin',
        destination: getCityByName(state.searchTo)?.id   || 'paris',
        date:        new Date().toISOString().slice(0, 10),
        depTime:     route?.legs[0]?.dep || '09:00',
        arrTime:     route?.legs[route.legs.length - 1]?.arr || '17:00',
        status:      'upcoming',
        route,
        passengers:  action.passengers,
        price:       action.price,
        addOn:       action.addOn,
        purchaseDate: new Date().toISOString().slice(0, 10),
      };
      return { ...state, screen:'wallet', tickets: [newTicket, ...state.tickets], checkoutStep:1 };
    }
    default: return state;
  }
}

// ─── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, dispatch] = useReducer(reducer, initialState);

  const screens = {
    home:     <HomeScreen     appState={appState} dispatch={dispatch} />,
    results:  <ResultsScreen  appState={appState} dispatch={dispatch} />,
    detail:   <DetailScreen   appState={appState} dispatch={dispatch} />,
    checkout: <CheckoutScreen appState={appState} dispatch={dispatch} />,
    wallet:   <WalletScreen   appState={appState} dispatch={dispatch} />,
    map:      <MapScreen      appState={appState} dispatch={dispatch} />,
    profile:  <ProfileScreen  appState={appState} dispatch={dispatch} />,
  };

  const activeTickets = appState.tickets.filter(t => t.status !== 'completed').length;

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {screens[appState.screen] || screens.home}
      </div>
      <BottomNav screen={appState.screen} dispatch={dispatch} ticketCount={activeTickets} />
    </div>
  );
}
