Write-Host "Starting Docker services..." -ForegroundColor Green
docker compose -f docker/docker-compose.yml up -d

Write-Host "Waiting for backend to become healthy..." -ForegroundColor Yellow
$maxWait = 60
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $status = docker inspect --format='{{.State.Health.Status}}' docker-backend-1 2>$null
    if ($status -eq "healthy") { break }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline
}
Write-Host ""

if ($status -eq "healthy") {
    Write-Host "Backend is healthy!" -ForegroundColor Green
} else {
    Write-Host "Backend did not become healthy in time, continuing anyway..." -ForegroundColor Yellow
}

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Green
Start-Process cloudflared -ArgumentList "tunnel --config C:\Users\msh28\.cloudflared\config.yml run"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "  Frontend: https://familytreebp.ru" -ForegroundColor Cyan
Write-Host "  Backend:  https://api.familytreebp.ru" -ForegroundColor Cyan
Write-Host "  Local:    http://localhost:3000" -ForegroundColor Cyan
