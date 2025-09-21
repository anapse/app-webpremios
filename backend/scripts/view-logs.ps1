# Script para ver los logs de Niubiz
param(
    [string]$Date = (Get-Date -Format "yyyy-MM-dd")
)

$LogFile = "..\logs\niubiz-$Date.log"

Write-Host "=====================================" -ForegroundColor Green
Write-Host "LOGS DE NIUBIZ - $Date" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

if (Test-Path $LogFile) {
    Write-Host "Archivo de log encontrado: $LogFile" -ForegroundColor Yellow
    Write-Host ""
    Get-Content $LogFile -Tail 50
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Para ver todo el archivo: Get-Content '$LogFile'" -ForegroundColor Cyan
    Write-Host "Para ver en tiempo real: Get-Content '$LogFile' -Wait" -ForegroundColor Cyan
} else {
    Write-Host "No se encontró archivo de log para la fecha: $Date" -ForegroundColor Red
    Write-Host "Archivos disponibles:" -ForegroundColor Yellow
    Get-ChildItem "..\logs\niubiz-*.log" | Select-Object Name, LastWriteTime
}