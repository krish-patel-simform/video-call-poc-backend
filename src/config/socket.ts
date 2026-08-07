import { Server as SocketServer } from 'socket.io';
import { type Server } from 'http';

export function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: { origin: '*' },
  });

  const emailToSocketMap = new Map<string, string>();
  const socketIdToEmailMap = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log('New Socket connected:', socket.id);

    // 1. Join Room
    socket.on('join-room', ({ roomId, email }, callback) => {
      socket.join(roomId);

      emailToSocketMap.set(email, socket.id);
      socketIdToEmailMap.set(socket.id, email);

      console.log(`User ${email} joined room ${roomId}`);

      // Notify existing users in the room
      socket.to(roomId).emit('user-joined', { newUserEmail: email });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // 2. Call User (Forward Offer)
    socket.on('call-user', ({ newUserEmail, offer }) => {
      const newUserSocketId = emailToSocketMap.get(newUserEmail);
      const fromUserEmail = socketIdToEmailMap.get(socket.id);

      if (newUserSocketId) {
        socket.to(newUserSocketId).emit('incomming-call', { offer, fromUserEmail });
      }
    });

    // 3. Call Accepted (Forward Answer)
    socket.on('call-accepted', ({ emailId, answer }) => {
      const targetSocketId = emailToSocketMap.get(emailId);

      if (targetSocketId) {
        // Wrap in { answer } object to match client expectation
        socket.to(targetSocketId).emit('call-accepted', { answer });
        // Ack the answering side so it knows the connection is proceeding
        // and can push its own media stream tracks
        socket.emit('call-accepted-ack');
      }
    });

    // 4. WebRTC ICE Candidates Exchange
    socket.on('peer:ice-candidate', ({ targetEmail, candidate }) => {
      const targetSocketId = emailToSocketMap.get(targetEmail);

      if (targetSocketId) {
        socket.to(targetSocketId).emit('peer:ice-candidate', { candidate });
      } else {
        // Fallback: broadcast to room
        socket.broadcast.emit('peer:ice-candidate', { candidate });
      }
    });

    // 5. Disconnect
    socket.on('disconnect', (reason) => {
      const email = socketIdToEmailMap.get(socket.id);
      if (email) emailToSocketMap.delete(email);
      socketIdToEmailMap.delete(socket.id);
      console.log(`Socket ${socket.id} disconnected (${reason})`);
    });
  });
}
