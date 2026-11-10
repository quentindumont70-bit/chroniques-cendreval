# La Binch - Compagnon Windows local V0.1 (prototype)
# Execution volontaire. Le relais ecoute UNIQUEMENT 127.0.0.1:18764.
# Aucune connexion sortante; aucune modification du dossier WoW.
# Le navigateur doit fournir un jeton ephemere et l'origine GitHub Pages autorisee.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = 'Choisis WTF/Account/<compte>/SavedVariables/GrimoireSync.lua'
$dialog.Filter = 'GrimoireSync.lua|GrimoireSync.lua'
$dialog.Multiselect = $false
$dialog.CheckFileExists = $true
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
$file = $dialog.FileName
if ([System.IO.Path]::GetFileName($file) -ine 'GrimoireSync.lua') {
 throw 'Selectionne uniquement GrimoireSync.lua.'
}
if ($file -notmatch '(?i)[\\/]WTF[\\/]Account[\\/].+[\\/]SavedVariables[\\/]GrimoireSync\.lua$') {
 throw 'Le fichier doit etre situe dans WTF/Account/.../SavedVariables.'
}

$randomBytes = New-Object byte[] 24
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($randomBytes) } finally { $rng.Dispose() }
$token = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
$origin = 'https://quentindumont70-bit.github.io'
$port = 18764
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback,$port)
function Reply($stream,[int]$status,[string]$reason,[string]$body,[bool]$cors,[string]$etag='') {
 $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
 $header = "HTTP/1.1 $status $reason`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n"
 if ($cors) {
  $header += "Access-Control-Allow-Origin: $origin`r`nAccess-Control-Allow-Methods: GET, OPTIONS`r`nAccess-Control-Allow-Headers: X-Binch-Token, If-None-Match`r`nAccess-Control-Expose-Headers: ETag`r`nVary: Origin`r`n"
 }
 if ($etag) { $header += "ETag: $etag`r`n" }
 $header += "`r`n"
 $headBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
 $stream.Write($headBytes,0,$headBytes.Length)
 if ($bytes.Length -gt 0) { $stream.Write($bytes,0,$bytes.Length) }
 $stream.Flush()
}
try {
 $listener.Start()
 Write-Host ''
 Write-Host 'LA BINCH - COMPAGNON WINDOWS LOCAL' -ForegroundColor Cyan
 Write-Host '-----------------------------------'
 Write-Host 'Le programme lit seulement :' $file
 Write-Host 'Adresse locale : http://127.0.0.1:18764'
 Write-Host ''
 Write-Host 'JETON DE CONNEXION (a coller dans La Binch) :' -ForegroundColor Yellow
 Write-Host $token -ForegroundColor Green
 Write-Host ''
 Write-Host 'Garde cette fenetre ouverte pendant WoW. CTRL+C pour arreter.'
 Write-Host 'Le jeton change a chaque lancement. Aucune donnee envoyee a un serveur.'
 while ($true) {
  if (-not $listener.Pending()) { Start-Sleep -Milliseconds 150; continue }
  $client = $null
  try {
   $client = $listener.AcceptTcpClient()
   $client.ReceiveTimeout = 4000
   $client.SendTimeout = 4000
   if (-not [System.Net.IPAddress]::IsLoopback(($client.Client.RemoteEndPoint).Address)) { continue }
   $stream = $client.GetStream()
   $reader = New-Object System.IO.StreamReader($stream,[System.Text.Encoding]::ASCII,$false,1024,$true)
   $request = $reader.ReadLine()
   if (-not $request -or $request.Length -gt 1024) { continue }
   $parts = $request.Split(' ')
   if ($parts.Length -lt 3) { continue }
   $headers = @{}
   for ($i=0; $i -lt 50; $i++) {
    $line = $reader.ReadLine()
    if ($null -eq $line -or $line.Length -eq 0) { break }
    if ($line.Length -gt 4096) { throw 'HTTP header too long' }
    $at = $line.IndexOf(':')
    if ($at -gt 0) { $headers[$line.Substring(0,$at).Trim().ToLowerInvariant()] = $line.Substring($at+1).Trim() }
   }
   $cors = $headers['origin'] -ceq $origin
   if (-not $cors -or $parts[1] -ne '/grimoire') {
    Reply $stream 403 'Forbidden' 'Origin or path refused' $false
    continue
   }
   if ($parts[0] -eq 'OPTIONS') {
    Reply $stream 204 'No Content' '' $true
    continue
   }
   if ($parts[0] -ne 'GET' -or $headers['x-binch-token'] -cne $token) {
    Reply $stream 403 'Forbidden' 'Token missing or invalid' $true
    continue
   }
   $info = Get-Item -LiteralPath $file -ErrorAction Stop
   if ($info.Length -gt 10MB) {
    Reply $stream 413 'Payload Too Large' 'SavedVariables file exceeds 10 MB' $true
    continue
   }
   $etag = '"' + $info.Length + '-' + $info.LastWriteTimeUtc.Ticks + '"'
   if ($headers['if-none-match'] -ceq $etag) {
    Reply $stream 304 'Not Modified' '' $true $etag
    continue
   }
   $lua = [System.IO.File]::ReadAllText($file,[System.Text.Encoding]::UTF8)
   Reply $stream 200 'OK' $lua $true $etag
  } catch {
   Write-Warning ('Lecture locale indisponible : '+$_.Exception.Message)
  } finally {
   if ($client) { $client.Close() }
  }
 }
} finally {
 $listener.Stop()
}
