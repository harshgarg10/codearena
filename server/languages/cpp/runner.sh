#!/bin/bash

# Check if files exist
if [ ! -f "main.cpp" ]; then
  echo "VERDICT:Compilation Error"
  echo "main.cpp file not found"
  echo "EXIT_CODE:1"
  exit 1
fi

if [ ! -f "input.txt" ]; then
  echo "VERDICT:Runtime Error"
  echo "input.txt file not found"
  echo "EXIT_CODE:1"
  exit 1
fi

# Compile the C++ code
g++ -O2 -std=c++17 main.cpp -o main.out 2> compile_error.txt
if [ $? -ne 0 ]; then
  echo "VERDICT:Compilation Error"
  cat compile_error.txt
  echo "EXIT_CODE:1"
  exit 1
fi

# Run with timeout and time measurement
timeout 2s /usr/bin/time -f "TIME:%e" ./main.out < input.txt > output.txt 2> runtime_error.txt
EXIT_CODE=$?

# Handle different exit scenarios
if [ $EXIT_CODE -eq 124 ]; then
  echo "VERDICT:Time Limit Exceeded"
elif [ $EXIT_CODE -eq 0 ]; then
  echo "VERDICT:Success"
  cat output.txt
else
  echo "VERDICT:Runtime Error"
  cat runtime_error.txt
fi

echo "EXIT_CODE:$EXIT_CODE"