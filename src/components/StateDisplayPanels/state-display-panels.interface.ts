import type { SignalDirectionState } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { MetricsSnapshot } from '../MetricsCollector/metrics-collector.interface';

export interface PerformanceWarningThresholds {
  readonly memoryMb: number;
  readonly cpuPercent: number;
}

export interface IStateDisplayPanels {
  updateConfiguration(config: Readonly<SimulationConfig>): void;
  updateTrafficMetrics(snapshot: Readonly<MetricsSnapshot>): void;
  updateSignalStatus(states: Record<SignalDirectionState['direction'], SignalDirectionState>): void;
  updateCollisionStatistics(snapshot: Readonly<MetricsSnapshot>): void;
  updatePerformanceMetrics(snapshot: Readonly<MetricsSnapshot>): void;
  refreshMetrics(snapshot: Readonly<MetricsSnapshot>): void;
}

export interface StateDisplayPanelsOptions {
  readonly warningThresholds?: Partial<PerformanceWarningThresholds>;
}
