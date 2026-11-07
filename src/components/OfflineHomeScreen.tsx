import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Layers, 
  ChevronRight, 
  Play, 
  Navigation, 
  Zap, 
  Award, 
  Flame, 
  Plane, 
  Clock, 
  MapPin, 
  SlidersHorizontal,
  ChevronUp,
  List,
  ShieldAlert,
  Target
} from 'lucide-react';
import { UserProfile, DestinationFilter } from '../types';

interface OfflineHomeScreenProps {
  user: UserProfile;
  activeCityKey: string;
  onGoOnline: () => void;
  onOpenPreferences: () => void;
  onOpenOpportunities: () => void;
  onOpenSafetyToolkit: () => void;
  onOpenSearch: () => void;
  onOpenLayers?: () => void;
  onOpenMap?: () => void;
  onOpenRankPro?: () => void;
  onOpenLeague?: () => void;
  onOpenCarPlay?: () => void;
  activeSurgeAreas?: any[];
  theme?: 'light' | 'dark';
  destinationFilter?: DestinationFilter | null;
  onClearDestinationFilter?: () => void;
}

export const OfflineHomeScreen: React.FC<OfflineHomeScreenProps> = ({
  user,
  activeCityKey,
  onGoOnline,
  onOpenPreferences,
  onOpenOpportunities,
  onOpenSafetyToolkit,
  onOpenSearch,
  onOpenLayers,
  onOpenMap,
  onOpenRankPro,
  onOpenLeague,
  onOpenCarPlay,
  activeSurgeAreas = [],
  theme = 'light',
  destinationFilter,
  onClearDestinationFilter
}) => {
  const [selectedOpportunityTab, setSelectedOpportunityTab] = useState<'all' | 'promos' | 'quests' | 'streaks' | 'airports'>('all');

  const insuranceExpiry = user.documentExpiries?.["Vehicle Insurance"];
  const insuranceDaysLeft = React.useMemo(() => {
    if (!insuranceExpiry) return null;
    const expiryDate = new Date(insuranceExpiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [insuranceExpiry]);

  return (
    <div className="relative w-full h-full bg-white text-neutral-900 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Header Navigation Overlay */}
      <div className="shrink-0 pt-10 px-5 pb-3 flex justify-between items-center bg-white border-b border-gray-100 z-20">
        <button 
          onClick={onOpenSafetyToolkit}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-blue-600 transition-colors active:scale-95"
          title="Safety Toolkit"
        >
          <Shield size={20} className="fill-blue-600/10" />
        </button>

        <div className="flex items-center gap-2">
          {onOpenLayers && (
            <button 
              onClick={onOpenLayers}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors active:scale-95"
              title="Map Layers"
            >
              <Layers size={18} />
            </button>
          )}
          <button 
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors active:scale-95"
            title="Search Destination"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Offline Home Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-4 pb-6 space-y-6">
        
        {insuranceDaysLeft !== null && insuranceDaysLeft <= 30 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-black text-orange-900 text-sm">Action Required</h3>
              <p className="text-xs text-orange-700 font-bold mt-0.5">
                Your vehicle insurance expires in {insuranceDaysLeft} days ({insuranceExpiry}).
              </p>
              <p className="text-[10px] text-orange-600 mt-1">
                Please update your documents in Settings to stay online.
              </p>
            </div>
          </div>
        )}

        {/* 1. Status Section ("You're offline" + "Ready to go?") */}
        <div>
          <button 
            onClick={onOpenPreferences}
            className="group text-left w-full focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                {user.isOnline ? "You're online" : "You're offline"}
              </h1>
              <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
                <SlidersHorizontal size={18} className="text-gray-600 group-hover:text-blue-600" />
              </div>
            </div>
            <p className="text-base font-bold text-gray-500 mt-1">
              {user.isOnline ? "Finding trips..." : "Ready to go?"}
            </p>
          </button>
          <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">
            {user.isOnline ? "You are currently receiving trip requests. Tap below to view the live map." : "When offline, you won't receive trip requests. Configure preferences or tap below to go online."}
          </p>
        </div>

        {/* Real Address Search Bar / Destination Mode Pill */}
        {destinationFilter?.active ? (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <Target size={20} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Destination Filter Active</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded font-black">Filtered Trips</span>
                </div>
                <h4 className="text-sm font-black text-emerald-950 truncate">{destinationFilter.shortName}</h4>
                <p className="text-[11px] text-emerald-700 font-bold">{destinationFilter.distanceMi} mi away • ~{destinationFilter.estimatedMinutes} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenSearch}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                Change
              </button>
              {onClearDestinationFilter && (
                <button
                  onClick={onClearDestinationFilter}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Clear Destination"
                >
                  <ShieldAlert size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenSearch}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-blue-400 rounded-3xl flex items-center justify-between text-left transition-all active:scale-[0.99] shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-md shadow-black/20 group-hover:bg-blue-600 transition-colors">
                <Search size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>Where to? (Set Destination)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-black uppercase">Live Geocoding</span>
                </p>
                <p className="text-xs text-gray-500 font-bold mt-0.5">Enter any real address to start navigation & get jobs on your route</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-blue-600 group-hover:border-blue-300 transition-colors shrink-0">
              <ChevronRight size={16} />
            </div>
          </button>
        )}

        {/* 2. Mini Map Preview Card */}
        <div 
          onClick={() => {
            if (onOpenMap) onOpenMap();
            else onGoOnline();
          }}
          className="relative w-full rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-neutral-900 min-h-[220px] flex flex-col justify-between p-4 group cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
        >
          {/* Simulated Map Background Canvas styling */}
          <div className="absolute inset-0 bg-[#e5e3df] opacity-95">
            {/* Grid street outlines */}
            <svg className="absolute inset-0 w-full h-full opacity-35" stroke="#94a3b8" strokeWidth="2">
              <path d="M -50 40 L 400 120 M -50 140 L 400 220 M 120 -50 L 180 300 M 280 -50 L 220 300" />
              <path d="M -20 200 Q 150 50 350 220" fill="none" stroke="#64748b" strokeWidth="4" />
            </svg>

            {/* Heatmap zones */}
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-red-500/35 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-orange-500/35 rounded-full blur-xl" />

            {/* Wait-Time Badges on Mini Map */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1 border border-white">
              <Flame size={10} className="fill-white" />
              <span>1–16 min</span>
            </div>

            <div className="absolute bottom-6 right-12 bg-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1 border border-white">
              <Clock size={10} />
              <span>2–21 min</span>
            </div>

            {/* Driver position marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-9 h-9 bg-white rounded-full shadow-xl border-2 border-black flex items-center justify-center">
                <Navigation size={18} className="text-black fill-black" style={{ transform: 'rotate(45deg)' }} />
              </div>
            </div>
          </div>

          {/* Top Pill Overlay */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-gray-200/50 flex items-center gap-1.5">
              <MapPin size={11} className="text-blue-600" />
              {activeCityKey} Area Demand
            </span>
            <button 
              onClick={onGoOnline}
              className="w-8 h-8 rounded-full bg-white text-black shadow-md flex items-center justify-center active:scale-90 transition-transform"
              title="Focus map"
            >
              <Play size={14} className="fill-black ml-0.5" />
            </button>
          </div>

          {/* Bottom Caption Overlay */}
          <div className="relative z-10 mt-24 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <div>
                <p className="text-xs font-black text-neutral-900 leading-tight">High Demand Zone Nearby</p>
                <p className="text-[10px] font-bold text-gray-500">Estimated waiting time: 1–16 mins</p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-600">Explore</span>
          </div>
        </div>

        {/* 2.5 Driver Rank & League Progression System Card */}
        {(() => {
          const pts = user.points ?? 350;
          const computedTier = pts >= 1200 ? 'Diamond' : pts >= 600 ? 'Platinum' : pts >= 200 ? 'Gold' : 'Blue';
          const nextTierName = computedTier === 'Blue' ? 'Gold' : computedTier === 'Gold' ? 'Platinum' : computedTier === 'Platinum' ? 'Diamond' : 'Max Rank';
          const tierFloor = computedTier === 'Blue' ? 0 : computedTier === 'Gold' ? 200 : computedTier === 'Platinum' ? 600 : 1200;
          const nextTarget = computedTier === 'Blue' ? 200 : computedTier === 'Gold' ? 600 : computedTier === 'Platinum' ? 1200 : 2000;
          const progressPct = computedTier === 'Diamond'
            ? 100
            : Math.min(100, Math.max(5, Math.round(((pts - tierFloor) / (nextTarget - tierFloor)) * 100)));

          return (
            <div className="bg-gradient-to-br from-slate-950 via-[#0d1527] to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-blue-500/25 space-y-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                    <Award size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Hyper Pro Rank</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-wider text-blue-300">
                        Level {user.level || Math.max(1, Math.floor(pts / 100) + 1)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white">{computedTier} League Driver</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-amber-400 font-mono leading-none">{pts} XP</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">
                    {computedTier === 'Diamond' ? 'Top 1% Tier' : `${nextTarget - pts} XP to ${nextTierName}`}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>Rating: {(user.rating || 4.95).toFixed(2)} ★</span>
                  <span>Acceptance: {user.acceptanceRate ?? 94}%</span>
                  <span>On-Time: {user.onTimeRate ?? 98}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onOpenRankPro && onOpenRankPro()}
                  className="py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Award size={14} className="text-amber-400" />
                  <span>Pro Perks & Tiers</span>
                </button>
                <button
                  onClick={() => onOpenLeague && onOpenLeague()}
                  className="py-2.5 px-3 bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Zap size={14} className="text-cyan-300" />
                  <span>Live Leaderboard</span>
                </button>
              </div>

              {onOpenCarPlay && (
                <button
                  onClick={onOpenCarPlay}
                  className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation size={14} className="text-emerald-400" />
                  <span>Open CarPlay Map View (iPad ⇄ PC Sync)</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* 3. Opportunities Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              Opportunities
            </h2>
            <button 
              onClick={onOpenOpportunities}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-neutral-800 transition-colors active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Featured Promotion Card (Matching Uber Reference Screenshot) */}
          <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-neutral-800 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Promotion</span>
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight leading-snug text-white">
                Extra £8.50 per active hour from 3 PM – 4 PM
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Active trip boost valid in {activeCityKey}. Earnings automatically added upon trip completion.
              </p>
            </div>

            {/* Embedded Go Online Button */}
            <button 
              onClick={() => {
                if (user.isOnline && onOpenMap) onOpenMap();
                else onGoOnline();
              }}
              className="w-full py-4 bg-[#1f52e3] hover:bg-blue-600 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Navigation size={18} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
              <span>{user.isOnline ? "Return to Map" : "Go Online"}</span>
            </button>
          </div>

          {/* Quest Bonus Card */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-5 space-y-3 hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <Award size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Quest Bonus</span>
              </div>
              <span className="text-xs font-extrabold text-gray-400 font-mono">18 / 40 Trips</span>
            </div>

            <h4 className="text-base font-black text-neutral-900">
              Complete 40 trips • Earn extra £120.00
            </h4>

            {/* Quest Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full w-[45%]" />
            </div>
            <p className="text-[11px] font-bold text-gray-500">22 trips remaining to unlock bonus payout.</p>
          </div>

          {/* Consecutive Trip Streak Card */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-5 flex items-center justify-between hover:border-gray-300 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600">
                <Zap size={15} className="fill-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider">Streak Reward</span>
              </div>
              <h4 className="text-base font-black text-neutral-900">
                Complete 3 trips in a row
              </h4>
              <p className="text-xs font-bold text-gray-500">Earn an extra £15.00 on your series.</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl font-black text-amber-600 text-sm whitespace-nowrap">
              +£15.00
            </div>
          </div>

          {/* Airport Queue Opportunity */}
          <div 
            onClick={onOpenOpportunities}
            className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Plane size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Airport Queue</span>
              </div>
              <h4 className="text-base font-black text-neutral-900">
                LHR Airport Queue Active
              </h4>
              <p className="text-xs font-bold text-gray-500">32 drivers in queue • Short wait time estimated.</p>
            </div>
            <ChevronRight size={20} className="text-blue-600 shrink-0" />
          </div>

        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-20">
        <button 
          onClick={() => {
            if (user.isOnline && onOpenMap) onOpenMap();
            else onGoOnline();
          }}
          className="w-full py-4 bg-[#1f52e3] hover:bg-blue-600 text-white rounded-full font-black text-lg uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Navigation size={22} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
          <span>{user.isOnline ? "Return to Map" : "Go Online"}</span>
        </button>
      </div>
    </div>
  );
};
