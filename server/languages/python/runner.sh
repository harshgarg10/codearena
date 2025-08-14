#!/bin/bash
set -u

if [ ! -f "main.py" ]; then
  echo "RUNTIME_ERROR: Source file not found"
  exit 1
fi

if [ ! -f "input.txt" ]; then
  touch input.txt
fi

set +e
timeout 2s python3 main.py < input.txt 1> program_stdout.txt 2> program_stderr.txt
EXIT_CODE=$?
set -e

if [ -s program_stdout.txt ]; then
  cat program_stdout.txt
elif [ -s program_stderr.txt ]; then
  cat program_stderr.txt
fi

if [ $EXIT_CODE -eq 124 ]; then
  echo "TIMEOUT_ERROR: Execution timed out" >&2
  exit 124
elif [ $EXIT_CODE -ne 0 ]; then
  echo "RUNTIME_ERROR: Python process exited with code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

exit 0
