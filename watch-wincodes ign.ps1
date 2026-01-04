$stableDir = "C:\Users\user\AppData\Local\electron-builder\Cache\winCodeSign\stable"
$cacheDir = "C:\Users\user\AppData\Local\electron-builder\Cache\winCodeSign"

# Monitor for new .7z files and copy the stable directory
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $cacheDir
$watcher.Filter = "*.7z"
$watcher.EnableRaisingEvents = $true

$action = {
    $name = $Event.SourceEventArgs.Name
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $targetDir = Join-Path $cacheDir $baseName
    
    if (-not (Test-Path $targetDir)) {
        Write-Host "Copying stable winCodeSign to $baseName..."
        Copy-Item -Path $stableDir -Destination $targetDir -Recurse -Force
        Write-Host "Copy complete!"
    }
}

Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action

Write-Host "Watcher started. Press Ctrl+C to stop."
Wait-Event
