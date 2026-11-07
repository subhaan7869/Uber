import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Gauge, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Star, 
  Navigation, 
  Clock, 
  ChevronRight, 
  DollarSign, 
  CloudRain, 
  Calendar, 
  Trophy, 
  Send,
  AlertCircle,
  AlertTriangle,
  Activity,
  Award,
  Plus,
  Shield,
  Coffee,
  CheckCircle2,
  List
} from 'lucide-react';
import { UserProfile, CompletedTrip, Location } from '../types';

interface Incident {
  id: string;
  type: 'closure' | 'accident' | 'traffic' | 'checkpoint' | 'event';
  title: string;
  locationName: string;
  minutesDelay: number;
  severity: 'low' | 'medium' | 'high';
}

interface CommandCentreScreenProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  location: Location | null;
  activeSurgeAreas: any[];
  hotspots: any[];
  activeCityCenter: Location;
  activeBrand: 'uber' | 'hyper' | 'both';
  weatherState: 'clear' | 'rainy' | 'sunset' | 'night';
  setWeatherState: (state: 'clear' | 'rainy' | 'sunset' | 'night') => void;
  fuel: number;
  setFuel: React.Dispatch<React.SetStateAction<number>>;
  vehicleHealth: number;
  setVehicleHealth: React.Dispatch<React.SetStateAction<number>>;
  todayEarningsTotal: number;
  completedTrips: CompletedTrip[];
  onClose: () => void;
  selectedGoal: 'none' | '50' | '100' | '200';
  setSelectedGoal: (goal: 'none' | '50' | '100' | '200') => void;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  aiMessages: { id: string; text: string; timestamp: string; category: 'demand' | 'traffic' | 'system' | 'tip' }[];
  setAiMessages: React.Dispatch<React.SetStateAction<{ id: string; text: string; timestamp: string; category: 'demand' | 'traffic' | 'system' | 'tip' }[]>>;
  reputation: { speed: number; friendliness: number; foodHandling: number; navigation: number; acceptanceRate: number };
  personalRecords: { highestHourly: number; biggestTip: number; longestShift: number; bestDay: number; mostTripsInHour: number };
  activeOrders: any[];
  scheduledOrders: any[];
  addToast: (title: string, body: string, type?: 'info' | 'success' | 'alert' | 'message') => void;
}

export const CommandCentreScreen: React.FC<CommandCentreScreenProps> = ({
  user,
  setUser,
  location,
  activeSurgeAreas,
  hotspots,
  activeCityCenter,
  activeBrand,
  weatherState,
  setWeatherState,
  fuel,
  setFuel,
  vehicleHealth,
  setVehicleHealth,
  todayEarningsTotal,
  completedTrips,
  onClose,
  selectedGoal,
  setSelectedGoal,
  incidents,
  setIncidents,
  aiMessages,
  setAiMessages,
  reputation,
  personalRecords,
  activeOrders,
  scheduledOrders,
  addToast
}) => {
  // Core Operational States
  const [selectedZone, setSelectedZone] = useState<string>('Piccadilly');
  const [jarvisCommand, setJarvisCommand] = useState<string>('');
  const [jarvisResponse, setJarvisResponse] = useState<string>(
    'Awaiting instructions, Commander. Select a quick query below or enter a custom prompt.'
  );
  const [isJarvisTyping, setIsJarvisTyping] = useState<boolean>(false);
  const [forecastTab, setForecastTab] = useState<'timeline' | 'periods'>('timeline');
  const [showReportIncident, setShowReportIncident] = useState<boolean>(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    locationName: '',
    type: 'traffic' as 'traffic' | 'accident' | 'closure' | 'checkpoint' | 'event',
    severity: 'medium' as 'low' | 'medium' | 'high',
    minutesDelay: 10
  });

  // Digital Dispatch Clock
  const [dispatchTime, setDispatchTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setDispatchTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Zones Database (Simulated high-tech driver hotspots)
  const DRIVER_ZONES = [
    { id: 'zone_piccadilly', name: 'Piccadilly Circus', type: 'Business & Retail', status: 'High Demand', surge: '2.1x', waitTime: '4 min', queue: 5, bg: 'from-orange-500/20 to-red-500/10' },
    { id: 'zone_heathrow', name: 'Heathrow Airport T5', type: 'Airport Queue', status: 'Surge Building', surge: '2.5x', waitTime: '18 min', queue: 22, bg: 'from-blue-500/20 to-indigo-500/10' },
    { id: 'zone_shoreditch', name: 'Shoreditch High St', type: 'Nightlife & Cafes', status: 'Very Active', surge: '1.8x', waitTime: '2 min', queue: 3, bg: 'from-purple-500/20 to-pink-500/10' },
    { id: 'zone_bloomsbury', name: 'Bloomsbury Square', type: 'Student Area', status: 'Moderate', surge: '1.4x', waitTime: '6 min', queue: 8, bg: 'from-emerald-500/20 to-teal-500/10' },
    { id: 'zone_westfield', name: 'Westfield Stratford', type: 'Shopping Centre', status: 'Heavy Congestion', surge: '1.9x', waitTime: '9 min', queue: 14, bg: 'from-yellow-500/20 to-amber-500/10' },
    { id: 'zone_chelsea', name: 'Chelsea Harbour', type: 'High-End Quiet', status: 'Low Activity', surge: '1.0x', waitTime: '12 min', queue: 2, bg: 'from-slate-500/20 to-neutral-500/10' }
  ];

  const currentZoneDetails = DRIVER_ZONES.find(z => z.name === selectedZone) || DRIVER_ZONES[0];

  // AI Dispatch Jarvis command prompt logic
  const handleJarvisCommand = (command: string) => {
    if (!command.trim()) return;
    setIsJarvisTyping(true);
    setJarvisResponse('Analyzing telemetry data feeds...');

    setTimeout(() => {
      let response = '';
      const cmdLower = command.toLowerCase();

      if (cmdLower.includes('surge') || cmdLower.includes('east') || cmdLower.includes('where')) {
        response = `Tactical Dispatch: Strongest surge detected around ${selectedZone === 'Heathrow Airport T5' ? 'Heathrow Terminal 5 (+£8.00 Peak)' : 'Piccadilly Circus and Soho (+£5.50 Surge)'}. Move closer to exploit short queue delays.`;
      } else if (cmdLower.includes('airport') || cmdLower.includes('flight')) {
        response = 'Flight arrivals tracking online. 14 incoming flights from Europe & North America arriving in next 35 mins. Average taxi loop queue is 22 cars. Wait: 15-20 mins.';
      } else if (cmdLower.includes('demand') || cmdLower.includes('hour') || cmdLower.includes('forecast')) {
        const nextPeriod = weatherState === 'rainy' ? 'Heavy downpour' : 'Standard evening rush';
        response = `Forecast Alert: ${nextPeriod} incoming in 15 mins. Eats delivery demand will spike by +45% in student areas, while premium rides will rise in shopping hubs. Plan fuel accordingly.`;
      } else if (cmdLower.includes('break') || cmdLower.includes('tired')) {
        response = 'Warning: Active drive duration is approaching optimal limits. Recommend 15-minute break. Rest reduces risk parameters by 60% and maintains high service ratings.';
      } else {
        response = `Jarvis AI Core: Command parsed. Active brand network (${activeBrand.toUpperCase()}) optimized. System is feeding active orders. Proceed to high surge zones. Current target zone: ${selectedZone}.`;
      }

      setJarvisResponse(response);
      setIsJarvisTyping(false);
      setJarvisCommand('');
    }, 1200);
  };

  // Incident reporting submit handler
  const handleReportIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.locationName) {
      addToast('Error', 'Please fill in all details for the incident report.', 'alert');
      return;
    }

    const created: Incident = {
      id: `reported_${Date.now()}`,
      type: newIncident.type,
      title: newIncident.title,
      locationName: newIncident.locationName,
      minutesDelay: Number(newIncident.minutesDelay),
      severity: newIncident.severity
    };

    setIncidents(prev => [created, ...prev]);
    // Append to AI dispatcher feed as well
    setAiMessages(prev => [
      {
        id: `ai_${Date.now()}`,
        text: `DRIVER REPORTED: ${created.title} at ${created.locationName}. Rerouting surrounding fleet vehicles.`,
        timestamp: 'Just now',
        category: 'traffic'
      },
      ...prev
    ]);

    addToast('Incident Reported!', `Successfully broadcasted '${created.title}' to the network.`, 'success');
    setShowReportIncident(false);
    setNewIncident({
      title: '',
      locationName: '',
      type: 'traffic',
      severity: 'medium',
      minutesDelay: 10
    });
  };

  // Smart Earnings Predictor Dynamic calculations
  const calculateEstimatedEarnings = (minutes: number) => {
    let baseRate = 22.00; // Average hourly rate in London
    if (weatherState === 'rainy') baseRate *= 1.35;
    if (activeBrand === 'both') baseRate *= 1.25; // Dual-app multiplier
    
    // Period surge adjustments
    const hours = minutes / 60;
    const est = baseRate * hours;
    const low = est * 0.9;
    const high = est * 1.15;
    return `£${low.toFixed(2)} – £${high.toFixed(2)}`;
  };

  // Goal Mode calculation values
  const numericGoal = selectedGoal === 'none' ? 0 : Number(selectedGoal);
  const goalProgressPercent = numericGoal > 0 ? Math.min(100, (todayEarningsTotal / numericGoal) * 100) : 0;
  const goalRemaining = numericGoal > 0 ? Math.max(0, numericGoal - todayEarningsTotal) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[4900] bg-neutral-950 text-white overflow-y-auto font-sans flex flex-col"
    >
      {/* 1. Tactical Command Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-[4910] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
            <Gauge size={22} />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black tracking-wider uppercase font-sans flex items-center gap-1.5 text-neutral-100">
              TACTICAL COMMAND CENTRE
              <span className="px-2 py-0.5 bg-red-600 rounded-md text-[8px] font-black tracking-widest text-white animate-pulse">
                SECURE
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
              Operational Fleet Supervisor • {activeCityCenter.latitude.toFixed(4)}°N, {activeCityCenter.longitude.toFixed(4)}°W
            </p>
          </div>
        </div>

        {/* Realtime Stats HUD */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-3 py-1 bg-neutral-800/80 border border-neutral-700/60 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">SYS_ONLINE</span>
          </div>
          
          <div className="px-3 py-1 bg-neutral-850 border border-neutral-800 rounded-lg flex items-center gap-2">
            <Activity className="text-blue-400 animate-pulse" size={12} />
            <span className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-tight">{dispatchTime} UTC</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setWeatherState(weatherState === 'clear' ? 'rainy' : weatherState === 'rainy' ? 'night' : 'clear');
                addToast("Weather Command Sent", `Atmospheric state synced to ${weatherState.toUpperCase()}`, "info");
              }}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-gray-300 transition-all cursor-pointer"
              title="Toggle Atmospheric State"
            >
              <CloudRain size={16} className={weatherState === 'rainy' ? 'text-blue-400 animate-bounce' : 'text-yellow-400'} />
            </button>
            
            <button 
              onClick={onClose}
              className="p-2 bg-neutral-800 hover:bg-red-600 text-gray-300 hover:text-white border border-neutral-700 rounded-lg transition-all cursor-pointer"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Dashboard Layout */}
      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-24">
        
        {/* ================= COLUMN 1 ================= */}
        <div className="space-y-6 flex flex-col">
          
          {/* A. AI Dispatch Jarvis Assistant */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Jarvis AI Dispatcher</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tactical Guidance Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[8px] font-black text-blue-400 tracking-wider uppercase">ACTIVE ENGINE</span>
              </div>
            </div>

            {/* Jarvis Visualizer & Output Screen */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 flex-1 flex flex-col justify-between gap-4 mb-4 min-h-[140px]">
              <div className="text-left font-sans text-xs leading-relaxed text-gray-300">
                <p className="text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-widest font-mono">SYS_RESPONSE:</p>
                {jarvisResponse}
              </div>
              
              {/* Pulsing visualizer lines */}
              <div className="flex items-center justify-center gap-0.5 h-4">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                  <motion.div 
                    key={`vis-${i}`}
                    animate={{ height: isJarvisTyping ? [4, h * 3, 4] : [4, 6, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.04 }}
                    className="w-1 bg-blue-500 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Input & Quick commands */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-1.5">
                <input 
                  type="text"
                  placeholder="Command Jarvis..."
                  value={jarvisCommand}
                  onChange={(e) => setJarvisCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJarvisCommand(jarvisCommand)}
                  className="bg-transparent border-none outline-none flex-1 text-xs text-white placeholder-gray-500 font-sans"
                />
                <button 
                  onClick={() => handleJarvisCommand(jarvisCommand)}
                  disabled={isJarvisTyping || !jarvisCommand.trim()}
                  className="p-1.5 hover:bg-neutral-800 text-blue-400 disabled:text-neutral-700 disabled:bg-transparent rounded-lg transition-all cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>

              {/* Quick Prompt Suggetions */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { text: 'Find Surge Area', cmd: 'Find nearest surge area' },
                  { text: 'Airport Status', cmd: 'Show airport flight status' },
                  { text: 'Demand Prediction', cmd: 'Predict next hour demand' },
                  { text: 'Break Recommendation', cmd: 'Need a break recommendation' }
                ].map((s, idx) => (
                  <button
                    key={`sug-${idx}`}
                    onClick={() => handleJarvisCommand(s.cmd)}
                    className="py-1.5 px-2 bg-neutral-850 border border-neutral-800 text-left rounded-lg text-[9px] font-black tracking-tight text-gray-400 hover:text-white hover:bg-neutral-800 hover:border-blue-500/35 transition-all truncate"
                  >
                    🚀 {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* B. Smart Earnings Predictor */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={16} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Smart Earnings Predictor</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Real-time Surge Math</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 font-mono font-black text-emerald-400 rounded-full">
                {weatherState === 'rainy' ? '1.35x WEATHER RAIN' : 'OPTIMIZED'}
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-snug text-left mb-4">
              Estimated driver payout estimates based on current fleet demand density, hourly booking rates, and active surge levels:
            </p>

            <div className="space-y-3">
              {[
                { time: '30 mins session', min: 30, color: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5' },
                { time: '1 hour session', min: 60, color: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5' },
                { time: '2 hours session', min: 120, color: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5' }
              ].map((p, idx) => (
                <div 
                  key={`pred-${idx}`}
                  className={`border rounded-2xl p-3 flex justify-between items-center transition-all ${p.color}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black text-white uppercase tracking-tight">{p.time}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Based on local telemetry</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-black text-emerald-400">{calculateEstimatedEarnings(p.min)}</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">NET PAYOUT</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2 ================= */}
        <div className="space-y-6 flex flex-col lg:col-span-1">
          
          {/* C. Live Tactical Radar Map & Driver Zones */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex-1 flex flex-col justify-between overflow-hidden relative">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MapPin size={16} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Tactical Radar & Zones</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Interactive Sector Hotspots</p>
                </div>
              </div>
            </div>

            {/* Tactical Vector Wireframe Map Canvas */}
            <div className="h-[210px] bg-neutral-950 rounded-2xl border border-neutral-800 relative overflow-hidden flex items-center justify-center">
              
              {/* Background Radar Grid Circles */}
              <div className="absolute w-[280px] h-[280px] border border-neutral-800/40 rounded-full pointer-events-none" />
              <div className="absolute w-[200px] h-[200px] border border-neutral-800/40 rounded-full pointer-events-none" />
              <div className="absolute w-[120px] h-[120px] border border-neutral-800/40 rounded-full pointer-events-none" />
              
              {/* Sweep Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/15 origin-center animate-spin pointer-events-none" style={{ animationDuration: '8s' }} />
              
              {/* Pulsing tactical radar signal rings */}
              <div className="absolute w-[80px] h-[80px] border border-blue-500/20 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />

              {/* Map Zones overlay pins */}
              <div className="absolute top-[40px] left-[60px] z-10">
                <button 
                  onClick={() => setSelectedZone('Chelsea Harbour')}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Chelsea Harbour' ? 'bg-slate-500 border-white scale-125' : 'bg-slate-500/60 border-slate-400 hover:scale-110'}`}
                  title="Chelsea Harbour (Quiet)"
                />
              </div>

              <div className="absolute top-[35px] right-[75px] z-10">
                <button 
                  onClick={() => setSelectedZone('Shoreditch High St')}
                  className={`relative w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Shoreditch High St' ? 'bg-purple-500 border-white scale-125' : 'bg-purple-500/60 border-purple-400 hover:scale-110'}`}
                  title="Shoreditch (Nightlife)"
                >
                  <span className="absolute -inset-1 rounded-full border border-purple-400/50 animate-ping" />
                </button>
              </div>

              <div className="absolute top-[105px] left-[135px] z-10">
                <button 
                  onClick={() => setSelectedZone('Piccadilly Circus')}
                  className={`relative w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Piccadilly Circus' ? 'bg-orange-500 border-white scale-125 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : 'bg-orange-500/60 border-orange-400 hover:scale-110'}`}
                  title="Piccadilly Circus (Business district)"
                >
                  <span className="absolute -inset-1.5 rounded-full border border-orange-400/50 animate-ping" />
                  <span className="text-[8px] font-sans font-black text-white">2.1</span>
                </button>
              </div>

              <div className="absolute bottom-[45px] left-[55px] z-10">
                <button 
                  onClick={() => setSelectedZone('Heathrow Airport T5')}
                  className={`relative w-7 h-7 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Heathrow Airport T5' ? 'bg-blue-600 border-white scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-600/60 border-blue-400 hover:scale-110'}`}
                  title="Heathrow Airport T5"
                >
                  <span className="absolute -inset-2 rounded-full border border-blue-400/45 animate-ping" style={{ animationDuration: '3s' }} />
                  <span className="text-[9px] font-sans font-black text-white">2.5</span>
                </button>
              </div>

              <div className="absolute bottom-[35px] right-[65px] z-10">
                <button 
                  onClick={() => setSelectedZone('Westfield Stratford')}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Westfield Stratford' ? 'bg-yellow-500 border-white scale-125' : 'bg-yellow-500/60 border-yellow-400 hover:scale-110'}`}
                  title="Westfield Stratford (Shopping Centre)"
                />
              </div>

              <div className="absolute top-[90px] right-[115px] z-10">
                <button 
                  onClick={() => setSelectedZone('Bloomsbury Square')}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedZone === 'Bloomsbury Square' ? 'bg-emerald-500 border-white scale-125' : 'bg-emerald-500/60 border-emerald-400 hover:scale-110'}`}
                  title="Bloomsbury Square (Student Area)"
                />
              </div>

              {/* Coordinates Indicator */}
              <div className="absolute bottom-2 left-3 bg-black/85 border border-neutral-800 rounded px-1.5 py-0.5 text-[7.5px] font-mono font-bold tracking-widest text-neutral-400">
                SECTOR_RADAR_MAP_V2
              </div>

              {/* Overlay Selected Indicator */}
              <div className="absolute top-2 right-3 bg-black/85 border border-neutral-800 rounded px-2 py-0.5 text-[9px] font-sans font-black tracking-tight text-indigo-400 uppercase">
                {selectedZone} Sector
              </div>
            </div>

            {/* Selected Zone Detail Panel */}
            <div className={`mt-4 bg-gradient-to-r ${currentZoneDetails.bg} border border-neutral-800 rounded-2xl p-4 text-left transition-all duration-300`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-display font-black text-sm uppercase tracking-tight text-white leading-none">
                  {currentZoneDetails.name}
                </h3>
                <span className="text-xs font-mono font-black text-amber-400">{currentZoneDetails.surge} Surge</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Sector Class</p>
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight mt-0.5 truncate">{currentZoneDetails.type}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Est Queue Wait</p>
                  <p className="text-[10px] font-mono font-black text-blue-400 mt-0.5">{currentZoneDetails.waitTime}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Active Cars</p>
                  <p className="text-[10px] font-mono font-black text-neutral-300 mt-0.5">{currentZoneDetails.queue} Units</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    addToast("Target Intercept Set", `Navigating GPS coordinates to ${currentZoneDetails.name}. Surge multiplier aligned!`, "success");
                    // Simulate selecting zone in Jarvis
                    handleJarvisCommand(`Tell me more about ${currentZoneDetails.name}`);
                  }}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer active:scale-95"
                >
                  🎯 Mark Target Sector
                </button>
              </div>
            </div>
          </div>

          {/* D. 📡 Demand Forecast Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar size={16} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">📡 Demand Forecast</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Chronos Demand Cycles</p>
                </div>
              </div>

              {/* Mini Tabs */}
              <div className="flex bg-neutral-950 p-1 border border-neutral-800 rounded-lg">
                <button 
                  onClick={() => setForecastTab('timeline')}
                  className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase transition-all cursor-pointer ${forecastTab === 'timeline' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}
                >
                  Timeline
                </button>
                <button 
                  onClick={() => setForecastTab('periods')}
                  className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase transition-all cursor-pointer ${forecastTab === 'periods' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}
                >
                  Periods
                </button>
              </div>
            </div>

            {/* Smart Forecast Alerts */}
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left">
              <p className="text-[9.5px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <AlertTriangle size={10} className="animate-pulse" /> Forecast Alert
              </p>
              <p className="text-[10.5px] text-gray-300 mt-1 font-sans leading-normal">
                {weatherState === 'rainy' 
                  ? "“Rain detected. Takeaway delivery demand predicted to rise in 15 minutes by +35%.”" 
                  : "“Airport evening rush expected in 35 minutes. Shoreditch bar rush rising in 50 minutes.”"
                }
              </p>
            </div>

            {forecastTab === 'timeline' ? (
              <div className="space-y-3">
                {[
                  { time: '07:00 – 10:00', label: '🍳 Breakfast Loop', desc: 'Coffee, Cafés, Bakeries', multiplier: '1.6x', active: false },
                  { time: '11:30 – 14:00', label: '🍔 Office Lunch', desc: 'Schools, Work-from-home hubs', multiplier: '1.7x', active: false },
                  { time: '17:00 – 21:00', label: '🍕 Dinner Surge', desc: 'Family deliveries, restaurants', multiplier: '2.4x', active: true },
                  { time: '21:00 – 01:00', label: '🌙 Late Night Takeout', desc: 'Pubs, nightclubs, takeaways', multiplier: '1.9x', active: false }
                ].map((f, idx) => (
                  <div 
                    key={`fc-${idx}`}
                    className={`border rounded-2xl p-3 flex justify-between items-center transition-all ${
                      f.active 
                        ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.06)]' 
                        : 'border-neutral-850 hover:border-neutral-800'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-white tracking-tight uppercase leading-none">{f.label}</span>
                        {f.active && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[7px] font-black tracking-widest rounded leading-none uppercase">
                            ACTIVE CURRENTLY
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-wide">{f.desc} • {f.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-amber-400">{f.multiplier} Surge</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">🍳 Breakfast Peak (8:00 – 9:30 AM)</p>
                  <p className="text-[10.5px] text-gray-300 mt-1">High volume coffee shop orders, bakery items, and fast-food breakfast combos drive this slot.</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">🍔 Lunch Peak (12:00 – 1:30 PM)</p>
                  <p className="text-[10.5px] text-gray-300 mt-1">Central business sectors, high school clusters, and work-from-home areas dominate sandwich and salad delivery.</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">🍕 Dinner Peak (18:00 – 20:00 PM)</p>
                  <p className="text-[10.5px] text-gray-300 mt-1">This is the peak financial interval of the entire day. Restaurant dine-in slots generate stacked food courier queues.</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ================= COLUMN 3 ================= */}
        <div className="space-y-6 flex flex-col">
          
          {/* E. 🎯 Goal Mode Tracker */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Trophy size={16} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">🎯 Shift Goal Mode</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pre-selected Target Tracker</p>
                </div>
              </div>
            </div>

            {selectedGoal === 'none' ? (
              <div className="py-6 text-center">
                <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Select target goal before shift:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '50', label: '£50 Goal', color: 'border-blue-500/30 text-blue-400' },
                    { val: '100', label: '£100 Goal', color: 'border-purple-500/30 text-purple-400' },
                    { val: '200', label: '£200 Goal', color: 'border-amber-500/30 text-amber-400' }
                  ].map((g, idx) => (
                    <button
                      key={`goal-sel-${idx}`}
                      onClick={() => {
                        setSelectedGoal(g.val as any);
                        addToast("Shift Goal Activated", `Goal set to £${g.val}. Tracking progress live!`, "success");
                      }}
                      className="py-3 px-2 border hover:bg-neutral-800 rounded-2xl text-xs font-black transition-all cursor-pointer active:scale-95"
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Circular ring simulator or clean visual progress bar */}
                <div className="flex justify-between items-center bg-neutral-950 rounded-2xl p-4 border border-neutral-850">
                  <div className="text-left">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Shift progress</p>
                    <p className="text-2xl font-mono font-black text-white mt-1">£{todayEarningsTotal.toFixed(2)}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">TARGET: £{numericGoal.toFixed(2)}</p>
                  </div>

                  <div className="relative w-16 h-16 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#262626" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#3b82f6" strokeWidth="4" 
                        strokeDasharray={176}
                        strokeDashoffset={176 - (176 * goalProgressPercent) / 100}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute font-mono text-[10px] font-black text-blue-400">{Math.round(goalProgressPercent)}%</span>
                  </div>
                </div>

                <div className="space-y-2 text-left text-xs leading-none">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining to Goal:</span>
                    <span className="font-mono font-black text-blue-400">£{goalRemaining.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated trips remaining:</span>
                    <span className="font-bold text-white">{Math.ceil(goalRemaining / 12)} Delivery jobs</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedGoal('none');
                    addToast("Goal Cancelled", "Shift goal reset. Select a new target anytime.", "info");
                  }}
                  className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 rounded-xl text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest text-center transition-all cursor-pointer"
                >
                  Change Target Goal
                </button>
              </div>
            )}
          </div>

          {/* F. 🚨 Live Incident Centre */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertCircle size={16} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Live Incident Centre</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Reroute Feed Warnings</p>
                </div>
              </div>

              <button 
                onClick={() => setShowReportIncident(!showReportIncident)}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer"
              >
                {showReportIncident ? 'View Incidents' : '+ Report'}
              </button>
            </div>

            {showReportIncident ? (
              <form onSubmit={handleReportIncidentSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1">Incident Name / Description</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Broken down bus blocking lanes"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1">Road Location</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Piccadilly A4"
                      value={newIncident.locationName}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, locationName: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1">Incident Type</label>
                    <select
                      value={newIncident.type}
                      onChange={(e: any) => setNewIncident(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-white outline-none"
                    >
                      <option value="traffic">Traffic Queue</option>
                      <option value="accident">Accident</option>
                      <option value="closure">Road Closure</option>
                      <option value="checkpoint">Checkpoint</option>
                      <option value="event">Delayed Event</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1">Est. Delay (Mins)</label>
                    <input 
                      type="number"
                      value={newIncident.minutesDelay}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, minutesDelay: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1">Severity</label>
                    <select
                      value={newIncident.severity}
                      onChange={(e: any) => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-white outline-none"
                    >
                      <option value="low">Low Impact</option>
                      <option value="medium">Medium Delay</option>
                      <option value="high">Critical Closure</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-500 border border-red-500/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer"
                >
                  Broadcast Incident To Network
                </button>
              </form>
            ) : (
              <div className="space-y-2 text-left max-h-[195px] overflow-y-auto no-scrollbar">
                {incidents.map((inc, idx) => (
                  <div 
                    key={`inc-${inc.id || idx}-${idx}`}
                    className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-start gap-3"
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      inc.severity === 'high' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                      inc.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                      'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                    }`}>
                      <AlertTriangle size={12} className="animate-pulse" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-sans font-black text-[11px] text-white leading-tight uppercase truncate">{inc.title}</p>
                        <span className="font-mono text-[9px] font-bold text-red-400 shrink-0">+{inc.minutesDelay}m</span>
                      </div>
                      <p className="text-[9.5px] text-gray-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-1 leading-none">
                        📍 {inc.locationName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* G. ⭐ Driver Reputation Ratings (Speed, friendliness, food, navigation, etc) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Star size={16} />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Driver Reputation</h2>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Feedback Metric Analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '🏃 Navigation & Speed', score: reputation.speed, stars: 5, color: 'bg-yellow-500' },
                { label: '🤝 Friendliness', score: reputation.friendliness, stars: 5, color: 'bg-emerald-500' },
                { label: '🍱 Food Handling', score: reputation.foodHandling, stars: 5, color: 'bg-blue-500' },
                { label: '🗺️ Map Accuracy', score: reputation.navigation, stars: 5, color: 'bg-purple-500' }
              ].map((r, idx) => (
                <div key={`rep-${idx}`} className="bg-neutral-950 rounded-2xl p-3 border border-neutral-850">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1.5">{r.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-mono font-black text-white leading-none">{r.score.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={`star-rep-${idx}-${s}`} size={8} fill={s <= Math.round(r.score) ? '#eab308' : 'none'} className="text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Miniature progress meter */}
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full ${r.color}`} style={{ width: `${(r.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Bottom Row / Break Reminder Bar */}
      <div className="bg-neutral-900 border-t border-neutral-850 p-4 fixed bottom-0 left-0 right-0 z-[4920] flex items-center justify-center">
        <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)] animate-pulse shrink-0">
              <Coffee size={18} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest leading-none">🧠 Smart Break Reminder</p>
              <p className="text-[11px] text-gray-300 mt-1">You've been simulated driving for 3.2 hours. Consider a 15-minute rest interval to sustain performance.</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => {
                setFuel(100);
                setVehicleHealth(100);
                addToast("Vehicle Service Complete", "Fuel refilled fully and repairs finalized at depot.", "success");
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer"
            >
              🛠️ Quick Pitstop
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-400/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_4px_15px_rgba(59,130,246,0.25)]"
            >
              🚀 Resume Fleet Operations
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
