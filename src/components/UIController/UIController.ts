// Browser DOM UI Controller implementation (TASK-053..059).
import { ALL_DIRECTIONS, ALL_EMERGENCY_TYPES } from '../../domain/constants';
import type { Direction, LaneSelectionStrategyKind, SignalCoordinationMode } from '../../domain/types';
import type {
  ConfigRunState,
  IConfigurationManager,
  ScenarioPreset,
  SimulationConfig
} from '../ConfigurationManager/configuration-manager.interface';
import type { ISimulationOrchestrator } from '../SimulationOrchestrator/simulation-orchestrator.interface';
import type { IUIController } from './ui-controller.interface';

const SCENARIO_PRESETS: readonly ScenarioPreset[] = [
  'NORMAL_TRAFFIC',
  'CONGESTION_TEST',
  'SPARSE_TRAFFIC',
  'PRIORITY_OPERATIONS',
  'CUSTOM'
];

const FRAME_RATES = [30, 60] as const;
const SIGNAL_MODES: readonly SignalCoordinationMode[] = ['STRICT_MUTUAL_EXCLUSION', 'OPPOSING_SIMULTANEOUS'];
const LANE_STRATEGIES: readonly LaneSelectionStrategyKind[] = ['RANDOM', 'INTELLIGENT'];
const SPEED_MULTIPLIERS = [1, 2, 4] as const;

type InputControl = HTMLInputElement | HTMLSelectElement | HTMLButtonElement;
type PerDirectionField = keyof SimulationConfig['perDirection'][Direction];

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function clonePerDirection(config: SimulationConfig): SimulationConfig['perDirection'] {
  const next = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    next[direction] = { ...config.perDirection[direction] };
  }
  return next;
}

function cloneEmergencyRates(config: SimulationConfig): SimulationConfig['emergency']['spawnRatePerMinute'] {
  return { ...config.emergency.spawnRatePerMinute };
}

export class UIController implements IUIController {
  private configManager: IConfigurationManager | undefined;
  private orchestrator: ISimulationOrchestrator | undefined;
  private runState: ConfigRunState = 'CONFIGURATION_ACTIVE';
  private readonly root: HTMLElement;
  private controls = new Map<string, InputControl>();

  constructor(root: HTMLElement | string = 'app') {
    const resolvedRoot = typeof root === 'string' ? document.getElementById(root) : root;
    if (!resolvedRoot) {
      throw new Error(`UIController root element not found: ${String(root)}`);
    }
    this.root = resolvedRoot;
    this.renderScaffold();
  }

  bind(configManager: IConfigurationManager, orchestrator: ISimulationOrchestrator): void {
    this.configManager = configManager;
    this.orchestrator = orchestrator;
    configManager.onChange(config => this.syncControls(config));
    this.syncControls(configManager.getSnapshot());
    this.bindEvents();
    this.setRunState(this.runState);
  }

  setRunState(state: ConfigRunState): void {
    this.runState = state;
    const startupLocked = state === 'RUNNING';

    for (const key of [
      ...SIGNAL_MODES.map(mode => `signal-${mode}`),
      ...LANE_STRATEGIES.map(strategy => `lane-${strategy}`)
    ]) {
      this.setDisabled(key, startupLocked);
    }

    this.root.querySelector('[data-ui-section="startup-only"]')?.classList.toggle('is-locked', startupLocked);
    this.setDisabled('play', state === 'RUNNING');
    this.setDisabled('pause', state !== 'RUNNING');
    this.setDisabled('reset', false);
    this.root.dataset.runState = state;
  }

  private renderScaffold(): void {
    this.root.innerHTML = `
      <section class="ui-controller" aria-label="Simulation controls">
        <header class="ui-controller__header">
          <h1>Realtime Crossroad Simulation</h1>
          <p>Configure scenarios, traffic flow, emergency vehicles, and playback.</p>
        </header>
        <div class="ui-controller__grid">
          <section class="ui-card" data-ui-section="scenario">
            <label for="ui-scenario-preset">Scenario Selection</label>
            <select id="ui-scenario-preset" data-ui-control="scenarioPreset">
              ${SCENARIO_PRESETS.map(preset => `<option value="${preset}">${labelize(preset)}</option>`).join('')}
            </select>
          </section>

          <section class="ui-card" data-ui-section="startup-only">
            <fieldset>
              <legend>Frame Rate</legend>
              ${FRAME_RATES.map(fps => this.radioMarkup('targetFrameRate', String(fps), `${fps} FPS`)).join('')}
            </fieldset>
            <fieldset>
              <legend>Signal Mode</legend>
              ${SIGNAL_MODES.map(mode => this.radioMarkup('signalCoordinationMode', mode, labelize(mode))).join('')}
            </fieldset>
            <fieldset>
              <legend>Lane Select</legend>
              ${LANE_STRATEGIES.map(strategy => this.radioMarkup('laneSelectionStrategy', strategy, labelize(strategy))).join('')}
            </fieldset>
            <p class="ui-lock-message" role="status">Signal mode and lane strategy are locked while running.</p>
          </section>

          <section class="ui-card ui-card--wide" data-ui-section="traffic">
            <h2>Traffic Controls</h2>
            <div class="ui-direction-grid">
              ${ALL_DIRECTIONS.map(direction => `
                <fieldset class="ui-direction" data-direction="${direction}">
                  <legend>${direction}</legend>
                  ${this.sliderMarkup(`traffic-${direction}-spawn`, `${direction}: Spawn Rate`, 0, 60, 'veh/min')}
                  ${this.sliderMarkup(`traffic-${direction}-green`, 'Green Duration', 10, 60, 'sec')}
                  ${this.sliderMarkup(`traffic-${direction}-red`, 'Red Duration', 10, 60, 'sec')}
                </fieldset>
              `).join('')}
            </div>
          </section>

          <section class="ui-card" data-ui-section="emergency">
            <label class="ui-checkbox">
              <input id="ui-emergency-enabled" type="checkbox" data-ui-control="emergency-enabled" />
              Enable emergency vehicles
            </label>
            <div data-ui-emergency-rates>
              <h2>Emergency Controls</h2>
              ${ALL_EMERGENCY_TYPES.map(type => this.sliderMarkup(`emergency-${type}`, labelize(type), 0, 20, 'veh/min')).join('')}
            </div>
          </section>

          <section class="ui-card" data-ui-section="playback">
            <h2>Simulation Controls</h2>
            <div class="ui-button-row">
              <button type="button" id="ui-play" data-ui-control="play">▶ Start</button>
              <button type="button" id="ui-pause" data-ui-control="pause">⏸ Pause</button>
              <button type="button" id="ui-reset" data-ui-control="reset">⏹ Reset</button>
            </div>
            <label for="ui-speed-multiplier">Speed</label>
            <select id="ui-speed-multiplier" data-ui-control="simulationSpeedMultiplier">
              ${SPEED_MULTIPLIERS.map(speed => `<option value="${speed}">${speed}x</option>`).join('')}
            </select>
          </section>
        </div>
      </section>
    `;
    this.injectStyles();
    this.cacheControls();
  }

  private radioMarkup(name: string, value: string, label: string): string {
    return `
      <label class="ui-radio">
        <input type="radio" name="${name}" value="${value}" data-ui-control="${name}" />
        ${label}
      </label>
    `;
  }

  private sliderMarkup(id: string, label: string, min: number, max: number, unit: string): string {
    return `
      <label class="ui-slider" for="ui-${id}">
        <span>${label}</span>
        <input id="ui-${id}" type="range" min="${min}" max="${max}" step="1" data-ui-control="${id}" />
        <output for="ui-${id}" data-ui-output="${id}">-- ${unit}</output>
      </label>
    `;
  }

  private cacheControls(): void {
    this.controls.clear();
    this.controls.set('scenarioPreset', this.requiredControl('scenarioPreset'));
    this.controls.set('emergency-enabled', this.requiredControl('emergency-enabled'));
    this.controls.set('simulationSpeedMultiplier', this.requiredControl('simulationSpeedMultiplier'));
    this.controls.set('play', this.requiredControl('play'));
    this.controls.set('pause', this.requiredControl('pause'));
    this.controls.set('reset', this.requiredControl('reset'));

    for (const fps of FRAME_RATES) {
      this.controls.set(`frame-${fps}`, this.requiredRadio('targetFrameRate', String(fps)));
    }
    for (const mode of SIGNAL_MODES) {
      this.controls.set(`signal-${mode}`, this.requiredRadio('signalCoordinationMode', mode));
    }
    for (const strategy of LANE_STRATEGIES) {
      this.controls.set(`lane-${strategy}`, this.requiredRadio('laneSelectionStrategy', strategy));
    }
    for (const direction of ALL_DIRECTIONS) {
      this.controls.set(`traffic-${direction}-spawn`, this.requiredControl(`traffic-${direction}-spawn`));
      this.controls.set(`traffic-${direction}-green`, this.requiredControl(`traffic-${direction}-green`));
      this.controls.set(`traffic-${direction}-red`, this.requiredControl(`traffic-${direction}-red`));
    }
    for (const type of ALL_EMERGENCY_TYPES) {
      this.controls.set(`emergency-${type}`, this.requiredControl(`emergency-${type}`));
    }
  }

  private bindEvents(): void {
    this.control('scenarioPreset').addEventListener('change', () => {
      this.configManager?.applyScenarioPreset(this.control('scenarioPreset').value as ScenarioPreset);
    });

    for (const fps of FRAME_RATES) {
      this.control(`frame-${fps}`).addEventListener('change', () => {
        if ((this.control(`frame-${fps}`) as HTMLInputElement).checked) {
          const frameRate = fps;
          this.configManager?.update({ targetFrameRate: frameRate });
          this.orchestrator?.setTargetFrameRate(frameRate);
        }
      });
    }

    for (const mode of SIGNAL_MODES) {
      this.control(`signal-${mode}`).addEventListener('change', () => {
        if ((this.control(`signal-${mode}`) as HTMLInputElement).checked) {
          this.configManager?.update({ signalCoordinationMode: mode });
        }
      });
    }

    for (const strategy of LANE_STRATEGIES) {
      this.control(`lane-${strategy}`).addEventListener('change', () => {
        if ((this.control(`lane-${strategy}`) as HTMLInputElement).checked) {
          this.configManager?.update({ laneSelectionStrategy: strategy });
        }
      });
    }

    for (const direction of ALL_DIRECTIONS) {
      this.bindTrafficSlider(direction, 'spawnRatePerMinute', `traffic-${direction}-spawn`);
      this.bindTrafficSlider(direction, 'greenDurationSec', `traffic-${direction}-green`);
      this.bindTrafficSlider(direction, 'redDurationSec', `traffic-${direction}-red`);
    }

    this.control('emergency-enabled').addEventListener('change', () => {
      this.configManager?.update({
        emergency: {
          ...this.configManager.getSnapshot().emergency,
          enabled: (this.control('emergency-enabled') as HTMLInputElement).checked
        }
      });
    });

    for (const type of ALL_EMERGENCY_TYPES) {
      this.control(`emergency-${type}`).addEventListener('input', () => {
        if (!this.configManager) return;
        const current = this.configManager.getSnapshot();
        const spawnRatePerMinute = cloneEmergencyRates(current);
        spawnRatePerMinute[type] = Number(this.control(`emergency-${type}`).value);
        this.configManager.update({ emergency: { ...current.emergency, spawnRatePerMinute } });
      });
    }

    this.control('simulationSpeedMultiplier').addEventListener('change', () => {
      this.configManager?.update({ simulationSpeedMultiplier: Number(this.control('simulationSpeedMultiplier').value) as 1 | 2 | 4 });
    });

    this.control('play').addEventListener('click', () => {
      this.orchestrator?.start();
      this.setRunState('RUNNING');
    });
    this.control('pause').addEventListener('click', () => {
      this.orchestrator?.pause();
      this.setRunState('PAUSED');
    });
    this.control('reset').addEventListener('click', () => {
      this.orchestrator?.reset();
      this.setRunState('CONFIGURATION_ACTIVE');
    });
  }

  private bindTrafficSlider(direction: Direction, field: PerDirectionField, controlKey: string): void {
    this.control(controlKey).addEventListener('input', () => {
      if (!this.configManager) return;
      const perDirection = clonePerDirection(this.configManager.getSnapshot());
      perDirection[direction] = { ...perDirection[direction], [field]: Number(this.control(controlKey).value) };
      this.configManager.update({ perDirection });
    });
  }

  private syncControls(config: Readonly<SimulationConfig>): void {
    this.control('scenarioPreset').value = config.scenarioPreset;
    (this.control(`frame-${config.targetFrameRate}`) as HTMLInputElement).checked = true;
    (this.control(`signal-${config.signalCoordinationMode}`) as HTMLInputElement).checked = true;
    (this.control(`lane-${config.laneSelectionStrategy}`) as HTMLInputElement).checked = true;
    this.control('simulationSpeedMultiplier').value = String(config.simulationSpeedMultiplier);

    for (const direction of ALL_DIRECTIONS) {
      const values = config.perDirection[direction];
      this.setSliderValue(`traffic-${direction}-spawn`, values.spawnRatePerMinute, 'veh/min');
      this.setSliderValue(`traffic-${direction}-green`, values.greenDurationSec, 'sec');
      this.setSliderValue(`traffic-${direction}-red`, values.redDurationSec, 'sec');
    }

    (this.control('emergency-enabled') as HTMLInputElement).checked = config.emergency.enabled;
    const emergencyRates = this.root.querySelector<HTMLElement>('[data-ui-emergency-rates]');
    if (emergencyRates) {
      emergencyRates.hidden = !config.emergency.enabled;
    }
    for (const type of ALL_EMERGENCY_TYPES) {
      this.setSliderValue(`emergency-${type}`, config.emergency.spawnRatePerMinute[type], 'veh/min');
    }
  }

  private setSliderValue(key: string, value: number, unit: string): void {
    this.control(key).value = String(value);
    const output = this.root.querySelector<HTMLOutputElement>(`[data-ui-output="${key}"]`);
    if (output) {
      output.value = `${value} ${unit}`;
      output.textContent = `${value} ${unit}`;
    }
  }

  private setDisabled(key: string, disabled: boolean): void {
    this.control(key).disabled = disabled;
  }

  private requiredControl(key: string): InputControl {
    const control = this.root.querySelector<InputControl>(`[data-ui-control="${key}"]`);
    if (!control) {
      throw new Error(`Missing UI control: ${key}`);
    }
    return control;
  }

  private requiredRadio(name: string, value: string): HTMLInputElement {
    const radio = this.root.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    if (!radio) {
      throw new Error(`Missing UI radio: ${name}=${value}`);
    }
    return radio;
  }

  private control(key: string): InputControl {
    const control = this.controls.get(key);
    if (!control) {
      throw new Error(`UI control not cached: ${key}`);
    }
    return control;
  }

  private injectStyles(): void {
    if (document.getElementById('ui-controller-styles')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'ui-controller-styles';
    style.textContent = `
      body { margin: 0; background: #0f172a; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; }
      .ui-controller { max-width: 1180px; margin: 0 auto; padding: 24px; }
      .ui-controller__header { margin-bottom: 20px; }
      .ui-controller__header h1 { margin: 0 0 6px; font-size: 2rem; }
      .ui-controller__header p { margin: 0; color: #94a3b8; }
      .ui-controller__grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ui-card { background: #111827; border: 1px solid #334155; border-radius: 14px; padding: 18px; box-shadow: 0 14px 35px rgb(0 0 0 / 0.22); }
      .ui-card--wide { grid-column: 1 / -1; }
      .ui-card h2, .ui-card legend { font-weight: 700; color: #f8fafc; }
      .ui-card label, .ui-card select, .ui-card button { font-size: 0.95rem; }
      .ui-card select, .ui-card button { border-radius: 10px; border: 1px solid #475569; padding: 9px 12px; background: #1e293b; color: #f8fafc; }
      .ui-card select { width: 100%; margin-top: 8px; }
      .ui-card fieldset { border: 0; margin: 0 0 14px; padding: 0; }
      .ui-radio, .ui-checkbox { display: inline-flex; align-items: center; gap: 8px; margin: 8px 14px 0 0; }
      .ui-direction-grid { display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .ui-direction { background: #0f172a; border-radius: 12px; padding: 12px; }
      .ui-slider { display: grid; gap: 5px; margin: 10px 0; }
      .ui-slider input { width: 100%; accent-color: #38bdf8; }
      .ui-slider output { color: #93c5fd; font-variant-numeric: tabular-nums; }
      .ui-button-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .ui-button-row button:not(:disabled) { cursor: pointer; }
      .ui-button-row button:disabled, input:disabled { opacity: 0.5; cursor: not-allowed; }
      .ui-lock-message { display: none; margin: 6px 0 0; color: #fbbf24; }
      .is-locked .ui-lock-message { display: block; }
      [hidden] { display: none !important; }
      @media (max-width: 900px) { .ui-controller__grid, .ui-direction-grid { grid-template-columns: 1fr; } }
    `;
    document.head.append(style);
  }
}
