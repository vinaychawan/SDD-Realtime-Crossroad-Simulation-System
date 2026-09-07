// TASK-048 acceptance criteria:
// - Module structure created at src/components/RenderingEngine/
// - IRenderer implemented; Canvas 2D context initialized
// - renderFrame() verified read-only by test
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RenderingEngine } from './RenderingEngine';
import { RenderingEngine as ExportedRenderingEngine } from './index';
import type { IRenderer } from './rendering-engine.interface';
import type { Direction, SignalDirectionState, VehicleState } from '../../domain/types';

interface CanvasCall {
  readonly name: string;
  readonly args: unknown[];
}

function createMockContext(): CanvasRenderingContext2D & { readonly calls: CanvasCall[] } {
  const calls: CanvasCall[] = [];
  const record = (name: string, args: unknown[] = []) => calls.push({ name, args });
  return {
    calls,
    clearRect: (...args: unknown[]) => record('clearRect', args),
    fillRect: (...args: unknown[]) => record('fillRect', args),
    strokeRect: (...args: unknown[]) => record('strokeRect', args),
    beginPath: () => record('beginPath'),
    moveTo: (...args: unknown[]) => record('moveTo', args),
    lineTo: (...args: unknown[]) => record('lineTo', args),
    stroke: () => record('stroke'),
    arc: (...args: unknown[]) => record('arc', args),
    fill: () => record('fill'),
    fillText: (...args: unknown[]) => record('fillText', args),
    save: () => record('save'),
    restore: () => record('restore'),
    set fillStyle(value: unknown) { record('fillStyle', [value]); },
    get fillStyle() { return '#000000'; },
    set strokeStyle(value: unknown) { record('strokeStyle', [value]); },
    get strokeStyle() { return '#000000'; },
    set lineWidth(value: unknown) { record('lineWidth', [value]); },
    get lineWidth() { return 1; },
    set font(value: unknown) { record('font', [value]); },
    get font() { return '10px Arial'; },
    set textAlign(value: unknown) { record('textAlign', [value]); },
    get textAlign() { return 'center'; }
  } as unknown as CanvasRenderingContext2D & { readonly calls: CanvasCall[] };
}

function signals(): Record<Direction, SignalDirectionState> {
  return {
    NORTH: { direction: 'NORTH', state: 'GREEN', secondsRemaining: 10 },
    SOUTH: { direction: 'SOUTH', state: 'RED', secondsRemaining: 20 },
    EAST: { direction: 'EAST', state: 'AMBER', secondsRemaining: 3 },
    WEST: { direction: 'WEST', state: 'RED', secondsRemaining: 20 }
  };
}

function vehicle(): VehicleState {
  return {
    id: 'vehicle-1',
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x: 0, y: 0 },
    speedKmh: 30,
    speedMs: 30 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-048: Rendering Engine Canvas 2D module', () => {
  it('module directory contains expected files', () => {
    const modulePath = 'src/components/RenderingEngine';
    expect(existsSync(join(process.cwd(), modulePath, 'RenderingEngine.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'rendering-engine.interface.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'index.ts'))).toBe(true);
  });

  it('RenderingEngine implements IRenderer and initializes with Canvas 2D context', () => {
    const context = createMockContext();
    const renderer: IRenderer = new RenderingEngine({ context });

    expect(typeof renderer.renderFrame).toBe('function');
    expect(new ExportedRenderingEngine({ context: createMockContext() })).toBeInstanceOf(RenderingEngine);
  });

  it('initializes context from a canvas when context is not provided', () => {
    const context = createMockContext();
    const canvas = { width: 640, height: 480, getContext: () => context } as unknown as HTMLCanvasElement;

    const renderer = new RenderingEngine({ canvas });
    renderer.renderFrame([], signals(), []);

    expect(context.calls.some((call) => call.name === 'clearRect')).toBe(true);
  });

  it('throws when no Canvas 2D context is available', () => {
    const canvas = { width: 640, height: 480, getContext: () => null } as unknown as HTMLCanvasElement;

    expect(() => new RenderingEngine({ canvas })).toThrow('RenderingEngine requires a CanvasRenderingContext2D');
  });

  it('renderFrame() does not mutate vehicles, signals, or conflict-zone occupant arrays', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });
    const inputVehicle = vehicle();
    const inputSignals = signals();
    const occupants = ['vehicle-1'];
    const beforeVehicle = JSON.stringify(inputVehicle);
    const beforeSignals = JSON.stringify(inputSignals);
    const beforeOccupants = JSON.stringify(occupants);

    renderer.renderFrame([inputVehicle], inputSignals, occupants);

    expect(JSON.stringify(inputVehicle)).toBe(beforeVehicle);
    expect(JSON.stringify(inputSignals)).toBe(beforeSignals);
    expect(JSON.stringify(occupants)).toBe(beforeOccupants);
  });
});
