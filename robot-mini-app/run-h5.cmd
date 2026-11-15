@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "UNI_INPUT_DIR=%CD%"
echo Starting robot-mini-app H5 on http://localhost:5174 ...
node "node_modules\@dcloudio\vite-plugin-uni\bin\uni.js"
pause
