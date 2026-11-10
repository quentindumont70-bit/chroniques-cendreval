# La Binch - installation locale GrimoireSync v0.9.0
# Source publique : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/
# Aucune permission administrateur, aucune lecture des identifiants/du dossier WTF, aucune telemetrie.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Application]::EnableVisualStyles()
function Tell([string]$message,[string]$title='La Binch') {
 [System.Windows.Forms.MessageBox]::Show($message,$title,[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}
# One local configuration file, in the user's profile. No WoW data is uploaded.
$configDirectory = Join-Path $env:LOCALAPPDATA 'LaBinch'
$configFile = Join-Path $configDirectory 'wow-forever-path.txt'
function Get-LastFolder {
 if (-not (Test-Path -LiteralPath $configFile -PathType Leaf)) { return $null }
 try { return (Get-Content -LiteralPath $configFile -TotalCount 1 -ErrorAction Stop).Trim() } catch { return $null }
}
function Save-LastFolder([string]$folder) {
 if (-not $folder) { return }
 if (-not (Test-Path -LiteralPath $configDirectory)) { New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null }
 [System.IO.File]::WriteAllText($configFile, $folder, [System.Text.Encoding]::UTF8)
}
function Confirm-Choice([string]$message,[string]$title='La Binch') {
 return [System.Windows.Forms.MessageBox]::Show($message,$title,[System.Windows.Forms.MessageBoxButtons]::YesNo,[System.Windows.Forms.MessageBoxIcon]::Question) -eq [System.Windows.Forms.DialogResult]::Yes
}
function Show-InstallResult([string]$heading,[string]$version,[string]$location,[string]$previous,[string]$backup) {
 $form = New-Object System.Windows.Forms.Form
 $form.Text = 'La Binch - Mise a jour GrimoireSync'
 $form.StartPosition = 'CenterScreen'
 $form.Size = New-Object System.Drawing.Size(790,365)
 $form.MinimumSize = New-Object System.Drawing.Size(630,320)
 $form.BackColor = [System.Drawing.Color]::FromArgb(24,34,40)
 $form.ForeColor = [System.Drawing.Color]::FromArgb(245,230,205)
 $form.Font = New-Object System.Drawing.Font('Segoe UI',10)
 $title = New-Object System.Windows.Forms.Label
 $title.Text = $heading
 $title.ForeColor = [System.Drawing.Color]::FromArgb(229,194,132)
 $title.Font = New-Object System.Drawing.Font('Segoe UI',16,[System.Drawing.FontStyle]::Bold)
 $title.Location = New-Object System.Drawing.Point(22,17)
 $title.AutoSize = $true
 $form.Controls.Add($title)
 $info = New-Object System.Windows.Forms.TextBox
 $info.Multiline = $true
 $info.ReadOnly = $true
 $info.BorderStyle = [System.Windows.Forms.BorderStyle]::None
 $info.ScrollBars = [System.Windows.Forms.ScrollBars]::Vertical
 $info.BackColor = $form.BackColor
 $info.ForeColor = $form.ForeColor
 $info.Font = New-Object System.Drawing.Font('Consolas',10)
 $info.Location = New-Object System.Drawing.Point(24,65)
 $info.Size = New-Object System.Drawing.Size(725,190)
 $info.Anchor = 'Top,Left,Right,Bottom'
 $info.Text = "Version disponible : $version" + [Environment]::NewLine + "Version precedente : $previous" + [Environment]::NewLine + [Environment]::NewLine + "Dossier :" + [Environment]::NewLine + $location + [Environment]::NewLine + [Environment]::NewLine + "Sauvegarde de l'ancienne version : " + $(if ($backup) {$backup} else {'aucune (pas de changement)'})
 $form.Controls.Add($info)
 $open = New-Object System.Windows.Forms.Button
 $open.Text = 'Ouvrir le dossier'
 $open.Location = New-Object System.Drawing.Point(24,273)
 $open.Size = New-Object System.Drawing.Size(180,40)
 $open.Anchor = 'Bottom,Left'
 $open.Add_Click({ Start-Process -FilePath 'explorer.exe' -ArgumentList @($location) })
 $form.Controls.Add($open)
 $ok = New-Object System.Windows.Forms.Button
 $ok.Text = 'Terminer'
 $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
 $ok.Location = New-Object System.Drawing.Point(617,273)
 $ok.Size = New-Object System.Drawing.Size(130,40)
 $ok.Anchor = 'Bottom,Right'
 $form.AcceptButton = $ok
 $form.Controls.Add($ok)
 [void]$form.ShowDialog()
 $form.Dispose()
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
 # The saved path is local to Windows, and must resolve to an existing AddOns folder.
 $known = Get-LastFolder
 $addons = Find-Addons $known
 $rememberedValid = [bool]$addons
 if (-not $addons) {
  $suggestions = @('D:\World of Warcraft\_forever_', 'C:\Program Files (x86)\World of Warcraft\_forever_', 'C:\Program Files\World of Warcraft\_forever_')
  foreach ($suggestion in $suggestions) {
   $candidate = Find-Addons $suggestion
   if ($candidate) { $addons = $candidate; break }
  }
 }
 if ($addons -and -not $rememberedValid) {
  $choice = "Dossier WoW detecte :" + [Environment]::NewLine + [Environment]::NewLine + $addons + [Environment]::NewLine + [Environment]::NewLine + "Utiliser ce dossier ?" + [Environment]::NewLine + "(Non = choisir un autre emplacement)"
  if (-not (Confirm-Choice $choice 'La Binch - WoW detecte')) { $addons = $null }
 }
 if (-not $addons) {
  $folder = New-Object System.Windows.Forms.FolderBrowserDialog
  $folder.Description = 'Selectionne WoW Forever ou Interface\AddOns (une seule fois)'
  $folder.ShowNewFolderButton = $false
  if ($known -and (Test-Path -LiteralPath $known -PathType Container)) { $folder.SelectedPath = $known }
  if ($folder.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
  $chosen = $folder.SelectedPath
  $addons = Find-Addons $chosen
  if (-not $addons -and (Split-Path -Leaf $chosen) -eq 'AddOns' -and (Split-Path -Leaf (Split-Path $chosen)) -eq 'Interface') { $addons = $chosen }
 }
 if (-not $addons) {
  Tell 'Dossier Interface\AddOns introuvable. Selectionne le dossier WoW Forever ou directement Interface\AddOns.' 'Installation non effectuee'
  exit 1
 }
 # To change the saved path, decline an auto-detection on first run or delete
 # %LOCALAPPDATA%\LaBinch\wow-forever-path.txt to force a new selection.
 # Resolve and validate the location before any file write.
 $addons = (Resolve-Path -LiteralPath $addons).ProviderPath
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
 $filenames = @('GrimoireSync.toc','Core.lua','Minimap.lua','Faith.lua')
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
  if ($toc -notmatch '(?m)^## SavedVariables: GrimoireSyncDB' -or $toc -notmatch '(?m)^## Version: 0\.9\.0\s*$' -or $toc -notmatch '(?m)^Minimap.lua\s*$' -or $toc -notmatch '(?m)^Faith.lua\s*$') { throw 'Le manifeste GrimoireSync ne correspond pas a la version attendue.' }
  # Idempotent upgrade: do not make a new backup if files are already current.
  $sameFiles = Test-Path -LiteralPath $installed -PathType Container
  if ($sameFiles) {
   foreach ($filename in $filenames) {
    $oldFile = Join-Path $installed $filename
    if (-not (Test-Path -LiteralPath $oldFile -PathType Leaf)) { $sameFiles = $false; break }
    if ((Get-FileHash -LiteralPath $oldFile -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath (Join-Path $staging $filename) -Algorithm SHA256).Hash) { $sameFiles = $false; break }
   }
  }
  if ($sameFiles) {
   Save-LastFolder $addons
   Show-InstallResult 'Deja a jour !' '0.9.0' $installed $previousVersion ''
   exit 0
  }
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
 if ($installedToc -notmatch '(?m)^## Version: 0\.9\.0\s*$') { throw 'Version installee incorrecte.' }
 Save-LastFolder $addons
 Show-InstallResult 'Mise a jour reussie !' '0.9.0' $installed $previousVersion $(if (Test-Path -LiteralPath $backup) {$backup} else {''})

} catch {
 Tell ("Installation interrompue : " + $_.Exception.Message + [Environment]::NewLine + "Aucun dossier WTF/SavedVariables n'a ete modifie.") 'La Binch - Erreur'
 exit 1
}
