# Monitor de Logs Niubiz para Capturas de Pantalla
# Ejecutar desde el directorio backend

Clear-Host
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   MONITOR DE LOGS NIUBIZ - BACKEND" -ForegroundColor Green  
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Realiza una transacción desde el frontend" -ForegroundColor Yellow
Write-Host "📸 Los logs aparecerán aquí para captura" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$logDate = Get-Date -Format "yyyy-MM-dd"
$logFile = "logs\niubiz-$logDate.log"

Write-Host "📂 Archivo de log: $logFile" -ForegroundColor Cyan
Write-Host "⏰ Iniciando monitoreo..." -ForegroundColor Cyan
Write-Host ""

# Crear el archivo si no existe
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Monitorear en tiempo real
try {
    if (Test-Path $logFile) {
        Write-Host "📋 Mostrando logs existentes:" -ForegroundColor Yellow
        Write-Host "=====================================" -ForegroundColor White
        Get-Content $logFile
        Write-Host "=====================================" -ForegroundColor White
        Write-Host ""
        Write-Host "⏳ Esperando nuevas transacciones..." -ForegroundColor Green
        Get-Content $logFile -Wait
    } else {
        Write-Host "⏳ Esperando primera transacción..." -ForegroundColor Green
        # Esperar a que se cree el archivo
        while (!(Test-Path $logFile)) {
            Start-Sleep -Seconds 2
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "🎉 ¡Log creado! Mostrando contenido:" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor White
        Get-Content $logFile -Wait
    }
} catch {
    Write-Host "❌ Error monitoreando logs: $($_.Exception.Message)" -ForegroundColor Red
}