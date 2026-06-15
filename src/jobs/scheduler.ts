import cron from 'node-cron';
import { runDailyPushSync, runPushReminders } from './pushSync.job';
import { logger } from '../utils/logger';

export function startScheduledJobs(): void {
  cron.schedule('0 18 * * *', () => {
    runPushReminders().catch((err) => logger.error({ err }, 'Push reminder job failed'));
  });

  cron.schedule('5 0 * * *', () => {
    runDailyPushSync().catch((err) => logger.error({ err }, 'Daily push sync job failed'));
  });

  logger.info('Scheduled push-tracking jobs registered');
}
