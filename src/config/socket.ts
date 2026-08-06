import { Server as SocketServer } from 'socket.io';
import { type Server } from 'http';

export function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
    },
  });

  const emailToSocketMap = new Map();
  const socketIdToEmailMap = new Map();

  io.on('connection', (socket) => {
    console.log('new Socket connection is created');

    socket.on('join-room', ({ roomId, email }, callback) => {
      socket.join(roomId);
      console.log(`A new User ${email} is joined in the room ${roomId}`);
      // need to store the email in the map
      emailToSocketMap.set(email, socket.id);
      socketIdToEmailMap.set(socket.id, email);

      // broadcats this to rest all in the room
      socket.broadcast.to(roomId).emit('user-joined', email);
      callback({
        success: true,
      });
    });

    socket.on('call-user', ({ newUserEmail, offer }) => {
      const newUserSocketId = emailToSocketMap.get(newUserEmail);
      const fromUserEmail = socketIdToEmailMap.get(socket.id);

      socket.to(newUserSocketId).emit('incomming-call', { offer, fromUserEmail });
    });

    socket.on('call-accepted', ({ emailId, answer }) => {
      const socketId = emailToSocketMap.get(emailId);

      socket.to(socketId).emit('call-accepted', answer);
    });

    socket.on('disconnect', (reason) => {
      console.log(`A socket connection ${socket.id} is disconnected due to ${reason}`);
    });
  });
}
