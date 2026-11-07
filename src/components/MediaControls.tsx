import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Radio, Disc, 
  Maximize2, Minimize2, Plus, Upload, Trash2, Link as LinkIcon, Check, Sparkles, X, ListMusic, AudioWaveform
} from 'lucide-react';
import { 
  saveAudioFileToDB, 
  saveAudioUrlToDB, 
  getAllCustomTracksFromDB, 
  deleteCustomTrackFromDB, 
  clearAllCustomTracksFromDB,
  StoredCustomTrack 
} from '../utils/audioStorage';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  isSynth: boolean;
  genre: string;
  isCustom?: boolean;
  fileSize?: number;
  objectUrl?: string;
}

export const DEFAULT_PLAYLIST: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Neon Horizon',
    artist: 'AI Auto-Synth',
    album: 'Procedural Cyber Vol. 1',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&h=120&fit=crop',
    url: '',
    isSynth: true,
    genre: 'Synthwave'
  },
  {
    id: 'track-2',
    title: 'Cyberpunk Alley',
    artist: 'Lofi Chords Engine',
    album: 'Procedural Cyber Vol. 1',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
    url: '',
    isSynth: true,
    genre: 'Lo-Fi Chill'
  },
  {
    id: 'track-3',
    title: 'Echoes of Shoreditch',
    artist: 'Royalty Free Radio',
    album: 'Modern Beats',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isSynth: false,
    genre: 'Electronic'
  },
  {
    id: 'track-4',
    title: 'Midnight Fuel',
    artist: 'Royalty Free Lounge',
    album: 'Hyper Driving Mix',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    isSynth: false,
    genre: 'Chill Chill'
  }
];

export const PLAYLIST: AudioTrack[] = DEFAULT_PLAYLIST;

// Persistent Singleton Global Music Controller
export class GlobalMusicController {
  isPlaying = false;
  currentTrackIndex = 0;
  volume = 0.7;
  isMuted = false;
  duckCount = 0;
  currentTime = 0;
  duration = 180;
  manualPause = false;
  
  playlist: AudioTrack[] = [...DEFAULT_PLAYLIST];
  customTracks: AudioTrack[] = [];
  isInitialized = false;

  audio: HTMLAudioElement;
  listeners = new Set<() => void>();
  
  synthInterval: number | null = null;
  synthNodes: AudioNode[] = [];
  masterGainNode: GainNode | null = null;
  audioCtx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  musicGainNode: GainNode | null = null;
  mediaSourceNode: MediaElementAudioSourceNode | null = null;
  activeUtterances = new Set<any>();

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.audio.addEventListener('timeupdate', () => {
      const track = this.currentTrack;
      if (track && !track.isSynth) {
        this.currentTime = this.audio.currentTime;
        this.notify();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      const track = this.currentTrack;
      if (track && !track.isSynth && this.audio.duration && !isNaN(this.audio.duration)) {
        this.duration = this.audio.duration;
        this.notify();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.next();
    });

    // Guard against OS / browser auto-pause on background audio or interruptions
    this.audio.addEventListener('pause', () => {
      if (this.isPlaying && !this.manualPause) {
        setTimeout(() => {
          if (this.isPlaying && !this.manualPause) {
            this.audio.play().catch(() => {});
          }
        }, 50);
      }
    });

    // Initialize saved custom music from IndexedDB
    this.loadCustomTracksFromStorage();
  }

  get currentTrack(): AudioTrack {
    return this.playlist[this.currentTrackIndex] || this.playlist[0] || DEFAULT_PLAYLIST[0];
  }

  async loadCustomTracksFromStorage() {
    try {
      const stored = await getAllCustomTracksFromDB();
      if (stored && stored.length > 0) {
        const mapped: AudioTrack[] = stored.map((s: StoredCustomTrack) => {
          let trackUrl = s.url || '';
          if (s.blob) {
            try {
              trackUrl = URL.createObjectURL(s.blob);
            } catch (err) {
              console.warn('Could not create ObjectURL for blob:', err);
            }
          }
          return {
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album || 'My In-Car Playlist',
            cover: s.cover,
            url: trackUrl,
            objectUrl: trackUrl,
            isSynth: false,
            genre: s.genre || 'Custom Audio',
            isCustom: true,
            fileSize: s.fileSize
          };
        });

        this.customTracks = mapped;
        // Place user's custom songs at the beginning of the playlist
        this.playlist = [...mapped, ...DEFAULT_PLAYLIST];
        this.notify();
      }
    } catch (e) {
      console.warn('Failed to load custom tracks from IndexedDB:', e);
    }
  }

  async addUploadedFiles(files: FileList | File[]): Promise<number> {
    let addedCount = 0;
    const newTracks: AudioTrack[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|aac|flac|ogg)$/i.test(file.name)) {
        continue;
      }
      try {
        const stored = await saveAudioFileToDB(file);
        const objUrl = URL.createObjectURL(file);
        const track: AudioTrack = {
          id: stored.id,
          title: stored.title,
          artist: stored.artist,
          album: stored.album,
          cover: stored.cover,
          url: objUrl,
          objectUrl: objUrl,
          isSynth: false,
          genre: 'Local Audio',
          isCustom: true,
          fileSize: stored.fileSize
        };
        newTracks.push(track);
        addedCount++;
      } catch (err) {
        console.error('Error saving audio file to IndexedDB:', err);
      }
    }

    if (newTracks.length > 0) {
      this.customTracks = [...newTracks, ...this.customTracks];
      this.playlist = [...newTracks, ...this.playlist];
      // Auto switch to first added song and play
      this.setTrackIndex(0);
      if (!this.isPlaying) {
        this.togglePlay();
      }
      this.notify();
    }

    return addedCount;
  }

  async addStreamUrl(title: string, artist: string, url: string, genre: string = 'Web Radio'): Promise<AudioTrack> {
    const stored = await saveAudioUrlToDB(title, artist, url, genre);
    const track: AudioTrack = {
      id: stored.id,
      title: stored.title,
      artist: stored.artist,
      album: stored.album,
      cover: stored.cover,
      url: stored.url || url,
      isSynth: false,
      genre: stored.genre,
      isCustom: true
    };

    this.customTracks = [track, ...this.customTracks];
    this.playlist = [track, ...this.playlist];
    this.setTrackIndex(0);
    if (!this.isPlaying) {
      this.togglePlay();
    }
    this.notify();
    return track;
  }

  async removeTrack(trackId: string) {
    try {
      await deleteCustomTrackFromDB(trackId);
    } catch (e) {
      console.warn('Error deleting track from DB:', e);
    }

    const wasCurrent = this.currentTrack?.id === trackId;
    this.customTracks = this.customTracks.filter(t => t.id !== trackId);
    this.playlist = this.playlist.filter(t => t.id !== trackId);

    if (this.playlist.length === 0) {
      this.playlist = [...DEFAULT_PLAYLIST];
    }

    if (wasCurrent) {
      this.currentTrackIndex = Math.min(this.currentTrackIndex, this.playlist.length - 1);
      this.setTrackIndex(this.currentTrackIndex);
    } else {
      this.currentTrackIndex = Math.min(this.currentTrackIndex, this.playlist.length - 1);
      this.notify();
    }
  }

  async clearAllCustomTracks() {
    try {
      await clearAllCustomTracksFromDB();
    } catch (e) {}

    this.customTracks = [];
    this.playlist = [...DEFAULT_PLAYLIST];
    this.setTrackIndex(0);
    this.notify();
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updateMediaSession(track: AudioTrack) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Hyper Driver Radio',
        artwork: [
          { src: track.cover || '/icon.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon.png', sizes: '192x192', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (!this.isPlaying) this.togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.isPlaying) this.togglePlay();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.next();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.prev();
      });

      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.seek(details.seekTime);
          }
        });
      } catch (e) {}
    } catch (e) {
      console.warn('Error setting MediaSession:', e);
    }
  }

  initAudioCtx() {
    if (this.audioCtx && this.mediaSourceNode) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = (window as any).__sharedAudioCtx || new AudioContextClass();
      (window as any).__sharedAudioCtx = ctx;
      this.audioCtx = ctx;

      if (!this.analyser) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        this.analyser = analyser;
      }

      if (!this.musicGainNode) {
        const musicGain = ctx.createGain();
        musicGain.gain.setValueAtTime(this.isDucked ? 0.15 : 1.0, ctx.currentTime);
        this.musicGainNode = musicGain;
      }

      if (!this.mediaSourceNode) {
        try {
          const source = ctx.createMediaElementSource(this.audio);
          source.connect(this.musicGainNode);
          this.musicGainNode.connect(this.analyser);
          this.analyser.connect(ctx.destination);
          this.mediaSourceNode = source;
        } catch (e) {
          // In case media element source was already created
        }
      }
    } catch (e) {
      console.warn("Global Music AudioCtx error:", e);
    }
  }

  get isDucked() {
    return this.duckCount > 0;
  }

  getEffectiveVolume() {
    if (this.isMuted) return 0;
    // Duck to 15% of user volume so announcements/voice alerts are crystal clear while music keeps playing
    return this.isDucked ? this.volume * 0.15 : this.volume;
  }

  updateAudioVolume(smooth = true) {
    const effVol = this.getEffectiveVolume();
    this.audio.volume = effVol;

    // Web audio synth master gain
    if (this.masterGainNode && this.audioCtx) {
      const time = this.audioCtx.currentTime;
      try {
        if (smooth) {
          this.masterGainNode.gain.cancelScheduledValues(time);
          this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, time);
          this.masterGainNode.gain.linearRampToValueAtTime(effVol * 0.15, time + 0.2);
        } else {
          this.masterGainNode.gain.setValueAtTime(effVol * 0.15, time);
        }
      } catch (e) {}
    }

    // Web audio HTML5 stream gain
    if (this.musicGainNode && this.audioCtx) {
      const time = this.audioCtx.currentTime;
      const targetGain = this.isDucked ? 0.15 : 1.0;
      try {
        if (smooth) {
          this.musicGainNode.gain.cancelScheduledValues(time);
          this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, time);
          this.musicGainNode.gain.linearRampToValueAtTime(targetGain, time + 0.2);
        } else {
          this.musicGainNode.gain.setValueAtTime(targetGain, time);
        }
      } catch (e) {}
    }
  }

  duckVolume(durationMs?: number) {
    this.duckCount++;
    this.updateAudioVolume(true);
    this.notify();

    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        this.unduckVolume();
      }, durationMs);
    }
  }

  unduckVolume() {
    this.duckCount = Math.max(0, this.duckCount - 1);
    this.updateAudioVolume(true);
    this.notify();
  }

  forceResetDuck() {
    this.duckCount = 0;
    this.updateAudioVolume(true);
    this.notify();
  }

  togglePlay() {
    this.initAudioCtx();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const nextPlay = !this.isPlaying;
    this.isPlaying = nextPlay;
    this.manualPause = !nextPlay;
    const track = this.currentTrack;

    if (nextPlay) {
      this.updateMediaSession(track);
      if (track.isSynth) {
        this.startSynth();
      } else {
        if (!this.audio.src || !this.audio.src.includes(track.url)) {
          this.audio.src = track.url;
          this.audio.load();
        }
        this.updateAudioVolume(false);
        this.audio.play().catch(() => { this.isPlaying = false; });
      }
    } else {
      if (track.isSynth) {
        this.stopSynth();
      } else {
        this.audio.pause();
      }
    }
    this.notify();
  }

  setTrackIndex(idx: number) {
    this.stopSynth();
    this.audio.pause();
    this.currentTrackIndex = Math.max(0, Math.min(idx, this.playlist.length - 1));
    this.currentTime = 0;
    const track = this.currentTrack;

    this.updateMediaSession(track);

    if (track.isSynth) {
      this.duration = 240;
      if (this.isPlaying) this.startSynth();
    } else {
      this.audio.src = track.url;
      this.audio.load();
      if (this.isPlaying) {
        this.updateAudioVolume(false);
        this.audio.play().catch(() => { this.isPlaying = false; });
      }
    }
    this.notify();
  }

  next() {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    this.setTrackIndex(nextIdx);
  }

  prev() {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setTrackIndex(prevIdx);
  }

  setVolume(vol: number) {
    this.volume = vol;
    this.isMuted = false;
    this.updateAudioVolume();
    this.notify();
  }

  setIsMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateAudioVolume();
    this.notify();
  }

  seek(secs: number) {
    this.currentTime = secs;
    const track = this.currentTrack;
    if (track && !track.isSynth) {
      this.audio.currentTime = secs;
    }
    this.notify();
  }

  startSynth() {
    this.initAudioCtx();
    this.stopSynth();
    const ctx = this.audioCtx;
    if (!ctx) return;

    let stepCount = 0;
    const stepDuration = 0.158;

    const playStep = () => {
      if (!ctx || ctx.state === 'suspended' || !this.isPlaying) return;
      const time = ctx.currentTime;
      const track = this.currentTrack;

      const masterNode = ctx.createGain();
      const effVol = this.getEffectiveVolume();
      masterNode.gain.setValueAtTime(effVol * 0.15, time);
      masterNode.connect(this.analyser || ctx.destination);
      this.masterGainNode = masterNode;

      this.currentTime = (this.currentTime + stepDuration) % this.duration;

      // Kick
      if (stepCount % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterNode);
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.start(time);
        osc.stop(time + 0.15);
      }

      // Snare
      if (stepCount % 8 === 4) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(masterNode);
        osc.frequency.setValueAtTime(180, time);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
        osc.start(time);
        osc.stop(time + 0.2);
      }

      // Bass
      const bassNotes = [55, 55, 65.4, 65.4, 73.4, 73.4, 82.4, 82.4];
      const currentBassNote = bassNotes[Math.floor(stepCount / 2) % bassNotes.length];
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.connect(bassGain);
      bassGain.connect(masterNode);
      bassOsc.frequency.setValueAtTime(currentBassNote, time);
      bassGain.gain.setValueAtTime(0.4, time);
      bassGain.gain.exponentialRampToValueAtTime(0.01, time + stepDuration * 0.9);
      bassOsc.start(time);
      bassOsc.stop(time + stepDuration);

      // Lead / Melody
      if (track.id === 'track-1') {
        const arpeggioNotes = [220, 261.6, 329.6, 392, 440, 523.3, 659.3, 784];
        const leadNote = arpeggioNotes[(stepCount * 3 + 2) % arpeggioNotes.length];
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.connect(leadGain);
        leadGain.connect(masterNode);
        leadOsc.frequency.setValueAtTime(leadNote, time);
        leadGain.gain.setValueAtTime(0.15, time);
        leadGain.gain.linearRampToValueAtTime(0.001, time + stepDuration * 0.85);
        leadOsc.start(time);
        leadOsc.stop(time + stepDuration);
      } else {
        const chordNotes = [220, 277, 330, 415];
        const chillNote = chordNotes[stepCount % chordNotes.length];
        const squareOsc = ctx.createOscillator();
        const squareGain = ctx.createGain();
        squareOsc.type = 'triangle';
        squareOsc.connect(squareGain);
        squareGain.connect(masterNode);
        squareOsc.frequency.setValueAtTime(chillNote, time);
        squareGain.gain.setValueAtTime(0.18, time);
        squareGain.gain.exponentialRampToValueAtTime(0.01, time + stepDuration * 1.5);
        squareOsc.start(time);
        squareOsc.stop(time + stepDuration * 1.5);
      }

      stepCount = (stepCount + 1) % 16;
    };

    this.synthInterval = window.setInterval(playStep, stepDuration * 1000);
  }

  stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

// Instantiate singleton on window
if (typeof window !== 'undefined' && !(window as any).__globalMusicController) {
  (window as any).__globalMusicController = new GlobalMusicController();
}

export const getGlobalMusicController = (): GlobalMusicController => {
  if (typeof window === 'undefined') return new GlobalMusicController();
  if (!(window as any).__globalMusicController) {
    (window as any).__globalMusicController = new GlobalMusicController();
  }
  return (window as any).__globalMusicController;
};

interface MediaControlsProps {
  theme?: 'light' | 'dark';
  compact?: boolean;
  isCarPlay?: boolean;
  onOpenFullModal?: () => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({ 
  theme = 'dark', 
  compact = false,
  isCarPlay = false,
  onOpenFullModal
}) => {
  const controller = getGlobalMusicController();
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'upload' | 'stream' | 'manage'>('upload');
  
  // Custom URL inputs
  const [streamTitle, setStreamTitle] = useState('');
  const [streamArtist, setStreamArtist] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Subscribe to global player state changes
  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, [controller]);

  const playlist = controller.playlist;
  const track = controller.currentTrack;
  const isPlaying = controller.isPlaying;
  const currentTime = controller.currentTime;
  const duration = controller.duration;
  const volume = controller.volume;
  const isMuted = controller.isMuted;

  const togglePlay = () => controller.togglePlay();
  const handleNext = () => controller.next();
  const handlePrev = () => controller.prev();
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => controller.seek(parseFloat(e.target.value));

  // Handle local file uploads (MP3, M4A, WAV, etc)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadStatus('Importing audio files...');
    const count = await controller.addUploadedFiles(e.target.files);
    setUploadStatus(`Added ${count} song${count === 1 ? '' : 's'} to your In-Car Playlist!`);
    setTimeout(() => {
      setUploadStatus(null);
      setIsAddModalOpen(false);
    }, 1800);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle direct stream URL addition
  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim() || !streamTitle.trim()) return;
    setUploadStatus('Adding stream...');
    await controller.addStreamUrl(streamTitle, streamArtist || 'Live Audio', streamUrl);
    setStreamTitle('');
    setStreamArtist('');
    setStreamUrl('');
    setUploadStatus('Stream added to In-Car Playlist!');
    setTimeout(() => {
      setUploadStatus(null);
      setIsAddModalOpen(false);
    }, 1500);
  };

  // Canvas visualizer rendering loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      
      const canvas = canvasRef.current;
      const analyser = controller.analyser;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const bufferLength = analyser ? analyser.frequencyBinCount : 16;
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        const time = Date.now() * 0.004;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying 
            ? Math.abs(Math.sin(i * 0.5 + time) * 80) + 20 
            : Math.sin(i * 0.3) * 10 + 10;
        }
      }

      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * (height / 256) * 1.1;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, '#00e5ff');

        ctx.fillStyle = grad;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, height - barHeight, barWidth - 4, barHeight, 3);
        } else {
          ctx.rect(x, height - barHeight, barWidth - 4, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, controller.currentTrackIndex, controller]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentThemeStyles = theme === 'dark' 
    ? 'bg-black/90 border-white/10 text-white' 
    : 'bg-white border-gray-200 text-black';

  // Render "Add Music" modal
  const renderAddMusicModal = () => {
    if (!isAddModalOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(false); }}
      >
        <div 
          className="bg-[#121216] border border-white/10 rounded-[32px] p-6 w-full max-w-md shadow-2xl text-white relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Music size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Add Your Music</h3>
                <p className="text-[11px] text-gray-400 font-bold">Plays in-app & pins to your Dynamic Island</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5 mb-5">
            <button
              onClick={() => setModalTab('upload')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                modalTab === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload size={13} />
              Upload Files
            </button>
            <button
              onClick={() => setModalTab('stream')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                modalTab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LinkIcon size={13} />
              Audio Link
            </button>
            <button
              onClick={() => setModalTab('manage')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                modalTab === 'manage' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListMusic size={13} />
              My Songs ({controller.customTracks.length})
            </button>
          </div>

          {/* Tab 1: Upload Audio Files */}
          {modalTab === 'upload' && (
            <div className="space-y-4">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="audio/*,.mp3,.m4a,.wav,.aac,.flac,.ogg" 
                multiple 
                onChange={handleFileChange}
                className="hidden" 
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-500/40 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group text-center"
              >
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                  <Upload size={28} />
                </div>
                <h4 className="font-black text-base text-white">Choose Audio from iPhone / Device</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[260px]">
                  Select MP3, M4A, or WAV songs from your iPhone Files, iCloud, or Downloads.
                </p>
                <span className="mt-3 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                  Select Multiple Songs
                </span>
              </div>

              {uploadStatus && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-2">
                  <Check size={16} />
                  <span>{uploadStatus}</span>
                </div>
              )}

              <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-[11px] text-gray-400 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  iPhone Dynamic Island Feature:
                </p>
                <p>
                  Any song you add plays through the in-app player, displays your song title on the <strong>Dynamic Island</strong>, and lets you tap the island to jump straight back into Hyper Driver.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Audio URL / Web Stream */}
          {modalTab === 'stream' && (
            <form onSubmit={handleAddStream} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Track or Station Name *
                </label>
                <input 
                  type="text" 
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="e.g. My Driving Mixtape / Chill Beats"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Artist or Radio Station
                </label>
                <input 
                  type="text" 
                  value={streamArtist}
                  onChange={(e) => setStreamArtist(e.target.value)}
                  placeholder="e.g. Spotify Playlist / BBC Radio"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Direct Audio URL (MP3 / Stream) *
                </label>
                <input 
                  type="url" 
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'SoundHelix Groove', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', artist: 'Groove Beats' },
                    { name: 'Lofi Chill Stream', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', artist: 'Night Drive' },
                    { name: 'Cyber Electro', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', artist: 'Hyper Synth' }
                  ].map((p, pIdx) => (
                    <button
                      key={`preset-stream-${pIdx}`}
                      type="button"
                      onClick={() => {
                        setStreamTitle(p.name);
                        setStreamArtist(p.artist);
                        setStreamUrl(p.url);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 border border-white/5"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {uploadStatus && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-2">
                  <Check size={16} />
                  <span>{uploadStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!streamTitle.trim() || !streamUrl.trim()}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer mt-2"
              >
                Add Stream & Play
              </button>
            </form>
          )}

          {/* Tab 3: Manage My Songs */}
          {modalTab === 'manage' && (
            <div className="space-y-3">
              {controller.customTracks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  <Music size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="font-bold">No custom songs added yet.</p>
                  <p className="text-[10px] mt-1 text-gray-600">Upload an MP3 from your phone or add a stream URL.</p>
                  <button 
                    onClick={() => setModalTab('upload')}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5"
                  >
                    <Upload size={12} />
                    Upload Songs Now
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      {controller.customTracks.length} Custom Track{controller.customTracks.length === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => controller.clearAllCustomTracks()}
                      className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {controller.customTracks.map((item, idx) => (
                      <div 
                        key={`custom-manage-${item.id}-${idx}`}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
                      >
                        <div 
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            const pIdx = controller.playlist.findIndex(p => p.id === item.id);
                            if (pIdx !== -1) controller.setTrackIndex(pIdx);
                            setIsAddModalOpen(false);
                          }}
                        >
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10 relative">
                            <img src={item.cover} alt="Cover" className="w-full h-full object-cover" />
                            {controller.currentTrack?.id === item.id && isPlaying && (
                              <div className="absolute inset-0 bg-blue-600/70 flex items-center justify-center">
                                <Disc size={14} className="text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-black text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold truncate">{item.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              const pIdx = controller.playlist.findIndex(p => p.id === item.id);
                              if (pIdx !== -1) {
                                controller.setTrackIndex(pIdx);
                                if (!isPlaying) controller.togglePlay();
                              }
                            }}
                            className="p-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Play"
                          >
                            <Play size={13} className="fill-current" />
                          </button>
                          <button
                            onClick={() => controller.removeTrack(item.id)}
                            className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // CarPlay Rendering
  if (isCarPlay) {
    return (
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 flex flex-col h-full relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={120} />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <Radio className="text-blue-400 animate-pulse" size={24} />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">HYPER MUSIC RECEIVER</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Plus size={14} />
              Add Music
            </button>
            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              {track.genre}
            </span>
          </div>
        </div>

        <div className="flex-1 flex gap-8 items-center relative z-10">
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 group border border-white/15">
            <img src={track.cover} alt="Album cover" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <Disc className="text-blue-400 animate-spin" size={32} style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-black truncate">{track.title}</h3>
                {track.isCustom && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                    My Music
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-400 font-bold truncate mt-1">{track.artist}</p>
              <p className="text-xs text-gray-500 leading-tight truncate mt-0.5">{track.album}</p>
            </div>

            <div className="space-y-1">
              <input 
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={handlePrev}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipBack size={26} className="text-white" />
            </button>

            <button 
              onClick={togglePlay}
              className="p-5 bg-blue-500 hover:bg-blue-400 rounded-full active:scale-95 transition-transform shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={30} className="text-white fill-white" />
              ) : (
                <Play size={30} className="text-white fill-white translate-x-0.5" />
              )}
            </button>

            <button 
              onClick={handleNext}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipForward size={26} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-black/40 py-2.5 px-4 rounded-full border border-white/5">
            <button onClick={() => controller.setIsMuted(!isMuted)} className="cursor-pointer">
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-gray-400" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => controller.setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {renderAddMusicModal()}
      </div>
    );
  }

  // Compact Rendering
  if (compact) {
    return (
      <div className={`p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all border ${currentThemeStyles}`}>
        <div 
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (onOpenFullModal) onOpenFullModal();
            else setIsAddModalOpen(true);
          }}
        >
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-black/10">
            <img src={track.cover} alt="Cover" className="w-full h-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc className="text-white animate-spin" size={16} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold truncate">{track.title}</p>
            <p className="text-[10px] text-gray-500 font-bold truncate leading-tight">{track.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <canvas ref={canvasRef} className="w-16 h-8 opacity-70" width={80} height={40} />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-1.5 rounded-full text-blue-400 hover:bg-blue-500/10 active:scale-90 transition-transform cursor-pointer"
            title="Add Music"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={handlePrev}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90 cursor-pointer`}
          >
            <SkipBack size={15} />
          </button>
          <button 
            onClick={togglePlay}
            className="p-2 bg-blue-600 text-white rounded-full active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? <Pause size={15} className="fill-white" /> : <Play size={15} className="fill-white translate-x-[1px]" />}
          </button>
          <button 
            onClick={handleNext}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90 cursor-pointer`}
          >
            <SkipForward size={15} />
          </button>
        </div>

        {renderAddMusicModal()}
      </div>
    );
  }

  // Full Standard Rendering
  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${currentThemeStyles}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-400">
            <Music size={18} />
            Entertainment & Cabin Ambient
          </h3>
          {controller.customTracks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
              {controller.customTracks.length} Custom
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus size={13} />
            <span>Add Music</span>
          </button>

          <div className="flex gap-0.5 items-end justify-center h-4 w-6">
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-4' : 'h-1.5'}`} style={{ animationDelay: '0.3s' }} />
            <span className={`w-0.5 bg-blue-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-2' : 'h-1'}`} style={{ animationDelay: '0.5s' }} />
            <span className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3.5' : 'h-2'}`} style={{ animationDelay: '0.2s' }} />
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Horizontal Track Pill Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-2xl overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Song</span>
          </button>

          {playlist.map((item, idx) => (
            <button
              key={`media-track-${item.id || idx}-${idx}`}
              onClick={() => controller.setTrackIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                idx === controller.currentTrackIndex 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {item.isCustom && <AudioWaveform size={10} className="text-emerald-400" />}
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 group shadow-md">
            <img src={track.cover} alt="Cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc className="text-white animate-spin" size={24} style={{ animationDuration: '4s' }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base truncate">{track.title}</h4>
              {track.isCustom && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Imported
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 font-medium truncate">{track.artist}</span>
              <span className="text-[9px] bg-blue-500/15 text-blue-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">{track.genre}</span>
            </div>
            
            <div className="mt-2 h-10 w-full overflow-hidden rounded-xl bg-black/20 relative">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={320} height={40} />
            </div>
          </div>
        </div>

        <div className="space-y-1 mt-1">
          <input 
            type="range"
            min="0"
            max={duration || 180}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-cyan-400 transition-colors"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => controller.setIsMuted(!isMuted)} 
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => controller.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrev}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={togglePlay}
              className="p-3 bg-blue-600 text-white rounded-full active:scale-95 shadow-lg shadow-blue-600/10 transition-transform hover:bg-blue-500 cursor-pointer"
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white translate-x-[1px]" />}
            </button>
            <button 
              onClick={handleNext}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>

      {renderAddMusicModal()}
    </div>
  );
};
