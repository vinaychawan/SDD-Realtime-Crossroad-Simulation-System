// Covers TASK-009 acceptance criteria only. See tasks/Tasks_009-config-manager-unit-test-suite.md
// This file completes the test matrix with the "valid update" cases not already owned by
// Test_005/006/007/008 (each of which owns its own slice of the matrix). Coverage completion
// itself is verified by the aggregate `npm run test:coverage` run across all Test_00x files.
import { describe, it, expect } from 'vitest';
import { ConfigurationManager } from './ConfigurationManager';

describe('TASK-009: Config Manager — unit test suite completion (valid update matrix)', () => {
  it('applies a valid partial update and reflects it in the snapshot', () => {
    const manager = new ConfigurationManager();
    manager.update({ targetFrameRate: 30 });
    expect(manager.getSnapshot().targetFrameRate).toBe(30);
  });

  it('merges nested perDirection updates without discarding other directions', () => {
    const manager = new ConfigurationManager();
    const before = manager.getSnapshot();
    manager.update({
      perDirection: { ...before.perDirection, NORTH: { spawnRatePerMinute: 45, greenDurationSec: 30, redDurationSec: 30 } }
    });
    const after = manager.getSnapshot();
    expect(after.perDirection.NORTH.spawnRatePerMinute).toBe(45);
    expect(after.perDirection.SOUTH).toEqual(before.perDirection.SOUTH);
  });

  it('supports independent emergency spawn rate fields (MF-006 Option A)', () => {
    const manager = new ConfigurationManager();
    manager.update({
      emergency: { enabled: true, spawnRatePerMinute: { AMBULANCE: 7, POLICE: 0, FIRE_BRIGADE: 0 } }
    });
    manager.update({
      emergency: { enabled: true, spawnRatePerMinute: { AMBULANCE: 7, POLICE: 3, FIRE_BRIGADE: 0 } }
    });
    const snapshot = manager.getSnapshot();
    // Setting POLICE independently must not reset the previously-set AMBULANCE rate.
    expect(snapshot.emergency.spawnRatePerMinute).toEqual({ AMBULANCE: 7, POLICE: 3, FIRE_BRIGADE: 0 });
  });
});
