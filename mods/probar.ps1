# Prueba un mod suelto: abre Claude Code con SOLO ese mod cargado (--plugin-dir),
# sin instalarlo en tu usuario. Cada mod en su propia terminal.
#
#   .\mods\probar.ps1 usage-meter          # en esta terminal
#   .\mods\probar.ps1 -Nuevas              # abre una pestaña de Windows Terminal por mod
#   .\mods\probar.ps1 -Lista               # lista los mods
param(
  [Parameter(Position = 0)][string]$Mod,
  [switch]$Nuevas,
  [switch]$Lista
)

$raiz = Join-Path $PSScriptRoot 'plugins'
$mods = Get-ChildItem $raiz -Directory | Select-Object -ExpandProperty Name

if ($Lista -or (-not $Mod -and -not $Nuevas)) { $mods; return }

if ($Nuevas) {
  foreach ($m in $mods) {
    $dir = Join-Path $raiz $m
    if (Get-Command wt -ErrorAction SilentlyContinue) {
      wt -w 0 new-tab --title $m -d (Split-Path $PSScriptRoot) claude --plugin-dir $dir
    } else {
      Start-Process powershell -ArgumentList '-NoExit', '-Command', "`$host.UI.RawUI.WindowTitle='$m'; claude --plugin-dir '$dir'"
    }
  }
  return
}

if ($mods -notcontains $Mod) { Write-Error "No existe '$Mod'. Mods: $($mods -join ', ')"; return }
claude --plugin-dir (Join-Path $raiz $Mod)
