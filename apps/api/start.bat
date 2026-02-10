@echo off
REM Batch file to handle paths with spaces on Windows
cd /d "%~dp0\..\.."
node apps\api\start.js
