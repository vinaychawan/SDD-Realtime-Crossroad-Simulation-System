// TASK-049 acceptance criteria:
// - Vehicles drawn at interpolated positions between last two physics snapshots
// - Rendering never blocks or delays physics accumulator loop
// - Unit test covers interpolation math used to avoid visible snapping
import { describe, expect, it } from 'vitest';
import { RenderingEngine } from './RenderingEngine';
import type { Direction, SignalDirectionState, VehicleState } from '../../domain/types';

interface CanvasCall { readonly name: string; readonly args: unknown[] }

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

function vehicle(id: string, x: number, y: number, speedKmh = 30, direction: Direction = 'NORTH'): VehicleState {
  return {
    id,
    direction,
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x, y },
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

function signals(): Record<Direction, SignalDirectionState> {
  return {
    NORTH: { direction: 'NORTH', state: 'GREEN', secondsRemaining: 1 },
    SOUTH: { direction: 'SOUTH', state: 'RED', secondsRemaining: 1 },
    EAST: { direction: 'EAST', state: 'RED', secondsRemaining: 1 },
    WEST: { direction: 'WEST', state: 'RED', secondsRemaining: 1 }
  };
}

describe('TASK-049: Rendering Engine vehicle interpolation', () => {
  it('interpolates vehicle position and speed at accumulator fraction', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    const interpolated = renderer.interpolateVehicle(vehicle('v1', 0, 0, 10), vehicle('v1', 10, 20, 30), 0.25);

    expect(interpolated.position).toEqual({ x: 2.5, y: 5 });
    expect(interpolated.speedKmh).toBe(15);
    expect(interpolated.speedMs).toBeCloseTo(15 / 3.6, 6);
  });

  it('clamps interpolation fraction to [0, 1]', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    expect(renderer.interpolateVehicle(vehicle('v1', 0, 0), vehicle('v1', 10, 10), -1).position).toEqual({ x: 0, y: 0 });
    expect(renderer.interpolateVehicle(vehicle('v1', 0, 0), vehicle('v1', 10, 10), 2).position).toEqual({ x: 10, y: 10 });
  });

  it('renderFrame() draws vehicles at interpolated display-only positions', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });
    renderer.setInterpolationSnapshots([vehicle('v1', 0, 0)], [vehicle('v1', 10, 0)], 0.5);

    renderer.renderFrame([vehicle('ignored-live-input', 100, 100)], signals(), []);

    const fillRects = context.calls.filter((call) => call.name === 'fillRect');
    const vehicleFillRect = fillRects[fillRects.length - 1];
    expect(vehicleFillRect?.args[0]).toBe(516); // world x=5m => canvas x=520, vehicle width=8px, x-left=516
  });

  it('uses current snapshot directly for vehicles missing from previous snapshot', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });
    renderer.setInterpolationSnapshots([vehicle('old', 0, 0)], [vehicle('new', 10, 0)], 0.5);

    renderer.renderFrame([], signals(), []);

    const fillRects = context.calls.filter((call) => call.name === 'fillRect');
    const vehicleFillRect = fillRects[fillRects.length - 1];
    expect(vehicleFillRect?.args[0]).toBe(536); // current world x=10m => canvas x=540, vehicle width=8px
  });

  it('falls back to live renderFrame vehicles when interpolation snapshots are absent', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });

    renderer.renderFrame([vehicle('live', -10, 0)], signals(), []);

    const fillRects = context.calls.filter((call) => call.name === 'fillRect');
    const vehicleFillRect = fillRects[fillRects.length - 1];
    expect(vehicleFillRect?.args[0]).toBe(456); // current world x=-10m => canvas x=460, vehicle width=8px
  });

  it('renders EAST/WEST vehicles with horizontal dimensions', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });

    renderer.renderFrame([vehicle('eastbound', 0, 0, 30, 'EAST')], signals(), []);

    const fillRects = context.calls.filter((call) => call.name === 'fillRect');
    const vehicleFillRect = fillRects[fillRects.length - 1];
    expect(vehicleFillRect?.args.slice(2)).toEqual([18, 8]); // 4.5m × 2m at 4 px/m
  });

  it('rendering completes within a frame budget and does not block physics timing', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });
    const vehicles = Array.from({ length: 150 }, (_, index) => vehicle(`v${index}`, index % 20, Math.floor(index / 20), 25));
    const startedAt = performance.now();

    renderer.renderFrame(vehicles, signals(), []);

    expect(performance.now() - startedAt).toBeLessThanOrEqual(16.7);
  });
});
