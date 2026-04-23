@echo off
REM Setup and run Node App with DAO Service locally (Windows)

echo ==========================================
echo NodeApp + DAO Service Local Setup
echo ==========================================

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js is not installed. Please install Node.js first.
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist .env (
  echo.
  echo Creating .env file...
  copy .env.example .env
  echo [OK] .env file created. Update it with your database credentials if running against real DB.
)

REM Check if PM2 is installed globally
where pm2 >nul 2>nul
if errorlevel 1 (
  echo.
  echo Installing PM2 globally...
  call npm install -g pm2
)

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo To start the services, run:
echo.
echo   Option 1 - Start both services (recommended):
echo     npm run start:both
echo.
echo   Option 2 - Start services separately in different terminals:
echo     Terminal 1: npm run start:dao
echo     Terminal 2: npm start
echo.
echo   Option 3 - Start individually:
echo     npm start              # Start NodeApp
echo     node daoService.js     # Start DAO Service
echo.
echo Testing endpoints:
echo   Health Check:  curl http://localhost:3000/health
echo   Get Users:     curl http://localhost:3000/users
echo   Create User:   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"name\":\"John\"}"
echo   DAO Health:    curl http://localhost:3001/health
echo.
