# La Binch - installation locale GrimoireSync v0.8.1
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
 $name = 'GrimoireSync'
 $installed = Join-Path $addons $name
 $backup = Join-Path (Split-Path $addons -Parent) ('LaBinch-Sauvegarde-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
 $base = 'https://quentindumont70-bit.github.io/chroniques-cendreval/binch/addon/GrimoireSync/'
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
  if ($toc -notmatch '(?m)^## SavedVariables: GrimoireSyncDB' -or $toc -notmatch '(?m)^## Version: 0\.8\.1' -or $toc -notmatch '(?m)^Minimap.lua\s*$') {throw 'Le manifeste GrimoireSync ne correspond pas a la version attendue.'}
  if (Test-Path -LiteralPath $installed) {
   # IMPORTANT : Les anciennes interfaces Lua sont retirees du dossier actif.
   Move-Item -LiteralPath $installed -Destination $backup -ErrorAction Stop
  }
  New-Item -ItemType Directory -Path $installed -Force | Out-Null
  foreach ($filename in $filenames) {
   Copy-Item -LiteralPath (Join-Path $staging $filename) -Destination (Join-Path $installed $filename) -Force
  }
 } finally {
  Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
 }
 $message = "GrimoireSync installe !" + [Environment]::NewLine + [Environment]::NewLine +
 "Dossier : $installed" + [Environment]::NewLine
 if (Test-Path -LiteralPath $backup) { $message += "Ancienne version sauvegardee : $backup" + [Environment]::NewLine }
 $message += [Environment]::NewLine + "Lance WoW, active GrimoireSync, clique sur le petit livre pres de la mini-carte puis importe GrimoireSync.lua dans La Binch."
 Tell $message 'La Binch - Installation terminee'
} catch {
 Tell ("Installation interrompue : " + $_.Exception.Message + [Environment]::NewLine + "Aucun dossier WTF/SavedVariables n'a ete modifie.") 'La Binch - Erreur'
 exit 1
}
) {throw 'Le manifeste GrimoireSync ne correspond pas a la version attendue.'}
  if (Test-Path -LiteralPath $installed) {
   # IMPORTANT : Les anciennes interfaces Lua sont retirees du dossier actif.
   Move-Item -LiteralPath $installed -Destination $backup -ErrorAction Stop
  }
  New-Item -ItemType Directory -Path $installed -Force | Out-Null
  foreach ($filename in $filenames) {
   Copy-Item -LiteralPath (Join-Path $staging $filename) -Destination (Join-Path $installed $filename) -Force
  }
 } finally {
  Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
 }
 $message = "GrimoireSync installe !" + [Environment]::NewLine + [Environment]::NewLine +
 "Dossier : $installed" + [Environment]::NewLine
 if (Test-Path -LiteralPath $backup) { $message += "Ancienne version sauvegardee : $backup" + [Environment]::NewLine }
 $message += [Environment]::NewLine + "Lance WoW, active GrimoireSync, clique sur le petit livre pres de la mini-carte puis importe GrimoireSync.lua dans La Binch."
 Tell $message 'La Binch - Installation terminee'
} catch {
 Tell ("Installation interrompue : " + $_.Exception.Message + [Environment]::NewLine + "Aucun dossier WTF/SavedVariables n'a ete modifie.") 'La Binch - Erreur'
 exit 1
}
