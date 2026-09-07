// TASK-051 acceptance criteria:
// - Correct color/trim per emergency type
// - Flashing lights alternate at 1.0 Hz (±0.1 Hz)
// - Text label rendered at ≥40px
import { describe, expect, it } from 'vitest';
import { RenderingEngine } from './RenderingEngine';
import type { Direction, EmergencyVehicleType, SignalDirectionState, VehicleState } from '../../domain/types';

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
    SOUTH: { direction: 'SOUTH', state: 'RED', secondsRemaining: 1 },
    EAST: { direction: 'EAST', state: 'RED', secondsRemaining: 1 },
    WEST: { direction: 'WEST', state: 'RED', secondsRemaining: 1 }
  };
}

function emergencyVehicle(id: string, emergencyType: EmergencyVehicleType): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x: 0, y: 0 },
    speedKmh: 45,
    speedMs: 45 / 3.6,
    isEmergency: true,
    emergencyType,
    yieldingActive: false
  };
}

describe('TASK-051: Rendering Engine emergency vehicle visual markers', () => {
  it('maps emergency vehicle styles per requirement', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    expect(renderer.getEmergencyVehicleStyle('AMBULANCE')).toMatchObject({ bodyColor: '#ffffff', trimColor: '#d00000', label: 'AMBULANCE' });
    expect(renderer.getEmergencyVehicleStyle('POLICE')).toMatchObject({ bodyColor: '#0057b8', trimColor: '#ffffff', label: 'POLICE' });
    expect(renderer.getEmergencyVehicleStyle('FIRE_BRIGADE')).toMatchObject({ bodyColor: '#c1121f', trimColor: '#ffd60a', label: 'FIRE' });
  });

  it('alternates red/blue ambulance lights at 1.0 Hz', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    expect(renderer.getEmergencyLightColor('AMBULANCE', 0)).toBe('#ff0000');
    expect(renderer.getEmergencyLightColor('AMBULANCE', 500)).toBe('#0066ff');
    expect(renderer.getEmergencyLightColor('AMBULANCE', 1000)).toBe('#ff0000');
  });

  it('alternates fire brigade red/yellow lights at 1.0 Hz', () => {
    const renderer = new RenderingEngine({ context: createMockContext() });

    expect(renderer.getEmergencyLightColor('FIRE_BRIGADE', 0)).toBe('#ff0000');
    expect(renderer.getEmergencyLightColor('FIRE_BRIGADE', 500)).toBe('#ffd60a');
    expect(renderer.getEmergencyLightColor('FIRE_BRIGADE', 1000)).toBe('#ff0000');
  });

  it('renders emergency body color, trim, flashing lights, and readable 40px label', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context, getSimulationTimeMs: () => 500 });

    renderer.renderFrame([emergencyVehicle('amb-1', 'AMBULANCE')], signals(), []);

    const fillStyles = context.calls.filter((call) => call.name === 'fillStyle').map((call) => call.args[0]);
    const strokeStyles = context.calls.filter((call) => call.name === 'strokeStyle').map((call) => call.args[0]);
    const fonts = context.calls.filter((call) => call.name === 'font').map((call) => call.args[0]);
    const text = context.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0]);

    expect(fillStyles).toContain('#ffffff');
    expect(fillStyles).toContain('#0066ff');
    expect(strokeStyles).toContain('#d00000');
    expect(fonts).toContain('40px Arial');
    expect(text).toContain('AMBULANCE');
  });

  it('renders all emergency type labels distinctly side by side', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });

    renderer.renderFrame([
      emergencyVehicle('amb', 'AMBULANCE'),
      { ...emergencyVehicle('police', 'POLICE'), position: { x: 10, y: 0 } },
      { ...emergencyVehicle('fire', 'FIRE_BRIGADE'), position: { x: 20, y: 0 } }
    ], signals(), []);

    const text = context.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0]);
    expect(text).toEqual(expect.arrayContaining(['AMBULANCE', 'POLICE', 'FIRE']));
  });

  it('regular vehicles render without emergency labels', () => {
    const context = createMockContext();
    const renderer = new RenderingEngine({ context });
    const regularVehicle: VehicleState = { ...emergencyVehicle('regular', 'AMBULANCE'), isEmergency: false, emergencyType: undefined };

    renderer.renderFrame([regularVehicle], signals(), []);

    const text = context.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0]);
    expect(text).not.toContain('AMBULANCE');
    expect(context.calls.filter((call) => call.name === 'fillStyle').map((call) => call.args[0])).toContain('#4dabf7');
  });
});
