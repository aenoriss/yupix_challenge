import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db.js';
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import aiRouter from './routes/ai.js';
import { setupRealtimeWebSocket } from './services/realtimeService.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 5000;
const server = createServer(app);

setupRealtimeWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}/ws/realtime`);
});