// TASK-050 acceptance criteria:
// - Signal color indicators rendered per direction matching SignalDirectionState
// - Color update latency ≤100ms of underlying state change
import { describe, expect, it } from 'vitest';
import { RenderingEngine } from './RenderingEngine';
import type { Direction, SignalDirectionState } from '../../domain/types';

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

function signals(north: SignalDirectionState['state'] = 'GREEN'): Record<Direction, SignalDirectionState> {
  return {
    NORTH: { direction: 'NORTH', state: north, secondsRemaining: 10 },
    SOUTH: { direction: 'SOUTH', state: 'RED', secondsRemaining: 20 },
    EAST: { direction: 'EAST', state: 'AMBER', secondsRemaining: 3 },
    WEST: { direction: 'WEST', state: 'RED', secondsRemaining: 20 }
  };
}

describe('TASK-050: Rendering Engine signal state rendering', () => {
  it('maps signal states to configured Canvas colors', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    expect(renderer.getSignalColor('RED')).toBe('#dc3545');
    expect(renderer.getSignalColor('GREEN')).toBe('#28a745');
    expect(renderer.getSignalColor('AMBER')).toBe('#ffc107');
  });

  it('renders color indicators for RED, GREEN, and AMBER states', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });

    renderer.renderFrame([], signals(), []);

    const fillColors = context.calls.filter((call) => call.name === 'fillStyle').map((call) => call.args[0]);
    expect(fillColors).toContain('#28a745');
    expect(fillColors).toContain('#dc3545');
    expect(fillColors).toContain('#ffc107');
  });

  it('renders direction labels and countdown seconds', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });

    renderer.renderFrame([], signals(), []);

    const text = context.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0]);
    expect(text).toEqual(expect.arrayContaining(['NORTH', 'SOUTH', 'EAST', 'WEST', '10s', '20s', '3s']));
  });

  it('updates rendered signal color within 100ms of state change input', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });
    const startedAt = performance.now();

    renderer.renderFrame([], signals('RED'), []);
    const callsBeforeUpdate = context.calls.length;
    renderer.renderFrame([], signals('GREEN'), []);

    const elapsedMs = performance.now() - startedAt;
    const updatedFrameFillColors = context.calls
      .slice(callsBeforeUpdate)
      .filter((call) => call.name === 'fillStyle')
      .map((call) => call.args[0]);
    expect(elapsedMs).toBeLessThanOrEqual(100);
    expect(updatedFrameFillColors).toContain('#28a745');
  });

  it('draws one signal light arc per lane for each direction', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });

    renderer.renderFrame([], signals(), []);

    expect(context.calls.filter((call) => call.name === 'arc')).toHaveLength(12);
  });
});
