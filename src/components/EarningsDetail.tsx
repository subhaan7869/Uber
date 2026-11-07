import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, History, Briefcase, Clock, Star, DollarSign, MapPin, Zap, 
  User, Utensils, Landmark, ArrowRight, ArrowLeft, RefreshCw, ChevronRight,
  ChevronDown, ChevronUp, TrendingUp, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { CompletedTrip, UserProfile, AppScreen } from '../types';

export const EarningsDetail = ({ 
  earnings, 
  user, 
  setUser,
  setCurrentScreen, 
  getArrivalTime, 
  setBankBalance, 
  setEarnings, 
  sendNotification, 
  playHyperSound,
  completedTrips,
  theme
}: { 
  earnings: number, 
  user: UserProfile, 
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  setCurrentScreen: (screen: AppScreen) => void,
  getArrivalTime: (mins: number) => string,
  setBankBalance: React.Dispatch<React.SetStateAction<number>>,
  setEarnings: React.Dispatch<React.SetStateAction<number>>,
  sendNotification: (title: string, body: string) => void,
  playHyperSound: (type: 'order' | 'accept' | 'complete') => void,
  completedTrips: CompletedTrip[],
  theme: 'light' | 'dark'
}) => {
  const [page, setPage] = useState(0); // 0: Day, 1: Week, 2: Month, 3: Year
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [isCashOutLoading, setIsCashOutLoading] = useState(false);
  const pages = ['Day', 'Week', 'Month', 'Year'];

  const getTripBreakdown = (trip: CompletedTrip) => {
    const base = trip.breakdown?.base ?? Number(Math.max(2.5, trip.earnings * 0.35).toFixed(2));
    const distancePay = trip.breakdown?.distancePay ?? Number((trip.distance * 0.85).toFixed(2));
    const timePay = trip.breakdown?.timePay ?? Number(Math.max(0.8, trip.distance * 0.3).toFixed(2));
    const surgeMultiplier = trip.breakdown?.surgeMultiplier ?? (trip.breakdown?.surge && trip.breakdown.surge > 0 ? Number((1 + trip.breakdown.surge / Math.max(1, base + distancePay + timePay)).toFixed(1)) : 1.0);
    const surge = trip.breakdown?.surge ?? Number((surgeMultiplier > 1.0 ? (base + distancePay + timePay) * (surgeMultiplier - 1.0) : 0).toFixed(2));
    const tip = trip.breakdown?.tip ?? Number(Math.max(0, trip.earnings - (base + distancePay + timePay + surge)).toFixed(2));
    return { base, distancePay, timePay, surge, surgeMultiplier, tip };
  };

  const stats = user.earningsStats || { daily: 45.50, weekly: 385.50, monthly: 1450.00, ytd: 16845.50 };

  // Dynamic date calculations for absolute consistency
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayIndex = (dayOfWeek + 6) % 7; // Monday = 0, ..., Sunday = 6
  
  const BASELINE_WEEKLY_AMOUNTS = [64.20, 58.50, 72.10, 85.30, 115.00, 142.50, 95.80];

  const todayDateNum = today.getDate();
  const getDailyAmountForDay = (dayNum: number) => {
    const base = 65;
    const variance = Math.sin(dayNum * 1.7) * 25 + Math.cos(dayNum * 0.9) * 15;
    return Math.max(35, Number((base + variance).toFixed(2)));
  };

  // 1. Dynamic Weekly Chart Data (Mon to Sun, matching baseline + today)
  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
    let amount = 0;
    if (idx < dayIndex) {
      amount = BASELINE_WEEKLY_AMOUNTS[idx];
    } else if (idx === dayIndex) {
      amount = stats.daily;
    } else {
      amount = 0;
    }
    return { day: dayName, amount };
  });

  // 2. Dynamic Monthly Chart Data (Days 1 to 30, matching baseline + today)
  const monthlyData = Array.from({ length: 30 }).map((_, i) => {
    const d = i + 1;
    let amount = 0;
    if (d < todayDateNum) {
      amount = getDailyAmountForDay(d);
    } else if (d === todayDateNum) {
      amount = stats.daily;
    } else {
      amount = 0;
    }
    return { date: d, amount };
  });

  // 3. Dynamic 7-Day Trend Chart Data (Last 7 Days)
  const last7DaysData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isToday = i === 0;
      
      const dayLabel = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dateFormatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      // Filter real completed trips for this calendar day
      const dayTrips = (completedTrips || []).filter(t => {
        const tripDate = new Date(t.timestamp);
        return tripDate.toDateString() === d.toDateString();
      });
      
      const tripSum = dayTrips.reduce((acc, curr) => acc + (curr.earnings || 0), 0);
      const amount = isToday && stats.daily > tripSum ? stats.daily : tripSum;
      
      data.push({
        day: dayLabel,
        date: dateFormatted,
        amount: Number(amount.toFixed(2)),
        tripsCount: dayTrips.length,
        isToday,
      });
    }
    return data;
  }, [completedTrips, stats.daily]);

  const sevenDayTotal = useMemo(() => {
    return last7DaysData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [last7DaysData]);

  const sevenDayAverage = useMemo(() => {
    return sevenDayTotal / 7;
  }, [sevenDayTotal]);

  const highestDay = useMemo(() => {
    return [...last7DaysData].sort((a, b) => b.amount - a.amount)[0] || last7DaysData[0];
  }, [last7DaysData]);

  // Trips calculation
  let displayTrips = user.deliveriesToday;
  if (page === 1) { // Week
    let weekTrips = 0;
    for (let i = 0; i < 7; i++) {
      if (i < dayIndex) {
        weekTrips += Math.round(BASELINE_WEEKLY_AMOUNTS[i] / 12.50);
      } else if (i === dayIndex) {
        weekTrips += user.deliveriesToday;
      }
    }
    displayTrips = weekTrips;
  } else if (page === 2) { // Month
    let monthTrips = 0;
    for (let d = 1; d <= 30; d++) {
      if (d < todayDateNum) {
        monthTrips += Math.max(1, Math.round(getDailyAmountForDay(d) / 12.50));
      } else if (d === todayDateNum) {
        monthTrips += user.deliveriesToday;
      }
    }
    displayTrips = monthTrips;
  } else if (page === 3) { // Year
    displayTrips = user.lifetimeTrips || 1424;
  }

  // Hours calculation
  let displayHours = Math.max(0.5, Number((stats.daily / 18.50).toFixed(1)));
  if (stats.daily === 0) displayHours = 0;
  
  if (page === 1) { // Week
    let weekHours = 0;
    for (let i = 0; i < 7; i++) {
      if (i < dayIndex) {
        weekHours += BASELINE_WEEKLY_AMOUNTS[i] / 18.50;
      } else if (i === dayIndex) {
        weekHours += stats.daily / 18.50;
      }
    }
    displayHours = Number(weekHours.toFixed(1));
  } else if (page === 2) { // Month
    let monthHours = 0;
    for (let d = 1; d <= 30; d++) {
      if (d < todayDateNum) {
        monthHours += getDailyAmountForDay(d) / 18.50;
      } else if (d === todayDateNum) {
        monthHours += stats.daily / 18.50;
      }
    }
    displayHours = Number(monthHours.toFixed(1));
  } else if (page === 3) { // Year
    displayHours = Number(((user.lifetimeTrips || 1424) * 0.42).toFixed(1)); // Realistic cumulative hours for all time
  }

  const currentDisplayAmount = page === 0 ? stats.daily : 
                               page === 1 ? stats.weekly : 
                               page === 2 ? stats.monthly : stats.ytd;

  const handleCashOut = () => {
    if (earnings <= 0 || isCashOutLoading) return;
    
    setIsCashOutLoading(true);
    playHyperSound('accept');
    
    setTimeout(() => {
      const amount = earnings;
      setBankBalance(prev => prev + amount);
      setEarnings(0);
      setUser(u => ({
        ...u,
        walletBalance: 0,
        // Preserve historical stats on cashout so today's daily progression stays visible!
      }));
      setIsCashOutLoading(false);
      sendNotification("Instant Pay Received", `£${amount.toFixed(2)} has been transferred to your bank ending in ...4421`);
      playHyperSound('complete');
    }, 2000);
  };

  if (selectedTrip) {
    const b = selectedTrip.breakdown || { base: 2.50, distancePay: 1.50, timePay: 0.80, surge: 0, tip: 1.20 };

    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute inset-0 z-[1100] bg-[#0a0a0c] text-white flex flex-col"
      >
        <div className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-[#0a0a0c]">
          <button onClick={() => setSelectedTrip(null)} className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all text-white">
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <h2 className="font-black text-xl">Trip Details</h2>
          <div className="w-10 h-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-[#0a0a0c]">
          <div className="text-center">
            <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2">{new Date(selectedTrip.timestamp).toLocaleDateString()} • {new Date(selectedTrip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <h1 className="text-6xl font-black mb-2 text-white">£{selectedTrip.earnings.toFixed(2)}</h1>
            <p className="text-[#22c55e] font-black text-xs uppercase tracking-wide">{selectedTrip.type === 'ride' ? 'Hyper Ride' : 'Delivery Route'}</p>
          </div>

          <div className="rounded-[32px] overflow-hidden border border-white/5 bg-[#121214] shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-6">Earnings Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-400">Base Fare</span>
                  <span className="font-black text-white">£{b.base.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-400 flex items-center gap-2 italic ml-4">
                    <MapPin size={14} className="text-[#22c55e] opacity-70" /> {selectedTrip.distance.toFixed(1)} miles
                  </span>
                  <span className="font-black text-white">£{b.distancePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-400 flex items-center gap-2 italic ml-4">
                    <Clock size={14} className="text-amber-500 opacity-70" /> {Math.floor(selectedTrip.distance * 4)} mins
                  </span>
                  <span className="font-black text-white">£{b.timePay.toFixed(2)}</span>
                </div>
                {/* Surge Multiplier */}
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-bold flex items-center gap-2 ${b.surgeMultiplier && b.surgeMultiplier > 1 ? 'text-amber-400' : 'text-gray-400'}`}>
                    <Zap size={16} fill={b.surgeMultiplier && b.surgeMultiplier > 1 ? "currentColor" : "none"} className={b.surgeMultiplier && b.surgeMultiplier > 1 ? "text-amber-400" : "text-gray-500"} />
                    Surge Multiplier
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.surgeMultiplier && b.surgeMultiplier > 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400'}`}>
                      {b.surgeMultiplier ? `${b.surgeMultiplier.toFixed(1)}x` : (b.surge > 0 ? '1.5x' : '1.0x Standard')}
                    </span>
                    <span className={`font-black ${b.surge > 0 ? 'text-amber-400' : 'text-white'}`}>
                      {b.surge > 0 ? `+£${b.surge.toFixed(2)}` : '£0.00'}
                    </span>
                  </div>
                </div>

                {/* Customer Tip */}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                  <span className="font-black flex items-center gap-2 text-[#22c55e]">
                    <Star size={16} fill="currentColor" /> Customer Tip (100% to you)
                  </span>
                  <span className="font-black text-emerald-400">{b.tip > 0 ? `+£${b.tip.toFixed(2)}` : '£0.00'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 flex justify-between items-center bg-black/40">
              <span className="text-lg font-black text-white uppercase tracking-wider">Total Payout</span>
              <span className="text-3xl font-black text-[#22c55e]">£{selectedTrip.earnings.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Trip Route</h3>
             <div className="h-40 rounded-[32px] overflow-hidden relative border border-white/5 bg-black/50">
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                   <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-[#22c55e] rounded-full shadow-[0_0_15px_rgba(34,197,94,1)]" />
                   <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-amber-500 rounded-full" />
                   <svg className="absolute inset-0 w-full h-full">
                      <path d="M100,50 L200,100" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="5 3" fill="none" className="opacity-70" />
                   </svg>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                   <div className="flex-1 p-3 rounded-2xl bg-[#121214]/90 border border-white/5 backdrop-blur-md">
                      <p className="text-[8px] font-black uppercase text-gray-500 leading-tight">Pickup</p>
                      <p className="text-[10px] font-bold text-white truncate">{selectedTrip.restaurantName || "Hyper Pick-up"}</p>
                   </div>
                   <div className="flex-1 p-3 rounded-2xl bg-[#121214]/90 border border-white/5 backdrop-blur-md">
                      <p className="text-[8px] font-black uppercase text-gray-500 leading-tight">Drop-off</p>
                      <p className="text-[10px] font-bold text-white truncate">{selectedTrip.customerName}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-3">
             <button className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#121214] border border-white/5 text-gray-400 hover:text-white transition-all active:scale-95">
                Issue with this delivery?
             </button>
             <button className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#121214] border border-white/5 text-gray-400 hover:text-white transition-all active:scale-95">
                Contact Hyper Dispatch
             </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-0 z-[1000] bg-[#0a0a0c] text-white flex flex-col font-sans"
    >
      <div className="p-6 pt-12 shrink-0 bg-[#0a0a0c]">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setCurrentScreen('home')} className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer">
            <ArrowLeft size={16} />
            <span>Go Back to Map</span>
          </button>
          <h2 className="text-xl font-black tracking-tight uppercase italic">Live Stats</h2>
          <div className="w-10 h-10" />
        </div>

        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5">
          {pages.map((p, i) => (
            <button 
              key={p}
              onClick={() => setPage(i)}
              className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${page === i ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20' : 'text-gray-400 hover:text-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-[#0a0a0c]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6"
          >
            <div className="text-center py-8">
              <p className="text-[#22c55e] font-black text-[10px] uppercase tracking-[0.2em] mb-2">{pages[page]} RUN RATE</p>
              <h1 className="text-6.5xl font-black tracking-tighter mb-4 text-white">£{currentDisplayAmount.toFixed(2)}</h1>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 bg-[#22c55e]/15 px-3 py-1 rounded-full border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-black uppercase tracking-widest">
                  <TrendingUp size={12} />
                  +14.8%
                </div>
                <p className="text-gray-500 font-bold text-xs">vs average period</p>
              </div>
            </div>

            <div className="h-64 w-full mb-8 rounded-[32px] p-6 border border-white/5 bg-[#121214] shadow-2xl">
               <ResponsiveContainer width="100%" height="100%">
                  {page === 1 ? (
                    <BarChart data={weeklyData}>
                       <defs>
                          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }} dy={10} />
                       <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }} itemStyle={{ color: '#22c55e', fontWeight: 900 }} cursor={{ fill: 'transparent' }} />
                       <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="url(#colorEarnings)">
                          {weeklyData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === dayIndex ? '#22c55e' : 'rgba(255,255,255,0.1)'} />
                          ))}
                       </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={monthlyData}>
                       <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis hide />
                       <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={3} fill="url(#areaGradient)" />
                    </AreaChart>
                  )}
               </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="p-4 rounded-2xl border border-white/5 bg-[#121214] text-center">
                <div className="text-[#22c55e] mb-1.5 flex justify-center"><Briefcase size={16} /></div>
                <p className="text-xl font-black text-white">{displayTrips}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">Trips</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-[#121214] text-center">
                <div className="text-amber-500 mb-1.5 flex justify-center"><Clock size={16} /></div>
                <p className="text-xl font-black text-white">{displayHours}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">Hours</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-[#121214] text-center">
                <div className="text-amber-500 mb-1.5 flex justify-center"><Star size={16} fill="currentColor" /></div>
                <p className="text-xl font-black text-white">{user.rating.toFixed(1)}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">Rating</p>
              </div>
            </div>

            {/* 7-Day Daily Earnings Trend Line Chart using Recharts */}
            <div className="rounded-[32px] p-6 border border-white/5 bg-[#121214] mb-8 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#22c55e]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Daily Trend (Last 7 Days)</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    7-Day Total: £{sevenDayTotal.toFixed(2)} • Avg: £{sevenDayAverage.toFixed(2)}/day
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                    <Sparkles size={10} />
                    Peak: {highestDay?.day} (£{highestDay?.amount.toFixed(0)})
                  </span>
                </div>
              </div>

              {/* Small Recharts Line Chart Container */}
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 600 }}
                      tickFormatter={(val) => `£${val}`}
                      dx={-4}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#1a1a1e] border border-white/10 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{data.date} • {data.day}</p>
                              <p className="text-sm font-black text-[#22c55e]">£{Number(data.amount).toFixed(2)}</p>
                              {data.isToday && <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mt-0.5">• Active Shift</span>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="url(#earningsLineGradient)" 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isToday = payload?.isToday;
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={isToday ? 5 : 3.5}
                            fill={isToday ? '#3b82f6' : '#22c55e'}
                            stroke="#121214"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 6, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Micro Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">7-Day Total</p>
                  <p className="text-xs font-black text-white mt-0.5">£{sevenDayTotal.toFixed(2)}</p>
                </div>
                <div className="text-center border-x border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Daily Average</p>
                  <p className="text-xs font-black text-[#22c55e] mt-0.5">£{sevenDayAverage.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Highest Day</p>
                  <p className="text-xs font-black text-amber-400 mt-0.5">£{highestDay?.amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] p-6 border border-white/5 bg-[#121214] mb-8 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#22c55e] mb-6">Income Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Net Fare', amount: currentDisplayAmount * 0.72, color: 'text-emerald-400', icon: <DollarSign size={14} /> },
                  { label: 'Wait Time Pay', amount: currentDisplayAmount * 0.08, icon: <Clock size={14} /> },
                  { label: 'Surge & Promotions', amount: currentDisplayAmount * 0.12, color: 'text-amber-500', icon: <Zap size={14} /> },
                  { label: 'Tips (100% yours)', amount: currentDisplayAmount * 0.08, color: 'text-[#22c55e]', icon: <Star size={14} /> },
                ].map((item, i) => (
                  <div key={`income-item-${i}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${item.color || 'text-gray-400'}`}>
                        {item.icon}
                      </div>
                      <span className="font-bold text-gray-400">{item.label}</span>
                    </div>
                    <span className={`font-black ${item.color || 'text-white'}`}>£{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Trip History</h3>
                <button className="text-[#22c55e] text-xs font-black uppercase tracking-wider">Filter</button>
              </div>
              {completedTrips.length === 0 ? (
                <div className="py-12 text-center bg-[#121214] border border-white/5 rounded-3xl text-gray-500 text-sm italic">No recent activity to show</div>
              ) : (
                completedTrips.slice(0, 10).map((trip, i) => {
                  const tripKey = `${trip.id || 'earn-trip'}-${trip.timestamp || i}-${i}`;
                  const isExpanded = expandedTripId === tripKey;
                  const b = getTripBreakdown(trip);

                  return (
                    <motion.div 
                      key={`trip-entry-${tripKey}`} 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }, delay: i * 0.04 }}
                      className={`rounded-[28px] border transition-colors overflow-hidden ${
                        isExpanded 
                          ? 'border-[#22c55e]/60 bg-[#161619] shadow-xl shadow-black/40 ring-1 ring-[#22c55e]/30' 
                          : 'border-white/5 bg-[#121214] hover:border-white/10 active:scale-[0.99]'
                      }`}
                    >
                      {/* Clickable Header Row */}
                      <div 
                        onClick={() => setExpandedTripId(prev => prev === tripKey ? null : tripKey)}
                        className="p-5 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${trip.type === 'ride' ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-amber-500/15 text-amber-500'}`}>
                            {trip.type === 'ride' ? <User size={20} /> : <Utensils size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-black text-sm text-white truncate max-w-[130px]">{trip.restaurantName || trip.customerName}</h4>
                              {b.surgeMultiplier > 1 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                  <Zap size={9} fill="currentColor" /> {b.surgeMultiplier.toFixed(1)}x
                                </span>
                              )}
                              {b.tip > 0 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                  <Star size={9} fill="currentColor" /> Tip
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                               {new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trip.distance.toFixed(1)} mi
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2.5">
                          <div>
                            <p className="font-black text-base text-white">£{trip.earnings.toFixed(2)}</p>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                              {isExpanded ? 'Collapse' : 'Breakdown'}
                            </span>
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#22c55e] text-black' : 'bg-white/5 text-gray-400'}`}>
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Breakdown View with Smooth Height Transition */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key={`earn-breakdown-${tripKey}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ 
                              opacity: 1, 
                              height: 'auto',
                              transition: {
                                height: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.25, delay: 0.08 }
                              }
                            }}
                            exit={{ 
                              opacity: 0, 
                              height: 0,
                              transition: {
                                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.15 }
                              }
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 border-t border-white/5">
                              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 text-xs">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#22c55e] pb-1.5 border-b border-white/5">
                                  <span>Itemized Fare</span>
                                  <span>Driver Breakdown</span>
                                </div>

                              {/* 1. Base Fare */}
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-400 flex items-center gap-1.5">
                                  <DollarSign size={13} className="text-blue-400" /> Base Fare
                                </span>
                                <span className="font-black text-white">£{b.base.toFixed(2)}</span>
                              </div>

                              {/* Distance & Time Pay */}
                              <div className="flex justify-between items-center text-gray-400 text-[11px] pl-4">
                                <span>Distance & Time ({trip.distance.toFixed(1)} mi)</span>
                                <span className="font-bold text-white">£{(b.distancePay + b.timePay).toFixed(2)}</span>
                              </div>

                              {/* 2. Surge Multiplier */}
                              <div className={`flex justify-between items-center p-2 rounded-xl ${b.surgeMultiplier > 1 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2">
                                  <Zap size={14} fill={b.surgeMultiplier > 1 ? "currentColor" : "none"} className={b.surgeMultiplier > 1 ? "text-amber-400" : "text-gray-400"} />
                                  <span className={`font-bold ${b.surgeMultiplier > 1 ? 'text-amber-400' : 'text-gray-400'}`}>Surge Multiplier</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${b.surgeMultiplier > 1 ? 'bg-amber-400 text-black' : 'text-gray-400'}`}>
                                    {b.surgeMultiplier.toFixed(1)}x
                                  </span>
                                  <span className={`font-black ${b.surge > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                                    {b.surge > 0 ? `+£${b.surge.toFixed(2)}` : '£0.00'}
                                  </span>
                                </div>
                              </div>

                              {/* 3. Customer Tip */}
                              <div className={`flex justify-between items-center p-2 rounded-xl ${b.tip > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2">
                                  <Star size={14} fill={b.tip > 0 ? "currentColor" : "none"} className={b.tip > 0 ? "text-[#22c55e]" : "text-gray-400"} />
                                  <span className={`font-bold ${b.tip > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>Customer Tip (100% yours)</span>
                                </div>
                                <span className={`font-black ${b.tip > 0 ? 'text-emerald-400 font-mono text-sm' : 'text-gray-400'}`}>
                                  {b.tip > 0 ? `+£${b.tip.toFixed(2)}` : '£0.00'}
                                </span>
                              </div>

                              {/* Total Payout */}
                              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                <span className="font-black text-white uppercase tracking-wider text-xs">Total Net Payout</span>
                                <span className="text-xl font-black text-[#22c55e]">£{trip.earnings.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* View Full Route Map Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrip(trip);
                              }}
                              className="mt-3 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-98"
                            >
                              <span>View Full Route Map & Receipt</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
              <button className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[#22c55e] transition-colors">Load More History</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pb-10 border-t border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl shrink-0">
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available to cash out</p>
            <h3 className="text-3xl font-black text-white">£{earnings.toFixed(2)}</h3>
          </div>
          <button className="text-[#22c55e] font-black flex items-center gap-2 text-sm active:scale-95 transition-all uppercase tracking-wider">
             <Landmark size={18} /> Instant Pay
          </button>
        </div>
        <button 
          onClick={handleCashOut}
          disabled={earnings <= 0 || isCashOutLoading}
          className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-xl relative overflow-hidden flex items-center justify-center gap-3 uppercase tracking-wider ${earnings > 0 ? 'bg-[#22c55e] text-black hover:bg-[#1fbd52] active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
        >
          {isCashOutLoading ? (
            <RefreshCw size={24} className="animate-spin" />
          ) : (
            <>CASH OUT <ArrowRight size={20} /></>
          )}
          {isCashOutLoading && <motion.div layoutId="progress" initial={{ x: '-100%' }} animate={{ x: 0 }} className="absolute inset-0 bg-[#22c55e]/15 pointer-events-none" />}
        </button>
      </div>
    </motion.div>
  );
};
