import { Server as SocketServer } from 'socket.io';
import { type Server } from 'http';

export function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
    },
  });

  const emailToSocketMap = new Map();

  io.on('connection', (socket) => {
    console.log('new Socket connection is created');

    socket.on('join-room', ({ roomId, email }) => {
      socket.join(roomId);
      console.log('A new User is joined in the room ', roomId);
      // need to store the email in the map
      emailToSocketMap.set(email, socket.id);

      // broadcats this to rest all in the room
      socket.broadcast.to(roomId).emit('new-user', email);
    });

    socket.on('disconnect', (reason) => {
      console.log(`A socket connection ${socket.id} is disconnected due to ${reason}`);
    });
  });
}
