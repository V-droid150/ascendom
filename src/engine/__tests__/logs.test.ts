import { LOG_RETENTION_DAYS } from '../constants';
import { pruneLogs } from '../logs';
import { makeLog } from './factories';

describe('pruneLogs', () => {
  it('keeps logs inside the retention window, including the cutoff day', () => {
    const logs = [makeLog('a', '2026-03-10'), makeLog('a', '2026-01-09')];
    expect(pruneLogs(logs, '2026-03-10', 60)).toBe(logs);
  });

  it('drops logs older than the window', () => {
    const recent = makeLog('a', '2026-03-09');
    const pruned = pruneLogs([makeLog('a', '2025-01-01'), recent], '2026-03-10');
    expect(pruned).toEqual([recent]);
  });

  it('uses a window wider than the catch-up period by default', () => {
    expect(LOG_RETENTION_DAYS).toBeGreaterThan(7);
  });
});
