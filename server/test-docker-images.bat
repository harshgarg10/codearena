@echo off
echo Testing Docker image availability...
echo.

echo Testing ubuntu:22.04...
docker pull ubuntu:22.04
if %errorlevel% neq 0 (
    echo ❌ ubuntu:22.04 not available
    exit /b 1
)
echo ✅ ubuntu:22.04 available

echo.
echo Testing python:3.11-alpine...
docker pull python:3.11-alpine
if %errorlevel% neq 0 (
    echo ❌ python:3.11-alpine not available
    exit /b 1
)
echo ✅ python:3.11-alpine available

echo.
echo Testing openjdk:17-alpine...
docker pull openjdk:17-alpine
if %errorlevel% neq 0 (
    echo ❌ openjdk:17-alpine not available
    exit /b 1
)
echo ✅ openjdk:17-alpine available

echo.
echo 🎉 All base images are available!