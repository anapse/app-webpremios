@echo off
title Monitor de Logs Niubiz - Backend
color 0A
echo =====================================
echo    MONITOR DE LOGS NIUBIZ - BACKEND
echo =====================================
echo.
echo Esperando logs de transacciones...
echo Presiona Ctrl+C para salir
echo.
echo =====================================
echo.

:monitor
set "logfile=logs\niubiz-%date:~-4%-%date:~3,2%-%date:~0,2%.log"
if exist "%logfile%" (
    echo [%time%] Mostrando contenido del log:
    echo -------------------------------------
    type "%logfile%"
    echo.
    echo =====================================
    echo Archivo de log: %logfile%
    echo =====================================
) else (
    echo [%time%] Esperando que se genere el archivo de log...
    echo Archivo esperado: %logfile%
)

timeout /t 5 /nobreak >nul
goto monitor