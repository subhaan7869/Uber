import React, { useState, useEffect } from 'react';
import { 
  Users, Award, TrendingUp, Zap, MapPin, CheckCircle2, Star, Clock, 
  Target, ShieldCheck, AlertCircle, RefreshCw, X, ArrowUpRight, 
  MessageSquare, UserCircle, Play, Sparkles, Navigation, DollarSign
} from 'lucide-react';
import { UserProfile, Order, AppScreen } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePayRate } from '../utils/payRate';

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
  onTimeRate?: number;
}

export interface MultiplayerHubProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  otherDrivers: OtherDriver[];
  activeSurgeAreas: any[];
  setBusyAreaTarget: (target: any) => void;
  setCurrentScreen: (screen: AppScreen) => void;
  theme: 'light' | 'dark';
  onAcceptRadarOffer: (offer: Order) => void;
  radarOrders: Order[];
  setRadarOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addToast: (title: string, message: string, type: 'success' | 'alert' | 'info') => void;
  addDebugLog: (type: 'info' | 'success' | 'warn' | 'error', text: string) => void;
}

// Simulated automated AI rival players to make the lobby feel active even in development sandbox
const BOT_DRIVERS_PRESETS: OtherDriver[] = [
  { uid: 'bot1', name: 'Liam Hughes (Gold)', rating: 4.96, tier: 'Gold', isOnline: true, todayEarnings: 112.50, todayDeliveries: 9, onTimeRate: 98 },
  { uid: 'bot2', name: 'Sarah Kenner (Diamond)', rating: 4.98, tier: 'Diamond', isOnline: true, todayEarnings: 154.20, todayDeliveries: 12, onTimeRate: 99 },
  { uid: 'bot3', name: 'Dave Ridley (Platinum)', rating: 4.89, tier: 'Platinum', isOnline: true, todayEarnings: 88.40, todayDeliveries: 7, onTimeRate: 96 },
  { uid: 'bot4', name: 'Priyah Patel (Gold)', rating: 4.92, tier: 'Gold', isOnline: true, todayEarnings: 104.90, todayDeliveries: 8, onTimeRate: 97 },
  { uid: 'bot5', name: 'Marcus Sterling (Blue)', rating: 4.76, tier: 'Blue', isOnline: true, todayEarnings: 42.10, todayDeliveries: 4, onTimeRate: 91 },
  { uid: 'bot6', name: 'Chloe Vance (Diamond)', rating: 4.99, tier: 'Diamond', isOnline: true, todayEarnings: 168.00, todayDeliveries: 14, onTimeRate: 100 },
];

export const MultiplayerHub: React.FC<MultiplayerHubProps> = ({
  user,
  setUser,
  otherDrivers,
  activeSurgeAreas,
  setBusyAreaTarget,
  setCurrentScreen,
  theme,
  onAcceptRadarOffer,
  radarOrders,
  setRadarOrders,
  addToast,
  addDebugLog
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'reputation' | 'surges'>('lobby');
  const [feedLogs, setFeedLogs] = useState<string[]>([]);
  const [pizzaRushTimer, setPizzaRushTimer] = useState<number>(1450); // Pizza Rush Event (seconds remaining)
  const isDark = theme === 'dark';

  // Spawn simulated live courier events in lobby chat log to make city feel alive
  useEffect(() => {
    const logsList = [
      "Liam Hughes accepted Burger King offer (£9.20)",
      "Sarah Kenner went online near City Centre (Active Peak!)",
      "Dave Ridley completed a delivery at Queen's Medical Center (+£8.80)",
      "Priyah Patel started a stacked delivery from McDonald's (+£13.50)",
      "Marcus Sterling received customer tip (£4.00)",
      "Chloe Vance reached Diamond status bonus reward!",
      "A brand new Pizza Rush Event is starting in Nottingham West!",
      "Rival driver Dave Ridley completed a 2x surge ride dropoff"
    ];

    // Seed initial list
    setFeedLogs([
      logsList[Math.floor(Math.random() * logsList.length)],
      logsList[Math.floor(Math.random() * logsList.length)],
      logsList[Math.floor(Math.random() * logsList.length)],
    ]);

    const interval = setInterval(() => {
      const newLog = logsList[Math.floor(Math.random() * logsList.length)];
      setFeedLogs(prev => [newLog, ...prev.slice(0, 7)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Event Tick-down timer for Peak Pay event
  useEffect(() => {
    const tInterval = setInterval(() => {
      setPizzaRushTimer(prev => (prev > 0 ? prev - 1 : 1800));
    }, 1000);
    return () => clearInterval(tInterval);
  }, []);

  // Format pizza timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compile full list of players by taking actual multiusers + bots for high-traffic feel
  const combinedDrivers: OtherDriver[] = [];

  // Use a map to guarantee uniqueness of uids
  const driverMap = new Map<string, OtherDriver>();
  
  // Load and clone presets
  BOT_DRIVERS_PRESETS.forEach(b => {
    driverMap.set(b.uid, { ...b });
  });

  // Inject online multi-users safely
  if (otherDrivers && Array.isArray(otherDrivers)) {
    otherDrivers.forEach(od => {
      if (!od || !od.uid || od.uid === 'me') return;
      
      const existing = driverMap.get(od.uid);
      if (existing) {
        // Enforce safe property overrides
        driverMap.set(od.uid, {
          ...existing,
          ...od,
          isOnline: od.isOnline ?? existing.isOnline,
        });
      } else {
        // Double check name clash
        let hasNameClash = false;
        for (const item of driverMap.values()) {
          if (item.name === od.name) {
            hasNameClash = true;
            break;
          }
        }
        
        if (!hasNameClash) {
          driverMap.set(od.uid, {
            uid: od.uid,
            name: od.name || 'Anonymous Courier',
            rating: od.rating ?? 5.00,
            tier: od.tier || 'Blue',
            isOnline: od.isOnline ?? true,
            todayEarnings: od.todayEarnings ?? 0,
            todayDeliveries: od.todayDeliveries ?? 0,
            onTimeRate: od.onTimeRate ?? 97
          });
        }
      }
    });
  }

  // Convert map values to list
  combinedDrivers.push(...Array.from(driverMap.values()));

  // Inject our own node perfectly, ensuring no key overlap or omissions
  const myLeaderboardNode: OtherDriver = {
    uid: 'me',
    name: (user.name || 'Alex') + " (You)",
    rating: user.rating ?? 5.00,
    tier: user.tier || 'Blue',
    isOnline: user.isOnline ?? false,
    todayEarnings: user.earningsStats?.daily || 0,
    todayDeliveries: user.deliveriesToday || 0,
    onTimeRate: user.onTimeRate || 97
  };

  const finalMeIdx = combinedDrivers.findIndex(d => d.uid === 'me');
  if (finalMeIdx !== -1) {
    combinedDrivers[finalMeIdx] = myLeaderboardNode;
  } else {
    combinedDrivers.push(myLeaderboardNode);
  }

  // Sort Leaderboard by Today's Earnings descending
  const sortedLeaderboard = [...combinedDrivers].sort((a, b) => (b.todayEarnings || 0) - (a.todayEarnings || 0));
  const myRank = sortedLeaderboard.findIndex(d => d.uid === 'me') + 1;

  // Snatched competitive claiming action
  const playSnatchedSimulation = (order: Order, driverName: string) => {
    addToast(
      "Trip Snapped Up!",
      `Rival courier ${driverName} claimed the ${order.restaurantName || 'Hot Zone'} offer (£${order.estimatedPay.toFixed(2)}) first!`,
      "alert"
    );
    addDebugLog(
      'warn',
      `Rival dispatch: ${order.restaurantName} snatched by competitive driver ${driverName}.`
    );
    // Remove the snatched order from the radar Orders queue on server/state
    setRadarOrders(prev => prev.filter(o => o.id !== order.id));
  };

  // Decline/Skip with acceptance rate feedback
  const handleSkipRadarWithPercentage = (orderId: string) => {
    setRadarOrders(prev => prev.filter(o => o.id !== orderId));
    
    // Decrement acceptance rate slightly
    setUser(prev => {
      const nextAcc = Math.max(60, prev.acceptanceRate - 2);
      addToast(
        "Offer Skipped",
        `Trip skipped. Acceptance Rate is now ${nextAcc}%. Keep it above 85% to stay Elite.`,
        "info"
      );
      return { ...prev, acceptanceRate: nextAcc };
    });
  };

  return (
    <motion.div 
      key="multiplayer_lounge"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`h-full w-full flex flex-col p-6 overflow-y-auto pb-32 font-sans select-none ${
        isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#f8f9fa] text-slate-900'
      }`}
    >
      {/* Header section with active online users indicator */}
      <div className="flex items-center justify-between mb-6 shrink-0 mt-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentScreen('home')} 
            className={`p-2.5 rounded-2xl cursor-pointer transition-colors active:scale-90 ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-slate-800'
            }`}
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none flex items-center gap-2">
              Competitive Lounge
              <Sparkles size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
            </h1>
            <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              Nottingham Active Driver Pool Live
            </p>
          </div>
        </div>
        
        {/* Glowing online pool count indicator */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Users size={12} className="text-emerald-400" />
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none">
              {combinedDrivers.filter(d => d.isOnline).length} ONLINE
            </span>
          </div>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Region: East Midlands
          </span>
        </div>
      </div>

      {/* Beautiful High-contrast Sub Tabs */}
      <div className={`flex p-1 rounded-2xl mb-6 border ${
        isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'
      }`}>
        <button
          onClick={() => setActiveTab('lobby')}
          className={`flex-1 py-2.5 text-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'lobby'
              ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-blue-700 shadow-md')
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users size={14} />
          Lobby Feed
        </button>
        <button
          onClick={() => setActiveTab('reputation')}
          className={`flex-1 py-2.5 text-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'reputation'
              ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-blue-700 shadow-md')
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Award size={14} />
          Reputation
        </button>
        <button
          onClick={() => setActiveTab('surges')}
          className={`flex-1 py-1 py-2.5 text-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'surges'
              ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-blue-700 shadow-md')
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Zap size={14} />
          Hot Zones
        </button>
      </div>

      {/* TAB 1: Lobby Live Radar Map & Leaderboard Feed */}
      {activeTab === 'lobby' && (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* Section: TRIPS RADAR FEED (Competitive Grab Pool) */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
                <h3 className="font-display font-black text-sm uppercase tracking-wide">
                  Open Trip Radar Pool
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-wider">
                COMPETITIVE OFFERING
              </span>
            </div>

            {radarOrders.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center border border-dashed border-gray-300/30 dark:border-white/5 rounded-2xl bg-black/10">
                <div className="w-10 h-10 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-500 mb-2">
                  <RefreshCw size={18} className="animate-spin text-blue-400" style={{ animationDuration: '4s' }} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Sweeping Area Grid...</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1 max-w-xs">Connecting with Nottingham dispatch networks to stream nearby open deliveries.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {radarOrders.map((order, i) => {
                    // Simulates a random background rival driver claiming the order if you wait too long!
                    return (
                      <motion.div
                        key={`radar-hub-${order.id || i}-${i}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl relative border overflow-hidden ${
                          isDark ? 'bg-gradient-to-r from-neutral-900 to-[#121215] border-white/10' : 'bg-slate-50 border-gray-200'
                        }`}
                      >
                        {/* Interactive snatch timer animation */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 12, ease: 'linear' }}
                            onAnimationComplete={() => {
                              // Choose a bot driver preset to snatch the order!
                              const luckyBot = BOT_DRIVERS_PRESETS[Math.floor(Math.random() * BOT_DRIVERS_PRESETS.length)];
                              playSnatchedSimulation(order, luckyBot.name);
                            }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                          />
                        </div>

                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
                              <h4 className="font-black text-sm">{order.restaurantName || "Store Dispatch"}</h4>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-wide mt-0.5">
                              {order.estimatedDistance.toFixed(1)} miles away • {order.items?.slice(0, 2).join(', ') || 'Courier Job'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {(() => {
                                const payRate = calculatePayRate(order.estimatedPay, order.estimatedDistance);
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${payRate.color}`}>
                                    {payRate.icon} Rate: {payRate.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-green-400">
                              £{order.estimatedPay.toFixed(2)}
                            </span>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">EST. PAY</p>
                          </div>
                        </div>

                        {/* Order action items */}
                        <div className="flex items-center gap-2 mt-3 mb-1.5 relative z-10">
                          <button
                            onClick={() => handleSkipRadarWithPercentage(order.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
                              isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-slate-700'
                            }`}
                          >
                            Skip
                          </button>
                          
                          <button
                            onClick={() => {
                              onAcceptRadarOffer(order);
                              addToast(
                                "Operation Claimed!",
                                `${order.restaurantName} accepted from Multi-user radar! (+£${order.estimatedPay.toFixed(2)})`,
                                "success"
                              );
                              setCurrentScreen('home');
                            }}
                            className="flex-1 py-1.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                          >
                            <Play size={10} className="fill-white" />
                            Claim Offer
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Section: MAIN LEAGUE LEADERBOARD */}
          <div className={`p-5 rounded-3xl border flex-1 flex flex-col min-h-[300px] ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                <h3 className="font-display font-black text-sm uppercase tracking-wide">
                  East Midlands Driver League
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-xl text-[9px] font-mono font-black uppercase">
                Rank #{myRank} of {sortedLeaderboard.length}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-2">
              {sortedLeaderboard.map((driver, index) => {
                const isMe = driver.uid === 'me';
                const medalColors = [
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                  'bg-slate-400/10 text-slate-300 border border-slate-400/20',
                  'bg-amber-700/10 text-amber-700 border border-amber-700/20',
                ];

                return (
                  <div
                    key={`leaderboard-${driver.uid || index}-${index}`}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                      isMe 
                        ? (isDark ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-blue-50 border-2 border-blue-200') 
                        : (isDark ? 'bg-white/2 border border-white/5 hover:bg-white/5' : 'bg-slate-50 border border-slate-100')
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Placement number */}
                      {index < 3 ? (
                        <div className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${medalColors[index]}`}>
                          {index + 1}
                        </div>
                      ) : (
                        <div className="w-6 h-6 text-gray-500 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                      )}

                      {/* Driver Avatar & Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs truncate leading-none">
                            {driver.name}
                          </span>
                          {driver.isOnline && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-amber-500 font-black"><Star size={8} className="fill-amber-500" /> {driver.rating.toFixed(2)}</span>
                          <span>• {driver.todayDeliveries} Deliveries</span>
                          <span className={`px-1 rounded-sm text-[7px] font-black ${
                            driver.tier === 'Diamond' 
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10' 
                              : driver.tier === 'Platinum'
                              ? 'bg-purple-500/15 text-purple-400'
                              : driver.tier === 'Gold'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-gray-500/15 text-gray-400'
                          }`}>{driver.tier}</span>
                        </p>
                      </div>
                    </div>

                    {/* Earnings ticker info */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-blue-500 leading-none block">
                        £{driver.todayEarnings?.toFixed(2)}
                      </span>
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Earnings</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Live Feed logs panel */}
          <div className="shrink-0 p-4 border border-dashed border-gray-300/30 dark:border-white/5 rounded-2xl bg-black/5">
            <h4 className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              Live Nottingham Wiretap Logs
            </h4>
            <div className="h-20 overflow-y-auto space-y-1.5 scrollbar-thin text-left">
              {feedLogs.map((log, index) => (
                <p key={`log-${index}`} className="text-[10px] font-mono text-gray-500 font-bold truncate">
                  <span className="text-gray-600 font-black">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> {log}
                </p>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Driver Reputation, Acceptance, Completion metrics */}
      {activeTab === 'reputation' && (
        <div className="space-y-6 flex-1 pr-1 custom-scrollbar">
          
          {/* Main Rep Header explanation banner */}
          <div className={`p-5 rounded-3xl text-left border ${
            isDark ? 'bg-gradient-to-br from-blue-900/10 to-transparent border-blue-500/10' : 'bg-blue-50 border-blue-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-black uppercase text-black dark:text-blue-400 leading-none mb-1">
                  Driver Reputation Index
                </h3>
                <p className="text-xs text-gray-500 font-bold leading-relaxed mt-1">
                  Hyper drivers are evaluated by our local dispatch algorithms on real-time metrics. High ratings unlock elite matches with up to 25% pay premium.
                </p>
              </div>
            </div>
          </div>

          {/* Grid of four core metrics matching the user's specs */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Index 1: Acceptance Rate */}
            <div className={`p-4 rounded-3xl border text-left ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest font-mono">Acceptance</span>
                <TrendingUp size={16} className={user.acceptanceRate >= 85 ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <h2 className="text-2xl font-black font-mono leading-none">
                {user.acceptanceRate}%
              </h2>
              <div className="w-full bg-gray-500/10 h-1.5 rounded-full mt-2 relative overflow-hidden">
                <div className={`h-full rounded-full ${user.acceptanceRate >= 85 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${user.acceptanceRate}%` }} />
              </div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase mt-2">
                Keep above 85% for Gold status.
              </p>
            </div>

            {/* Index 2: Completion / Cancel Rate */}
            <div className={`p-4 rounded-3xl border text-left ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest font-mono">Completion</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black font-mono leading-none">
                {100 - user.cancellationRate}%
              </h2>
              <div className="w-full bg-gray-500/10 h-1.5 rounded-full mt-2 relative overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${100 - user.cancellationRate}%` }} />
              </div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase mt-2">
                Canceling accepted tasks lowers rate.
              </p>
            </div>

            {/* Index 3: Customer Rating */}
            <div className={`p-4 rounded-3xl border text-left ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest font-mono">Customer stars</span>
                <Star size={16} className="text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-2xl font-black font-mono leading-none flex items-baseline gap-1">
                {user.rating.toFixed(2)}
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">/5.0</span>
              </h2>
              <div className="w-full bg-gray-500/10 h-1.5 rounded-full mt-2 relative overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(user.rating / 5) * 100}%` }} />
              </div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase mt-2">
                Evaluated on last 50 deliveries.
              </p>
            </div>

            {/* Index 4: On-Time Rate */}
            <div className={`p-4 rounded-3xl border text-left ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest font-mono">On-Time Rate</span>
                <Clock size={16} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black font-mono leading-none">
                {user.onTimeRate || 97}%
              </h2>
              <div className="w-full bg-gray-500/10 h-1.5 rounded-full mt-2 relative overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${user.onTimeRate || 97}%` }} />
              </div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase mt-2">
                Arriving prior to simulation ETA.
              </p>
            </div>

          </div>

          {/* Reputation Progression Bonuses */}
          <div className={`p-5 rounded-3xl border text-left ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
          }`}>
            <h4 className="font-display font-black text-sm uppercase tracking-wide mb-3 flex items-center gap-1.5">
              👑 Unlock Tier Benefits
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5 text-xs">
                <div>
                  <p className="font-black">Elite Diamond Priority Match</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">Acceptance &gt; 92%, Stars &gt; 4.85</p>
                </div>
                <span className="text-green-400 font-black shrink-0">+15% Pay Bonus</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5 text-xs">
                <div>
                  <p className="font-black">Stadium Surge Unlocks</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">Unlock VIP stadium drops</p>
                </div>
                <span className="text-blue-400 font-black shrink-0">Unlocked</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-black text-gray-500">Premium Electric Tesla Perks</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">Reduced vehicle wear fee</p>
                </div>
                <span className="text-cyan-400 font-black shrink-0">Active</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Surges & Pizza Rush Event Live Multipliers */}
      {activeTab === 'surges' && (
        <div className="space-y-6 flex-1 pr-1 custom-scrollbar">
          
          {/* Section: ACTIVE SPECIFIC MULTIPLAYER EVENTS (Pizza Rush Event) */}
          <div className="p-6 rounded-[32px] bg-gradient-to-br from-orange-600 to-red-600 text-white text-left relative overflow-hidden shadow-xl">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 blur-sm pointer-events-none">
              <Zap size={140} />
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest bg-black/30 border border-white/10 px-2.5 py-1 rounded-full max-w-max flex items-center gap-1">
              🍕 Pizza Rush Active!
            </p>

            <h2 className="font-display text-2xl font-black mt-3 italic leading-tight">
              +50% PIZZA DESPATCHES
            </h2>
            <p className="text-xs font-bold text-white/80 mt-1 max-w-md leading-relaxed">
              Huge pizza party across City Centre Pizza Hut & Dominoes! All riders are racing there. Travel there immediately to seize high-stakes contracts!
            </p>

            {/* Micro-counter tracking time limit */}
            <div className="flex items-center justify-between mt-6 bg-black/20 p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-300 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-200">Event clock:</span>
              </div>
              <span className="font-mono font-black text-base text-amber-300">
                {formatTime(pizzaRushTimer)}
              </span>
            </div>
          </div>

          {/* Hot Zones and active Surge Areas list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-black text-sm uppercase tracking-wider">
                Surge Zone Tracing
              </h3>
              <span className="text-[9px] text-gray-400 uppercase font-black">
                {activeSurgeAreas.length} AREAS TRACKED
              </span>
            </div>

            {activeSurgeAreas.map((area, idx) => (
              <div 
                key={`surge-lounge-${area.id}-${idx}`} 
                className={`p-5 rounded-3xl border relative text-left ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500/10 rounded-xl text-orange-500 shrink-0">
                      <Zap size={14} className="fill-orange-500" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block leading-none">{area.name}</span>
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5 font-mono">Location ID: EMA-{area.id}</span>
                    </div>
                  </div>
                  
                  {/* Plus cash indicator specified by user (+£3/order) */}
                  <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-black text-amber-500 uppercase shrink-0">
                    +{area.multiplier}x SURGE
                  </span>
                </div>

                <p className="text-xs text-gray-500 font-bold leading-normal mt-1 mb-3">
                  Drivers in this area are reporting double frequency. Coordinate on-map to start.
                </p>

                {/* Direct GPS lock tracker */}
                <button
                  onClick={() => {
                    const surgeAreaLocation = {
                      latitude: 52.9548 + area.lat,
                      longitude: -1.1581 + area.lng
                    };
                    setBusyAreaTarget({
                      id: area.id,
                      name: area.name,
                      location: surgeAreaLocation
                    });
                    addToast("Target Fixed", `Compass adjusted to lead driver towards ${area.name}!`, "success");
                    setCurrentScreen('home');
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Navigation size={12} className="rotate-45" />
                  Align Compass
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </motion.div>
  );
};
