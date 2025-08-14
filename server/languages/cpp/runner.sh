#!/bin/bash

set -u

if [ ! -f "main.cpp" ]; then
  echo "COMPILATION_ERROR: Source file not found"
  exit 1
fi

if [ ! -f "input.txt" ]; then
  touch input.txt
fi

# Compilation: disable errexit so we can capture compiler output
set +e
g++ -O2 -std=c++17 main.cpp -o main 2> compile_error.txt
COMPILE_EXIT=$?
set -e

if [ $COMPILE_EXIT -ne 0 ]; then
  echo "COMPILATION_ERROR"
  cat compile_error.txt
  exit 1
fi

# Execution: capture stdout/stderr
set +e
timeout 3s ./main < input.txt 1> program_stdout.txt 2> program_stderr.txt
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
  echo "RUNTIME_ERROR: Process exited with code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

exit 0
