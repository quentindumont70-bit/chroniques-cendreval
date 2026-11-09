# La Binch - installation locale GrimoireSync v0.8.4
# Source publique : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/
# Aucune permission administrateur, aucune lecture des identifiants/du dossier WTF, aucune telemetrie.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Application]::EnableVisualStyles()
function Tell([string]$message,[string]$title='La Binch') {
 [System.Windows.Forms.MessageBox]::Show($message,$title,[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}
function Find-Addons([string]$path) {
 if (-not $path) { return $null }
 $candidates = @($path)
 foreach ($relative in @('_forever_','_classic_','_classic_era_','_classic_beta_','World of Warcraft','World of Warcraft\_forever_','World of Warcraft\_classic_')) {
  $candidates += (Join-Path $path $relative)
 }
 foreach ($candidate in $candidates) {
  $target = Join-Path $candidate 'Interface\AddOns'
  if (Test-Path -LiteralPath $target -PathType Container) { return $target }
 }
 return $null
}
try {
 $folder = New-Object System.Windows.Forms.FolderBrowserDialog
 $folder.Description = 'Selectionne le dossier WoW Forever (ou son dossier Interface\AddOns)'
 $folder.ShowNewFolderButton = $false
 foreach ($suggestion in @('C:\Program Files (x86)\World of Warcraft','C:\Program Files\World of Warcraft','C:\Games\World of Warcraft')) {
  if (Test-Path -LiteralPath $suggestion -PathType Container) { $folder.SelectedPath = $suggestion; break }
 }
 if ($folder.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
 $gameRoot = $folder.SelectedPath
 $addons = Find-Addons $gameRoot
 if (-not $addons -and (Split-Path -Leaf $gameRoot) -eq 'AddOns' -and (Split-Path -Leaf (Split-Path $gameRoot)) -eq 'Interface') {
  $addons = $gameRoot
 }
 if (-not $addons) { Tell 'Dossier Interface\AddOns introuvable. Selectionne le dossier de la version WoW Forever, ou directement Interface\AddOns.' 'Installation non effectuee'; exit 1 }
 # If WoW is running, the old addon remains loaded until a full client restart.
 $wowProcesses = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^(Wow|WowClassic|WowForever|WorldOfWarcraft)(\.exe)?$' })
 if ($wowProcesses.Count -gt 0) {
  Tell 'Ferme completement WoW avant la mise a jour. Aucune modification effectuee.' 'WoW encore ouvert'
  exit 2
 }
 $name = 'GrimoireSync'
 $installed = Join-Path $addons $name
 $previousVersion = 'aucune'
 $previousToc = Join-Path $installed 'GrimoireSync.toc'
 if (Test-Path -LiteralPath $previousToc -PathType Leaf) {
  $existingToc = Get-Content -LiteralPath $previousToc -Raw
  if ($existingToc -match '(?m)^## Version: ([0-9]+(?:\.[0-9]+)+)\s*$') { $previousVersion = $Matches[1] }
  else { $previousVersion = 'inconnue' }
 }
 $backup = Join-Path (Split-Path $addons -Parent) ('LaBinch-Sauvegarde-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
 $base = 'https://raw.githubusercontent.com/quentindumont70-bit/chroniques-cendreval/main/public/binch/addon/GrimoireSync/'
 $filenames = @('GrimoireSync.toc','Core.lua','Minimap.lua')
 # Recuperation dans un dossier temporaire AVANT toute modification de l'ancien addon.
 $staging = Join-Path ([System.IO.Path]::GetTempPath()) ('binch-'+[guid]::NewGuid().ToString('N'))
 New-Item -ItemType Directory -Path $staging -Force | Out-Null
 try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  foreach ($filename in $filenames) {
   $out = Join-Path $staging $filename
   Invoke-WebRequest -UseBasicParsing -Uri ($base+$filename) -OutFile $out -TimeoutSec 25
   if ((Get-Item -LiteralPath $out).Length -lt 40) { throw "Le fichier $filename est vide ou invalide." }
  }
  $toc = Get-Content -LiteralPath (Join-Path $staging 'GrimoireSync.toc') -Raw
  if ($toc -notmatch '(?m)^## SavedVariables: GrimoireSyncDB' -or $toc -notmatch '(?m)^## Version: 0\.8\.4' -or $toc -notmatch '(?m)^Minimap.lua\s*$') {throw 'Le manifeste GrimoireSync ne correspond pas a la version attendue.'}
  $minimapCode = Get-Content -LiteralPath (Join-Path $staging 'Minimap.lua') -Raw
  if ($minimapCode -match 'dialog:SetBackdrop\(' -or $minimapCode -match 'button:SetBackdrop\(') { throw 'Minimap.lua non compatible avec WoW Forever.' }
  if (Test-Path -LiteralPath $installed) {
   # IMPORTANT : Les anciennes interfaces Lua sont retirees du dossier actif.
   Move-Item -LiteralPath $installed -Destination $backup -ErrorAction Stop
  }
  New-Item -ItemType Directory -Path $installed -Force | Out-Null
  try {
   foreach ($filename in $filenames) {
    Copy-Item -LiteralPath (Join-Path $staging $filename) -Destination (Join-Path $installed $filename) -Force -ErrorAction Stop
    $expected = (Get-FileHash -LiteralPath (Join-Path $staging $filename) -Algorithm SHA256).Hash
    $actual = (Get-FileHash -LiteralPath (Join-Path $installed $filename) -Algorithm SHA256).Hash
    if ($expected -ne $actual) { throw "Copie incorrecte : $filename." }
   }
  } catch {
   if (Test-Path -LiteralPath $installed) { Remove-Item -LiteralPath $installed -Recurse -Force -ErrorAction SilentlyContinue }
   if (Test-Path -LiteralPath $backup) { Move-Item -LiteralPath $backup -Destination $installed -ErrorAction SilentlyContinue }
   throw
  }
 } finally {
  Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
 }
 $installedToc = Get-Content -LiteralPath (Join-Path $installed 'GrimoireSync.toc') -Raw
 if ($installedToc -notmatch '(?m)^## Version: 0\.8\.4\s*$') { throw 'Version installee incorrecte.' }
 $message = "GrimoireSync v0.8.4 installe - fichiers controles (SHA-256)." + [Environment]::NewLine + [Environment]::NewLine +
 "Dossier : $installed" + [Environment]::NewLine +
 "Version precedente : $previousVersion" + [Environment]::NewLine
 if (Test-Path -LiteralPath $backup) { $message += "Ancienne version sauvegardee : $backup" + [Environment]::NewLine }
 $message += [Environment]::NewLine + "Lance WoW, active GrimoireSync, clique sur le petit livre pres de la mini-carte puis importe GrimoireSync.lua dans La Binch."
 Tell $message 'La Binch - Installation terminee'
} catch {
 Tell ("Installation interrompue : " + $_.Exception.Message + [Environment]::NewLine + "Aucun dossier WTF/SavedVariables n'a ete modifie.") 'La Binch - Erreur'
 exit 1
}
