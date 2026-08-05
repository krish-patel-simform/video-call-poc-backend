import './config/env.js';
import express from 'express';
import { env } from './config/env.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';
import cors from 'cors';
import roomGeneratorRouter from './routes/roomGeneration.route.js';

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: '*',
  }),
);

// init socket
initSocket(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/room', roomGeneratorRouter);

const PORT = env.PORT;

server.listen(PORT, () => console.log('🚀 Server is running on port', PORT));
