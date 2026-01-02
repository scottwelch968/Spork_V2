# ============================================
# COSMO 2.0 - Auto GitHub Sync (Background)
# Watches for file changes and syncs automatically
# ============================================

$projectPath = "C:\VBOX\devserver\dev_01"
$syncInterval = 60  # Check every 60 seconds

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COSMO 2.0 - Auto GitHub Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Watching: $projectPath" -ForegroundColor Yellow
Write-Host "Sync interval: Every $syncInterval seconds" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location $projectPath

function Sync-ToGitHub {
    # Check if there are any changes
    $status = git status --porcelain 2>$null
    
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Changes detected, syncing..." -ForegroundColor Green
        
        # Stage all changes
        git add -A
        
        # Get summary of changes
        $added = (git diff --cached --numstat | Measure-Object).Count
        
        # Commit with timestamp
        $commitMsg = "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git commit -m $commitMsg 2>$null
        
        # Push to GitHub
        $pushResult = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] Pushed successfully!" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] Push failed: $pushResult" -ForegroundColor Red
        }
    } else {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] No changes" -ForegroundColor DarkGray
    }
}

# Initial sync
Sync-ToGitHub

# Continuous monitoring loop
while ($true) {
    Start-Sleep -Seconds $syncInterval
    Sync-ToGitHub
}
