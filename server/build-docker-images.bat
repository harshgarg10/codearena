@echo off
echo Building Docker images for local development...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Build C++ image
echo 📦 Building C++ image...
cd languages\cpp
docker build -t codearena-cpp . --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build C++ image
    cd ..\..
    pause
    exit /b 1
)
echo ✅ C++ image built successfully
cd ..\..

REM Build Python image
echo.
echo 📦 Building Python image...
cd languages\python
docker build -t codearena-python . --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build Python image
    cd ..\..
    pause
    exit /b 1
)
echo ✅ Python image built successfully
cd ..\..

REM Build Java image
echo.
echo 📦 Building Java image...
cd languages\java
docker build -t codearena-java . --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build Java image
    cd ..\..
    pause
    exit /b 1
)
echo ✅ Java image built successfully
cd ..\..

echo.
echo 🎉 All Docker images built successfully!
echo.
echo 📋 Built images:
docker images | findstr codearena

echo.
echo 🧪 Test Docker execution with:
echo    npm run test-docker
echo.
pause