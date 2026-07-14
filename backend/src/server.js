import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import { connectDB } from './config/db.js';
import { registerKdsNamespace } from './sockets/kds.js';
<<<<<<< HEAD
import { registerSettingsNamespace } from './sockets/settings.js';
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
});

registerKdsNamespace(io);
<<<<<<< HEAD
registerSettingsNamespace(io);
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

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
