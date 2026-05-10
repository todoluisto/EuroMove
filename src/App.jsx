import { useState, useEffect, useReducer, useRef } from 'react';
import { LANGUAGES, LanguageContext, useTranslation } from './i18n';
import { searchLocations, searchRoutes } from './api';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Train, Bus, MapPin, Clock, CreditCard, Search, Home, Ticket,
  User, Map, AlertTriangle, ChevronRight, ArrowRight,
  Check, Plus, Minus, X, ChevronDown, ChevronUp, Navigation,
  Shuffle, Calendar,
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
  mvg:   { id: 'mvg',   name: 'MVG',        fullName: 'MVG München',    color: '#0B6E4F', type: 'metro' },
  obb:   { id: 'obb',   name: 'ÖBB',        fullName: 'ÖBB Austria',    color: '#E2001A', type: 'rail'  },
  ns:    { id: 'ns',    name: 'NS',         fullName: 'NS Dutch Railways', color: '#FFD700', type: 'rail' },
  ctt:     { id: 'ctt',     name: 'CTT',      fullName: 'CTT Nord Pisa',        color: '#FF6B00', type: 'bus'  },
  trenord: { id: 'trenord', name: 'Trenord',  fullName: 'Trenord Lombardia',    color: '#007AB3', type: 'rail' },
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
  { id: 'munich',    name: 'Munich',    country: 'DE', emoji: '🇩🇪', transitPass: { name: 'MVG Day Pass',          price: 8.60, op: 'mvg'  } },
  { id: 'pisa',      name: 'Pisa',      country: 'IT', emoji: '🇮🇹', transitPass: { name: 'CTT Nord Biglietto',    price: 1.50, op: 'ctt'  } },
];

// ─── LOCATIONS (for door-to-door address search) ──────────────────────────────
const LOCATIONS = [
  { id: 'l1',  label: 'Westendstraße 8, Munich',           short: 'Westendstr. 8',       city: 'munich', type: 'address',  emoji: '📍' },
  { id: 'l2',  label: 'München Hauptbahnhof',              short: 'München Hbf',          city: 'munich', type: 'station',  emoji: '🚉' },
  { id: 'l3',  label: 'Marienplatz, Munich',               short: 'Marienplatz',          city: 'munich', type: 'station',  emoji: '🚇' },
  { id: 'l4',  label: 'München ZOB (Bus Station)',         short: 'München ZOB',          city: 'munich', type: 'station',  emoji: '🚌' },
  { id: 'l5',  label: 'Via Navigli 14, Milan',             short: 'Via Navigli 14',       city: 'milan',  type: 'address',  emoji: '📍' },
  { id: 'l6',  label: 'Milano Centrale',                   short: 'Milano Centrale',      city: 'milan',  type: 'station',  emoji: '🚉' },
  { id: 'l7',  label: 'Porta Genova FS, Milan',            short: 'Porta Genova FS',      city: 'milan',  type: 'station',  emoji: '🚇' },
  { id: 'l8',  label: 'Milano Lampugnano (Bus Station)',   short: 'Lampugnano',           city: 'milan',  type: 'station',  emoji: '🚌' },
  { id: 'l9',  label: 'Berlin Hauptbahnhof',               short: 'Berlin Hbf',           city: 'berlin', type: 'station',  emoji: '🚉' },
  { id: 'l10', label: 'Paris Gare de l\'Est',              short: 'Paris GdE',            city: 'paris',  type: 'station',  emoji: '🚉' },
  { id: 'l11', label: 'Amsterdam Centraal',                short: 'Amsterdam CS',         city: 'amsterdam', type: 'station', emoji: '🚉' },
  { id: 'l12', label: 'Donnersbergerbrücke, Munich',       short: 'Donnersbergerbrücke',  city: 'munich',     type: 'station',  emoji: '🚇' },
  { id: 'l13', label: 'Karl-Marx-Allee 1, Berlin',         short: 'Karl-Marx-Allee 1',    city: 'berlin',     type: 'address',  emoji: '📍' },
  { id: 'l14', label: 'Berlin ZOB (Bus Station)',           short: 'Berlin ZOB',           city: 'berlin',     type: 'station',  emoji: '🚌' },
  { id: 'l15', label: 'Prinsengracht 263, Amsterdam',       short: 'Prinsengracht 263',    city: 'amsterdam',  type: 'address',  emoji: '📍' },
  { id: 'l16', label: 'Amsterdam Sloterdijk',               short: 'Amsterdam Sloterdijk', city: 'amsterdam',  type: 'station',  emoji: '🚌' },
  { id: 'l17', label: 'Rue de Rivoli 228, Paris',           short: 'Rue de Rivoli 228',    city: 'paris',      type: 'address',  emoji: '📍' },
  { id: 'l18', label: 'Paris Gare du Nord',                 short: 'Paris Nord',           city: 'paris',      type: 'station',  emoji: '🚉' },
  { id: 'l19', label: 'Grand Place 1, Brussels',            short: 'Grand Place 1',        city: 'brussels',   type: 'address',  emoji: '📍' },
  { id: 'l20', label: 'Brussels Midi / Zuid',               short: 'Brussels Midi',        city: 'brussels',   type: 'station',  emoji: '🚉' },
  { id: 'l21', label: 'Prague Florenc (Bus Station)',        short: 'Prague Florenc',       city: 'prague',     type: 'station',  emoji: '🚌' },

  // ── Munich ──
  { id: 'l_muc', label: 'Munich Airport (MUC)',                short: 'Munich Airport',       city: 'munich', type: 'airport',    emoji: '✈️', lat: 48.3538, lon: 11.7861 },

  // ── Pisa ────
  { id: 'l_psa',      label: 'Pisa Galileo Galilei Airport (PSA)', short: 'Pisa Airport',    city: 'pisa',   type: 'airport',    emoji: '✈️', lat: 43.6839, lon: 10.3927 },
  { id: 'l_pisa_c',   label: 'Pisa Centrale',                      short: 'Pisa Centrale',   city: 'pisa',   type: 'station',    emoji: '🚉', lat: 43.7086, lon: 10.3980 },
  { id: 'l_torre',    label: 'Torre Pendente di Pisa',              short: 'Torre Pendente',  city: 'pisa',   type: 'attraction', emoji: '🗼', lat: 43.7230, lon: 10.3966 },
  { id: 'l_miracoli', label: 'Piazza dei Miracoli, Pisa',           short: 'Piazza Miracoli', city: 'pisa',   type: 'attraction', emoji: '🏛️', lat: 43.7229, lon: 10.3964 },
  { id: 'l_pisa_r',   label: 'Pisa, Via Roma',                      short: 'Via Roma, Pisa',  city: 'pisa',   type: 'address',    emoji: '📍', lat: 43.7151, lon: 10.4013 },

  // ── Milan ───
  { id: 'l_mxp',       label: 'Milan Malpensa Airport (MXP)',                      short: 'Malpensa Airport',   city: 'milan', type: 'airport',    emoji: '✈️', lat: 45.6227, lon:  8.7282 },
  { id: 'l_vc',        label: 'Villaggio Cavour, Settimo Milanese',               short: 'Villaggio Cavour',   city: 'milan', type: 'district',   emoji: '🌿', lat: 45.4670, lon:  9.0222 },
  { id: 'l_vc_addr',   label: 'Via Guglielmo Marconi 8, Settimo Milanese',        short: 'Via G. Marconi 8',   city: 'milan', type: 'address',    emoji: '📍', lat: 45.4670, lon:  9.0222 },
  { id: 'l_flamingos', label: 'Villa Invernizzi – Flamingo Garden, Milan',        short: 'Villa Invernizzi',   city: 'milan', type: 'attraction', emoji: '🦩', lat: 45.4700, lon:  9.2025 },
  { id: 'l_san_lor',   label: 'Colonne di San Lorenzo, Milan',                    short: 'Colonne di S.Lorenzo', city: 'milan', type: 'attraction', emoji: '🏛️', lat: 45.4582, lon:  9.1810 },
  { id: 'l_navigli',   label: 'Navigli, Milan',                                   short: 'Navigli',            city: 'milan', type: 'district',   emoji: '🌊', lat: 45.4513, lon:  9.1734 },
  { id: 'l_brera',     label: 'Brera, Milan',                                     short: 'Brera',              city: 'milan', type: 'district',   emoji: '🎨', lat: 45.4719, lon:  9.1869 },
];

const getCityById  = (id)   => CITIES.find(c => c.id === id);
const getCityByName = (name) => CITIES.find(c => c.name.toLowerCase() === name?.toLowerCase());

const BASE_ROUTES = [
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
  // Munich → Milan (door-to-door)
  { id:'r12', origin:'munich', destination:'milan', label:'Fastest', tags:['fastest'], doorToDoor: true,
    fromAddress: 'Westendstraße 8, Munich', toAddress: 'Via Navigli 14, Milan',
    legs:[
      { operator:'mvg',  vehicle:'U5',           type:'metro', from:'Westendstraße',    to:'München Hbf',        dep:'06:42', arr:'06:50', dur:8,   platform:'U5',  local: true },
      { operator:'db',   vehicle:'EC 89',        type:'rail',  from:'München Hbf',      to:'Verona Porta Nuova', dep:'07:26', arr:'12:41', dur:315, platform:'11' },
      { operator:'trit', vehicle:'RV 2161',      type:'rail',  from:'Verona Porta Nuova', to:'Milano Centrale',  dep:'13:10', arr:'14:35', dur:85,  platform:'2' },
      { operator:'atm',  vehicle:'M2 → M2',      type:'metro', from:'Milano Centrale',  to:'Porta Genova FS',    dep:'14:45', arr:'14:57', dur:12,  platform:'M2', local: true },
    ], totalDur:495, totalPrice:79, transfers:3 },
  { id:'r13', origin:'munich', destination:'milan', label:'Cheapest', tags:['cheapest'], doorToDoor: true,
    fromAddress: 'Westendstraße 8, Munich', toAddress: 'Via Navigli 14, Milan',
    legs:[
      { operator:'mvg',  vehicle:'S7',           type:'metro', from:'Donnersbergerbrücke', to:'München ZOB',     dep:'08:15', arr:'08:28', dur:13,  platform:'S7',  local: true },
      { operator:'flix', vehicle:'FlixBus 1940', type:'bus',   from:'München ZOB',        to:'Milano Lampugnano', dep:'09:00', arr:'18:15', dur:555, platform:'Bay 7' },
      { operator:'atm',  vehicle:'M1 → M2',      type:'metro', from:'Lampugnano',         to:'Porta Genova FS',   dep:'18:30', arr:'18:52', dur:22,  platform:'M1', local: true },
    ], totalDur:637, totalPrice:38, transfers:2 },
  { id:'r14', origin:'munich', destination:'milan', label:'Via Innsbruck · Scenic', tags:['scenic'], doorToDoor: true,
    fromAddress: 'Westendstraße 8, Munich', toAddress: 'Via Navigli 14, Milan',
    legs:[
      { operator:'mvg',  vehicle:'U5',           type:'metro', from:'Westendstraße',      to:'München Hbf',       dep:'07:12', arr:'07:20', dur:8,   platform:'U5',  local: true },
      { operator:'obb',  vehicle:'EC 85',        type:'rail',  from:'München Hbf',        to:'Innsbruck Hbf',     dep:'07:52', arr:'09:36', dur:104, platform:'9' },
      { operator:'obb',  vehicle:'EC 81',        type:'rail',  from:'Innsbruck Hbf',      to:'Verona Porta Nuova', dep:'10:04', arr:'13:24', dur:200, platform:'4' },
      { operator:'trit', vehicle:'FR 9535',      type:'rail',  from:'Verona Porta Nuova', to:'Milano Centrale',   dep:'13:50', arr:'14:55', dur:65,  platform:'1' },
      { operator:'atm',  vehicle:'M2 → M2',      type:'metro', from:'Milano Centrale',    to:'Porta Genova FS',   dep:'15:05', arr:'15:17', dur:12,  platform:'M2', local: true },
    ], totalDur:485, totalPrice:69, transfers:4 },

  // Berlin → Amsterdam
  { id:'r15', origin:'berlin', destination:'amsterdam', label:'ICE + IC', tags:['fastest'], doorToDoor: true,
    fromAddress: 'Karl-Marx-Allee 1, Berlin', toAddress: 'Prinsengracht 263, Amsterdam',
    legs:[
      { operator:'bvg',  vehicle:'U5',           type:'metro', from:'Karl-Marx-Allee',    to:'Berlin Hbf',        dep:'07:30', arr:'07:42', dur:12,  platform:'U5',  local: true },
      { operator:'db',   vehicle:'ICE 947',      type:'rail',  from:'Berlin Hbf',         to:'Hannover Hbf',      dep:'08:02', arr:'09:36', dur:94,  platform:'1' },
      { operator:'ns',   vehicle:'IC 147',       type:'rail',  from:'Hannover Hbf',       to:'Amsterdam CS',      dep:'10:04', arr:'13:17', dur:193, platform:'5' },
      { operator:'gvb',  vehicle:'Tram 2',       type:'metro', from:'Amsterdam CS',       to:'Prinsengracht',     dep:'13:25', arr:'13:40', dur:15,  platform:'T2',  local: true },
    ], totalDur:370, totalPrice:79, transfers:2 },
  { id:'r16', origin:'berlin', destination:'amsterdam', label:'FlixBus Direct', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 104', type:'bus',   from:'Berlin ZOB',          to:'Amsterdam Sloterdijk', dep:'08:30', arr:'14:45', dur:375, platform:'Bay 6' },
    ], totalDur:375, totalPrice:19, transfers:0 },

  // Paris → Brussels
  { id:'r17', origin:'paris', destination:'brussels', label:'Thalys Direct', tags:['fastest','fewest'], doorToDoor: true,
    fromAddress: 'Rue de Rivoli 228, Paris', toAddress: 'Grand Place 1, Brussels',
    legs:[
      { operator:'ratp', vehicle:'Métro 4',      type:'metro', from:'Rue de Rivoli',      to:'Paris Nord',        dep:'06:55', arr:'07:08', dur:13,  platform:'M4',  local: true },
      { operator:'thal', vehicle:'Thalys 9364', type:'rail',  from:'Paris Nord',          to:'Brussels Midi',     dep:'07:25', arr:'09:22', dur:117, platform:'2' },
      { operator:'nmbs', vehicle:'Métro 2',      type:'metro', from:'Brussels Midi',       to:'Grand Place',       dep:'09:35', arr:'09:44', dur:9,   platform:'M2',  local: true },
    ], totalDur:169, totalPrice:55, transfers:1 },
  { id:'r18', origin:'paris', destination:'brussels', label:'FlixBus Budget', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 715', type:'bus',   from:'Paris Bercy',         to:'Brussels Nord',     dep:'09:00', arr:'13:15', dur:255, platform:'Bay 3' },
    ], totalDur:255, totalPrice:12, transfers:0 },

  // Prague → Milan
  { id:'r19', origin:'prague', destination:'milan', label:'Railjet via Wien', tags:['fastest'],
    legs:[
      { operator:'obb',  vehicle:'RJ 65',        type:'rail',  from:'Praha hl.n.',         to:'Wien Hbf',          dep:'08:40', arr:'12:44', dur:244, platform:'3' },
      { operator:'obb',  vehicle:'RJ 131',       type:'rail',  from:'Wien Hbf',            to:'Milano Centrale',   dep:'13:25', arr:'19:25', dur:360, platform:'7' },
    ], totalDur:645, totalPrice:89, transfers:1 },
  { id:'r20', origin:'prague', destination:'milan', label:'FlixBus Overnight', tags:['cheapest'],
    legs:[
      { operator:'flix', vehicle:'FlixBus 921', type:'bus',   from:'Prague Florenc',       to:'Milan Lampugnano',  dep:'16:30', arr:'07:00', dur:870, platform:'Bay 2' },
    ], totalDur:870, totalPrice:29, transfers:0 },

  // Munich → Berlin
  { id:'r21', origin:'munich', destination:'berlin', label:'ICE Direct', tags:['fastest','fewest'], doorToDoor: true,
    fromAddress: 'Westendstraße 8, Munich', toAddress: 'Karl-Marx-Allee 1, Berlin',
    legs:[
      { operator:'mvg',  vehicle:'U5',           type:'metro', from:'Westendstraße',       to:'München Hbf',       dep:'07:43', arr:'07:51', dur:8,   platform:'U5',  local: true },
      { operator:'db',   vehicle:'ICE 1006',     type:'rail',  from:'München Hbf',         to:'Berlin Hbf',        dep:'08:00', arr:'11:47', dur:227, platform:'20' },
      { operator:'bvg',  vehicle:'U5',           type:'metro', from:'Berlin Hbf',          to:'Karl-Marx-Allee',   dep:'12:00', arr:'12:08', dur:8,   platform:'U5',  local: true },
    ], totalDur:265, totalPrice:59, transfers:0 },
  { id:'r22', origin:'munich', destination:'berlin', label:'FlixBus Night', tags:['cheapest'], doorToDoor: true,
    fromAddress: 'Westendstraße 8, Munich', toAddress: 'Karl-Marx-Allee 1, Berlin',
    legs:[
      { operator:'mvg',  vehicle:'S7',           type:'metro', from:'Donnersbergerbrücke', to:'München ZOB',       dep:'22:15', arr:'22:28', dur:13,  platform:'S7',  local: true },
      { operator:'flix', vehicle:'FlixBus 880', type:'bus',   from:'München ZOB',          to:'Berlin ZOB',        dep:'23:00', arr:'05:30', dur:390, platform:'Bay 5' },
      { operator:'bvg',  vehicle:'U5',           type:'metro', from:'Berlin ZOB',          to:'Karl-Marx-Allee',   dep:'05:45', arr:'05:58', dur:13,  platform:'U5',  local: true },
    ], totalDur:463, totalPrice:19, transfers:0 },
];

// ─── REVERSE ROUTE GENERATOR ──────────────────────────────────────────────────
const generateReverseRoutes = (routes) => routes.map(route => ({
  ...route,
  id: `${route.id}-rev`,
  origin: route.destination,
  destination: route.origin,
  ...(route.fromAddress ? { fromAddress: route.toAddress, toAddress: route.fromAddress } : {}),
  legs: [...route.legs].reverse().map(leg => ({
    ...leg,
    from: leg.to,
    to: leg.from,
    dep: leg.arr,
    arr: leg.dep,
  })),
}));

// ─── PISA IN-CITY ROUTES (Airport → Torre Pendente) ──────────────────────────
// Added separately to avoid time-flip artifacts from generateReverseRoutes
const PISA_ROUTES = [
  { id:'rp1', origin:'pisa', destination:'pisa', label:'Recommended',
    legs:[
      { operator:'ctt',  vehicle:'PisaMover',  type:'rail', from:'Pisa Airport',    to:'Pisa Centrale',      dep:'10:00', arr:'10:05', dur:5,  platform:'Terminal' },
      { operator:'ctt',  vehicle:'LAM Rossa',  type:'bus',  from:'Pisa Centrale',   to:'Piazza dei Miracoli',dep:'10:15', arr:'10:30', dur:15, platform:'P.za V. Emanuele' },
    ], totalDur:30, totalPrice:2.70, transfers:1 },

  { id:'rp2', origin:'pisa', destination:'pisa', label:'Via Trenitalia',
    legs:[
      { operator:'trit', vehicle:'R 22716',    type:'rail', from:'Pisa Aeroporto',  to:'Pisa Centrale',      dep:'09:36', arr:'09:42', dur:6,  platform:'1' },
      { operator:'ctt',  vehicle:'LAM Rossa',  type:'bus',  from:'Pisa Centrale',   to:'Piazza dei Miracoli',dep:'09:52', arr:'10:07', dur:15, platform:'P.za V. Emanuele' },
    ], totalDur:31, totalPrice:3.20, transfers:1 },

  { id:'rp3', origin:'pisa', destination:'pisa', label:'Direct Shuttle',
    legs:[
      { operator:'ctt',  vehicle:'Navetta Aeroporto', type:'bus', from:'Pisa Airport', to:'Piazza dei Miracoli', dep:'10:30', arr:'10:50', dur:20, platform:'Uscita Arrivi' },
    ], totalDur:20, totalPrice:2.70, transfers:0 },

  // Reverse: Torre Pendente → Airport
  { id:'rp1r', origin:'pisa', destination:'pisa', label:'Recommended',
    legs:[
      { operator:'ctt',  vehicle:'LAM Rossa',  type:'bus',  from:'Piazza dei Miracoli', to:'Pisa Centrale',  dep:'14:00', arr:'14:15', dur:15, platform:'Piazza Miracoli' },
      { operator:'ctt',  vehicle:'PisaMover',  type:'rail', from:'Pisa Centrale',        to:'Pisa Airport',   dep:'14:25', arr:'14:30', dur:5,  platform:'Staz. Pisa C.' },
    ], totalDur:30, totalPrice:2.70, transfers:1 },

  { id:'rp3r', origin:'pisa', destination:'pisa', label:'Direct Shuttle',
    legs:[
      { operator:'ctt',  vehicle:'Navetta Aeroporto', type:'bus', from:'Piazza dei Miracoli', to:'Pisa Airport', dep:'13:40', arr:'14:00', dur:20, platform:'Piazza Miracoli' },
    ], totalDur:20, totalPrice:2.70, transfers:0 },
];

// ─── MILAN IN-CITY ROUTES (Malpensa ↔ Porta Venezia / city centre) ───────────
const MILAN_ROUTES = [
  // ── Arrival: Malpensa → Villaggio Cavour (Settimo Milanese) ──
  { id:'rmx1', origin:'milan', destination:'milan', label:'Malpensa Express',
    legs:[
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Malpensa T1',       to:'Milano Centrale',    dep:'15:05', arr:'15:56', dur:51, platform:'1' },
      { operator:'atm',     vehicle:'Bus 78',           type:'bus',   from:'Milano Centrale',   to:'Villaggio Cavour',   dep:'16:05', arr:'16:24', dur:19, platform:'Via Vitruvio' },
    ], totalDur:79, totalPrice:13.90, transfers:1 },

  { id:'rmx2', origin:'milan', destination:'milan', label:'Via Cadorna',
    legs:[
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Malpensa T1',       to:'Milano Cadorna',     dep:'15:25', arr:'16:02', dur:37, platform:'1' },
      { operator:'atm',     vehicle:'M1',               type:'metro', from:'Cadorna F.N.',       to:'Rho Fiera',         dep:'16:10', arr:'16:28', dur:18, platform:'M1 rossa' },
      { operator:'atm',     vehicle:'Bus Z214',         type:'bus',   from:'Rho Fiera',          to:'Villaggio Cavour',  dep:'16:35', arr:'16:43', dur:8,  platform:'Fermata Rho' },
    ], totalDur:78, totalPrice:15.00, transfers:2 },

  { id:'rmx3', origin:'milan', destination:'milan', label:'Budget Bus',
    legs:[
      { operator:'flix',    vehicle:'Terravision',      type:'bus',   from:'Malpensa T1',       to:'Milano Centrale',    dep:'15:30', arr:'16:25', dur:55, platform:'Uscita 4' },
      { operator:'atm',     vehicle:'Bus 78',           type:'bus',   from:'Milano Centrale',   to:'Villaggio Cavour',   dep:'16:35', arr:'16:54', dur:19, platform:'Via Vitruvio' },
    ], totalDur:84, totalPrice:8.40, transfers:1 },

  // ── Arrival: Malpensa → Villa Invernizzi (Flamingo Garden, Porta Venezia) ──
  { id:'rmx_vi1', origin:'milan', destination:'milan', label:'Recommended',
    legs:[
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Malpensa T1',  to:'Milano Cadorna',   dep:'15:25', arr:'16:02', dur:37, platform:'1' },
      { operator:'atm',     vehicle:'M1',               type:'metro', from:'Cadorna F.N.', to:'Porta Venezia',    dep:'16:10', arr:'16:22', dur:12, platform:'M1 rossa · dir. Sesto 1° Maggio' },
    ], totalDur:57, totalPrice:15.00, transfers:1 },

  { id:'rmx_vi2', origin:'milan', destination:'milan', label:'Via Centrale',
    legs:[
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Malpensa T1',    to:'Milano Centrale',  dep:'15:05', arr:'15:56', dur:51, platform:'1' },
      { operator:'atm',     vehicle:'Tram 9',           type:'metro', from:'Milano Centrale', to:'Villa Invernizzi', dep:'16:05', arr:'16:23', dur:18, platform:'Via Vitruvio' },
    ], totalDur:78, totalPrice:13.90, transfers:1 },

  { id:'rmx_vi3', origin:'milan', destination:'milan', label:'Budget',
    legs:[
      { operator:'flix',    vehicle:'Terravision',      type:'bus',   from:'Malpensa T1',    to:'Milano Centrale',  dep:'15:30', arr:'16:25', dur:55, platform:'Uscita 4' },
      { operator:'atm',     vehicle:'Tram 9',           type:'metro', from:'Milano Centrale', to:'Villa Invernizzi', dep:'16:35', arr:'16:53', dur:18, platform:'Via Vitruvio' },
    ], totalDur:83, totalPrice:8.40, transfers:1 },

  // ── Departure: Villaggio Cavour → Malpensa ──
  { id:'rmx1r', origin:'milan', destination:'milan', label:'Malpensa Express',
    legs:[
      { operator:'atm',     vehicle:'Bus 78',           type:'bus',   from:'Villaggio Cavour',  to:'Milano Centrale',    dep:'09:00', arr:'09:19', dur:19, platform:'Via G. Marconi' },
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Milano Centrale',   to:'Malpensa T1',        dep:'09:25', arr:'10:16', dur:51, platform:'2' },
    ], totalDur:76, totalPrice:13.90, transfers:1 },

  { id:'rmx2r', origin:'milan', destination:'milan', label:'Via Cadorna',
    legs:[
      { operator:'atm',     vehicle:'Bus Z214',         type:'bus',   from:'Villaggio Cavour',  to:'Rho Fiera',          dep:'08:30', arr:'08:38', dur:8,  platform:'Via G. Marconi' },
      { operator:'atm',     vehicle:'M1',               type:'metro', from:'Rho Fiera',          to:'Cadorna F.N.',       dep:'08:45', arr:'09:03', dur:18, platform:'M1 rossa' },
      { operator:'trenord', vehicle:'Malpensa Express', type:'rail',  from:'Milano Cadorna',    to:'Malpensa T1',        dep:'09:10', arr:'09:47', dur:37, platform:'1' },
    ], totalDur:77, totalPrice:15.00, transfers:2 },
];

const ROUTES = [...BASE_ROUTES, ...generateReverseRoutes(BASE_ROUTES), ...PISA_ROUTES, ...MILAN_ROUTES];

const INSPIRATION = [
  { id:'i1', title:'Weekend in Prague',  subtitle:'Direct from Berlin',   from:'berlin',    to:'prague',   price:19,  dur:'4h 30m', gradient:'linear-gradient(135deg,#003D7E 0%,#6B7280 100%)' },
  { id:'i2', title:'Paris → Lyon',       subtitle:'TGV in 2 hours',       from:'paris',     to:'lyon',     price:19,  dur:'2h',     gradient:'linear-gradient(135deg,#C0001B 0%,#F5A623 100%)' },
  { id:'i3', title:'Milan Day Trip',     subtitle:'Frecciarossa fast',     from:'milan',     to:'rome',     price:39,  dur:'2h 55m', gradient:'linear-gradient(135deg,#006940 0%,#34C759 100%)' },
  { id:'i4', title:'Amsterdam Break',    subtitle:'via Thalys',            from:'amsterdam', to:'brussels', price:29,  dur:'2h',     gradient:'linear-gradient(135deg,#00A0DE 0%,#003366 100%)' },
  { id:'i5', title:'Berlin → Paris',     subtitle:'ICE + TGV combo',       from:'berlin',    to:'paris',    price:59,  dur:'8h 30m', gradient:'linear-gradient(135deg,#E30614 0%,#003366 100%)' },
  { id:'i6', title:'Munich → Milan',      subtitle:'Door-to-door · 3 transfers', from:'munich', to:'milan',      price:38, dur:'7h',     gradient:'linear-gradient(135deg,#0B6E4F 0%,#D52B1E 100%)' },
  { id:'i7', title:'Berlin → Amsterdam', subtitle:'ICE to the canals',          from:'berlin', to:'amsterdam',  price:19, dur:'6h 15m', gradient:'linear-gradient(135deg,#E30614 0%,#00A0DE 100%)' },
  { id:'i8', title:'Munich → Berlin',    subtitle:'ICE direct, under 4h',       from:'munich', to:'berlin',     price:59, dur:'3h 47m', gradient:'linear-gradient(135deg,#003366 0%,#E30614 100%)' },
];

const INIT_TICKETS = [];

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
  const { t } = useTranslation();
  const cfg = { upcoming:['#003366', t('status_upcoming')], active:['#34C759', t('status_active')], completed:['#6B7280', t('status_completed')] };
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
const getDefaultDate = () => new Date().toISOString().slice(0, 10);

function HomeScreen({ appState, dispatch }) {
  const { t } = useTranslation();

  // ── text values shown in the inputs ──────────────────────────────────────
  const [fromVal,       setFromVal]       = useState('');
  const [toVal,         setToVal]         = useState('');
  // ── lat/lon stored when user picks a live-API suggestion ─────────────────
  const [fromCoords,    setFromCoords]    = useState(null); // [lat, lon] | null
  const [toCoords,      setToCoords]      = useState(null);
  // ── dropdown suggestion lists ─────────────────────────────────────────────
  const [fromSug,       setFromSug]       = useState([]);
  const [toSug,         setToSug]         = useState([]);
  // ── date ─────────────────────────────────────────────────────────────────
  const [dateVal, setDateVal] = useState(getDefaultDate);

  // Refs track the "current" query so stale API responses are ignored
  const fromQueryRef = useRef('');
  const toQueryRef   = useRef('');

  // ── LOCAL fallback: CITIES + LOCATIONS ───────────────────────────────────
  const localSuggest = (val) => {
    if (val.length < 1) return [];
    const v = val.toLowerCase();
    const cities = CITIES
      .filter(c => c.name.toLowerCase().startsWith(v))
      .map(c => ({
        id: c.id, label: c.name, sub: c.country,
        emoji: c.emoji, cityName: c.name,
        lat: null, lon: null, isLive: false,
      }));
    const locs = LOCATIONS
      .filter(l => l.label.toLowerCase().includes(v))
      .map(l => ({
        id: l.id, label: l.label, sub: l.type,
        emoji: l.emoji, cityName: getCityById(l.city)?.name || l.city,
        lat: l.lat ?? null, lon: l.lon ?? null, isLive: false,
      }));
    return [...locs, ...cities].slice(0, 6);
  };

  // ── Normalise a Nominatim result into our suggestion shape ────────────────
  const normaliseApiResult = (item, i) => ({
    id:       item.id ?? `api-${i}`,
    label:    item.short || item.label,   // concise display text
    sub:      item.type  || item.country,
    emoji:    item.emoji,
    cityName: item.city  || item.short || '',
    lat:      item.lat,
    lon:      item.lon,
    isLive:   true,
  });

  // ── Async handler: show local results instantly, then API results ──────────
  const fetchSuggestions = async (val, queryRef, setSug) => {
    queryRef.current = val;

    if (val.length < 2) { setSug([]); return; }

    // Instant local feedback — keep reference for later merge
    const local = localSuggest(val);
    setSug(local);

    // Fire debounced Nominatim call (300 ms debounce is inside api.js)
    const { data } = await searchLocations(val);

    // Discard result if user has typed something different
    if (queryRef.current !== val) return;

    if (data.length > 0) {
      const apiResults = data.map(normaliseApiResult);
      // Local results stay at top; append only API results not already present
      const localLabels = new Set(local.map(s => s.label.toLowerCase()));
      const freshApi = apiResults.filter(s => !localLabels.has(s.label.toLowerCase()));
      setSug([...local, ...freshApi].slice(0, 8));
    }
    // else: keep the local results already shown
  };

  // ── City name resolver (for mock ROUTES matching) ─────────────────────────
  // Maps common non-English city names to our English CITIES names
  const CITY_ALIAS = {
    münchen: 'Munich', muenchen: 'Munich',
    milano: 'Milan',
    bruxelles: 'Brussels', brussel: 'Brussels', brüssel: 'Brussels',
    prag: 'Prague', praga: 'Prague', praha: 'Prague',
    roma: 'Rome',
    lyon: 'Lyon',
    paris: 'Paris',
    amsterdam: 'Amsterdam',
    berlin: 'Berlin',
  };

  const resolveCityName = (val) => {
    if (!val) return val;
    // 1. Exact LOCATIONS label match
    const loc = LOCATIONS.find(l => l.label.toLowerCase() === val.toLowerCase());
    if (loc) return getCityById(loc.city)?.name || val;
    // 2. Exact CITIES name match
    const city = getCityByName(val);
    if (city) return city.name;
    // 3. Scan each comma-separated token for city name or alias
    const tokens = val.split(',').map(t => t.trim()).filter(Boolean);
    for (const tok of tokens) {
      const c = getCityByName(tok);
      if (c) return c.name;
      // Also check the first word of the token (e.g. "München Hbf" → "München")
      for (const word of tok.split(/\s+/)) {
        const alias = CITY_ALIAS[word.toLowerCase()];
        if (alias) return alias;
      }
    }
    return val;
  };

  const doSearch = (from, to) => {
    if (!from || !to) return;
    dispatch({
      type:        'SEARCH',
      from:        resolveCityName(from),
      to:          resolveCityName(to),
      fromLabel:   from,
      toLabel:     to,
      fromCoords:  fromCoords ?? null,
      toCoords:    toCoords   ?? null,
      date:        dateVal,
    });
  };

  // ── Shared dropdown renderer ──────────────────────────────────────────────
  const SuggestionList = ({ sugs, onPick, zIndex }) =>
    sugs.length === 0 ? null : (
      <div
        className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden"
        style={{ borderColor: C.border, zIndex }}
      >
        {sugs.map(s => (
          <button
            key={s.id}
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50"
            onClick={() => onPick(s)}
          >
            <span>{s.emoji}</span>
            <span className="flex-1 truncate" style={{ color: C.text }}>{s.label}</span>
            {/* Source indicator */}
            <span
              className="text-xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded-full"
              style={s.isLive
                ? { background: C.primary + '12', color: C.primary }
                : { background: C.border,          color: C.muted   }}
            >
              {s.isLive ? '📡 Live' : '📍 Local'}
            </span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      {/* Header */}
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-6 rounded-b-3xl">
        <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs mb-1">{t('good_morning')}</p>
        <h1 className="text-white text-xl font-bold mb-4">{t('where_to_next')}</h1>

        {/* Door-to-door badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: C.accent, color: C.primary }}>
            🚪 Door-to-door
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('door_to_door_subtitle')}</span>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl p-3 space-y-2 shadow-lg relative" style={{ zIndex: 10 }}>

          {/* From */}
          <div className="relative" style={{ zIndex: 20 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.bg }}>
              <div className="w-2 h-2 rounded-full border-2 flex-shrink-0" style={{ borderColor: C.primary }} />
              <input
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: C.text }}
                placeholder={t('from_placeholder')}
                value={fromVal}
                onChange={e => {
                  setFromVal(e.target.value);
                  setFromCoords(null);
                  fetchSuggestions(e.target.value, fromQueryRef, setFromSug);
                }}
              />
              {fromVal && (
                <button onClick={() => { setFromVal(''); setFromCoords(null); setFromSug([]); }}>
                  <X size={14} color={C.muted} />
                </button>
              )}
            </div>
            <SuggestionList
              sugs={fromSug}
              zIndex={30}
              onPick={s => {
                setFromVal(s.label);
                setFromCoords(s.lat != null ? [s.lat, s.lon] : null);
                setFromSug([]);
              }}
            />
          </div>

          {/* Swap — swaps both text and coords */}
          <div className="flex items-center gap-2 px-3">
            <div className="flex-1 h-px" style={{ background: C.border }} />
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center shadow"
              style={{ background: C.primary }}
              onClick={() => {
                setFromVal(toVal);   setToVal(fromVal);
                setFromCoords(toCoords); setToCoords(fromCoords);
                setFromSug([]);      setToSug([]);
              }}
            >
              <Shuffle size={12} color="white" />
            </button>
            <div className="flex-1 h-px" style={{ background: C.border }} />
          </div>

          {/* To */}
          <div className="relative" style={{ zIndex: 19 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.bg }}>
              <MapPin size={14} color={C.accent} className="flex-shrink-0" />
              <input
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: C.text }}
                placeholder={t('to_placeholder')}
                value={toVal}
                onChange={e => {
                  setToVal(e.target.value);
                  setToCoords(null);
                  fetchSuggestions(e.target.value, toQueryRef, setToSug);
                }}
              />
              {toVal && (
                <button onClick={() => { setToVal(''); setToCoords(null); setToSug([]); }}>
                  <X size={14} color={C.muted} />
                </button>
              )}
            </div>
            <SuggestionList
              sugs={toSug}
              zIndex={29}
              onPick={s => {
                setToVal(s.label);
                setToCoords(s.lat != null ? [s.lat, s.lon] : null);
                setToSug([]);
              }}
            />
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.bg }}>
            <Calendar size={14} color={C.primary} className="flex-shrink-0" />
            <input type="date" className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: C.text }} value={dateVal}
              onChange={e => setDateVal(e.target.value)} />
          </div>

          <button onClick={() => doSearch(fromVal, toVal)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
            style={{ background: (fromVal && toVal) ? C.accent : C.border, color: (fromVal && toVal) ? C.primary : C.muted }}>
            <Search size={16} /> {t('search_routes')}
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── SCREEN: SEARCH RESULTS ───────────────────────────────────────────────────
const formatSearchDate = (searchDate, t) => {
  if (!searchDate) return t('today');
  const d = new Date(searchDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime()
    ? t('today')
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

function ResultsScreen({ appState, dispatch }) {
  const { t } = useTranslation();
  const [filter, setFilter]       = useState('fastest');
  const [expanded, setExpanded]   = useState(null);
  const [liveRoutes, setLiveRoutes] = useState([]);
  const [loading, setLoading]     = useState(false);

  const { searchFrom, searchTo, searchFromLabel, searchToLabel, searchDate, fromCoords, toCoords } = appState;
  const displayFrom = searchFromLabel || searchFrom;
  const displayTo   = searchToLabel   || searchTo;

  // ── Live API fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fromCoords || !toCoords) return;
    let cancelled = false;
    setLoading(true);
    setLiveRoutes([]);
    const date = searchDate || new Date().toISOString().slice(0, 10);
    searchRoutes(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1], date, '08:00')
      .then(({ data }) => { if (!cancelled && data.length > 0) setLiveRoutes(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fromCoords, toCoords, searchDate]);

  // ── Mock routes (always available) ───────────────────────────────────────
  const fromCity   = getCityByName(searchFrom);
  const toCity     = getCityByName(searchTo);
  const mockRoutes = ROUTES.filter(r => {
    if (r.origin !== fromCity?.id || r.destination !== toCity?.id) return false;
    // For in-city routes (origin === destination) we must also check direction,
    // otherwise both Malpensa→VC and VC→Malpensa would appear simultaneously.
    if (r.origin === r.destination) {
      const fromLabel = (searchFromLabel || searchFrom).toLowerCase();
      const toLabel   = (searchToLabel   || searchTo).toLowerCase();
      const cityName  = (fromCity?.name || '').toLowerCase();
      // If both inputs are just the city name, show all in-city routes
      if (fromLabel.trim() === cityName && toLabel.trim() === cityName) return true;
      // Match first-leg departure against "from" label
      const firstFromWords = r.legs[0].from.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const fromMatch = fromLabel.trim() === cityName ||
                        firstFromWords.some(w => fromLabel.includes(w));
      // Match last-leg destination against "to" label (distinguishes e.g. VC vs VI routes)
      const lastToWords = r.legs[r.legs.length - 1].to.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const toMatch   = toLabel.trim() === cityName ||
                        lastToWords.some(w => toLabel.includes(w));
      return fromMatch && toMatch;
    }
    return true;
  });

  // ── Sort (cheapest puts null prices last) ────────────────────────────────
  const sortFn = (a, b) => {
    if (filter === 'fastest')  return a.totalDur - b.totalDur;
    if (filter === 'cheapest') return (a.totalPrice ?? Infinity) - (b.totalPrice ?? Infinity);
    return a.transfers - b.transfers;
  };
  const sortedLive = [...liveRoutes].sort(sortFn);
  const sortedMock = [...mockRoutes].sort(sortFn);
  const totalCount = sortedLive.length + sortedMock.length;

  // ── Shared route card renderer ────────────────────────────────────────────
  const renderRouteCard = (route, i) => {
    const isExp = expanded === route.id;
    const first = route.legs[0];
    const last  = route.legs[route.legs.length - 1];
    return (
      <div key={route.id} className="bg-white rounded-2xl overflow-hidden fade-in"
        style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)', animationDelay:`${i*0.05}s` }}>
        <button className="w-full text-left p-4" onClick={() => setExpanded(isExp ? null : route.id)}>
          {/* Times + Price */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold" style={{ color: C.text }}>{first.dep}</span>
              <span className="text-sm mx-2" style={{ color: C.muted }}>→</span>
              <span className="text-lg font-bold" style={{ color: C.text }}>{last.arr}</span>
            </div>
            {route.totalPrice != null
              ? <span className="text-lg font-bold" style={{ color: C.accent }}>€{route.totalPrice}</span>
              : <span className="text-sm font-medium" style={{ color: C.muted }}>Price TBD</span>
            }
          </div>
          {/* Journey bar */}
          <JourneyBar legs={route.legs} totalDur={route.totalDur} />
          {/* Meta */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock size={12} color={C.muted} />
              <span className="text-xs" style={{ color: C.muted }}>{fmtDur(route.totalDur)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shuffle size={12} color={C.muted} />
              <span className="text-xs" style={{ color: C.muted }}>{route.transfers === 0 ? t('direct') : `${route.transfers} ${t('transfer_label')}`}</span>
            </div>
            {route.legs.map((l, j) => <OperatorBadge key={j} opId={l.operator} />)}
            {route.label && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: C.accent + '20', color: C.accent }}>{route.label}</span>
            )}
          </div>
        </button>

        {/* Expanded legs */}
        {isExp && (
          <div className="border-t px-4 pb-3" style={{ borderColor: C.border }}>
            {route.legs.map((leg, j) => {
              const op = OPERATORS[leg.operator];
              return (
                <div key={j}>
                  <div className="flex items-start gap-3 py-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: (op?.color || C.muted) + '20' }}>
                      <VehicleIcon type={leg.type} size={13} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold" style={{ color: C.text }}>{leg.from}</span>
                        <ArrowRight size={11} color={C.muted} />
                        <span className="text-xs font-bold" style={{ color: C.text }}>{leg.to}</span>
                      </div>
                      <p className="text-xs" style={{ color: C.muted }}>
                        {op?.fullName || leg.agencyName || leg.vehicle}
                        {op && leg.vehicle ? ` · ${leg.vehicle}` : ''}
                        {leg.platform ? ` · Plat. ${leg.platform}` : ''}
                      </p>
                      <p className="text-xs" style={{ color: C.muted }}>{leg.dep}–{leg.arr} · {fmtDur(leg.dur)}</p>
                    </div>
                    <OperatorBadge opId={leg.operator} />
                  </div>
                  {j < route.legs.length - 1 && (
                    <div className="flex items-center gap-2 ml-10 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.muted }} />
                      <span className="text-xs" style={{ color: C.muted }}>
                        {transferMins(route.legs[j], route.legs[j+1])} {t('min_transfer_at')} {leg.to}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => dispatch({ type:'SELECT_ROUTE', route })}
              className="w-full mt-2 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
              style={{ background: C.primary }}>
              {t('see_journey_details')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {!isExp && (
          <div className="border-t" style={{ borderColor: C.border }}>
            <button onClick={() => dispatch({ type:'SELECT_ROUTE', route })}
              className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-1"
              style={{ color: C.primary }}>
              {t('view_details')} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      {/* Header */}
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-4 rounded-b-3xl">
        <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> {t('back')}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-white font-bold text-base leading-snug">{displayFrom}</h1>
          <ArrowRight size={16} color="rgba(255,255,255,0.6)" className="flex-shrink-0" />
          <h1 className="text-white font-bold text-base leading-snug">{displayTo}</h1>
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {totalCount} {t('routes')} · {formatSearchDate(searchDate, t)}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3">
        {[['fastest', t('filter_fastest')],['cheapest', t('filter_cheapest')],['fewest', t('filter_transfers')]].map(([k,lbl]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={filter === k
              ? { background: C.primary, color: 'white' }
              : { background: 'white', color: C.muted, border: `1px solid ${C.border}` }}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-5">
            <div className="w-7 h-7 border-4 rounded-full animate-spin"
              style={{ borderColor: C.border, borderTopColor: C.primary }} />
            <span className="text-sm" style={{ color: C.muted }}>Fetching live routes…</span>
          </div>
        )}

        {/* Live section */}
        {sortedLive.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-2 pt-1 pb-2">
              <span className="text-xs font-bold" style={{ color: C.error }}>🔴 Live results from Transitous</span>
            </div>
            <div className="space-y-3">
              {sortedLive.map((route, i) => renderRouteCard(route, i))}
            </div>
          </div>
        )}

        {/* Divider between live and mock */}
        {sortedLive.length > 0 && sortedMock.length > 0 && (
          <div className="flex items-center gap-2 py-3">
            <div className="flex-1 h-px" style={{ background: C.border }} />
            <span className="text-xs font-semibold px-2" style={{ color: C.muted }}>📋 Sample routes</span>
            <div className="flex-1 h-px" style={{ background: C.border }} />
          </div>
        )}

        {/* Mock section */}
        {sortedMock.length > 0 && (
          <div className="space-y-3">
            {sortedMock.map((route, i) => renderRouteCard(route, i))}
          </div>
        )}

        {/* Empty state (no live + no mock, not loading) */}
        {!loading && totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Train size={40} color={C.muted} />
            <p className="mt-3 font-semibold" style={{ color: C.text }}>{t('no_routes_found')}</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>{t('try_different_cities')}</p>
            <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.primary }}>
              {t('new_search')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── SCREEN: JOURNEY DETAIL ───────────────────────────────────────────────────
function DetailScreen({ appState, dispatch }) {
  const { t } = useTranslation();
  const [addOn, setAddOn] = useState(false);
  const { selectedRoute, searchFrom, searchTo, searchFromLabel, searchToLabel } = appState;
  const route = selectedRoute;
  if (!route) return null;

  const displayFrom = searchFromLabel || searchFrom;
  const displayTo   = searchToLabel   || searchTo;
  const destCity   = getCityByName(searchTo);
  const transitPass = destCity?.transitPass;
  const total = route.totalPrice + (addOn && transitPass ? transitPass.price : 0);

  return (
    <div className="flex flex-col flex-1 pb-28 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-5 rounded-b-3xl">
        <button onClick={() => dispatch({ type:'GOTO', screen:'results' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> {t('back_to_results')}
        </button>
        <h1 className="text-white font-bold text-base leading-snug">{displayFrom} → {displayTo}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtDur(route.totalDur)}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{route.transfers === 0 ? t('direct') : `${route.transfers} ${t('transfer_label')}${route.transfers > 1 ? 's' : ''}`}</span>
          <span className="text-lg font-bold text-white ml-auto">€{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4 space-y-3">
        {route.legs.map((leg, i) => {
          const op   = OPERATORS[leg.operator];
          const tight = i < route.legs.length - 1 && transferMins(route.legs[i], route.legs[i+1]) < 10;
          return (
            <div key={i}>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)', border: leg.local ? `1.5px dashed ${C.success}40` : 'none' }}>
                {leg.local && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: C.success + '15', color: C.success }}>Local transit</span>
                    <span className="text-xs" style={{ color: C.muted }}>Included in booking</span>
                  </div>
                )}
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
                    {tight ? t('tight_connection') : ''}{transferMins(route.legs[i], route.legs[i+1])} min at {leg.to}
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
                <p className="text-xs" style={{ color: C.muted }}>{t('get_around_arrival').replace('{city}', searchTo)}</p>
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
            <span className="text-sm font-medium" style={{ color: C.muted }}>{t('total')}</span>
            <span className="text-xl font-bold" style={{ color: C.text }}>€{total.toFixed(2)}</span>
          </div>
          <button onClick={() => dispatch({ type:'START_CHECKOUT', price: total, addOn: addOn ? transitPass : null })}
            className="w-full py-3.5 rounded-xl text-base font-bold"
            style={{ background: C.accent, color: C.primary }}>
            {t('book_this_journey')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: CHECKOUT ─────────────────────────────────────────────────────────
function CheckoutScreen({ appState, dispatch }) {
  const { t } = useTranslation();
  const { checkoutStep, checkoutPrice, checkoutAddOn, selectedRoute } = appState;
  const [pax, setPax] = useState({ adults:1, children:0, students:0 });
  const route = selectedRoute;

  const totalPax  = pax.adults + pax.children + pax.students;
  const finalPrice = ((checkoutPrice || 0) * (totalPax || 1)).toFixed(2);
  // Stable ref — must not regenerate on re-render (otherwise confirmed ref ≠ displayed ref)
  const [bookingRef] = useState(() => 'EM-' + Math.random().toString(36).toUpperCase().slice(2, 10));

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
          <h1 className="text-2xl font-bold mb-2" style={{ color: C.text }}>{t('booking_confirmed')}</h1>
          <p className="text-sm mb-4" style={{ color: C.muted }}>{t('tickets_in_wallet')}</p>
          <p className="font-mono text-sm font-bold px-4 py-2 rounded-xl mb-6"
            style={{ background: C.primary + '10', color: C.primary }}>{bookingRef}</p>

          <div className="bg-white w-full rounded-2xl p-4 shadow-sm mb-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
            <p className="font-semibold text-sm mb-3" style={{ color: C.text }}>{t('journey_summary')}</p>
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
              <span className="text-sm font-semibold" style={{ color: C.text }}>{t('total_paid')}</span>
              <span className="text-sm font-bold" style={{ color: C.accent }}>€{finalPrice}</span>
            </div>
          </div>

          <button onClick={() => dispatch({ type:'GOTO', screen:'wallet' })}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-2" style={{ background: C.primary }}>
            {t('view_ticket_wallet')}
          </button>
          <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
            className="w-full py-3 rounded-xl font-semibold text-sm" style={{ color: C.muted }}>
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  const steps = [t('step_review'), t('step_passengers'), t('step_payment')];

  return (
    <div className="flex flex-col flex-1 pb-28 fade-in">
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-5 rounded-b-3xl">
        <button onClick={() => checkoutStep > 1 ? dispatch({ type:'PREV_STEP' }) : dispatch({ type:'GOTO', screen:'detail' })}
          className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ChevronRight size={14} className="rotate-180" /> {checkoutStep > 1 ? t('back') : t('back_to_journey')}
        </button>
        <h1 className="text-white font-bold text-xl">{t('checkout')}</h1>
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
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>{t('journey_review')}</p>
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
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>{t('price_breakdown')}</p>
              {route?.legs.map((leg, i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <span className="text-sm" style={{ color: C.muted }}>{OPERATORS[leg.operator].name} {t('fare_label')}</span>
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
                <span className="text-sm font-bold" style={{ color: C.text }}>{t('total')}</span>
                <span className="text-base font-bold" style={{ color: C.accent }}>€{(checkoutPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Passengers */}
        {checkoutStep === 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm fade-in">
            <p className="font-bold text-sm mb-3" style={{ color: C.text }}>{t('step_passengers')}</p>
            <PaxRow label={t('adults')}   sub={t('full_fare')}   field="adults"   />
            <PaxRow label={t('children')} sub={t('under_15')}    field="children" />
            <PaxRow label={t('students')} sub={t('valid_id')}    field="students" />
            <div className="mt-4 p-3 rounded-xl" style={{ background: C.primary + '08' }}>
              <p className="text-xs" style={{ color: C.muted }}>
                {totalPax} {totalPax !== 1 ? t('passengers_plural') : t('passenger_singular')} · {t('total')}: <strong style={{ color: C.accent }}>€{finalPrice}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {checkoutStep === 3 && (
          <div className="space-y-3 fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>{t('saved_payment')}</p>
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
              <p className="font-bold text-sm mb-3" style={{ color: C.text }}>{t('or_pay_with')}</p>
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
              <p className="text-xs" style={{ color: C.muted }}>{t('one_tap_checkout')}</p>
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
              {checkoutStep === 3 ? t('pay_now') : t('total')}
            </span>
            <span className="text-lg font-bold" style={{ color: C.text }}>€{finalPrice}</span>
          </div>
          <button onClick={() => {
              if (checkoutStep === 3) {
                // Payment confirmed → save ticket immediately, then show confirmation
                dispatch({ type:'CONFIRM_BOOKING', ref:bookingRef, passengers:pax, price:parseFloat(finalPrice), addOn:checkoutAddOn });
              } else {
                dispatch({ type:'NEXT_STEP' });
              }
            }}
            className="w-full py-3.5 rounded-xl text-base font-bold"
            style={{ background: C.accent, color: C.primary }}>
            {checkoutStep === 1 ? t('continue_btn') : checkoutStep === 2 ? t('continue_to_payment') : `${t('pay_btn')} €${finalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: WALLET ───────────────────────────────────────────────────────────
function WalletScreen({ appState, dispatch }) {
  const { t } = useTranslation();
  const { tickets } = appState;
  const [expandedId, setExpandedId] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const active = tickets.filter(tk => tk.status !== 'completed');
  const past   = tickets.filter(tk => tk.status === 'completed');

  const TicketCard = ({ ticket }) => {
    const isExp = expandedId === ticket.id;
    const orig  = getCityById(ticket.origin);
    const dest  = getCityById(ticket.destination);
    // Use stored labels if available; fall back to city name
    const displayFrom = ticket.fromLabel || orig?.name || ticket.origin;
    const displayTo   = ticket.toLabel   || dest?.name || ticket.destination;
    return (
      <div className="bg-white rounded-2xl overflow-hidden fade-in" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
        <button className="w-full text-left p-4" onClick={() => setExpandedId(isExp ? null : ticket.id)}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-2">
              <p className="text-sm font-bold mb-1 leading-snug" style={{ color: C.text }}>
                {orig?.emoji} {displayFrom}
              </p>
              <p className="text-sm font-bold mb-1 leading-snug" style={{ color: C.text }}>
                → {dest?.emoji} {displayTo}
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
              <span className="text-sm font-semibold" style={{ color: C.text }}>{t('total_paid')}</span>
              <span className="text-sm font-bold" style={{ color: C.accent }}>€{ticket.price.toFixed(2)}</span>
            </div>
            {ticket.status === 'upcoming' && (
              <button onClick={() => dispatch({ type:'GOTO', screen:'map' })}
                className="w-full mt-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white"
                style={{ background: C.primary }}>
                <Navigation size={15} /> {t('track_journey')}
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
        <h1 className="text-white font-bold text-xl">{t('my_tickets')}</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{active.length} {t('active_label')} · {past.length} {t('past_label')}</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pt-4 space-y-3">
        {active.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket size={40} color={C.muted} />
            <p className="mt-3 font-semibold" style={{ color: C.text }}>{t('no_active_tickets')}</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>{t('book_to_see_tickets')}</p>
            <button onClick={() => dispatch({ type:'GOTO', screen:'home' })}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.primary }}>
              {t('find_a_trip')}
            </button>
          </div>
        )}
        {active.map(tk => <TicketCard key={tk.id} ticket={tk} />)}

        {past.length > 0 && (
          <div>
            <button onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 py-2 w-full">
              <span className="text-sm font-semibold" style={{ color: C.muted }}>{t('past_tickets')} ({past.length})</span>
              {showPast ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
            </button>
            {showPast && past.map(tk => <TicketCard key={tk.id} ticket={tk} />)}
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ─── MAP CONFIGURATIONS (one per tracked journey) ────────────────────────────
const MAP_CONFIGS = {
  mxp_vc: {
    chipLabel: '✈️ Malpensa → Villaggio Cavour',
    title:     '✈️ Malpensa → Villaggio Cavour',
    alert:     { msg: 'Malpensa Express on time', detail: 'Platform 1 · Next stop: Saronno (~8 min)' },
    activeLeg: 0,
    initProgress: 22,
    waypoints: [
      { coords: [45.6227,  8.7282], label: 'Malpensa T1',       color: C.success },
      { coords: [45.6279,  9.0379], label: 'Saronno',           color: '#007AB3' },
      { coords: [45.4862,  9.2037], label: 'Milano Centrale',   color: '#007AB3' },
      { coords: [45.4670,  9.0222], label: 'Villaggio Cavour 🌿', color: C.accent },
    ],
    legs: [
      { op: 'trenord', vehicle: 'Malpensa Express', from: 0, to: 2, status: 'active',   delay: 0, nextStop: 'Saronno',          nextIn: 8  },
      { op: 'atm',     vehicle: 'Bus 78',           from: 2, to: 3, status: 'upcoming', delay: 0 },
    ],
  },
  muc_mil: {
    chipLabel: '🇩🇪 Munich → Milan 🇮🇹',
    title:     '🇩🇪 Munich → Milan 🇮🇹',
    alert:     { msg: '+8 min delay on EC 89 (DB)', detail: 'Transfer at Verona still possible (21 min buffer)' },
    activeLeg: 1,
    initProgress: 18,
    waypoints: [
      { coords: [48.1391, 11.5380], label: 'Westendstr.',     color: C.success },
      { coords: [48.1403, 11.5600], label: 'München Hbf',     color: '#0B6E4F' },
      { coords: [47.2632, 11.4010], label: 'Innsbruck',       color: '#E2001A' },
      { coords: [45.4289, 10.9822], label: 'Verona PN',       color: '#006940' },
      { coords: [45.4861,  9.2043], label: 'Milano Centrale', color: '#D52B1E' },
      { coords: [45.4500,  9.1693], label: 'Porta Genova',    color: C.accent  },
    ],
    legs: [
      { op: 'mvg',  vehicle: 'U5',               from: 0, to: 1, status: 'completed', delay: 0 },
      { op: 'db',   vehicle: 'EC 89',            from: 1, to: 3, status: 'active',    delay: 8, nextStop: 'Kufstein', nextIn: 18 },
      { op: 'trit', vehicle: 'RV 2161',          from: 3, to: 4, status: 'upcoming',  delay: 0 },
      { op: 'atm',  vehicle: 'M2',               from: 4, to: 5, status: 'upcoming',  delay: 0 },
    ],
  },
};

const getMapConfig = (ticket) => {
  if (!ticket) return MAP_CONFIGS.mxp_vc;
  if (ticket.route?.id?.startsWith('rmx')) return MAP_CONFIGS.mxp_vc;
  if (ticket.origin === 'munich' && ticket.destination === 'milan') return MAP_CONFIGS.muc_mil;
  return MAP_CONFIGS.mxp_vc;
};

// ─── SCREEN: MAP ──────────────────────────────────────────────────────────────
function MapScreen({ appState, dispatch }) {
  const { t } = useTranslation();

  // Ticket switcher
  const upcomingTickets = appState.tickets.filter(tk => tk.status !== 'completed');
  const [trackedId, setTrackedId] = useState(upcomingTickets[0]?.id ?? null);
  const tracked = upcomingTickets.find(tk => tk.id === trackedId) ?? upcomingTickets[0];
  const cfg = getMapConfig(tracked);

  // Progress animation — resets when ticket changes
  const [progress, setProgress] = useState(cfg.initProgress);
  useEffect(() => { setProgress(cfg.initProgress); }, [trackedId]);
  useEffect(() => {
    const timer = setInterval(() => setProgress(p => p >= 95 ? 95 : +(p + 0.15).toFixed(2)), 400);
    return () => clearInterval(timer);
  }, []);

  const { waypoints: WAYPOINTS, legs: MAP_LEGS, activeLeg, title, alert: alertCfg } = cfg;
  const activeMapLeg = MAP_LEGS[activeLeg];

  // Interpolate vehicle position
  const legPct = Math.min(1, progress / 100);
  const interpPoints = [];
  for (let i = activeMapLeg.from; i <= activeMapLeg.to; i++) interpPoints.push(WAYPOINTS[i].coords);
  const totalSeg = interpPoints.length - 1;
  const segIdx   = Math.min(Math.floor(legPct * totalSeg), totalSeg - 1);
  const segPct   = legPct * totalSeg - segIdx;
  const c1 = interpPoints[segIdx];
  const c2 = interpPoints[Math.min(segIdx + 1, interpPoints.length - 1)];
  const vehiclePos = [c1[0] + (c2[0] - c1[0]) * segPct, c1[1] + (c2[1] - c1[1]) * segPct];

  const polylines = MAP_LEGS.map(leg => ({
    pts:    Array.from({ length: leg.to - leg.from + 1 }, (_, k) => WAYPOINTS[leg.from + k].coords),
    color:  leg.status === 'completed' ? C.success : leg.status === 'active' ? C.primary : C.muted,
    dashed: leg.status === 'upcoming',
    weight: leg.status === 'active' ? 4 : 3,
  }));
  const mapBounds  = WAYPOINTS.map(w => w.coords);
  const isDelay    = alertCfg.msg.startsWith('+');

  return (
    <div className="flex flex-col flex-1 pb-20 fade-in">
      {/* Header */}
      <div style={{ background: C.primary }} className="px-5 pt-10 pb-4 rounded-b-3xl">
        <h1 className="text-white font-bold text-lg">{title}</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('live_nav_subtitle')}</p>
      </div>

      {/* Ticket switcher chips */}
      {upcomingTickets.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {upcomingTickets.map(tk => {
            const tcfg   = getMapConfig(tk);
            const active = tk.id === tracked?.id;
            return (
              <button key={tk.id} onClick={() => setTrackedId(tk.id)}
                className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={active
                  ? { background: C.accent, color: C.primary }
                  : { background: 'white',  color: C.muted, border: `1px solid ${C.border}` }}>
                {tcfg.chipLabel}
                <span className="ml-1.5 opacity-60">{tk.date.slice(5).replace('-', '/')}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Alert banner */}
      <div className="mx-4 mt-3 p-3 rounded-2xl flex items-start gap-3"
        style={{ background: isDelay ? '#FFF3CD' : '#E8F5E9', border: `1px solid ${isDelay ? '#FFE082' : '#A5D6A7'}` }}>
        <AlertTriangle size={16} color={isDelay ? C.warning : C.success} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold" style={{ color: isDelay ? '#856404' : '#2E7D32' }}>{alertCfg.msg}</p>
          <p className="text-xs" style={{ color: isDelay ? '#856404' : '#2E7D32' }}>{alertCfg.detail}</p>
        </div>
      </div>

      {/* Map */}
      <div className="mx-4 mt-3 rounded-3xl overflow-hidden shadow-lg" style={{ height: 255 }}>
        <MapContainer key={trackedId} bounds={mapBounds} boundsOptions={{ padding: [32, 32] }}
          style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {polylines.map((pl, i) => (
            <Polyline key={i} positions={pl.pts}
              pathOptions={{ color: pl.color, weight: pl.weight, opacity: pl.dashed ? 0.5 : 1, dashArray: pl.dashed ? '10 7' : undefined }} />
          ))}
          {WAYPOINTS.map((wp, i) => {
            const isStart  = i === 0;
            const isEnd    = i === WAYPOINTS.length - 1;
            const isPassed = i <= activeMapLeg.from;
            return (
              <CircleMarker key={i} center={wp.coords} radius={isStart || isEnd ? 9 : 6}
                pathOptions={{ fillColor: isPassed ? C.success : isEnd ? C.accent : 'white', fillOpacity: 1, color: isPassed ? C.success : wp.color, weight: 2.5 }}>
                <Popup>
                  <strong>{wp.label}</strong>
                  {isStart && <div style={{ color: C.success }}>🟢 Journey start</div>}
                  {isEnd   && <div style={{ color: C.accent  }}>🏁 Destination</div>}
                </Popup>
              </CircleMarker>
            );
          })}
          <CircleMarker center={vehiclePos} radius={11}
            pathOptions={{ fillColor: C.success, fillOpacity: 1, color: 'white', weight: 2.5 }}>
            <Popup><strong>{activeMapLeg.vehicle}</strong> · In transit<br />Next: {activeMapLeg.nextStop} (~{activeMapLeg.nextIn} min)</Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      {/* Progress + leg list */}
      <div className="mx-4 mt-3 overflow-y-auto scrollable space-y-3 pb-2" style={{ maxHeight: 195 }}>
        {/* Active leg card */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: C.success, animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
              <span className="text-sm font-bold" style={{ color: C.text }}>{activeMapLeg.vehicle} — {t('live_tracking')}</span>
            </div>
            <OperatorBadge opId={activeMapLeg.op} />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-xs" style={{ color: C.muted }}>{t('next_stop')}</p>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{activeMapLeg.nextStop}</p>
              <p className="text-xs" style={{ color: C.muted }}>in ~{activeMapLeg.nextIn} min</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: C.muted }}>{t('leg_arrival')}</p>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{WAYPOINTS[activeMapLeg.to].label}</p>
              {activeMapLeg.delay > 0
                ? <p className="text-xs font-semibold" style={{ color: C.warning }}>+{activeMapLeg.delay} min</p>
                : <p className="text-xs" style={{ color: C.success }}>On time</p>}
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs" style={{ color: C.muted }}>{t('overall')}</p>
              <p className="text-xl font-bold" style={{ color: C.primary }}>{Math.round(progress)}%</p>
              <div className="w-16 h-2 rounded-full mt-1" style={{ background: C.border }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ background: C.success, width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Leg timeline */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>{t('journey_legs')}</p>
          {MAP_LEGS.map((leg, i) => {
            const op          = OPERATORS[leg.op];
            const isCompleted = leg.status === 'completed';
            const isActive    = leg.status === 'active';
            return (
              <div key={i} className="flex items-start gap-3 pb-3 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: isCompleted ? C.success : isActive ? (op?.color || C.primary) : C.border }}>
                    {isCompleted ? <Check size={13} color="white" /> : <VehicleIcon type={op?.type || 'rail'} size={12} />}
                  </div>
                  {i < MAP_LEGS.length - 1 && <div className="w-0.5 h-6 mt-1" style={{ background: isCompleted ? C.success : C.border }} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: C.text }}>{WAYPOINTS[leg.from].label} → {WAYPOINTS[leg.to].label}</span>
                    {isCompleted && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: C.success + '15', color: C.success }}>{t('done')}</span>}
                    {isActive    && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: C.primary + '15', color: C.primary }}>{t('in_transit')}</span>}
                    {leg.delay > 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: C.warning + '15', color: C.warning }}>+{leg.delay}m</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <OperatorBadge opId={leg.op} />
                    <span className="text-xs" style={{ color: C.muted }}>{leg.vehicle}</span>
                    {!isCompleted && !isActive && <span className="text-xs" style={{ color: C.muted }}>· {t('scheduled')}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE ──────────────────────────────────────────────────────────
function ProfileScreen({ appState, dispatch }) {
  const { t } = useTranslation();
  const [prefs,  setPrefs]  = useState({ transfers:false, cheapest:false, fastest:true });
  const [notifs, setNotifs] = useState({ delays:true, promos:false, reminders:true });

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
        <Section title={t('payment_methods')}>
          <Row label="•••• 4242 (Visa)">
            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: C.success + '15', color: C.success }}>{t('default_label')}</span>
          </Row>
          <button className="flex items-center gap-2 mt-2 text-sm font-semibold" style={{ color: C.primary }}>
            <Plus size={14} /> {t('add_payment')}
          </button>
        </Section>

        <Section title={t('travel_preferences')}>
          <Row label={t('pref_fewer_transfers')}><Toggle value={prefs.transfers} onChange={v => setPrefs(p => ({...p, transfers:v}))} /></Row>
          <Row label={t('pref_cheapest')}><Toggle value={prefs.cheapest}  onChange={v => setPrefs(p => ({...p, cheapest:v}))}  /></Row>
          <Row label={t('pref_fastest')}><Toggle value={prefs.fastest}   onChange={v => setPrefs(p => ({...p, fastest:v}))}   /></Row>
        </Section>

        <Section title={t('notifications')}>
          <Row label={t('notif_delays')}><Toggle value={notifs.delays}     onChange={v => setNotifs(p => ({...p, delays:v}))}     /></Row>
          <Row label={t('notif_promos')}><Toggle value={notifs.promos}     onChange={v => setNotifs(p => ({...p, promos:v}))}     /></Row>
          <Row label={t('notif_reminders')}><Toggle value={notifs.reminders}  onChange={v => setNotifs(p => ({...p, reminders:v}))}  /></Row>
        </Section>

        <Section title={t('app_settings')}>
          <Row label={t('language_label')}>
            <select value={appState.language} onChange={e => dispatch({ type: 'SET_LANGUAGE', language: e.target.value })}
              className="text-sm rounded-lg px-2 py-1 border outline-none" style={{ borderColor: C.border, color: C.text }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </Row>
          <Row label={t('home_city')}>
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
  const { t } = useTranslation();
  const tabs = [
    { id:'home',    icon:Home,   label:t('nav_home')    },
    { id:'results', icon:Search, label:t('nav_search')  },
    { id:'wallet',  icon:Ticket, label:t('nav_tickets'), badge: ticketCount },
    { id:'map',     icon:Map,    label:t('nav_map')     },
    { id:'profile', icon:User,   label:t('nav_profile') },
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
  searchFrom: '',
  searchTo: '',
  searchFromLabel: '',
  searchToLabel: '',
  searchDate: '',
  fromCoords: null,
  toCoords: null,
  selectedRoute: null,
  checkoutStep: 1,
  checkoutPrice: 0,
  checkoutAddOn: null,
  passengers: { adults:1, children:0, students:0 },
  tickets: INIT_TICKETS,
  language: 'en',
};

function reducer(state, action) {
  switch (action.type) {
    case 'GOTO':       return { ...state, screen: action.screen };
    case 'SEARCH':     return { ...state, screen:'results', searchFrom: action.from, searchTo: action.to, searchFromLabel: action.fromLabel || action.from, searchToLabel: action.toLabel || action.to, searchDate: action.date || '', fromCoords: action.fromCoords || null, toCoords: action.toCoords || null };
    case 'SELECT_ROUTE': return { ...state, screen:'detail', selectedRoute: action.route };
    case 'START_CHECKOUT': return { ...state, screen:'checkout', checkoutStep:1, checkoutPrice: action.price, checkoutAddOn: action.addOn };
    case 'NEXT_STEP':  return { ...state, checkoutStep: Math.min(4, state.checkoutStep + 1) };
    case 'PREV_STEP':  return { ...state, checkoutStep: Math.max(1, state.checkoutStep - 1) };
    case 'CONFIRM_BOOKING': {
      const route = state.selectedRoute;
      // Prefer the route's own origin/destination so in-city routes (origin===destination)
      // work correctly; fall back to city-name resolution, then generic defaults.
      const originId = route?.origin      || getCityByName(state.searchFrom)?.id || 'milan';
      const destId   = route?.destination || getCityByName(state.searchTo)?.id   || 'milan';
      const newTicket = {
        id: 't' + Date.now(),
        ref: action.ref,
        origin:      originId,
        destination: destId,
        fromLabel:   state.searchFromLabel || state.searchFrom,
        toLabel:     state.searchToLabel   || state.searchTo,
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
      // Stay on checkout screen at step 4 (confirmation UI) — ticket is already saved.
      // Buttons on step 4 navigate to wallet or home via GOTO.
      return { ...state, screen:'checkout', checkoutStep: 4, tickets: [newTicket, ...state.tickets] };
    }
    case 'SET_LANGUAGE': return { ...state, language: action.language };
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
    <LanguageContext.Provider value={appState.language}>
      <div className="app-shell">
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {screens[appState.screen] || screens.home}
        </div>
        <BottomNav screen={appState.screen} dispatch={dispatch} ticketCount={activeTickets} />
      </div>
    </LanguageContext.Provider>
  );
}
