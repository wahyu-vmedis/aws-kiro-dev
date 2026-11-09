$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')

try {
    $listener.Start()
} catch {
    Write-Host "Error: Port 8080 is unavailable."
    exit 1
}

Write-Host "Server running at http://localhost:8080 - press Ctrl+C to stop"

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    if ($request.Url.AbsolutePath -eq '/') {
        $indexPath = Join-Path $PSScriptRoot 'index.html'
        $bytes = [System.IO.File]::ReadAllBytes($indexPath)
        $response.ContentType = 'text/html'
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
    }

    $response.Close()
}
