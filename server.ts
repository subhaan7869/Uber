import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// In-memory real-time store for iPad <-> PC CarPlay rooms
const carplayRooms = new Map();
// Connected SSE clients per room
const roomClients = new Map();

function getDefaultRoomState(room) {
  return {
    room,
    isActive: true,
    isNavigating: false,
    location: { latitude: 52.9548, longitude: -1.1581 },
    heading: 0,
    isOnline: false,
    activeOrders: [],
    currentOrderId: null,
    busyAreaTarget: null,
    routeWaypoints: [],
    activeCityKey: 'Nottingham',
    mapCoreMode: 'google',
    navigationApp: 'google',
    navDestination: null,
    navTriggeredAt: 0,
    lastUpdated: Date.now(),
    controllerDevice: 'iPad',
    pendingOrder: null,
    orderExpiryTimer: 18,
    action: null,
    orderId: null,
  };
}

function broadcastToRoom(room, state) {
  const clients = roomClients.get(room);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

// Get current state for a pairing room
app.get('/api/carplay/state', (req, res) => {
  const room = String(req.query.room || 'HYPER1').toUpperCase().trim();
  const state = carplayRooms.get(room) || getDefaultRoomState(room);
  res.json(state);
});

// Update state for a pairing room (e.g., when iPad clicks Navigate or updates GPS/orders)
app.post('/api/carplay/sync', (req, res) => {
  const body = req.body || {};
  const room = String(body.room || 'HYPER1').toUpperCase().trim();
  const existing = carplayRooms.get(room) || getDefaultRoomState(room);

  const updated = {
    ...existing,
    ...body,
    room,
    lastUpdated: Date.now(),
  };

  carplayRooms.set(room, updated);
  broadcastToRoom(room, updated);
  res.json({ ok: true, state: updated });
});

// Real-time Server-Sent Events (SSE) stream for PC CarPlay receiver & iPad controller
app.get('/api/carplay/stream', (req, res) => {
  const room = String(req.query.room || 'HYPER1').toUpperCase().trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!roomClients.has(room)) {
    roomClients.set(room, new Set());
  }
  const clients = roomClients.get(room);
  clients.add(res);

  // Send initial snapshot immediately
  const initial = carplayRooms.get(room) || getDefaultRoomState(room);
  res.write(`data: ${JSON.stringify(initial)}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hyper Driver Server & CarPlay Sync running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
