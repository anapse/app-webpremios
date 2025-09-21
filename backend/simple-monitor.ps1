# Monitor Simple de Logs Niubiz
Clear-Host
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   MONITOR DE LOGS NIUBIZ" -ForegroundColor Green  
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$logDate = Get-Date -Format "yyyy-MM-dd"
$logFile = "logs\niubiz-$logDate.log"

Write-Host "Archivo de log: $logFile" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $logFile) {
    Write-Host "Mostrando contenido actual:" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor White
    Get-Content $logFile
    Write-Host "=====================================" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitoreando nuevas entradas..." -ForegroundColor Cyan
    Get-Content $logFile -Wait
} else {
    Write-Host "Esperando que se cree el archivo de log..." -ForegroundColor Yellow
    Write-Host "Realiza una transaccion para generar logs." -ForegroundColor Cyan
    while (!(Test-Path $logFile)) {
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    Write-Host "Log creado! Mostrando contenido:" -ForegroundColor Green
    Get-Content $logFile -Wait
}