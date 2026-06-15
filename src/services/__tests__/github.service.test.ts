import axios from 'axios';
import { getPushCountForDate } from '../github.service';

jest.mock('axios');

describe('github.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getPushCountForDate', () => {
    it('sums commits from PushEvents on the matching date', async () => {
      jest.mocked(axios.get).mockResolvedValue({
        data: [
          { type: 'PushEvent', created_at: '2026-06-15T10:00:00Z', payload: { commits: [{}, {}] } },
          { type: 'PushEvent', created_at: '2026-06-15T18:00:00Z', payload: { commits: [{}] } },
          { type: 'PushEvent', created_at: '2026-06-14T10:00:00Z', payload: { commits: [{}, {}, {}] } },
          { type: 'WatchEvent', created_at: '2026-06-15T11:00:00Z', payload: {} },
        ],
      });

      const result = await getPushCountForDate('octocat', '2026-06-15');

      expect(result).toBe(3);
    });

    it('falls back to payload.size when commits array is absent', async () => {
      jest.mocked(axios.get).mockResolvedValue({
        data: [{ type: 'PushEvent', created_at: '2026-06-15T10:00:00Z', payload: { size: 2 } }],
      });

      const result = await getPushCountForDate('octocat', '2026-06-15');

      expect(result).toBe(2);
    });

    it('returns 0 when the request fails', async () => {
      jest.mocked(axios.get).mockRejectedValue(new Error('network error'));

      const result = await getPushCountForDate('octocat', '2026-06-15');

      expect(result).toBe(0);
    });
  });
});
