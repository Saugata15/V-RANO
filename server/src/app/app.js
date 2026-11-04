import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import config from '../config/config.js';
import authRoutes from '../routes/auth.route.js';

const app = express();

app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

export default app;