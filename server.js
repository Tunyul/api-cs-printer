const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Simple JWT handshake verification
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const jwt = require('./node_modules/jsonwebtoken');
    const payload = jwt.verify(token, 'secretkey');
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // Join user-specific room
  if (socket.user && socket.user.id_user) {
    socket.join(`user:${socket.user.id_user}`);
  }
  socket.on('disconnect', () => {
    // noop for now
  });
});

// expose io to express app so controllers can emit
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});