@echo off
echo Creating express project "%1"
pause
express %1 && subl %1 && cd %1 && npm install

