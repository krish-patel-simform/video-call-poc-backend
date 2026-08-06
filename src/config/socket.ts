import { Server as SocketServer } from 'socket.io';
import { type Server } from 'http';

export function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: { origin: '*' },
  });

  const emailToSocketMap = new Map();
  const socketIdToEmailMap = new Map();

  io.on('connection', (socket) => {
    console.log('new Socket connection created:', socket.id);

    socket.on('join-room', ({ roomId, email }, callback) => {
      socket.join(roomId);

      emailToSocketMap.set(email, socket.id);
      socketIdToEmailMap.set(socket.id, email);

      console.log(`User ${email} joined room ${roomId} with socket ${socket.id}`);

      // Broadcast to existing members in the room
      socket.to(roomId).emit('user-joined', { newUserEmail: email });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('call-user', ({ newUserEmail, offer }) => {
      const newUserSocketId = emailToSocketMap.get(newUserEmail);
      const fromUserEmail = socketIdToEmailMap.get(socket.id);

      console.log(
        `Forwarding call from ${fromUserEmail} (${socket.id}) -> ${newUserEmail} (${newUserSocketId})`,
      );

      if (newUserSocketId) {
        socket.to(newUserSocketId).emit('incomming-call', { offer, fromUserEmail });
      } else {
        console.error(`Socket ID for ${newUserEmail} not found!`);
      }
    });

    socket.on('call-accepted', ({ emailId, answer }) => {
      const targetSocketId = emailToSocketMap.get(emailId);
      console.log(`Forwarding accepted call answer to ${emailId} (${targetSocketId})`);

      if (targetSocketId) {
        // Wrap in object { answer } to match client destructuring!
        socket.to(targetSocketId).emit('call-accepted', { answer });
      }
    });

    socket.on('disconnect', (reason) => {
      const email = socketIdToEmailMap.get(socket.id);
      emailToSocketMap.delete(email);
      socketIdToEmailMap.delete(socket.id);
      console.log(`Socket ${socket.id} (${email}) disconnected due to ${reason}`);
    });
  });
}
