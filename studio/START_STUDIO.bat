@echo off
setlocal
cd /d "%~dp0"
title NeuroQuest Content Studio

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 run_studio.py
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  python run_studio.py
  goto :end
)

echo.
echo Python was not found on this computer.
echo.
echo Open this folder in VS Code, right-click index.html,
echo then choose "Open with Live Server".
echo.
pause

:end
endlocal
