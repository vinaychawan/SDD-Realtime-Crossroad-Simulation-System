// TASK-052 acceptance criteria:
// - Conflict zone rectangle rendered at intersection center, dimensions matching configured size ±2m
// - Zone only rendered when Mode B (OPPOSING_SIMULTANEOUS) is active
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

function signals(): Record<Direction, SignalDirectionState> {
  return {
    NORTH: { direction: 'NORTH', state: 'GREEN', secondsRemaining: 1 },
    SOUTH: { direction: 'SOUTH', state: 'GREEN', secondsRemaining: 1 },
    EAST: { direction: 'EAST', state: 'RED', secondsRemaining: 1 },
    WEST: { direction: 'WEST', state: 'RED', secondsRemaining: 1 }
  };
}

function vehicle(id: string): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x: 0, y: 0 },
    speedKmh: 20,
    speedMs: 20 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-052: Rendering Engine conflict zone visualization', () => {
  it('does not render conflict zone rectangle in Mode A', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, signalMode: 'STRICT_MUTUAL_EXCLUSION' });

    renderer.renderFrame([], signals(), []);

    expect(context.calls.filter((call) => call.name === 'strokeStyle').map((call) => call.args[0])).not.toContain('#ff8800');
  });

  it('renders conflict zone rectangle only when Mode B is active', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, signalMode: 'OPPOSING_SIMULTANEOUS', widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });

    renderer.renderFrame([], signals(), []);

    expect(context.calls.filter((call) => call.name === 'strokeStyle').map((call) => call.args[0])).toContain('#ff8800');
    expect(context.calls.some((call) => call.name === 'strokeRect' && call.args[2] === 100 && call.args[3] === 100)).toBe(true);
  });

  it('renders configured conflict-zone size centered at intersection within ±2m tolerance', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, signalMode: 'OPPOSING_SIMULTANEOUS', widthPx: 1000, heightPx: 800, pixelsPerMeter: 4, conflictZoneSizeMeters: 30 });

    renderer.renderFrame([], signals(), []);

    const zoneStrokeRect = context.calls.find((call) => call.name === 'strokeRect' && call.args[2] === 120 && call.args[3] === 120);
    expect(zoneStrokeRect?.args).toEqual([440, 340, 120, 120]);
  });

  it('can update conflict-zone size and signal mode at runtime', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, signalMode: 'STRICT_MUTUAL_EXCLUSION', widthPx: 1000, heightPx: 800, pixelsPerMeter: 4 });

    renderer.setSignalMode('OPPOSING_SIMULTANEOUS');
    renderer.setConflictZoneSizeMeters(20);
    renderer.renderFrame([], signals(), []);

    expect(context.calls.some((call) => call.name === 'strokeRect' && call.args[2] === 80 && call.args[3] === 80)).toBe(true);
  });

  it('highlights vehicles listed as conflict-zone occupants', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });

    renderer.renderFrame([vehicle('occupant')], signals(), ['occupant']);

    expect(context.calls.filter((call) => call.name === 'strokeStyle').map((call) => call.args[0])).toContain('#ff8800');
    expect(context.calls.filter((call) => call.name === 'lineWidth').map((call) => call.args[0])).toContain(4);
  });
});
