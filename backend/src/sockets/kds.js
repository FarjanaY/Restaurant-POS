let kdsNamespace = null;

export function registerKdsNamespace(io) {
  kdsNamespace = io.of('/kds');

  kdsNamespace.on('connection', (socket) => {
    console.log('KDS client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('KDS client disconnected:', socket.id);
    });
  });

  return kdsNamespace;
}

// No-ops when no socket server is attached (e.g. controller/route tests that import
// app.js directly without booting server.js) — emitting to the kitchen screen is a
// side effect of order state changes, not something request handling should require.
export function emitOrderNew(order) {
  kdsNamespace?.emit('order:new', order);
}

export function emitOrderUpdated(order) {
  kdsNamespace?.emit('order:updated', order);
}
