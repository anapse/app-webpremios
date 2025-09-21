echo "======================================"
echo "MONITOR DE RESPUESTAS JSON - NIUBIZ"
echo "======================================"
echo.
echo "Realizando seguimiento del archivo de log..."
echo "Presiona Ctrl+C para salir"
echo.

:loop
set "logfile=logs\niubiz-%date:~-4%-%date:~3,2%-%date:~0,2%.log"

if exist "%logfile%" (
    echo [%time%] === CONTENIDO ACTUAL DEL LOG ===
    type "%logfile%"
    echo.
    echo === FIN DEL LOG ===
    echo.
) else (
    echo [%time%] Esperando archivo de log: %logfile%
)

timeout /t 10 /nobreak >nul 2>&1
goto loop