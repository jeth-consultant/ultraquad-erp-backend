import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { authRouter } from './routes/auth.routes';
import { profileRouter } from './routes/profile.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(generalLimiter);

  app.get('/api/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/me', profileRouter);

  app.use(errorHandler);

  return app;
}
