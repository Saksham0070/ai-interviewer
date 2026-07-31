import { setServers } from "node:dns/promises";
import express from 'express';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
setServers(["1.1.1.1", "8.8.8.8"]);

// Keep development diagnostics outside the watched project directory. An
// uncaught background-task error should be visible without taking down Socket.IO.
if (process.env.NODE_ENV !== 'production') {
  const diagnosticLog = path.join(os.tmpdir(), 'ai-interviewer-backend-errors.log');
  const reportBackgroundError = (label, reason) => {
    const details = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
    const entry = `[${new Date().toISOString()}] ${label}\n${details}\n\n`;
    console.error(entry);
    try {
      fs.appendFileSync(diagnosticLog, entry);
    } catch (logError) {
      console.error('Could not write backend diagnostic log:', logError);
    }
  };

  process.on('uncaughtException', (error) => reportBackgroundError('uncaughtException', error));
  process.on('unhandledRejection', (reason) => reportBackgroundError('unhandledRejection', reason));
}

console.log(process.env.MONGO_URI);
connectDB();

const app = express();

const server = http.createServer(app);

const allowOrigin =[
    'http://localhost',
    'http://localhost:5174',
    'http://localhost:5173',
]

const io = new Server(server, {
  cors: {
    origin: allowOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowOrigin.includes(origin)) {
            callback(null, true);
        } else {
            if(process.env.NODE_ENV === 'development') {
                callback(null, true);
            }else{
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization','X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('io', io);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  const userId = socket.handshake.query.userId;

  if(userId) {
    socket.join(userId);
    console.log(`User with ID ${userId} joined room ${userId}`);
  }

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
