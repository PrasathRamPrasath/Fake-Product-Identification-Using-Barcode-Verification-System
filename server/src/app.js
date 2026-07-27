import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import envConfig from './config/envConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS must be applied before helmet so its headers are never overridden
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));

if (envConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Fake Product Identification - Barcode Verification API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
