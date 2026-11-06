import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import config from '../config/config.js';
import authRoutes from '../routes/auth.route.js';
import { errorHandler } from '../middlewares/error.middleware.js';
import passport from '../config/passport.js';

const app = express();

app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
    ],
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

// error middleware
app.use(errorHandler);

export default app;
