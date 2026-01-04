# GhostMoney Local Server Script
# This script starts a local web server and opens the app in your default browser

$port = 8080
$distPath = Join-Path $PSScriptRoot "dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GhostMoney Local Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server on http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Process "http://localhost:$port"

# Start simple HTTP server using Python (if available) or .NET
if (Get-Command python -ErrorAction SilentlyContinue) {
    Set-Location $distPath
    python -m http.server $port
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    Set-Location $distPath
    python3 -m http.server $port
} else {
    # Fallback to PowerShell HTTP server
    Write-Host "Using PowerShell HTTP Server..." -ForegroundColor Yellow
    
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    
    Write-Host "Server started successfully!" -ForegroundColor Green
    
    try {
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $path = $request.Url.LocalPath
            if ($path -eq "/") { $path = "/index.html" }
            
            $filePath = Join-Path $distPath $path.TrimStart('/')
            
            if (Test-Path $filePath -PathType Leaf) {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                
                # Set content type
                $ext = [System.IO.Path]::GetExtension($filePath)
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html" }
                    ".css"  { $response.ContentType = "text/css" }
                    ".js"   { $response.ContentType = "application/javascript" }
                    ".json" { $response.ContentType = "application/json" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".svg"  { $response.ContentType = "image/svg+xml" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                
                $response.OutputStream.Write($content, 0, $content.Length)
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            
            $response.Close()
        }
    } finally {
        $listener.Stop()
    }
}
