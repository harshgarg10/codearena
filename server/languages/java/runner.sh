#!/bin/bash
# Updated runner: capture errors without letting `set -e` kill the script early.
set -u

if [ ! -f "Main.java" ]; then
  echo "COMPILATION_ERROR: Source file not found"
  exit 1
fi

if [ ! -f "input.txt" ]; then
  touch input.txt
fi

# Compilation (temporarily disable errexit)
set +e
javac Main.java 2> compile_error.txt
COMPILE_EXIT=$?
set -e

if [ $COMPILE_EXIT -ne 0 ]; then
  echo "COMPILATION_ERROR"
  cat compile_error.txt
  exit 1
fi

# Execution (capture exit code)
set +e
timeout 5s java $JAVA_OPTS Main < input.txt 1> program_stdout.txt 2> program_stderr.txt
EXIT_CODE=$?
set -e

# If program wrote stdout, print it; otherwise print stderr for diagnostics
if [ -s program_stdout.txt ]; then
  cat program_stdout.txt
elif [ -s program_stderr.txt ]; then
  cat program_stderr.txt
fi

if [ $EXIT_CODE -eq 124 ]; then
  echo "TIMEOUT_ERROR: Execution timed out" >&2
  exit 124
elif [ $EXIT_CODE -ne 0 ]; then
  echo "RUNTIME_ERROR: Java process exited with code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

exit 0
