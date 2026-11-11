// Singleton Dynamic Island & Voice Dispatch Manager
// Preserves mic session & audio context across component re-renders and page navigation

export type VoiceListener = () => void;

export interface CommandHandlers {
  onAcceptOrder?: () => void;
  onDeclineOrder?: () => void;
  onToggleOnline?: () => void;
  onNextWorkflowStep?: () => void;
  isOnline?: boolean;
}

export interface DynamicIslandVoiceState {
  isMicActive: boolean;
  isListening: boolean;
  micAudioLevel: number;
  lastHeardCommand: string | null;
  liveTranscript: string;
  speechSupported: boolean;
  isPipActive: boolean;
  hasLiveStream: boolean;
  permissionError: string | null;
}

class DynamicIslandVoiceManager {
  private isMicActive: boolean = false;
  private isListening: boolean = false;
  private micAudioLevel: number = 0;
  private lastHeardCommand: string | null = null;
  private liveTranscript: string = '';
  private speechSupported: boolean = true;
  private isPipActive: boolean = false;
  private permissionError: string | null = null;

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private animFrameId: number | null = null;
  private recognition: any = null;
  private listeners: Set<VoiceListener> = new Set();
  private handlers: CommandHandlers = {};

  // Cached immutable snapshot reference to guarantee reference equality for React useSyncExternalStore
  private snapshot: DynamicIslandVoiceState;

  constructor() {
    this.snapshot = {
      isMicActive: false,
      isListening: false,
      micAudioLevel: 0,
      lastHeardCommand: null,
      liveTranscript: '',
      speechSupported: true,
      isPipActive: false,
      hasLiveStream: false,
      permissionError: null
    };

    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.speechSupported = !!SpeechRec;
      this.updateSnapshot();

      // Handle visibility changes safely (iOS Safari & Android PWA rules)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Pause speech recognition in background to satisfy iOS Safari restrictions
          if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
          }
          this.isListening = false;
          this.updateSnapshot();
        } else if (document.visibilityState === 'visible' && this.isMicActive) {
          // Resume audio context & speech recognition when returning to app
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
          }
          if (this.mediaStream && this.mediaStream.active && this.speechSupported) {
            this.startSpeechRecognition();
          }
        }
      });
    }
  }

  private updateSnapshot() {
    this.snapshot = {
      isMicActive: this.isMicActive,
      isListening: this.isListening && !!(this.mediaStream && this.mediaStream.active),
      micAudioLevel: this.micAudioLevel,
      lastHeardCommand: this.lastHeardCommand,
      liveTranscript: this.liveTranscript,
      speechSupported: this.speechSupported,
      isPipActive: this.isPipActive,
      hasLiveStream: !!(this.mediaStream && this.mediaStream.active),
      permissionError: this.permissionError
    };
    this.listeners.forEach(fn => fn());
  }

  public registerHandlers(handlers: CommandHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public subscribe = (listener: VoiceListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getState = (): DynamicIslandVoiceState => {
    return this.snapshot;
  };

  public async toggleMic(): Promise<boolean> {
    if (this.isMicActive) {
      this.stopMicSession();
      return false;
    } else {
      return await this.startMicSession();
    }
  }

  public async startMicSession(): Promise<boolean> {
    this.permissionError = null;

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone audio is not supported in this browser.');
      }

      // 1. Request microphone permission with active user tap
      let stream = this.mediaStream;
      if (!stream || !stream.active || stream.getAudioTracks().length === 0 || stream.getAudioTracks()[0].readyState === 'ended') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.mediaStream = stream;
      }

      // 2. Initialize Web Audio keep-alive & analyser for Dynamic Island persistence
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume().catch(() => {});
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        this.analyser = analyser;

        // Inaudible silent gain node connected to destination:
        // Keeps iOS WebKit hardware audio session active (Dynamic Island orange indicator / background alive)
        const silentGain = this.audioContext.createGain();
        silentGain.gain.value = 0.00001;
        source.connect(silentGain);
        silentGain.connect(this.audioContext.destination);
        this.silentGain = silentGain;

        this.startLevelLoop();
      }

      // 3. Initialize Speech Recognition
      this.startSpeechRecognition();

      this.isMicActive = true;
      this.isListening = true;
      this.permissionError = null;
      localStorage.setItem('hyper_dynamic_island_mic', 'true');
      this.updateSnapshot();
      return true;
    } catch (err: any) {
      console.warn('Microphone permission or hardware access failed:', err);
      
      let userFriendlyMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMsg = 'Microphone permission was denied. Please allow microphone access in your browser or device settings (Settings ➔ Safari/Chrome ➔ Microphone) to use voice commands.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMsg = 'No microphone hardware found on this device.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }

      this.permissionError = userFriendlyMsg;
      this.stopMicSession();
      return false;
    }
  }

  private startLevelLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const dataArray = new Uint8Array(this.analyser ? this.analyser.frequencyBinCount : 0);

    const updateLevel = () => {
      if (!this.analyser || !this.isMicActive) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / (dataArray.length || 1);
      const nextLevel = Math.min(100, Math.round((avg / 128) * 100));

      if (Math.abs(nextLevel - this.micAudioLevel) >= 4) {
        this.micAudioLevel = nextLevel;
        this.updateSnapshot();
      }
      this.animFrameId = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  private startSpeechRecognition() {
    if (!this.speechSupported || typeof window === 'undefined') {
      this.isListening = true;
      this.updateSnapshot();
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        this.isListening = true;
        this.updateSnapshot();
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase().trim();
        this.liveTranscript = transcript;
        this.lastHeardCommand = transcript;
        this.updateSnapshot();

        // Voice Command Parsing:
        if (transcript.includes('accept') || transcript.includes('take it') || transcript.includes('yes') || transcript.includes('take order')) {
          if (this.handlers.onAcceptOrder) {
            this.handlers.onAcceptOrder();
            this.lastHeardCommand = '✅ Accepted Order';
            this.updateSnapshot();
          }
        } else if (transcript.includes('decline') || transcript.includes('pass') || transcript.includes('reject') || transcript.includes('no')) {
          if (this.handlers.onDeclineOrder) {
            this.handlers.onDeclineOrder();
            this.lastHeardCommand = '❌ Declined Order';
            this.updateSnapshot();
          }
        } else if (transcript.includes('go online') || transcript.includes('start shift')) {
          if (this.handlers.onToggleOnline && !this.handlers.isOnline) {
            this.handlers.onToggleOnline();
            this.lastHeardCommand = '⚡ Went Online';
            this.updateSnapshot();
          }
        } else if (transcript.includes('go offline') || transcript.includes('end shift') || transcript.includes('offline')) {
          if (this.handlers.onToggleOnline && this.handlers.isOnline) {
            this.handlers.onToggleOnline();
            this.lastHeardCommand = '💤 Went Offline';
            this.updateSnapshot();
          }
        } else if (transcript.includes('next step') || transcript.includes('next') || transcript.includes('advance') || transcript.includes('arrived') || transcript.includes('collected') || transcript.includes('complete')) {
          if (this.handlers.onNextWorkflowStep) {
            this.handlers.onNextWorkflowStep();
            this.lastHeardCommand = '⏩ Advanced Job Stage';
            this.updateSnapshot();
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed' && document.visibilityState === 'hidden') {
          return;
        }
        if (e.error === 'not-allowed') {
          this.permissionError = 'Microphone permission was not allowed for Speech Recognition.';
          this.updateSnapshot();
        }
      };

      recognition.onend = () => {
        // Only restart if still active and page is visible
        if (this.isMicActive && this.mediaStream && document.visibilityState === 'visible') {
          try { recognition.start(); } catch (e) {}
        } else {
          this.isListening = false;
          this.updateSnapshot();
        }
      };

      if (document.visibilityState === 'visible') {
        recognition.start();
        this.recognition = recognition;
        this.isListening = true;
      }
    } catch (e) {
      console.warn('SpeechRecognition failed to start:', e);
    }
  }

  public stopMicSession() {
    this.isMicActive = false;
    this.isListening = false;
    this.micAudioLevel = 0;
    this.liveTranscript = '';
    localStorage.setItem('hyper_dynamic_island_mic', 'false');

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.updateSnapshot();
  }

  public clearPermissionError() {
    this.permissionError = null;
    this.updateSnapshot();
  }

  public setPipActive(active: boolean) {
    if (this.isPipActive !== active) {
      this.isPipActive = active;
      this.updateSnapshot();
    }
  }

  public clearLastCommand() {
    if (this.lastHeardCommand !== null || this.liveTranscript !== '') {
      this.lastHeardCommand = null;
      this.liveTranscript = '';
      this.updateSnapshot();
    }
  }
}

export const dynamicIslandVoiceManager = new DynamicIslandVoiceManager();
