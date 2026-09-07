// Canvas 2D Rendering Engine (TASK-048-052).
// Draws read-only snapshots of the simulation state with display-only interpolation.
import type { Direction, EmergencyVehicleType, SignalDirectionState, VehicleId, VehicleState, Vector2 } from '../../domain/types';
import type { IRenderer } from './rendering-engine.interface';

export type SignalModeForRendering = 'STRICT_MUTUAL_EXCLUSION' | 'OPPOSING_SIMULTANEOUS';

export interface RenderingEngineOptions {
  readonly canvas?: HTMLCanvasElement;
  readonly context?: CanvasRenderingContext2D;
  readonly widthPx?: number;
  readonly heightPx?: number;
  readonly pixelsPerMeter?: number;
  readonly conflictZoneSizeMeters?: number;
  readonly signalMode?: SignalModeForRendering;
  readonly getSimulationTimeMs?: () => number;
}

export interface EmergencyVehicleStyle {
  readonly bodyColor: string;
  readonly trimColor: string;
  readonly labelColor: string;
  readonly label: string;
  readonly lightColors: readonly [string, string];
}

const SIGNAL_COLORS: Record<SignalDirectionState['state'], string> = {
  RED: '#dc3545',
  GREEN: '#28a745',
  AMBER: '#ffc107'
};

const EMERGENCY_STYLES: Record<EmergencyVehicleType, EmergencyVehicleStyle> = {
  AMBULANCE: {
    bodyColor: '#ffffff',
    trimColor: '#d00000',
    labelColor: '#d00000',
    label: 'AMBULANCE',
    lightColors: ['#ff0000', '#0066ff']
  },
  POLICE: {
    bodyColor: '#0057b8',
    trimColor: '#ffffff',
    labelColor: '#ffffff',
    label: 'POLICE',
    lightColors: ['#ff0000', '#0066ff']
  },
  FIRE_BRIGADE: {
    bodyColor: '#c1121f',
    trimColor: '#ffd60a',
    labelColor: '#ffd60a',
    label: 'FIRE',
    lightColors: ['#ff0000', '#ffd60a']
  }
};

const DIRECTIONS: readonly Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

/** Canvas 2D renderer implementing docs/INTERFACES.md §10. */
export class RenderingEngine implements IRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly widthPx: number;
  private readonly heightPx: number;
  private readonly pixelsPerMeter: number;
  private readonly getSimulationTimeMs: () => number;

  private conflictZoneSizeMeters: number;
  private signalMode: SignalModeForRendering;
  private previousVehicles: VehicleState[] = [];
  private currentVehicles: VehicleState[] = [];
  private interpolationFraction = 0;

  constructor(options: RenderingEngineOptions = {}) {
    const context = options.context ?? options.canvas?.getContext('2d');
    if (!context) {
      throw new Error('RenderingEngine requires a CanvasRenderingContext2D or a canvas with a 2D context');
    }

    this.context = context;
    this.widthPx = options.widthPx ?? options.canvas?.width ?? 1000;
    this.heightPx = options.heightPx ?? options.canvas?.height ?? 800;
    this.pixelsPerMeter = options.pixelsPerMeter ?? 4;
    this.conflictZoneSizeMeters = options.conflictZoneSizeMeters ?? 25;
    this.signalMode = options.signalMode ?? 'STRICT_MUTUAL_EXCLUSION';
    this.getSimulationTimeMs = options.getSimulationTimeMs ?? (() => 0);
  }

  /** TASK-049: Store physics snapshots and accumulator fraction for display-only interpolation. */
  setInterpolationSnapshots(previousVehicles: VehicleState[], currentVehicles: VehicleState[], interpolationFraction: number): void {
    this.previousVehicles = previousVehicles.map((vehicle) => this.cloneVehicle(vehicle));
    this.currentVehicles = currentVehicles.map((vehicle) => this.cloneVehicle(vehicle));
    this.interpolationFraction = Math.min(1, Math.max(0, interpolationFraction));
  }

  setSignalMode(signalMode: SignalModeForRendering): void {
    this.signalMode = signalMode;
  }

  setConflictZoneSizeMeters(sizeMeters: number): void {
    this.conflictZoneSizeMeters = sizeMeters;
  }

  /** TASK-048: Draws a full read-only frame. */
  renderFrame(vehicles: VehicleState[], signals: Record<Direction, SignalDirectionState>, conflictZoneOccupants: VehicleId[]): void {
    const vehiclesToRender = this.getVehiclesForRendering(vehicles);
    this.clearCanvas();
    this.drawIntersectionBase();
    this.drawConflictZoneIfNeeded();
    this.drawSignals(signals);
    for (const vehicle of vehiclesToRender) {
      this.drawVehicle(vehicle, conflictZoneOccupants.includes(vehicle.id));
    }
  }

  /** TASK-049: Pure interpolation helper used by renderFrame and tests. */
  interpolateVehicle(previous: VehicleState, current: VehicleState, fraction: number): VehicleState {
    const clampedFraction = Math.min(1, Math.max(0, fraction));
    return {
      ...current,
      position: {
        x: previous.position.x + (current.position.x - previous.position.x) * clampedFraction,
        y: previous.position.y + (current.position.y - previous.position.y) * clampedFraction
      },
      speedKmh: previous.speedKmh + (current.speedKmh - previous.speedKmh) * clampedFraction,
      speedMs: previous.speedMs + (current.speedMs - previous.speedMs) * clampedFraction
    };
  }

  /** TASK-050: Signal state to Canvas color mapping. */
  getSignalColor(state: SignalDirectionState['state']): string {
    return SIGNAL_COLORS[state];
  }

  /** TASK-051: Emergency marker style mapping. */
  getEmergencyVehicleStyle(emergencyType: EmergencyVehicleType): EmergencyVehicleStyle {
    return EMERGENCY_STYLES[emergencyType];
  }

  /** TASK-051: 1.0 Hz alternating lights: 500ms per half-cycle. */
  getEmergencyLightColor(emergencyType: EmergencyVehicleType, simulationTimeMs: number): string {
    const style = this.getEmergencyVehicleStyle(emergencyType);
    const phase = Math.floor(simulationTimeMs / 500) % 2;
    return style.lightColors[phase];
  }

  worldToCanvas(position: Vector2): Vector2 {
    return {
      x: this.widthPx / 2 + position.x * this.pixelsPerMeter,
      y: this.heightPx / 2 - position.y * this.pixelsPerMeter
    };
  }

  private getVehiclesForRendering(vehicles: VehicleState[]): VehicleState[] {
    if (this.previousVehicles.length === 0 || this.currentVehicles.length === 0) {
      return vehicles.map((vehicle) => this.cloneVehicle(vehicle));
    }

    const previousById = new Map(this.previousVehicles.map((vehicle) => [vehicle.id, vehicle]));
    return this.currentVehicles.map((currentVehicle) => {
      const previousVehicle = previousById.get(currentVehicle.id);
      return previousVehicle ? this.interpolateVehicle(previousVehicle, currentVehicle, this.interpolationFraction) : this.cloneVehicle(currentVehicle);
    });
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.widthPx, this.heightPx);
  }

  private drawIntersectionBase(): void {
    const ctx = this.context;
    ctx.save();
    ctx.fillStyle = '#2f3437';
    ctx.fillRect(0, this.heightPx / 2 - 60, this.widthPx, 120);
    ctx.fillRect(this.widthPx / 2 - 60, 0, 120, this.heightPx);
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 2;

    for (const offset of [-20, 20]) {
      ctx.beginPath();
      ctx.moveTo(0, this.heightPx / 2 + offset);
      ctx.lineTo(this.widthPx, this.heightPx / 2 + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.widthPx / 2 + offset, 0);
      ctx.lineTo(this.widthPx / 2 + offset, this.heightPx);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawConflictZoneIfNeeded(): void {
    if (this.signalMode !== 'OPPOSING_SIMULTANEOUS') {
      return;
    }

    const ctx = this.context;
    const sizePx = this.conflictZoneSizeMeters * this.pixelsPerMeter;
    ctx.save();
    ctx.strokeStyle = '#ff8800';
    ctx.fillStyle = 'rgba(255, 136, 0, 0.12)';
    ctx.lineWidth = 3;
    ctx.fillRect(this.widthPx / 2 - sizePx / 2, this.heightPx / 2 - sizePx / 2, sizePx, sizePx);
    ctx.strokeRect(this.widthPx / 2 - sizePx / 2, this.heightPx / 2 - sizePx / 2, sizePx, sizePx);
    ctx.restore();
  }

  private drawSignals(signals: Record<Direction, SignalDirectionState>): void {
    for (const direction of DIRECTIONS) {
      this.drawSignal(direction, signals[direction]);
    }
  }

  private drawSignal(direction: Direction, signal: SignalDirectionState): void {
    const ctx = this.context;
    const position = this.signalCanvasPosition(direction);
    ctx.save();
    ctx.fillStyle = this.getSignalColor(signal.state);
    ctx.beginPath();
    ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(direction, position.x, position.y - 18);
    ctx.fillText(`${signal.secondsRemaining}s`, position.x, position.y + 32);
    ctx.restore();
  }

  private drawVehicle(vehicle: VehicleState, inConflictZone: boolean): void {
    const ctx = this.context;
    const position = this.worldToCanvas(vehicle.position);
    const isHorizontal = vehicle.direction === 'EAST' || vehicle.direction === 'WEST';
    const width = (isHorizontal ? 4.5 : 2) * this.pixelsPerMeter;
    const height = (isHorizontal ? 2 : 4.5) * this.pixelsPerMeter;

    ctx.save();
    ctx.fillStyle = vehicle.isEmergency && vehicle.emergencyType ? this.getEmergencyVehicleStyle(vehicle.emergencyType).bodyColor : '#4dabf7';
    ctx.strokeStyle = inConflictZone ? '#ff8800' : '#111111';
    ctx.lineWidth = inConflictZone ? 4 : 1;
    ctx.fillRect(position.x - width / 2, position.y - height / 2, width, height);
    ctx.strokeRect(position.x - width / 2, position.y - height / 2, width, height);

    if (vehicle.isEmergency && vehicle.emergencyType) {
      this.drawEmergencyMarkers(vehicle, position, width, height);
    }

    ctx.restore();
  }

  private drawEmergencyMarkers(vehicle: VehicleState, position: Vector2, width: number, height: number): void {
    const ctx = this.context;
    const emergencyType = vehicle.emergencyType!;
    const style = this.getEmergencyVehicleStyle(emergencyType);
    const lightColor = this.getEmergencyLightColor(emergencyType, this.getSimulationTimeMs());

    ctx.strokeStyle = style.trimColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(position.x - width / 2, position.y - height / 2, width, height);

    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(position.x - width / 4, position.y - height / 2 - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(position.x + width / 4, position.y - height / 2 - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = style.labelColor;
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(style.label, position.x, position.y - height / 2 - 14);
  }

  private signalCanvasPosition(direction: Direction): Vector2 {
    switch (direction) {
      case 'NORTH':
        return { x: this.widthPx / 2 - 90, y: this.heightPx / 2 - 90 };
      case 'SOUTH':
        return { x: this.widthPx / 2 + 90, y: this.heightPx / 2 + 90 };
      case 'EAST':
        return { x: this.widthPx / 2 - 90, y: this.heightPx / 2 + 90 };
      case 'WEST':
        return { x: this.widthPx / 2 + 90, y: this.heightPx / 2 - 90 };
    }
  }

  private cloneVehicle(vehicle: VehicleState): VehicleState {
    return {
      ...vehicle,
      position: { ...vehicle.position }
    };
  }
}
