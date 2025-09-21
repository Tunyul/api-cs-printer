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
    // Accept "Bearer <token>" or raw token
    if (typeof token === 'string' && token.startsWith('Bearer ')) token = token.slice(7);
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('./src/config/auth');
  const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // Join user-specific rooms (support both id_user and id_customer if present)
  if (socket.user) {
    // join both internal (user) and customer namespaces to be resilient
    if (socket.user.id_user) socket.join(`internal:${socket.user.id_user}`);
    if (socket.user.id_customer) socket.join(`customer:${socket.user.id_customer}`);
    if (socket.user.role && socket.user.role === 'admin') socket.join('role:admin');
    console.log('socket connected user=', socket.user);
    try {
      console.log('socket rooms=', Array.from(socket.rooms));
    } catch (e) {}
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