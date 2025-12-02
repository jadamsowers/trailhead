#!/bin/bash

# Trailhead - Bootstrap Script (Modular Version)
# This script orchestrates the system initialization by calling individual setup scripts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOTSTRAP_DIR="$SCRIPT_DIR/scripts/bootstrap"

# Source utility functions
source "$BOOTSTRAP_DIR/lib_utils.sh"

print_header "=========================================="
print_header "Trailhead - Bootstrap"
print_header "=========================================="
echo ""



# Dynamically determine steps (support any number of digits)
STEPS=($(ls "$BOOTSTRAP_DIR"/[0-9]*_*.sh | sort -V))
TOTAL_STEPS=${#STEPS[@]}
STEP_NUM=1


# Run all steps except 09_display_summary.sh first
for STEP_SCRIPT in "${STEPS[@]}"; do
    STEP_BASENAME=$(basename "$STEP_SCRIPT")
    if [ "$STEP_BASENAME" = "09_display_summary.sh" ]; then
        continue
    fi
    STEP_NAME=$(echo "$STEP_BASENAME" | sed 's/^[0-9]*_//;s/\.sh$//;s/_/ /g')
    print_info "Step $STEP_NUM/$TOTAL_STEPS: $STEP_NAME..."
    bash "$STEP_SCRIPT"
    if [ $? -ne 0 ]; then
        print_error "Step failed: $STEP_NAME"
        exit 1
    fi
    echo ""
    STEP_NUM=$((STEP_NUM+1))
done

# Always run 09_display_summary.sh last if it exists
SUMMARY_SCRIPT="$BOOTSTRAP_DIR/09_display_summary.sh"
if [ -f "$SUMMARY_SCRIPT" ]; then
    STEP_NAME="display summary"
    print_info "Step $STEP_NUM/$TOTAL_STEPS: $STEP_NAME..."
    bash "$SUMMARY_SCRIPT"
    if [ $? -ne 0 ]; then
        print_error "Step failed: $STEP_NAME"
        exit 1
    fi
    echo ""
fi

print_success "Bootstrap complete!"
