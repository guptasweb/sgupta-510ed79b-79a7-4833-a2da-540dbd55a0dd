@echo off
REM Batch file to handle paths with spaces on Windows
cd /d "%~dp0\..\.."
npx --yes ts-node --project apps/api/tsconfig.app.json apps/api/src/main.ts
