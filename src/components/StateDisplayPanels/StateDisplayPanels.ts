import { ALL_DIRECTIONS } from '../../domain/constants';
import type { Direction, SignalDirectionState, SignalState } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { MetricsSnapshot } from '../MetricsCollector/metrics-collector.interface';
import type {
  IStateDisplayPanels,
  PerformanceWarningThresholds,
  StateDisplayPanelsOptions
} from './state-display-panels.interface';

const DEFAULT_WARNING_THRESHOLDS: PerformanceWarningThresholds = {
  memoryMb: 80,
  cpuPercent: 80
};

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatNumber(value: number, digits = 1): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function signalClass(state: SignalState): string {
  return `state-display-signal--${state.toLowerCase()}`;
}

export class StateDisplayPanels implements IStateDisplayPanels {
  private readonly root: HTMLElement;
  private readonly warningThresholds: PerformanceWarningThresholds;

  constructor(root: HTMLElement | string, options: StateDisplayPanelsOptions = {}) {
    const resolvedRoot = typeof root === 'string' ? document.getElementById(root) : root;
    if (!resolvedRoot) {
      throw new Error(`StateDisplayPanels root element not found: ${String(root)}`);
    }

    this.root = resolvedRoot;
    this.warningThresholds = { ...DEFAULT_WARNING_THRESHOLDS, ...options.warningThresholds };
    this.renderScaffold();
  }

  updateConfiguration(config: Readonly<SimulationConfig>): void {
    this.setText('config-scenario', labelize(config.scenarioPreset));
    this.setText('config-frame-rate', `${config.targetFrameRate} FPS`);
    this.setText('config-signal-mode', labelize(config.signalCoordinationMode));
    this.setText('config-lane-strategy', labelize(config.laneSelectionStrategy));
  }

  updateTrafficMetrics(snapshot: Readonly<MetricsSnapshot>): void {
    this.setText('traffic-regular-count', String(snapshot.vehicleCountRegular));
    this.setText('traffic-emergency-count', String(snapshot.vehicleCountEmergency));
    this.setText('traffic-average-speed', `${formatNumber(snapshot.averageSpeedKmh)} km/h`);
    this.setText('traffic-throughput', `${formatNumber(snapshot.throughputPerMinute)} veh/min`);
    this.markMetricRefresh();
  }

  updateSignalStatus(states: Record<Direction, SignalDirectionState>): void {
    for (const direction of ALL_DIRECTIONS) {
      const signal = states[direction];
      const row = this.requiredElement(`[data-state-signal-row="${direction}"]`);
      const indicator = this.requiredElement(`[data-state-signal-indicator="${direction}"]`);
      row.classList.remove('state-display-signal--red', 'state-display-signal--green', 'state-display-signal--amber');
      row.classList.add(signalClass(signal.state));
      indicator.setAttribute('aria-label', `${direction} ${signal.state}`);
      this.setText(`signal-${direction}-state`, labelize(signal.state));
      this.setText(`signal-${direction}-time`, `${Math.round(signal.secondsRemaining)} sec`);
    }
  }

  updateCollisionStatistics(snapshot: Readonly<MetricsSnapshot>): void {
    this.setText('collision-total', String(snapshot.totalCollisions));
    this.setText('collision-active', String(snapshot.activeCollisions));
    this.setText('collision-free-ratio', `${formatNumber(snapshot.collisionFreeRatioPercent)}%`);
    this.setText('collision-deadlocks', String(snapshot.deadlockCount));
  }

  updatePerformanceMetrics(snapshot: Readonly<MetricsSnapshot>): void {
    this.setText('performance-render-fps', `${formatNumber(snapshot.renderFps)} FPS`);
    this.setText('performance-physics-hz', `${formatNumber(snapshot.physicsHz)} Hz`);
    this.setText('performance-memory-mb', `${formatNumber(snapshot.memoryMb, 0)} MB`);
    this.setText('performance-cpu-percent', `${formatNumber(snapshot.cpuPercent)}%`);
    this.setWarning('performance-memory-mb', snapshot.memoryMb > this.warningThresholds.memoryMb);
    this.setWarning('performance-cpu-percent', snapshot.cpuPercent > this.warningThresholds.cpuPercent);
  }

  refreshMetrics(snapshot: Readonly<MetricsSnapshot>): void {
    this.updateTrafficMetrics(snapshot);
    this.updateCollisionStatistics(snapshot);
    this.updatePerformanceMetrics(snapshot);
  }

  private renderScaffold(): void {
    this.root.innerHTML = `
      <section class="state-display-panels" aria-label="Simulation state display">
        ${this.panelMarkup('configuration', 'Configuration', [
          ['config-scenario', 'Scenario'],
          ['config-frame-rate', 'Frame Rate'],
          ['config-signal-mode', 'Signal Mode'],
          ['config-lane-strategy', 'Lane Strategy']
        ])}
        ${this.panelMarkup('traffic', 'Traffic Metrics', [
          ['traffic-regular-count', 'Regular Vehicles'],
          ['traffic-emergency-count', 'Emergency Vehicles'],
          ['traffic-average-speed', 'Avg Speed'],
          ['traffic-throughput', 'Throughput']
        ])}
        <section class="state-display-card" data-state-panel="signal-status">
          <h2>Signal Status</h2>
          <dl class="state-display-list">
            ${ALL_DIRECTIONS.map(direction => `
              <div class="state-display-row" data-state-signal-row="${direction}">
                <dt><span class="state-display-signal-dot" data-state-signal-indicator="${direction}" aria-label="${direction} RED">●</span>${direction}</dt>
                <dd><span data-state-value="signal-${direction}-state">RED</span> · <span data-state-value="signal-${direction}-time">0 sec</span></dd>
              </div>
            `).join('')}
          </dl>
        </section>
        ${this.panelMarkup('collision-statistics', 'Collision Stats', [
          ['collision-total', 'Total Collisions'],
          ['collision-active', 'Active Collisions'],
          ['collision-free-ratio', 'Collision-Free'],
          ['collision-deadlocks', 'Deadlocks']
        ])}
        ${this.panelMarkup('performance', 'Performance Metrics', [
          ['performance-render-fps', 'Render FPS'],
          ['performance-physics-hz', 'Physics'],
          ['performance-memory-mb', 'Memory'],
          ['performance-cpu-percent', 'CPU']
        ])}
      </section>
    `;
    this.injectStyles();
  }

  private panelMarkup(panel: string, title: string, rows: Array<readonly [string, string]>): string {
    return `
      <section class="state-display-card" data-state-panel="${panel}">
        <h2>${title}</h2>
        <dl class="state-display-list">
          ${rows.map(([key, label]) => `
            <div class="state-display-row">
              <dt>${label}</dt>
              <dd data-state-value="${key}">N/A</dd>
            </div>
          `).join('')}
        </dl>
      </section>
    `;
  }

  private setText(key: string, value: string): void {
    this.requiredElement(`[data-state-value="${key}"]`).textContent = value;
  }

  private setWarning(key: string, active: boolean): void {
    this.requiredElement(`[data-state-value="${key}"]`).classList.toggle('state-display-warning', active);
  }

  private markMetricRefresh(): void {
    this.root.dataset.metricsLastRefreshed = String(Date.now());
  }

  private requiredElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Missing StateDisplayPanels element: ${selector}`);
    }
    return element;
  }

  private injectStyles(): void {
    if (document.getElementById('state-display-panels-styles')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'state-display-panels-styles';
    style.textContent = `
      .state-display-panels { display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 18px; }
      .state-display-card { background: #020617; border: 1px solid #1e3a8a; border-radius: 14px; padding: 16px; box-shadow: 0 14px 35px rgb(0 0 0 / 0.18); }
      .state-display-card h2 { margin: 0 0 10px; color: #dbeafe; font-size: 1rem; }
      .state-display-list { display: grid; gap: 8px; margin: 0; }
      .state-display-row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgb(148 163 184 / 0.15); padding-bottom: 7px; }
      .state-display-row dt { color: #94a3b8; }
      .state-display-row dd { margin: 0; color: #f8fafc; font-variant-numeric: tabular-nums; text-align: right; }
      .state-display-signal-dot { margin-right: 6px; }
      .state-display-signal--red .state-display-signal-dot { color: #ef4444; }
      .state-display-signal--green .state-display-signal-dot { color: #22c55e; }
      .state-display-signal--amber .state-display-signal-dot { color: #f59e0b; }
      .state-display-warning { color: #f87171 !important; font-weight: 800; }
      @media (max-width: 900px) { .state-display-panels { grid-template-columns: 1fr; } }
    `;
    document.head.append(style);
  }
}
