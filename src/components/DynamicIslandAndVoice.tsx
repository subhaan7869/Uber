import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { 
  Mic, 
  MicOff, 
  PictureInPicture, 
  Tablet, 
  Smartphone, 
  Info, 
  Volume2, 
  CheckCircle2, 
  X, 
  Sparkles,
  Radio,
  Music,
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { dynamicIslandVoiceManager } from '../utils/dynamicIslandVoiceManager';

interface DynamicIslandAndVoiceProps {
  isOnline: boolean;
  pendingOrder?: Order | null;
  onAcceptOrder?: () => void;
  onDeclineOrder?: () => void;
  todayEarningsTotal?: number;
  onToggleOnline?: () => void;
}

export const DynamicIslandAndVoice: React.FC<DynamicIslandAndVoiceProps> = ({
  isOnline,
  pendingOrder,
  onAcceptOrder,
  onDeclineOrder,
  todayEarningsTotal = 0,
  onToggleOnline
}) => {
  // Subscribe to singleton Mic & Dynamic Island audio manager with stable bound methods
  const voiceState = useSyncExternalStore(
    dynamicIslandVoiceManager.subscribe,
    dynamicIslandVoiceManager.getState
  );

  const { isMicActive, micAudioLevel, lastHeardCommand, speechSupported, isPipActive } = voiceState;

  // Picture-in-Picture floating HUD state
  const [isPipAvailable, setIsPipAvailable] = useState<boolean>(false);

  // Guide Modal state
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'island' | 'ipad' | 'iphone_classic' | 'android'>('island');

  // Canvas & Video refs for Picture-in-Picture
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check PiP support on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPipAvailable('pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
    }
  }, []);

  // Sync latest command handlers to the singleton manager without resetting audio streams
  useEffect(() => {
    dynamicIslandVoiceManager.registerHandlers({
      onAcceptOrder,
      onDeclineOrder,
      onToggleOnline,
      isOnline
    });
  }, [onAcceptOrder, onDeclineOrder, onToggleOnline, isOnline]);

  const toggleMicSession = async () => {
    await dynamicIslandVoiceManager.toggleMic();
  };


  // Picture-in-Picture Floating Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pipAnimId: number;

    const renderPipFrame = () => {
      // 1. Clear background (High contrast dark theme)
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Glowing outer border
      if (pendingOrder) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 6;
      } else {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
      }
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // 3. Top Status Row
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('⚡ HYPER DRIVER', 20, 32);

      // Status indicator
      ctx.fillStyle = isOnline ? '#10b981' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(200, 26, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(isOnline ? 'ONLINE' : 'OFFLINE', 215, 31);

      // Live Earnings in PiP
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Today: £${todayEarningsTotal.toFixed(2)}`, canvas.width - 20, 32);
      ctx.textAlign = 'left';

      // Horizontal separator line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 48);
      ctx.lineTo(canvas.width - 20, 48);
      ctx.stroke();

      // 4. Center Content (Incoming Order or Radar Status)
      if (pendingOrder) {
        // High-contrast incoming offer alert card
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(20, 60, canvas.width - 40, 150);

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 60, canvas.width - 40, 150);

        // Header: Job Type
        ctx.fillStyle = '#93c5fd';
        ctx.font = '900 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(`🚨 NEW OFFER • ${pendingOrder.type.toUpperCase()}`, 35, 85);

        // Big Payout
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px system-ui, -apple-system, sans-serif';
        ctx.fillText(`£${(pendingOrder.estimatedPay || 15.50).toFixed(2)}`, 35, 128);

        // Trip distance & pickup
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        const distStr = `${(pendingOrder.estimatedDistance || 3.2).toFixed(1)} mi total`;
        ctx.fillText(distStr, 35, 158);

        // Voice instruction pill
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('🗣️ SPEAK "ACCEPT" OR "DECLINE"', 35, 190);
      } else {
        // Idle scanning status
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.fillText('RADAR ACTIVE • LOOKING FOR JOBS', 20, 95);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillText('Incoming requests will pop up right here.', 20, 125);
        ctx.fillText('Compatible with iPad Slide-Over & Android floating view.', 20, 150);

        // Mic status indicator in PiP
        ctx.fillStyle = isMicActive ? '#10b981' : '#f59e0b';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(
          isMicActive ? '🎙️ DYNAMIC ISLAND MIC ACTIVE (Spotify Safe)' : '🎙️ MIC VOICE STANDBY',
          20,
          195
        );
      }

      pipAnimId = requestAnimationFrame(renderPipFrame);
    };

    renderPipFrame();

    return () => {
      cancelAnimationFrame(pipAnimId);
    };
  }, [pendingOrder, isOnline, todayEarningsTotal, isMicActive]);

  // Handle PiP Toggle
  const handleTogglePip = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        dynamicIslandVoiceManager.setPipActive(false);
      } else {
        if (!video.srcObject) {
          const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
          if (stream) {
            video.srcObject = stream;
            await video.play().catch(() => {});
          }
        }
        await video.requestPictureInPicture();
        dynamicIslandVoiceManager.setPipActive(true);
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Video PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnter = () => dynamicIslandVoiceManager.setPipActive(true);
    const onLeave = () => dynamicIslandVoiceManager.setPipActive(false);

    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  return (
    <>
      {/* Hidden Canvas & Video for Universal Picture-in-Picture */}
      <canvas
        ref={canvasRef}
        width={480}
        height={240}
        className="hidden"
      />
      <video
        ref={videoRef}
        muted
        playsInline
        className="hidden"
      />

      {/* Action Controls Cluster in Header/Toolbar */}
      <div className="flex items-center gap-1.5">
        {/* Dynamic Island Mic Keep-Alive & Voice Dispatch Button */}
        <button
          onClick={toggleMicSession}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
            isMicActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-amber-500/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
          title="Dynamic Island Mic & Voice Mode (Spotify/Apple Music safe)"
        >
          {isMicActive ? (
            <>
              <div className="relative flex items-center justify-center">
                <Mic size={11} className="text-amber-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
              </div>
              <span>🎙️ Island Mic ON</span>
              {micAudioLevel > 15 && (
                <span className="text-[9px] bg-amber-400/20 px-1 rounded text-amber-200">
                  {micAudioLevel}%
                </span>
              )}
            </>
          ) : (
            <>
              <MicOff size={11} className="text-gray-400" />
              <span>🎙️ Island Mic</span>
            </>
          )}
        </button>

        {/* Float HUD (PiP) for iPad, Older iPhone & Android */}
        {isPipAvailable && (
          <button
            onClick={handleTogglePip}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
              isPipActive
                ? 'bg-blue-600 text-white border border-blue-400 shadow-blue-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
            title="Float HUD Widget (PiP for iPad, Android & Non-Island iPhone)"
          >
            <PictureInPicture size={11} className={isPipActive ? 'text-white' : 'text-blue-400'} />
            <span>{isPipActive ? '🪟 HUD Active' : '🪟 Float HUD'}</span>
          </button>
        )}

        {/* Multi-Device & Setup Info Button */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer transition-all"
          title="iPad, Android & Dynamic Island Setup Guide"
        >
          <HelpCircle size={13} className="text-blue-400" />
        </button>
      </div>

      {/* Voice feedback toast when command is recognized */}
      {lastHeardCommand && isMicActive && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-black/90 border border-amber-500/60 rounded-full text-amber-300 text-xs font-mono flex items-center gap-2 shadow-2xl backdrop-blur-md animate-fade-in">
          <Mic size={12} className="text-amber-400 animate-pulse" />
          <span>Heard: "{lastHeardCommand}"</span>
          <button 
            onClick={() => dynamicIslandVoiceManager.clearLastCommand()}
            className="text-gray-400 hover:text-white text-xs ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Multi-Device Setup Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b0f19] border border-blue-500/30 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 to-indigo-950/40">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Multi-Device & Background Setup Guide
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-white/10 bg-black/40 p-1 gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveGuideTab('island')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'island'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🏝️ Dynamic Island</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('ipad')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'ipad'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tablet size={13} />
                <span>iPad Setup</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('iphone_classic')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'iphone_classic'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone size={13} />
                <span>iPhone without Island</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('android')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'android'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🤖 Android</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-300">
              {activeGuideTab === 'island' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                      <Mic size={15} className="text-amber-400" />
                      Dynamic Island Mic & Background Music (Spotify / Apple Music Safe)
                    </div>
                    <p className="leading-relaxed">
                      Normally, iOS stops web audio when you play Spotify or Apple Music. 
                      However, <strong>Microphone Input sessions</strong> operate on a separate iOS audio pipeline that does <em>not</em> interrupt background music!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">How it works on your iPhone:</h4>
                    <ul className="space-y-2 list-disc list-inside text-gray-300 pl-1">
                      <li>
                        <strong>Dynamic Island Pill:</strong> Shows the active orange microphone indicator and Hyper Driver icon <code className="bg-black/60 px-1 rounded text-blue-300">[🎙️ | 🄷]</code>.
                      </li>
                      <li>
                        <strong>Music Compatibility:</strong> Spotify and Apple Music continue streaming normally in the background without being silenced or paused.
                      </li>
                      <li>
                        <strong>Instant 1-Tap Return:</strong> Tap the Dynamic Island from anywhere (Apple Maps, Waze, Spotify) to instantly bring Hyper Driver back to the front.
                      </li>
                      <li>
                        <strong>Hands-Free Voice Dispatch:</strong> Say <em>"Accept"</em> or <em>"Decline"</em> out loud when an order comes in—no hands needed on the wheel!
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <div className="font-bold text-white">Enable Island Mic Mode</div>
                      <div className="text-[11px] text-gray-400">Keeps Dynamic Island pinned and enables hands-free voice commands.</div>
                    </div>
                    <button
                      onClick={toggleMicSession}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        isMicActive ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isMicActive ? 'Turn Off' : 'Activate Mic'}
                    </button>
                  </div>
                </div>
              )}

              {activeGuideTab === 'ipad' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-black text-blue-300 text-sm">
                      <Tablet size={15} className="text-blue-400" />
                      iPad Setup (Slide Over & Picture-in-Picture)
                    </div>
                    <p className="leading-relaxed">
                      iPads have expansive screens and support iPadOS multi-tasking features that work even better than the Dynamic Island for driving!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Slide Over Mode (Recommended for Driving)</span>
                      </div>
                      <p className="text-gray-300 pl-6">
                        Open Hyper Driver in Safari or as a PWA, tap the three dots (<code className="text-white">...</code>) at the top of the iPad screen, and tap <strong>Slide Over</strong>. Hyper Driver becomes a floating phone-sized overlay on the right edge! You can swipe it off-screen and swipe back with a thumb to accept orders while Apple Maps runs full screen.
                      </p>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Split View (50/50 Dual Screen)</span>
                      </div>
                      <p className="text-gray-300 pl-6">
                        Place Hyper Driver on the left side and Google Maps / Waze or Spotify on the right side. Both run simultaneously with live GPS!
                      </p>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Floating PiP Mini-HUD</span>
                      </div>
                      <p className="text-gray-300 pl-6">
                        Tap the <strong>"Float HUD"</strong> button in the top bar. A floating picture-in-picture window docks in any corner over your navigation app showing live payouts and order alerts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'iphone_classic' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-black text-indigo-300 text-sm">
                      <Smartphone size={15} className="text-indigo-400" />
                      iPhone without Dynamic Island (iPhone 8 through 14, SE)
                    </div>
                    <p className="leading-relaxed">
                      If your iPhone does not have the Dynamic Island hardware cutout, iOS provides two built-in mechanisms:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">🎙️</span>
                        <span>Status Bar Mic Indicator (1-Tap Switcher)</span>
                      </div>
                      <p className="text-gray-300">
                        When you turn on <strong>Island Mic Mode</strong>, iOS places an orange microphone indicator at the top left of your screen next to the clock (<code className="bg-black/60 px-1 rounded text-amber-300">13:57 🎙️</code>). Tapping this pill from Apple Maps, Waze, or Spotify instantly jumps back to Hyper Driver!
                      </p>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <PictureInPicture size={14} className="text-blue-400" />
                        <span>Floating Picture-in-Picture Mini-HUD</span>
                      </div>
                      <p className="text-gray-300">
                        Tap <strong>"Float HUD"</strong> in the top bar. A native floating window hovers directly over your navigation or music app showing your live earnings and incoming order notifications.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                      <Sparkles size={15} className="text-emerald-400" />
                      Android Setup (Google Pixel, Samsung Galaxy, etc.)
                    </div>
                    <p className="leading-relaxed">
                      Android has extensive multitasking and floating overlay features:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <PictureInPicture size={14} className="text-emerald-400" />
                        <span>Native Picture-in-Picture Floating Window</span>
                      </div>
                      <p className="text-gray-300">
                        Tap <strong>"Float HUD"</strong> in the top bar or swipe up to Home while the app is active. Chrome on Android automatically minimizes Hyper Driver into a floating, resizable window on top of Google Maps, Waze, or Spotify.
                      </p>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Radio size={14} className="text-blue-400" />
                        <span>Actionable Notification Shade</span>
                      </div>
                      <p className="text-gray-300">
                        When Hyper Driver is online, the Android notification drawer shows an ongoing driver dispatch card with quick action buttons (<code className="text-green-400">[ACCEPT]</code> and <code className="text-rose-400">[DECLINE]</code>).
                      </p>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" />
                        <span>Split-Screen Mode</span>
                      </div>
                      <p className="text-gray-300">
                        Open Android Recents, tap the app icon above Hyper Driver, and select <strong>Split Screen</strong> to run Hyper Driver and Google Maps side by side.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Intercity jobs configured to strict 1-in-15 probability.
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer transition-all shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
