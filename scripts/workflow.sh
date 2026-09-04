#!/bin/bash
# Spec-Driven Development Workflow Orchestrator
# Manages the 9-step workflow: spec → review → architecture → tasks → implement → test → debug → impact → release

set -euo pipefail

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/.workflow-logs"
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Step counter
CURRENT_STEP=${1:-1}

case $CURRENT_STEP in
  1)
    log_step "STEP 1: Create Specification"
    log_warning "Run /speckit-specify in your coding agent"
    log_warning "Output: specs/SPECIFICATION.md"
    ;;
  2)
    log_step "STEP 2: Review Specification"
    log_warning "Run /speckit-review-spec in your coding agent"
    log_warning "Resolve all blocking findings before proceeding"
    ;;
  3)
    log_step "STEP 3: Obtain Specification Approval"
    log_warning "✓ Get stakeholder sign-off on specs/SPECIFICATION.md"
    read -p "Press Enter when approval is obtained..."
    ;;
  4)
    log_step "STEP 4: Create Architecture"
    log_warning "Run /speckit-architecture in your coding agent"
    log_warning "Output: docs/ARCHITECTURE.md, docs/INTERFACES.md, docs/ADRs/"
    ;;
  5)
    log_step "STEP 5: Create Implementation Tasks"
    log_warning "Run /speckit-tasks in your coding agent"
    log_warning "Output: TASKS.md with traceable work items"
    ;;
  6)
    log_step "STEP 6: Implement Task (one at a time)"
    if [ -z "${TASK_ID:-}" ]; then
      read -p "Enter TASK ID (e.g., TASK-001): " TASK_ID
    fi
    log_warning "Run /speckit-implement [TASK-$TASK_ID] in your coding agent"
    log_warning "Output: Implementation with verification"
    ;;
  7)
    log_step "STEP 7: Generate & Execute Tests"
    if [ -z "${TASK_ID:-}" ]; then
      read -p "Enter TASK ID (e.g., TASK-001): " TASK_ID
    fi
    log_warning "Run /speckit-generate-tests [TASK-$TASK_ID] in your coding agent"
    log_warning "Execute: make test (or your test runner)"
    ;;
  8)
    log_step "STEP 8: Investigate Defects or Change Impact"
    log_warning "Run /speckit-investigate-defect or /speckit-change-impact as needed"
    ;;
  9)
    log_step "STEP 9: Review Release Evidence"
    log_warning "Run /speckit-review-release in your coding agent"
    log_warning "Output: RELEASE_EVIDENCE.md"
    ;;
  *)
    log_error "Invalid step: $CURRENT_STEP"
    echo "Usage: $0 [1-9]"
    exit 1
    ;;
esac

log_success "Next step instructions displayed"
