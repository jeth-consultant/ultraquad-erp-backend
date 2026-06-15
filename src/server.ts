import { createApp } from './app';
import { env } from './config/env';
import { startScheduledJobs } from './jobs/scheduler';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`UltraQuad ERP API listening on port ${env.port}`);
});

if (env.nodeEnv !== 'test' && env.enableCronJobs) {
  startScheduledJobs();
}
