// Application entry point. Wired up fully in TASK-067 (Integration).
// TEMPORARY DEMO: Signal Controller visualization (TASK-016-021)

import { SignalController } from './components/SignalController/SignalController';
import { ALL_DIRECTIONS } from './domain/constants';
import type { Direction } from './domain/types';

function createSignalDemo() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1>🚦 Signal Controller Demo (TASK-016-021)</h1>
      <p><strong>Status:</strong> <span id="status">Stopped</span> | <strong>Mode:</strong> <span id="mode">-</span> | <strong>Tick:</strong> <span id="tick">0</span></p>
      
      <div style="margin: 20px 0;">
        <button id="modeA" style="padding: 10px 20px; margin-right: 10px;">Mode A: Strict Mutual Exclusion</button>
        <button id="modeB" style="padding: 10px 20px; margin-right: 10px;">Mode B: Opposing Simultaneous</button>
        <button id="stop" style="padding: 10px 20px; background: #dc3545; color: white;">Stop</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 30px;">
        ${ALL_DIRECTIONS.map(dir => `
          <div id="${dir}" style="border: 3px solid #ddd; border-radius: 8px; padding: 20px; text-align: center;">
            <h2 style="margin: 0 0 10px 0;">${dir}</h2>
            <div class="signal" style="width: 100px; height: 100px; margin: 10px auto; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-size: 48px;">
              ⚫
            </div>
            <div class="countdown" style="font-size: 24px; font-weight: bold; margin-top: 10px;">--</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3>State Transitions Log (last 20):</h3>
        <div id="log" style="font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;"></div>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-left: 4px solid #007bff; border-radius: 4px;">
        <strong>Note:</strong> This is a temporary visualization demo for TASK-016-021. Full UI/rendering system will be implemented in TASK-044-056.
      </div>
    </div>
  `;

  let controller: SignalController | null = null;
  let intervalId: number | null = null;
  let tickCount = 0;
  const logLines: string[] = [];

  function updateDisplay() {
    if (!controller) return;
    
    const states = controller.getStates();
    
    for (const direction of ALL_DIRECTIONS) {
      const state = states[direction];
      const elem = document.getElementById(direction);
      if (!elem) continue;

      const signalDiv = elem.querySelector('.signal') as HTMLDivElement;
      const countdownDiv = elem.querySelector('.countdown') as HTMLDivElement;

      // Update signal color
      if (state.state === 'GREEN') {
        signalDiv.style.background = '#28a745';
        signalDiv.textContent = '🟢';
        elem.style.borderColor = '#28a745';
      } else if (state.state === 'AMBER') {
        signalDiv.style.background = '#ffc107';
        signalDiv.textContent = '🟡';
        elem.style.borderColor = '#ffc107';
      } else {
        signalDiv.style.background = '#dc3545';
        signalDiv.textContent = '🔴';
        elem.style.borderColor = '#dc3545';
      }

      // Update countdown
      countdownDiv.textContent = `${state.secondsRemaining}s`;
    }

    document.getElementById('tick')!.textContent = String(tickCount);
  }

  function logStateChange(states: Record<Direction, any>) {
    const timestamp = new Date().toLocaleTimeString();
    const greenDirs = ALL_DIRECTIONS.filter(d => states[d].state === 'GREEN');
    const amberDirs = ALL_DIRECTIONS.filter(d => states[d].state === 'AMBER');
    
    const line = `[${timestamp}] Tick ${tickCount}: GREEN=${greenDirs.join(',')||'none'} | AMBER=${amberDirs.join(',')||'none'}`;
    logLines.unshift(line);
    if (logLines.length > 20) logLines.pop();
    
    const logDiv = document.getElementById('log');
    if (logDiv) {
      logDiv.innerHTML = logLines.map(l => `<div>${l}</div>`).join('');
    }
  }

  function startSimulation(mode: 'STRICT_MUTUAL_EXCLUSION' | 'OPPOSING_SIMULTANEOUS') {
    if (intervalId) clearInterval(intervalId);
    
    controller = new SignalController();
    tickCount = 0;
    logLines.length = 0;

    // Initialize with 2-second green durations for visible transitions
    const perDirectionTiming = {} as any;
    for (const dir of ALL_DIRECTIONS) {
      perDirectionTiming[dir] = { spawnRatePerMinute: 20, greenDurationSec: 2, redDurationSec: 2 };
    }

    controller.initialize(mode, perDirectionTiming);
    controller.onStateChange(logStateChange);

    document.getElementById('status')!.textContent = 'Running';
    document.getElementById('mode')!.textContent = mode === 'STRICT_MUTUAL_EXCLUSION' ? 'Mode A' : 'Mode B';

    updateDisplay();
    logStateChange(controller.getStates());

    // Tick every 100ms (10x speed for demo visibility)
    intervalId = window.setInterval(() => {
      controller!.tick(10);
      tickCount++;
      updateDisplay();
    }, 100);
  }

  function stopSimulation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    controller = null;
    tickCount = 0;
    document.getElementById('status')!.textContent = 'Stopped';
    document.getElementById('mode')!.textContent = '-';
    document.getElementById('tick')!.textContent = '0';
  }

  document.getElementById('modeA')!.addEventListener('click', () => {
    startSimulation('STRICT_MUTUAL_EXCLUSION');
  });

  document.getElementById('modeB')!.addEventListener('click', () => {
    startSimulation('OPPOSING_SIMULTANEOUS');
  });

  document.getElementById('stop')!.addEventListener('click', stopSimulation);
}

createSignalDemo();
