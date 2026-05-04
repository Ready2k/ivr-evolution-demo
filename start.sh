#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  ┌─────────────────────────────────────┐"
echo "  │  IVR Evolution Demo                 │"
echo "  │  Open Chrome at: http://localhost:8081 │"
echo "  └─────────────────────────────────────┘"
echo ""
echo "  Speech recognition requires Chrome or Edge."
echo "  Press Ctrl+C to stop."
echo ""
open -a "Google Chrome" http://localhost:8081 2>/dev/null || \
open http://localhost:8081 2>/dev/null || true
python3 -m http.server 8081
