Write-Host "Starting Docker services..." -ForegroundColor Green
docker compose -f docker/docker-compose.yml up -d

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Green
Start-Process cloudflared -ArgumentList "tunnel --config C:\Users\msh28\.cloudflared\config.yml run"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "  Frontend: https://familytreebp.ru" -ForegroundColor Cyan
Write-Host "  Backend:  https://api.familytreebp.ru" -ForegroundColor Cyan
Write-Host "  Local:    http://localhost:3000" -ForegroundColor Cyan
