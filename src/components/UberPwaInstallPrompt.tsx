import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare, Smartphone, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { checkIsStandalonePWA, triggerUberHaptic } from '../utils/pwaDevice';

interface UberPwaInstallPromptProps {
  theme?: 'dark' | 'light';
}

export const UberPwaInstallPrompt: React.FC<UberPwaInstallPromptProps> = ({ theme = 'dark' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('uber_pwa_prompt_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    setIsStandalone(checkIsStandalonePWA());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerUberHaptic('tap');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsModalOpen(false);
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDismiss = () => {
    triggerUberHaptic('tap');
    setIsDismissed(true);
    try {
      localStorage.setItem('uber_pwa_prompt_dismissed', 'true');
    } catch {}
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Uber PWA Banner (Pill when minimized) */}
      {!isDismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[4900] max-w-[92vw] w-[420px] pointer-events-auto select-none"
        >
          <div className="bg-black/95 text-white border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={() => setIsModalOpen(true)}>
              {/* App Icon preview */}
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shrink-0 border border-black/10 shadow-md">
                <span className="tracking-tighter">UBER</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">Install Uber Driver</h4>
                  <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[8px] font-black uppercase">PWA</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium truncate">Full-screen GPS, Wake Lock & Push Alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-white text-black hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-1"
              >
                <Download size={11} strokeWidth={3} />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors active:scale-90"
                title="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Installation Guide Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[5500] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="w-full max-w-sm rounded-[32px] bg-neutral-950 text-white border border-white/15 p-6 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-base shadow-lg">
                    UBER
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Uber Driver App</h3>
                    <p className="text-xs text-gray-400 font-medium">Progressive Web Application</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-left">
                  <div className="text-emerald-400 mb-1"><Zap size={16} /></div>
                  <p className="text-xs font-black text-white">Screen Wake Lock</p>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">Display never times out while driving</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-left">
                  <div className="text-blue-400 mb-1"><Smartphone size={16} /></div>
                  <p className="text-xs font-black text-white">Full-Screen Native</p>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">No browser address bar or tabs</p>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-3 mb-6 text-left">
                {isIOS ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                        <Share size={15} />
                      </div>
                      <p className="text-xs font-medium text-gray-200">
                        1. Tap the <strong className="text-white">Share</strong> button in Safari toolbar
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <PlusSquare size={15} />
                      </div>
                      <p className="text-xs font-medium text-gray-200">
                        2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0">
                        <Sparkles size={15} />
                      </div>
                      <p className="text-xs font-medium text-gray-200">
                        3. Launch <strong className="text-white">Uber Driver</strong> directly from your Home Screen
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                      Install this web app to your mobile device home screen or desktop launcher for instantaneous dispatches, authentic haptics, and uninterrupted navigation.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-3.5 bg-white text-black hover:bg-gray-100 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition-transform"
                  >
                    Add to Home Screen
                  </button>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 bg-white text-black hover:bg-gray-100 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition-transform"
                  >
                    Got It
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
