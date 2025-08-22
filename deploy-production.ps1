# Script de Despliegue a Producción
# Automatiza el build del frontend y despliegue a Nginx

Write-Host "🚀 Iniciando despliegue a producción..." -ForegroundColor Green

# 1. Hacer build del frontend
Write-Host "📦 Construyendo frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build del frontend" -ForegroundColor Red
    exit 1
}

# 2. Regresar al directorio raíz
Set-Location ..

# 3. Copiar archivos a directorio de producción de Nginx
Write-Host "📂 Copiando archivos a producción..." -ForegroundColor Yellow
Copy-Item "frontend\dist\*" "C:\nginx\html\app-webpremios\" -Recurse -Force

# 4. Detener Nginx
Write-Host "🛑 Deteniendo Nginx..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*nginx*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 5. Probar configuración de Nginx
Write-Host "🔍 Probando configuración de Nginx..." -ForegroundColor Yellow
$testResult = & "C:\nginx\nginx.exe" -t -c "C:\Users\Administrator\Desktop\app-webpremios\backend\database\nginx_config_PRODUCCION.conf" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en configuración de Nginx:" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

# 6. Iniciar Nginx con configuración de producción
Write-Host "🚀 Iniciando Nginx..." -ForegroundColor Yellow
Start-Process "C:\nginx\nginx.exe" -ArgumentList "-c", "C:\Users\Administrator\Desktop\app-webpremios\backend\database\nginx_config_PRODUCCION.conf" -WindowStyle Hidden

# 7. Verificar que Nginx esté corriendo
Start-Sleep -Seconds 3
$nginxProcesses = Get-Process | Where-Object {$_.ProcessName -like "*nginx*"}
if ($nginxProcesses.Count -gt 0) {
    Write-Host "✅ Despliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "🌐 Sitio web disponible en: https://gameztorepremios.com" -ForegroundColor Cyan
    Write-Host "📊 Procesos de Nginx:" -ForegroundColor Yellow
    $nginxProcesses | Format-Table ProcessName, Id, StartTime -AutoSize
} else {
    Write-Host "❌ Error: Nginx no se inició correctamente" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 ¡Despliegue completado!" -ForegroundColor Green
