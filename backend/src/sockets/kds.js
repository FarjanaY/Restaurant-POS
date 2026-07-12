export function registerKdsNamespace(io) {
  const kds = io.of('/kds');

  kds.on('connection', (socket) => {
    console.log('KDS client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('KDS client disconnected:', socket.id);
    });
  });

  return kds;
}
