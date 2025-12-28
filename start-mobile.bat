@echo off
REM NounPaddi Mobile Access Script for Windows

echo ========================================
echo NounPaddi Mobile Access Setup
echo ========================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found
)

:found
REM Trim spaces
set LOCAL_IP=%LOCAL_IP: =%

if "%LOCAL_IP%"=="" (
    echo Could not detect local IP address
    echo Please check your network connection
    pause
    exit /b 1
)

echo Network detected!
echo Your local IP: %LOCAL_IP%
echo.
echo Access from phone: http://%LOCAL_IP%:3000
echo Backend API: http://%LOCAL_IP%:5001/api
echo.
echo ========================================
echo.

REM Create frontend .env.local
echo Updating frontend configuration...
echo REACT_APP_API_URL=http://%LOCAL_IP%:5001/api > frontend\.env.local
echo Configuration updated!
echo.

REM Start backend
echo Starting backend server...
cd backend
start "NounPaddi Backend" /min cmd /c "set HOST=0.0.0.0 && set PORT=5001 && npm start"
cd ..

REM Wait for backend
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

REM Start frontend
echo Starting frontend server...
cd frontend
start "NounPaddi Frontend" /min cmd /c "set HOST=0.0.0.0 && set PORT=3000 && npm start"
cd ..

REM Wait for frontend
echo Waiting for frontend to initialize...
timeout /t 8 /nobreak > nul

echo.
echo ========================================
echo.
echo All servers started successfully!
echo.
echo Mobile Access Instructions:
echo   1. Connect your phone to the same WiFi network
echo   2. Open browser on your phone
echo   3. Navigate to: http://%LOCAL_IP%:3000
echo.
echo Press any key to stop all servers...
pause > nul

REM Cleanup
taskkill /FI "WindowTitle eq NounPaddi Backend*" /F > nul 2>&1
taskkill /FI "WindowTitle eq NounPaddi Frontend*" /F > nul 2>&1

echo Servers stopped.
pause
