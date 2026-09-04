// TASK-022 acceptance criteria:
// - Module structure exists at src/components/ConflictZoneManager/
// - IConflictZoneManager interface matches INTERFACES.md §5
// - Zone dimensions configurable (default 25m)
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConflictZoneManager } from './ConflictZoneManager';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

describe('TASK-022: Conflict Zone Manager module structure', () => {
  it('module directory contains the expected files', () => {
    expect(existsSync(join(MODULE_DIR, 'conflict-zone-manager.interface.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'ConflictZoneManager.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'README.md'))).toBe(true);
  });

  it('ConflictZoneManager can be instantiated with zone configuration', () => {
    const config = { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 };
    const manager = new ConflictZoneManager(config);
    expect(manager).toBeInstanceOf(ConflictZoneManager);
  });

  it('zone dimensions are configurable (20-50m range)', () => {
    const smallZone = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });
    const largeZone = new ConflictZoneManager({ sizeMeters: 50, maxWaitSeconds: 8, stopLineDistanceMeters: 30 });
    expect(smallZone).toBeInstanceOf(ConflictZoneManager);
    expect(largeZone).toBeInstanceOf(ConflictZoneManager);
  });

  it('getOccupants() returns empty array initially', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    expect(manager.getOccupants()).toEqual([]);
  });

  it('getDeadlockedVehicles() returns empty array initially', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });
});
