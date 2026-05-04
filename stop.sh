#!/bin/bash
echo "Stopping IVR Evolution Demo..."

# Find the process ID listening on port 8081
PID=$(lsof -ti:8081)

if [ -n "$PID" ]; then
    echo "Killing process $PID on port 8081..."
    kill -9 $PID
    echo "Service stopped."
else
    echo "Service is not running."
fi
