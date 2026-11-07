// IndexedDB Persistent Storage for User Imported In-Car Audio & Music

export interface StoredCustomTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  cover: string;
  blob?: Blob;
  url?: string;
  fileName?: string;
  fileSize?: number;
  dateAdded: number;
}

const DB_NAME = 'hyper_driver_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_tracks';

// Cover gradients for uploaded songs
const COVER_GRADIENTS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop'
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Clean and format a file name into a readable song title
export function sanitizeSongTitle(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '') // remove extension (.mp3, .m4a, etc)
    .replace(/[_-]/g, ' ')     // replace dashes and underscores
    .replace(/\s+/g, ' ')      // remove duplicate spaces
    .trim();
}

// Save a user-uploaded audio file (MP3, M4A, WAV, etc) to IndexedDB
export async function saveAudioFileToDB(file: File, customTitle?: string, customArtist?: string): Promise<StoredCustomTrack> {
  const db = await openDB();
  const id = `user_track_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const title = (customTitle && customTitle.trim()) || sanitizeSongTitle(file.name);
  const artist = (customArtist && customArtist.trim()) || 'Imported Audio';
  const cover = COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)];

  const trackData: StoredCustomTrack = {
    id,
    title,
    artist,
    album: 'My In-Car Playlist',
    genre: 'Custom Audio',
    cover,
    blob: file,
    fileName: file.name,
    fileSize: file.size,
    dateAdded: Date.now()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(trackData);
    req.onsuccess = () => resolve(trackData);
    req.onerror = () => reject(req.error);
  });
}

// Save a direct audio stream URL or podcast link
export async function saveAudioUrlToDB(title: string, artist: string, url: string, genre: string = 'Web Radio'): Promise<StoredCustomTrack> {
  const db = await openDB();
  const id = `user_stream_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cover = COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)];

  const trackData: StoredCustomTrack = {
    id,
    title: title.trim(),
    artist: (artist && artist.trim()) || 'Live Stream',
    album: 'My In-Car Playlist',
    genre,
    cover,
    url: url.trim(),
    dateAdded: Date.now()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(trackData);
    req.onsuccess = () => resolve(trackData);
    req.onerror = () => reject(req.error);
  });
}

// Retrieve all saved custom audio tracks
export async function getAllCustomTracksFromDB(): Promise<StoredCustomTrack[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        // sort by newest added first
        results.sort((a: StoredCustomTrack, b: StoredCustomTrack) => (b.dateAdded || 0) - (a.dateAdded || 0));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Could not load custom tracks from IndexedDB:', e);
    return [];
  }
}

// Delete a custom track by ID
export async function deleteCustomTrackFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Clear all custom tracks
export async function clearAllCustomTracksFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
