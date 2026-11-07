/**
 * Uber Driver PWA Native Device Integrations
 * Screen Wake Lock, Native Haptics, App Icon Badging, and Web Audio Chimes.
 */

let wakeLockSentinel: any = null;
let wakeLockEnabled = false;

/**
 * Keep device screen awake while online (Screen Wake Lock API)
 */
export const requestScreenWakeLock = async (): Promise<boolean> => {
  wakeLockEnabled = true;
  try {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    }
  } catch (err) {
    // Wake Lock can fail if device battery saver is active or permission denied
    console.debug('PWA Wake Lock unavailable or blocked:', err);
  }
  return false;
};

/**
 * Release screen wake lock when driver goes offline
 */
export const releaseScreenWakeLock = async () => {
  wakeLockEnabled = false;
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.debug('Error releasing wake lock:', err);
  }
};

// Re-acquire wake lock when tab/app regains visibility (standard PWA requirement)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (wakeLockEnabled && document.visibilityState === 'visible') {
      await requestScreenWakeLock();
    }
  });
}

/**
 * Authentic Uber Driver Haptic Vibration Patterns
 */
export type UberHapticType = 'dispatch' | 'accept' | 'arrive' | 'complete' | 'tap' | 'warning';

export const triggerUberHaptic = (type: UberHapticType = 'tap') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'dispatch':
        // Prominent double-buzz alert pattern for incoming dispatch
        navigator.vibrate([160, 90, 160, 90, 260]);
        break;
      case 'accept':
        // Crisp confirmation double tap
        navigator.vibrate([70, 40, 110]);
        break;
      case 'arrive':
        // Triple arrival pulse
        navigator.vibrate([50, 40, 50, 40, 50]);
        break;
      case 'complete':
        // Ascending reward pulse
        navigator.vibrate([90, 50, 180]);
        break;
      case 'warning':
        // Speed limit / critical alert buzz
        navigator.vibrate([220, 100, 220]);
        break;
      case 'tap':
      default:
        // Subtle UI selection tap
        navigator.vibrate(25);
        break;
    }
  } catch (e) {
    // Silently ignore in browsers where vibration is disabled by user policy
  }
};

/**
 * PWA App Icon Badging API
 */
export const updateAppBadge = async (count: number) => {
  if (typeof navigator === 'undefined') return;
  try {
    if ('setAppBadge' in navigator && (navigator as any).setAppBadge) {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (err) {
    console.debug('App badging not supported or blocked:', err);
  }
};

/**
 * Authentic Synthesized Uber Driver Two-Tone Chime
 * Uses Web Audio API without needing external MP3 downloads.
 */
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

export const playAuthenticUberChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: 880 Hz (A5) - The signature Uber Dispatch chime upper harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.66);
  } catch (err) {
    console.debug('Uber chime audio playback:', err);
  }
};

/**
 * Check if the app is currently running in standalone PWA mode
 */
export const checkIsStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
  return Boolean(isStandalone);
};
