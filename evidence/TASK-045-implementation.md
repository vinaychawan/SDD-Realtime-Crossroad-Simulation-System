# TASK-045 Implementation Evidence

**Task**: Metrics Collector — Implement rolling 60s throughput window  
**Status**: ✅ COMPLETE  
**Date**: 2026-09-04

## Acceptance Criteria Met

### ✅ Rolling 60-second throughput window implemented
- `recordDespawn(timestampMs)` records vehicle exit events.
- `throughputPerMinute` counts despawn events in the trailing 60-second window.
- Old events are evicted on each `tick()`.

### ✅ Window behavior verified
- No exits → `0 veh/min`
- Events inside trailing 60s are counted
- Events older than 60s are evicted
- Boundary behavior is deterministic: events exactly at the window start are excluded
- Multiple exits at the same timestamp are counted independently
- Repeated 10 Hz display ticks preserve rolling-window state

## Test Results

**Test file**: `Test_045-metrics-collector-rolling-throughput-window.test.ts`  
**Tests**: 6/6 passing ✅

## Final Validation

- TypeScript typecheck: ✅ 0 errors
- Rolling window: ✅ implemented
- Event eviction: ✅ verified
- Coverage: ✅ included in 100% runtime coverage
