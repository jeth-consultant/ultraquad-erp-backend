import * as adminRepository from '../repositories/admin.repository';
import * as finesRepository from '../repositories/fines.repository';
import * as notificationsRepository from '../repositories/notifications.repository';
import { getAppConfig } from '../repositories/payments.repository';
import * as pushDaysRepository from '../repositories/pushDays.repository';
import * as githubService from '../services/github.service';
import { logger } from '../utils/logger';

function yesterdayUtc(): string {
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return yesterday.toISOString().slice(0, 10);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export async function runDailyPushSync(targetDate?: string): Promise<{ checked: number; fined: number }> {
  const date = targetDate ?? yesterdayUtc();
  const appConfig = await getAppConfig();
  const isRequiredDay = appConfig.required_push_weekdays.includes(weekdayOf(date));

  const members = await adminRepository.findAllMembers();

  let checked = 0;
  let fined = 0;

  for (const member of members) {
    if (!member.github_username) continue;

    checked += 1;
    const commitsCount = await githubService.getPushCountForDate(member.github_username, date);
    const satisfied = !isRequiredDay || commitsCount > 0;

    await pushDaysRepository.upsert(member.id, date, commitsCount, satisfied);

    if (isRequiredDay && !satisfied) {
      await finesRepository.createFine({
        memberId: member.id,
        amount: Number(appConfig.fine_per_missed_day),
        reason: 'missed_push',
        dateIncurred: date,
      });
      await notificationsRepository.insert({
        memberId: member.id,
        title: 'Missed push fine',
        body: `You did not push any commits on ${date}, so a fine of KES ${appConfig.fine_per_missed_day} has been applied.`,
        type: 'fine_created',
      });
      fined += 1;
    }
  }

  logger.info({ date, checked, fined }, 'Daily push sync complete');
  return { checked, fined };
}

export async function runPushReminders(): Promise<{ sent: number }> {
  const date = todayUtc();
  const appConfig = await getAppConfig();

  if (!appConfig.required_push_weekdays.includes(weekdayOf(date))) {
    return { sent: 0 };
  }

  const members = await adminRepository.findAllMembers();

  let sent = 0;

  for (const member of members) {
    if (!member.github_username) continue;

    const pushDay = await pushDaysRepository.findByMemberAndDate(member.id, date);
    if (pushDay?.satisfied) continue;

    await notificationsRepository.insert({
      memberId: member.id,
      title: 'Push reminder',
      body: `You haven't pushed any commits today. Push before the deadline to avoid a missed-push fine.`,
      type: 'daily_push_reminder',
    });
    sent += 1;
  }

  logger.info({ date, sent }, 'Push reminders sent');
  return { sent };
}
