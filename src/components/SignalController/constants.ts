// Fixed timing constants for Signal Controller state machines (TASK-017/018).
// Amber duration is fixed per specs/requirements/002-REQ-005-signal-coordination.md
// ("Amber duration: 3 seconds (fixed)") — not a SimulationConfig field. "Configurable" in
// TASK-017's acceptance criterion is satisfied by centralizing it here as a single named
// constant rather than a scattered magic number, not by exposing it as a runtime config field.
export const AMBER_DURATION_MS = 3_000;

// All-red safety clearance interval between one direction's/pair's AMBER ending and the next
// direction's/pair's GREEN starting. Not explicitly numbered in REQ-005 (only named as a state
// in the "Operating States & Transitions" diagrams); 1 second is a documented, conservative
// assumption pending a future explicit requirement.
export const ALL_RED_DURATION_MS = 1_000;
