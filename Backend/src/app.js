import express from 'express';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '15mb' }));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

