import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import { connectDB } from './config/db.js';
import { registerKdsNamespace } from './sockets/kds.js';
import { registerSettingsNamespace } from './sockets/settings.js';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
});

registerKdsNamespace(io);
registerSettingsNamespace(io);

connectDB(MONGO_URI)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
