import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface GithubPushEvent {
  type: string;
  created_at: string;
  payload?: {
    commits?: unknown[];
    size?: number;
  };
}

export async function getPushCountForDate(githubUsername: string, date: string): Promise<number> {
  try {
    const response = await axios.get<GithubPushEvent[]>(
      `https://api.github.com/users/${encodeURIComponent(githubUsername)}/events/public`,
      {
        params: { per_page: 100 },
        headers: {
          Accept: 'application/vnd.github+json',
          ...(env.githubPat ? { Authorization: `token ${env.githubPat}` } : {}),
        },
      },
    );

    let total = 0;
    for (const event of response.data) {
      if (event.type !== 'PushEvent') continue;
      if (event.created_at.slice(0, 10) !== date) continue;
      total += event.payload?.commits?.length ?? event.payload?.size ?? 0;
    }

    return total;
  } catch (err) {
    logger.warn({ err, githubUsername, date }, 'Failed to fetch GitHub push events for member');
    return 0;
  }
}
