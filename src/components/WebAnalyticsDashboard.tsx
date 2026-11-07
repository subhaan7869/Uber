import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BarChart2, Globe, Laptop, Chrome, Smartphone, 
  MapPin, HelpCircle, Activity, Play, RefreshCw, 
  ArrowUpRight, Monitor, ArrowRight, Zap, PlayCircle, ToggleRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

export interface AnalyticsEvent {
  id: string;
  name: string;
  count: number;
  lastTriggered: string;
}

export interface WebAnalyticsDashboardProps {
  theme?: 'light' | 'dark';
  onClose: () => void;
  currentScreen: string;
  isOnline: boolean;
  activeOrdersCount: number;
  completedTripsCount: number;
  isLowPerformance: boolean;
  isSimulatingMovement: boolean;
  targetPrice?: number;
}

// Generate static sample data for Referrers, Countries, Browsers, etc.
const INITIAL_REFERRERS = [
  { name: 'Direct (Bookmark)', visitors: 782, percent: 45 },
  { name: 'Google Search', visitors: 421, percent: 24 },
  { name: 'github.com/react-example', visitors: 289, percent: 16 },
  { name: 'ai.studio/build', visitors: 194, percent: 11 },
  { name: 'vercel.com/dashboard', visitors: 68, percent: 4 },
];

const INITIAL_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', visitors: 1102, percent: 63 },
  { code: 'US', name: 'United States', visitors: 349, percent: 20 },
  { code: 'DE', name: 'Germany', visitors: 114, percent: 6 },
  { code: 'FR', name: 'France', visitors: 89, percent: 5 },
  { code: 'JP', name: 'Japan', visitors: 56, percent: 3 },
  { code: 'CA', name: 'Canada', visitors: 44, percent: 2 },
];

const INITIAL_DEVICES = [
  { name: 'Mobile Devices', visitors: 1224, percent: 70 },
  { name: 'Desktop Browsers', visitors: 472, percent: 27 },
  { name: 'Tablet Devices', visitors: 58, percent: 3 },
];

const INITIAL_BROWSERS = [
  { name: 'Google Chrome', visitors: 1042, percent: 60 },
  { name: 'Apple Safari', visitors: 486, percent: 28 },
  { name: 'Mozilla Firefox', visitors: 116, percent: 6 },
  { name: 'Microsoft Edge', visitors: 88, percent: 5 },
  { name: 'Safari Mobile', visitors: 22, percent: 1 },
];

const INITIAL_OS = [
  { name: 'iOS Mobile', visitors: 871, percent: 50 },
  { name: 'Android OS', visitors: 353, percent: 20 },
  { name: 'macOS Desktop', visitors: 312, percent: 18 },
  { name: 'Windows OS', visitors: 185, percent: 11 },
  { name: 'Linux', visitors: 33, percent: 1 },
];

export const WebAnalyticsDashboard: React.FC<WebAnalyticsDashboardProps> = ({
  theme = 'dark',
  onClose,
  currentScreen,
  isOnline,
  activeOrdersCount,
  completedTripsCount,
  isLowPerformance,
  isSimulatingMovement,
  targetPrice = 5.00
}) => {
  // Main local state for stats
  const [visitors, setVisitors] = useState(248);
  const [pageViews, setPageViews] = useState(841);
  const [bounceRate, setBounceRate] = useState(28.4);
  const [trackerActive, setTrackerActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'referrers' | 'countries' | 'tech' | 'events' | 'flags'>('pages');
  
  // Custom Events logged via user navigation
  const [customEvents, setCustomEvents] = useState<AnalyticsEvent[]>([
    { id: '1', name: 'screen_view:home', count: 145, lastTriggered: '10s ago' },
    { id: '2', name: 'gps_update', count: 521, lastTriggered: '2s ago' },
    { id: '3', name: 'online_toggle:on', count: 32, lastTriggered: '12m ago' },
    { id: '4', name: 'order_accepted', count: 18, lastTriggered: '25m ago' },
    { id: '5', name: 'order_delivered', count: 14, lastTriggered: '40m ago' },
  ]);

  // Pages view counts
  const [pageStats, setPageStats] = useState<Array<{ path: string; views: number; percent: number }>>([
    { path: '/home', views: 385, percent: 45 },
    { path: '/earnings', views: 189, percent: 22 },
    { path: '/account', views: 104, percent: 12 },
    { path: '/wallet', views: 82, percent: 10 },
    { path: '/safety', views: 51, percent: 6 },
    { path: '/diagnostics', views: 30, percent: 5 },
  ]);

  // Generate hourly view data for beautiful area chart
  const chartData = useMemo(() => {
    const data = [];
    const baseViews = 15;
    for (let i = 23; i >= 0; i--) {
      const hr = new Date();
      hr.setHours(hr.getHours() - i);
      const hourStr = hr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add randomness but keep curve organic
      const multi = 1 + Math.sin((24 - i) / 3.5) * 0.4 + Math.random() * 0.25;
      data.push({
        time: hourStr,
        'Page Views': Math.floor(baseViews * multi * 1.8),
        'Unique Visitors': Math.floor(baseViews * multi * 0.7),
      });
    }
    return data;
  }, []);

  // Soft Background Traffic Simulation
  useEffect(() => {
    if (!trackerActive) return;

    const interval = setInterval(() => {
      // Simulate real-world hits
      setPageViews(p => p + 1);
      if (Math.random() > 0.75) {
        setVisitors(v => v + 1);
      }
      
      // Randomly fluctuation on bounce rate
      setBounceRate(b => {
        const diff = (Math.random() - 0.5) * 0.2;
        return parseFloat(Math.min(99, Math.max(1, b + diff)).toFixed(1));
      });

      // Update pages statistics at random
      setPageStats(prev => {
        const randIndex = Math.floor(Math.random() * prev.length);
        return prev.map((p, idx) => {
          if (idx === randIndex) {
            const up = p.views + 1;
            return { ...p, views: up };
          }
          return p;
        });
      });

      // Update generic gps_update event
      setCustomEvents(prev => prev.map(evt => {
        if (evt.name === 'gps_update') {
          return { ...evt, count: evt.count + 1, lastTriggered: 'Just now' };
        }
        return evt;
      }));

    }, 4000);

    return () => clearInterval(interval);
  }, [trackerActive]);

  // Intercept changes to current user interactions to update live dashboard!
  useEffect(() => {
    if (!trackerActive) return;

    // Track Screen Views
    setPageViews(p => p + 2);
    setPageStats(prev => {
      const formattedPath = `/${currentScreen}`;
      const found = prev.find(p => p.path === formattedPath);
      if (found) {
        return prev.map(p => p.path === formattedPath ? { ...p, views: p.views + 1 } : p);
      } else {
        return [...prev, { path: formattedPath, views: 1, percent: 1 }].sort((a,b) => b.views - a.views);
      }
    });

    // Record Event log in the Events List
    setCustomEvents(prev => {
      const eventName = `screen_view:${currentScreen}`;
      const found = prev.find(e => e.name === eventName);
      if (found) {
        return prev.map(e => e.name === eventName ? { ...e, count: e.count + 1, lastTriggered: 'Just now' } : e);
      } else {
        const uniqueId = `${eventName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return [{ id: uniqueId, name: eventName, count: 1, lastTriggered: 'Just now' }, ...prev];
      }
    });
  }, [currentScreen, trackerActive]);

  // React to system state Changes like Going Online, Low performance mode, simulating movement
  useEffect(() => {
    if (!trackerActive) return;
    setCustomEvents(prev => {
      const eventName = isOnline ? 'online_toggle:on' : 'online_toggle:off';
      const found = prev.find(e => e.name === eventName);
      if (found) {
        return prev.map(e => e.name === eventName ? { ...e, count: e.count + 1, lastTriggered: 'Just now' } : e);
      } else {
        const uniqueId = `${eventName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return [{ id: uniqueId, name: eventName, count: 1, lastTriggered: 'Just now' }, ...prev];
      }
    });
  }, [isOnline]);

  useEffect(() => {
    if (!trackerActive) return;
    if (activeOrdersCount > 0) {
      setCustomEvents(prev => {
        const found = prev.find(e => e.name === 'order_accepted');
        if (found) {
          return prev.map(e => e.name === 'order_accepted' ? { ...e, count: e.count + 1, lastTriggered: 'Just now' } : e);
        }
        return prev;
      });
    }
  }, [activeOrdersCount]);

  useEffect(() => {
    if (!trackerActive) return;
    if (completedTripsCount > 0) {
      setCustomEvents(prev => {
        const found = prev.find(e => e.name === 'order_delivered');
        if (found) {
          return prev.map(e => e.name === 'order_delivered' ? { ...e, count: e.count + 1, lastTriggered: 'Just now' } : e);
        }
        return prev;
      });
    }
  }, [completedTripsCount]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-3 sm:p-6 md:p-10 select-none overflow-hidden">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl h-full max-h-[850px] bg-[#090a0f] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden text-gray-200 font-sans"
      >
        {/* Dynamic Header HUD */}
        <div className="px-6 py-5 border-b border-white/5 bg-[#0e1017] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-lg">
              <svg viewBox="0 0 76 65" className="w-5 h-5 fill-current">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-[#0070f3] uppercase leading-none">Vercel Web Analytics</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${trackerActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${trackerActive ? 'bg-[#10b981]' : 'bg-rose-500'}`}></span>
                </span>
              </div>
              <h1 className="text-xl font-black font-display text-white tracking-tight">Vite SPA Analytics HUD</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Play/Stop Tracking Simulation */}
            <button
              onClick={() => setTrackerActive(!trackerActive)}
              className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 font-black uppercase tracking-wider transition-all shadow-md ${
                trackerActive 
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10b981] border-emerald-500/20' 
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20'
              }`}
            >
              {trackerActive ? <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '4s' }} /> : <Play size={12} />}
              {trackerActive ? 'LIVE TRACKING' : 'MUTED'}
            </button>

            <button 
              onClick={onClose} 
              className="p-2 ml-auto sm:ml-0 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-full border border-white/5 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Status Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0070f3]" />
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase leading-none">Unique Visitors</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black font-mono text-white tracking-tight">{visitors}</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-0.5">
                  +1.2% <ArrowUpRight size={12} />
                </span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase">Simulated unique devices</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#10b981]" />
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase leading-none">Page Views</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black font-mono text-white tracking-tight">{pageViews}</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-0.5">
                  +3.8% <ArrowUpRight size={12} />
                </span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase">Screen Views & transitions</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              <p className="text-[10px] font-black text-gray-400 tracking-wider uppercase leading-none">Bounce Rate</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black font-mono text-white tracking-tight">{bounceRate}%</span>
                <span className="text-xs font-black text-rose-500 flex items-center gap-0.5">
                  +0.4% <ArrowUpRight size={12} className="rotate-90" />
                </span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase">Page view durations under 10s</p>
            </div>
          </div>

          {/* Core Analytics Line Chart */}
          <div className="p-5 rounded-3xl bg-[#0e1017] border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5 leading-none">
                  <Activity size={14} className="text-[#0070f3]" /> Visited Timeline
                </h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Hits monitored over the last 24 hours</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#0070f3] rounded-full" />
                  <span className="text-gray-300">Page Views</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#3b82f6]/40 rounded-full" />
                  <span className="text-gray-300">Unique Users</span>
                </div>
              </div>
            </div>

            <div className="w-full h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070f3" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222530" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#4a4d61" 
                    fontSize={8} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#4a4d61" 
                    fontSize={8} 
                    fontFamily="monospace" 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#090a0f', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }}
                    labelStyle={{ fontSize: 10, fontWeight: 'bold', color: '#888' }}
                    itemStyle={{ fontSize: 12, fontWeight: 'black', color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Page Views" 
                    stroke="#0070f3" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#viewsGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Unique Visitors" 
                    stroke="#3b82f6" 
                    strokeWidth={1}
                    fillOpacity={1} 
                    fill="url(#usersGrad)" 
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Navigation Sub Tab panels */}
          <div className="flex flex-wrap border-b border-white/5 gap-1 pb-1">
            {[
              { id: 'pages', label: 'Pages (Routes)', icon: <BarChart2 size={12} /> },
              { id: 'referrers', label: 'Referrers', icon: <Globe size={12} /> },
              { id: 'countries', label: 'Countries', icon: <MapPin size={12} /> },
              { id: 'tech', label: 'Target Tech', icon: <Laptop size={12} /> },
              { id: 'events', label: 'Custom Events Log', icon: <Activity size={12} /> },
              { id: 'flags', label: 'Feature Flags', icon: <ToggleRight size={12} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel renderer */}
          <div className="bg-[#0e1017] border border-white/5 rounded-3xl p-5 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'pages' && (
                <motion.div 
                  key="pages_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-gray-400 font-bold mb-2">Most visited routes inside your app container</p>
                  
                  <div className="space-y-2">
                    {pageStats.map((item, idx) => (
                      <div key={`page-stat-${item.path || 'p'}-${idx}`} className="relative p-3 rounded-xl bg-[#12141f]/40 border border-white/5 overflow-hidden group">
                        {/* Progress Bar background */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-[#0070f3]/5 transition-all duration-1000"
                          style={{ width: `${item.percent}%` }}
                        />
                        <div className="relative flex justify-between items-center z-10 text-xs">
                          <code className="text-[#0070f3] font-mono font-bold">{item.path}</code>
                          <div className="flex items-center gap-4 text-right">
                            <span className="font-mono text-gray-400">{item.views} hits</span>
                            <span className="font-mono font-bold text-white w-10">{Math.floor((item.views/pageViews)*100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'referrers' && (
                <motion.div 
                  key="referrers_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-gray-400 font-bold mb-2">Sources where visitors clicked to open your site</p>
                  
                  <div className="space-y-2">
                    {INITIAL_REFERRERS.map((item, idx) => (
                      <div key={`ref-${item.name}-${idx}`} className="relative p-3 rounded-xl bg-[#12141f]/40 border border-white/5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-[#10b981]/5"
                          style={{ width: `${item.percent}%` }}
                        />
                        <div className="relative flex justify-between items-center z-10 text-xs">
                          <span className="font-bold text-gray-200">{item.name}</span>
                          <div className="flex items-center gap-4 text-right">
                            <span className="font-mono text-gray-400">{item.visitors} users</span>
                            <span className="font-mono font-bold text-white w-10">{item.percent}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'countries' && (
                <motion.div 
                  key="countries_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-gray-400 font-bold mb-2">Geographical origin from client IP lookup headers</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {INITIAL_COUNTRIES.map((item, idx) => (
                      <div key={`country-${item.code}-${idx}`} className="relative p-3 rounded-xl bg-[#12141f]/40 border border-white/5 overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.code === 'GB' ? '🇬🇧' : item.code === 'US' ? '🇺🇸' : item.code === 'DE' ? '🇩🇪' : item.code === 'FR' ? '🇫🇷' : item.code === 'JP' ? '🇯🇵' : '🇨🇦'}</span>
                          <span className="text-xs font-bold text-gray-200">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-black text-gray-400">{item.visitors} ({item.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'tech' && (
                <motion.div 
                  key="tech_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Device Typologies</h4>
                    <div className="space-y-2">
                      {INITIAL_DEVICES.map((item, idx) => (
                        <div key={`device-${item.name}-${idx}`} className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 font-bold">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-gray-400">{item.visitors}</span>
                            <span className="font-mono font-black text-[#0070f3] w-10 text-right">{item.percent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Browsers</h4>
                      <div className="space-y-2">
                        {INITIAL_BROWSERS.map((item, idx) => (
                          <div key={`browser-${item.name}-${idx}`} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-bold">{item.name}</span>
                            <span className="font-mono font-black text-emerald-400">{item.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Operating Systems</h4>
                      <div className="space-y-2">
                        {INITIAL_OS.map((item, idx) => (
                          <div key={`os-${item.name}-${idx}`} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-bold">{item.name}</span>
                            <span className="font-mono font-black text-amber-500">{item.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'events' && (
                <motion.div 
                  key="events_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-400 font-bold">Custom event telemetry triggered from your session</p>
                    <span className="text-[9px] bg-[#0070f3] uppercase font-black px-2 py-0.5 rounded text-white">INTERACTIVE EVENTS</span>
                  </div>

                  <div className="space-y-2">
                    {customEvents.map((item, idx) => (
                      <div key={`cust-event-${item.id || idx}-${idx}`} className="p-3 rounded-xl bg-[#12141f]/60 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse" />
                          <code className="text-gray-100 font-mono font-black text-[11px] bg-black/60 px-2 py-1 rounded border border-white/5">{item.name}</code>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <span className="font-mono font-extrabold text-blue-400">{item.count} fired</span>
                          <span className="text-[10px] text-gray-500 font-mono">{item.lastTriggered}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 font-bold mt-2 text-center">
                    💡 Click around the driver portal: toggle "Go Online", switch tabs, accept jobs! Watch your actions dispatch telemetry in real-time.
                  </p>
                </motion.div>
              )}

              {activeTab === 'flags' && (
                <motion.div 
                  key="flags_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-gray-400 font-bold mb-2">Status of active feature flags during your run</p>

                  <div className="space-y-2">
                    {[
                      { name: 'is_low_performance', value: isLowPerformance ? 'ENABLED' : 'DISABLED', desc: 'Battery Saver toggled under Account Options' },
                      { name: 'is_online_persistence', value: isOnline ? 'ONLINE' : 'OFFLINE', desc: 'Driver went live on core network map' },
                      { name: 'simulate_movement', value: isSimulatingMovement ? 'ACTIVE' : 'INACTIVE', desc: 'GPS automatic mock location walker settings' },
                      { name: 'use_google_maps', value: 'ENABLED', desc: 'Interactive Google Maps Platform component binding' },
                      { name: 'target_price_limit', value: `£${targetPrice.toFixed(2)}`, desc: 'Minimum acceptable payout filter for matched jobs' },
                    ].map((flag, idx) => (
                      <div key={`flag-${flag.name}-${idx}`} className="p-3 rounded-xl bg-[#12141f]/35 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                        <div>
                          <code className="text-orange-400 font-mono font-black">{flag.name}</code>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-bold">{flag.desc}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          flag.value === 'ENABLED' || flag.value === 'ONLINE' || flag.value === 'ACTIVE'
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white/5 text-gray-400 border border-white/5'
                        }`}>
                          {flag.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Vercel Project Integration instructions footer */}
          <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
            <Zap className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div className="text-left text-xs">
              <p className="font-black text-white">How Vercel Web Analytics works behind the scenes</p>
              <p className="text-gray-400 font-bold mt-1 leading-relaxed">
                The official Vercel tracking package is fully integrated and instantiated in <code className="text-gray-300 font-bold px-1 bg-white/5 rounded">/src/main.tsx</code> as <code className="text-[#0070f3] font-bold">&lt;Analytics /&gt;</code>. 
                When you deploy this project to Vercel, the script automatically attaches to Vercel's edge network and gathers real-world visitors!
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
