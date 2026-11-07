import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Navigation as NavIcon, 
  Settings, 
  MessageSquare, 
  Mail, 
  Bell, 
  Play, 
  X, 
  Check, 
  AlertCircle,
  Clock,
  Smartphone,
  Compass,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Order, NavSimulation } from '../types';

interface SimulatedHomeScreenProps {
  pendingOrder: Order | null;
  isOnline: boolean;
  onOpenApp: () => void;
  activeOrders: Order[];
  navSimulation: NavSimulation;
  onAcceptOrder: () => void;
  onRejectOrder: () => void;
  orderExpiryTimer: number;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'alert' | 'message') => void;
  addDebugLog: (type: 'info' | 'warn' | 'error' | 'success', message: string) => void;
  iosCoreLocationPerm?: 'always' | 'denied';
  iosActivityKitState?: 'compact' | 'expanded' | 'inactive';
  iosMapKitEngine?: 'rendered' | 'suspended';
  iosWidgetKitTimeline?: number;
  iosBackgroundModes?: boolean;
  iosApnsHandshake?: boolean;
}

export default function SimulatedHomeScreen({
  pendingOrder,
  isOnline,
  onOpenApp,
  activeOrders,
  navSimulation,
  onAcceptOrder,
  onRejectOrder,
  orderExpiryTimer,
  addToast,
  addDebugLog,
  iosCoreLocationPerm = 'always',
  iosActivityKitState = 'compact',
  iosMapKitEngine = 'rendered',
  iosWidgetKitTimeline = 3,
  iosBackgroundModes = true,
  iosApnsHandshake = true
}: SimulatedHomeScreenProps) {
  const [timeStr, setTimeStr] = useState('12:00');
  const [dateStr, setDateStr] = useState('Sunday, 24 May');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 15);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    addDebugLog('info', 'Tapped notification banner, restoring driver application.');
    onOpenApp();
  };

  const handleAcceptFromWidget = () => {
    addDebugLog('success', 'Accepted incoming offer directly from simulated Home Screen card!');
    onAcceptOrder();
    onOpenApp();
    addToast("Job Accepted!", "Trip assigned. Restoring map navigation routing guide.", "success");
  };

  const handleDeclineFromWidget = () => {
    addDebugLog('warn', 'Declined offer directly from simulated Home Screen.');
    onRejectOrder();
  };

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPipAvailable, setIsPipAvailable] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPipAvailable('pictureInPictureEnabled' in document);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLeavePip = () => {
      setIsPipActive(false);
      addDebugLog('info', 'ActivityKit: Picture-in-Picture Live Activity window closed.');
    };

    video.addEventListener('leavepictureinpicture', handleLeavePip);
    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, [addDebugLog]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderFrame = () => {
      // 1. Clear background with dark iOS-like gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020617'); // slate-950
      grad.addColorStop(1, '#090d16'); // deep dark
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. High-contrast accent border
      ctx.strokeStyle = '#2563eb'; // blue-600
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // 3. Render Header Text
      ctx.fillStyle = '#60a5fa'; // blue-400
      ctx.font = '900 13px system-ui, -apple-system, sans-serif';
      ctx.fillText('⚡ DUAL DISPATCH', 16, 28);

      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = 'bold 9px monospace';
      ctx.fillText('REALTIME CORE-LOCATION', 215, 26);

      // 4. Render Primary State Visualizer
      if (iosCoreLocationPerm === 'denied') {
        ctx.fillStyle = '#f87171'; // rose-400
        ctx.font = '900 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('GPS ACCESS DENIED', 16, 64);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText('Please restore Core Location permissions to resume tracking.', 16, 84);
      } else if (iosMapKitEngine === 'suspended') {
        ctx.fillStyle = '#fbbf24'; // amber-400
        ctx.font = '900 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('MAP ENGINE SUSPENDED', 16, 64);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText('MapKit background threads frozen at 0Hz.', 16, 84);
      } else if (navSimulation.active) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Arriving in ${navSimulation.eta.toFixed(0)} mins`, 16, 60);

        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const tripTypeLabel = navSimulation.type === 'pickup' 
          ? 'Route Segment: Heading to Merchant Pickup' 
          : 'Route Segment: Delivering to Customer';
        ctx.fillText(tripTypeLabel, 16, 80);

        // Target miles text
        ctx.fillStyle = '#60a5fa'; // blue-400
        ctx.font = '900 20px monospace';
        ctx.fillText(`${navSimulation.distanceRemaining.toFixed(1)} mi`, 265, 60);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('TRIP REMAINING', 265, 75);
      } else {
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.font = '900 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('DISPATCH RADAR SCANNING', 16, 64);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText('Listening for live geofence beacons...', 16, 84);
      }

      // 5. Progress slider indicator
      if (navSimulation.active && iosCoreLocationPerm !== 'denied') {
        const pX = 16;
        const pY = 96;
        const pW = canvas.width - 32;
        const pH = 8;

        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pX, pY, pW, pH, 4) : ctx.rect(pX, pY, pW, pH);
        ctx.fill();

        const progW = Math.max(0, Math.min(1, navSimulation.progress)) * pW;
        if (progW > 0) {
          const pGrad = ctx.createLinearGradient(pX, pY, pX + progW, pY);
          pGrad.addColorStop(0, '#3b82f6'); // blue
          pGrad.addColorStop(1, '#10b981'); // emerald
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(pX, pY, progW, pH, 4) : ctx.rect(pX, pY, progW, pH);
          ctx.fill();
        }
      }

      // 6. Footer coordinates metadata
      ctx.fillStyle = '#475569'; // slate-600
      ctx.font = '900 8.5px monospace';
      const fSpeed = `SPEED: ${iosCoreLocationPerm === 'denied' || iosMapKitEngine === 'suspended' ? '0' : navSimulation.speed.toFixed(0)} MPH`;
      ctx.fillText(fSpeed, 16, 128);

      const fCoord = iosCoreLocationPerm === 'denied' 
        ? 'GPS: ACCESS_BLOCKED' 
        : navSimulation.currentPos 
          ? `LAT/LNG: ${navSimulation.currentPos.lat.toFixed(5)}, ${navSimulation.currentPos.lng.toFixed(5)}` 
          : 'LAT/LNG: WAITING';
      ctx.fillText(fCoord, 125, 128);

      const fPlist = !iosBackgroundModes ? 'PLIST: BLOCK' : 'PLIST: RUN';
      ctx.fillText(fPlist, 290, 128);

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [navSimulation, iosCoreLocationPerm, iosMapKitEngine, iosBackgroundModes]);

  const handleTogglePip = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPipActive) {
      if (document.exitPictureInPicture) {
        try {
          await document.exitPictureInPicture();
          setIsPipActive(false);
        } catch (err) {}
      }
    } else {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
        if (!stream) {
          addToast("Unsupported Stream", "Your browser does not support canvas element streams.", "alert");
          return;
        }

        video.srcObject = stream;
        await video.play();
        await video.requestPictureInPicture();
        setIsPipActive(true);
        addDebugLog('success', 'ActivityKit: Picture-in-Picture floating Live Activity successfully spawned.');
        addToast("Floating Widget Launched", "A real floating iOS Live Activity is now active on your system screen!", "success");
      } catch (err: any) {
        console.error("Picture-in-Picture activation error:", err);
        addToast("Launch Failed", "Interact with the application first, then trigger Floating widgets.", "alert");
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-black text-white flex flex-col justify-between overflow-hidden relative font-sans select-none">
      
      {/* Phone Wallpaper Accent Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[80px]" />

      {/* Top Status Bar Simulator */}
      <div className="w-full px-5 pt-3 pb-2 flex items-center justify-between z-50 bg-black/30 backdrop-blur-sm shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black tracking-tight font-mono text-slate-100">{timeStr}</span>
          <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded ml-1 tracking-wider uppercase">EE 5G</span>
          {isOnline && (
            <motion.div 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
              ONLINE WIDGET ACTIVE
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-slate-300">
          <NavIcon size={11} className="text-blue-400 animate-pulse fill-blue-400" />
          <Signal size={12} />
          <Wifi size={12} />
          <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-black">
            <span>84%</span>
            <Battery size={14} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Home Grid Area */}
      <div className="flex-1 px-6 pt-10 pb-4 flex flex-col relative z-20">
        
        {/* Large Aesthetic Widget clock */}
        <div className="text-center mb-10 mt-2">
          <h2 className="text-5xl font-extrabold tracking-tighter text-white drop-shadow-md">{timeStr}</h2>
          <p className="text-xs tracking-[0.2em] font-black text-blue-400 mt-1 uppercase">{dateStr}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/60 border border-white/5 backdrop-blur-md px-4 py-1.5 rounded-full drop-shadow">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[9px] font-mono tracking-wider font-extrabold text-slate-300 uppercase">
              {isOnline ? 'GPS LINK: STABLE' : 'DRIVER SERVICE: SLEEPING'}
            </span>
          </div>
        </div>

        {/* iOS Lock Screen / Dynamic Island WidgetKit & ActivityKit Simulation */}
        {isOnline && iosActivityKitState !== 'inactive' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: iosActivityKitState === 'expanded' ? 1.02 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-full max-w-sm mx-auto bg-slate-950/90 backdrop-blur-2xl border rounded-[28px] p-4 shadow-2xl mb-8 relative overflow-hidden text-left hover:border-blue-500/25 transition-all duration-300 group ${
              iosActivityKitState === 'expanded' ? 'border-blue-500/35 ring-1 ring-blue-500/10' : 'border-white/10'
            }`}
          >
            {/* Ambient Background Glow matching trip type and permissions status */}
            <div className={`absolute -inset-10 opacity-10 bg-gradient-to-tr ${
              iosCoreLocationPerm === 'denied' ? 'from-rose-500 to-amber-500' :
              !iosBackgroundModes ? 'from-amber-600 to-rose-700' :
              navSimulation.active ? 'from-blue-500 to-indigo-500' : 'from-emerald-500 to-teal-500'
            } blur-[40px] pointer-events-none`} />

            {/* Header: App Brand, ActivityKit Service details */}
            <div className="flex items-center justify-between mb-3 relative z-10 border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                  <Compass size={11} className="text-white animate-spin-slow" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Dual Dispatch</span>
                <span className={`text-[7.5px] px-1.5 py-0.5 border rounded font-black font-mono tracking-wider uppercase ${
                  iosActivityKitState === 'expanded' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' :
                  navSimulation.active ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                }`}>
                  {iosActivityKitState === 'expanded' ? 'ActivityKit Expanded' : navSimulation.active ? 'ActivityKit Live' : 'WidgetKit Active'}
                </span>
                {iosWidgetKitTimeline > 3 && (
                  <span className="text-[7px] px-1 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold rounded">
                    T-{iosWidgetKitTimeline}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${iosApnsHandshake ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-black tracking-wider text-slate-500 uppercase">
                  {iosApnsHandshake ? 'APNs: STANDBY' : 'APNs: OFFLINE'}
                </span>
              </div>
            </div>

            {/* Core Location Lockout Warning Banner */}
            {iosCoreLocationPerm === 'denied' && (
              <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-[9.5px] font-mono text-rose-400 relative z-10 animate-bounce">
                <AlertCircle size={12} className="shrink-0" />
                <span className="font-extrabold uppercase tracking-wider">Core Location Permission Denied: GPS Updates Halted</span>
              </div>
            )}

            {/* Plist Entitlements Warning Banner */}
            {!iosBackgroundModes && (
              <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[9.5px] font-mono text-amber-400 relative z-10">
                <AlertCircle size={12} className="shrink-0" />
                <span className="font-extrabold uppercase tracking-wider">Plist Suspended: Threads freeze on lock</span>
              </div>
            )}

            {/* Body content based on Active Navigation or Standby dispatch offering */}
            {navSimulation.active ? (
              <div className="space-y-3.5 relative z-10">
                {/* Route Segment, ETA countdown */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/15 rounded-2xl text-blue-400 shrink-0">
                      <NavIcon size={18} className="rotate-45 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {iosMapKitEngine === 'suspended' ? 'Navigation Suspended' :
                         navSimulation.type === 'pickup' ? 'Heading to Merchant / Pickup' : 
                         navSimulation.type === 'dropoff' ? 'Delivering to Customer' : 'Driving to Demand Hotspot'}
                      </h4>
                      <p className="text-lg font-black text-white tracking-tight mt-0.5 leading-none">
                        {iosMapKitEngine === 'suspended' ? (
                          <span className="text-slate-500">Maps Frozen</span>
                        ) : (
                          <>Arriving in <span className="text-blue-400 font-mono">{navSimulation.eta.toFixed(0)}</span> mins</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">MAPKIT RANGE</span>
                    <span className="text-sm font-mono font-black text-slate-200">
                      {iosMapKitEngine === 'suspended' ? 'FREEZE' : `${navSimulation.distanceRemaining.toFixed(1)} mi`}
                    </span>
                  </div>
                </div>

                {/* Progress bar tracking the Web Driver geofence progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8.5px] font-mono font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={9} className="text-blue-500" /> Start
                    </span>
                    <span className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded text-[8px] font-black tracking-wide">
                      SPEED: {iosCoreLocationPerm === 'denied' || iosMapKitEngine === 'suspended' ? '0' : navSimulation.speed.toFixed(0)} MPH
                    </span>
                    <span>Destination</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${iosCoreLocationPerm === 'denied' ? 0 : navSimulation.progress * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Expanded mode additional details */}
                {iosActivityKitState === 'expanded' && (
                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 text-[10px] text-slate-400">
                    <div>
                      <span className="block text-[8px] font-mono font-extrabold uppercase text-slate-500 tracking-wider">ACTIVITY ENGINE</span>
                      <span className="text-indigo-400 font-bold font-mono">Live Session: active_run</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-mono font-extrabold uppercase text-slate-500 tracking-wider">MAP TILE STATUS</span>
                      <span className={iosMapKitEngine === 'rendered' ? "text-emerald-400 font-bold font-mono" : "text-amber-400 font-bold font-mono"}>
                        {iosMapKitEngine === 'rendered' ? "Vector Engine Hot" : "Tile Render Suspended"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Core Location system details strip */}
                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-2.5 py-1.5 text-[8px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 uppercase tracking-wide">
                    <span className={`w-1 h-1 rounded-full ${iosCoreLocationPerm === 'always' ? 'bg-cyan-400 animate-ping' : 'bg-rose-500'} inline-block`} />
                    {iosCoreLocationPerm === 'always' ? 'Core Location GPS Mode Active' : 'Core Location Access Denied'}
                  </span>
                  <span className="text-slate-300 font-bold font-mono">
                    {iosCoreLocationPerm === 'denied' ? 'BLOCKED' : navSimulation.currentPos ? `${navSimulation.currentPos.lat.toFixed(5)}, ${navSimulation.currentPos.lng.toFixed(5)}` : 'RE-INDEXING'}
                  </span>
                </div>

                {/* Real Picture-in-Picture Live Activity System Launcher */}
                {isPipAvailable && (
                  <button
                    onClick={handleTogglePip}
                    className={`w-full mt-1.5 py-2 px-3 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
                      isPipActive
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/30'
                    }`}
                  >
                    <Compass size={12} className={isPipActive ? 'animate-spin' : ''} />
                    {isPipActive ? 'Close Floating Live Activity (PiP)' : 'Launch Floating Live Activity (PiP)'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {/* Standby Widget */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className={`absolute inline-flex h-full w-full rounded-full ${iosCoreLocationPerm === 'always' ? 'animate-ping bg-emerald-400 opacity-75' : 'bg-rose-500 opacity-20'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${iosCoreLocationPerm === 'always' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">WidgetKit Dispatch Radar</h4>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">
                        {iosCoreLocationPerm === 'denied' ? 'Background scanner blocked' : 'Core Location scanning hotspots in background...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Geofencing status */}
                <div className="bg-black/30 border border-white/5 rounded-xl px-2.5 py-1.5 text-[8.5px] font-mono text-slate-500 flex justify-between items-center">
                  <span className="uppercase font-bold tracking-wider text-slate-400">Enrolled Background Modes:</span>
                  <span className={`font-black uppercase ${iosBackgroundModes ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {iosBackgroundModes ? 'Location, Audio, Alerts' : 'SUSPENDED'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {isOnline && iosActivityKitState === 'inactive' && (
          <div className="w-full max-w-sm mx-auto bg-slate-900/40 border border-white/5 rounded-[24px] p-4 text-center mb-8 relative z-10">
            <p className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-widest">
              ActivityKit Live Activity Inactive
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Enable "Live Activity" states from the iOS Native Dashboard inside the app to project Lock Screen widgets.
            </p>
          </div>
        )}

        {/* Dynamic Interactive Slide-Down Notification Banner */}
        <AnimatePresence>
          {pendingOrder && (
            <motion.div 
              key="slide-down-notif"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              onClick={handleNotificationClick}
              className="absolute left-4 right-4 top-4 z-[100] bg-slate-950/95 border border-white/10 backdrop-blur-xl p-4 rounded-[24px] shadow-2xl flex items-start gap-3.5 cursor-pointer hover:border-blue-500/40 active:scale-98 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg flex items-center justify-center shrink-0">
                <Smartphone size={22} className="text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">⚡ Dispatch Notification</span>
                  <span className="text-[9px] font-medium text-slate-500 font-mono">Just now</span>
                </div>
                <h3 className="text-xs font-black text-slate-100 mt-0.5 truncate uppercase">
                  NEW {pendingOrder.type === 'ride' ? 'PASSENGER REQUEST' : 'DELIVERY JOB'} AVAILABLE
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Stack details: <span className="text-emerald-400 font-bold">£{pendingOrder.estimatedPay.toFixed(2)}</span> • {pendingOrder.estimatedDistance.toFixed(1)} miles. Tap to overlay or accept.
                </p>
              </div>
              <ChevronRight size={14} className="text-slate-500 self-center shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulated iOS Style App Icons Grid */}
        <div className="grid grid-cols-4 gap-y-7 gap-x-3 mt-4 max-w-sm mx-auto">
          
          {/* Hyper Driver - Our App! */}
          <div className="flex flex-col items-center">
            <button 
              onClick={onOpenApp}
              className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center relative active:scale-90 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,158,255,0.45)] hover:shadow-[0_0_28px_rgba(0,158,255,0.75)] overflow-visible"
            >
              <img src="/icon.svg" alt="Hyper Driver" className="w-full h-full object-contain rounded-2xl" />
              
              {/* Notifications Badge */}
              {pendingOrder && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-pulse"
                >
                  1
                </motion.div>
              )}
            </button>
            <span className="text-[10px] text-slate-200 mt-1.5 font-bold tracking-tight text-center truncate w-full">Hyper Driver</span>
          </div>

          {[
            { label: "Safari", icon: <Compass size={24} className="text-sky-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Phone", icon: <Smartphone size={24} className="text-emerald-400 animate-pulse" />, bg: "bg-emerald-950/20 border border-emerald-500/10" },
            { label: "Maps", icon: <MapPin size={24} className="text-red-400" />, bg: "bg-red-950/10 border border-red-500/10" },
            { label: "Messages", icon: <MessageSquare size={24} className="text-blue-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Mail", icon: <Mail size={24} className="text-orange-400" />, bg: "bg-orange-950/15 border border-orange-500/10" },
            { label: "Settings", icon: <Settings size={21} className="text-slate-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Files", icon: <Clock size={22} className="text-indigo-400" />, bg: "bg-slate-900/40 border border-white/5" },
          ].map((app, i) => (
            <div key={`mock-app-${i}`} className="flex flex-col items-center">
              <button 
                onClick={() => addToast(`Mock Launch: ${app.label}`, "Simulated iOS device application placeholder. Open 'Dual Dispatch' to return.", "info")}
                className={`w-14 h-14 ${app.bg} backdrop-blur shadow rounded-2xl flex items-center justify-center text-slate-300 active:scale-90 transition-all cursor-pointer hover:border-white/20`}
              >
                {app.icon}
              </button>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-tight truncate w-full text-center">{app.label}</span>
            </div>
          ))}

        </div>

      </div>

      {/* Floating Uber-style Drag Dot Trigger Widget Button */}
      {isOnline && (
        <motion.div 
          drag
          dragElastic={0.15}
          dragMomentum={false}
          className="absolute z-[200] cursor-grab active:cursor-grabbing pointer-events-auto"
          style={{ bottom: '110px', right: '24px' }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
        >
          <div 
            onClick={onOpenApp}
            className="w-16 h-16 bg-slate-950 border-2 border-blue-500 rounded-full flex flex-col items-center justify-center shadow-[0_4px_25px_rgba(37,99,235,0.8)] relative"
          >
            {/* Pulsing Dot Halo */}
            <span className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping" />
            
            <Compass size={22} className="text-blue-400 animate-spin-slow relative z-10" />
            
            {/* Small Green LED status indicator */}
            <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border border-slate-950 flex items-center justify-center text-[7px] text-slate-950 font-black">
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-pulse" />
            </span>

            {/* Micro details speed limit tag */}
            <span className="text-[7.5px] font-black tracking-widest font-mono text-slate-300 relative z-10 uppercase mt-0.5">
              {navSimulation.active ? `${navSimulation.speed.toFixed(0)}mph` : 'ONLINE'}
            </span>

            {/* Glowing red alert badge if trip pending */}
            {pendingOrder && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full animate-bounce text-white font-sans font-black flex items-center justify-center text-[8px] z-50">
                ⚡
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Pop Up Job Offer Overlay Dialog on Home Screen */}
      <AnimatePresence>
        {pendingOrder && (
          <motion.div 
            key="home-screen-trip-overlay"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute left-0 right-0 bottom-0 z-[250] bg-slate-950 border-t-2 border-amber-500 rounded-t-[36px] overflow-hidden p-6 shadow-2xl flex flex-col gap-4 text-left border-b-8 border-slate-950"
          >
            {/* Header offer bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">🚨 HOME SCREEN HIGH PRIORITY ALLOCATION</p>
              </div>
              <div className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[9px] font-mono text-amber-500 font-black uppercase">
                {orderExpiryTimer}s remaining
              </div>
            </div>

            {/* Main price/earnings showcase */}
            <div className="flex justify-between items-baseline bg-white/5 border border-white/5 rounded-3xl p-5">
              <div>
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono block">ESTIMATED COMPOSITE PAYOUT</span>
                <span className="text-4xl font-extrabold tracking-tighter text-white">£{pendingOrder.estimatedPay.toFixed(2)}</span>
                {pendingOrder.surge ? (
                  <span className="bg-orange-600 font-sans text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ml-2 animate-pulse inline-block">
                    {pendingOrder.surge}x SURGE INCLUDED
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono block">RUN TRIP RANGE</span>
                <span className="text-lg font-mono font-black text-blue-400">{pendingOrder.estimatedDistance.toFixed(1)} mi</span>
              </div>
            </div>

            {/* Ride details list */}
            <div className="space-y-3 p-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold text-slate-300">
              <div className="flex justify-between">
                <span>Category Stack:</span>
                <span className="text-slate-100 uppercase">{pendingOrder.type === 'ride' ? '👪 Passenger Ride' : '🍔 Food Delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span>Merchant / Pickup:</span>
                <span className="text-blue-400 font-extrabold truncate max-w-[180px]">{pendingOrder.restaurantName || "High Priority Booking"}</span>
              </div>
              <div className="flex justify-between">
                <span>Transit Duration estimation:</span>
                <span className="text-slate-100">{pendingOrder.estimatedTime} minutes</span>
              </div>
            </div>

            {/* Progress countdown timeline bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shrink-0 mt-1">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(orderExpiryTimer / 18) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>

            {/* Tactile Accept / Decline trigger actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={handleDeclineFromWidget}
                className="py-4 bg-slate-900 hover:bg-slate-850 border border-white/5 hover:border-white/10 text-slate-300 font-black text-xs tracking-widest rounded-2xl uppercase transition-all duration-200 active:scale-95"
              >
                PASS OFFER
              </button>
              <button 
                onClick={handleAcceptFromWidget}
                className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest rounded-2xl uppercase shadow-xl shadow-blue-500/10 transition-all duration-200 active:scale-95"
              >
                ACCEPT OFFER
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home Navigation Indicator Swiper Swipe Bar */}
      <div className="w-full py-2.5 flex justify-center z-50 shrink-0 select-none bg-black/10">
        <button 
          onClick={onOpenApp}
          className="w-36 h-1.5 bg-slate-700/60 hover:bg-slate-500 rounded-full active:scale-90 transition-all"
          title="Return to application"
        />
      </div>

      {/* Hidden Picture-in-Picture Native Stream Capture Canvas/Video Assets */}
      <canvas 
        ref={canvasRef} 
        width={360} 
        height={150} 
        className="hidden pointer-events-none absolute w-[360px] h-[150px] top-[-1000px] left-[-1000px]" 
        style={{ display: 'none', visibility: 'hidden' }}
      />
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="hidden pointer-events-none absolute w-1 h-1 top-[-1000px] left-[-1000px]" 
        style={{ display: 'none', visibility: 'hidden' }}
      />

    </div>
  );
}
