# ==============================================================================
# HireGenius / Hirelens - Stop All Services Script
# ==============================================================================

Write-Host "Stopping HireGenius AI Services..." -ForegroundColor Yellow

# Ports: 5173 (Frontend), 8080 (Auth), 4000 (Core API), 8000 (AI/ML)
$ports = @(5173, 8080, 4000, 8000)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                try {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    Write-Host "Killed process on port $port (PID: $pidToKill)" -ForegroundColor Green
                } catch {}
            }
        }
    } else {
        Write-Host "Port $port is already free." -ForegroundColor Gray
    }
}

Write-Host "`nAll HireGenius AI services have been stopped." -ForegroundColor Cyan
