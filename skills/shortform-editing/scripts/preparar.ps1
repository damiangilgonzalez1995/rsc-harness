# shortform-editing · comprueba y prepara las herramientas del editor de reels en Windows (adaptado de becario-editor v1.0).
# Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File preparar.ps1 -SoloComprobar   solo mira qué hay (no escribe nada)
#       powershell -NoProfile -ExecutionPolicy Bypass -File preparar.ps1                  mira; si todo está, guarda rutas.json;
#                                                                                         si falta algo, dice qué bajaría y para
#       powershell -NoProfile -ExecutionPolicy Bypass -File preparar.ps1 -Acepto          instala lo que falta (con permiso)
# Todo va a %USERPROFILE%\.editor-video (o a $env:EDITOR_VIDEO_HOME). Se reutilizan el Node, el FFmpeg y el Python que ya
# estén instalados; lo que falte se baja comprobado con su sha256 (Node, uv) o con winget (FFmpeg). Sin -Acepto no se
# descarga nada. Escribe rutas.json con python, node, npm, ffmpeg, ffprobe, hyperframes y modelo.
param([switch]$SoloComprobar, [switch]$Acepto)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ($env:EDITOR_VIDEO_HOME) { $Base = $env:EDITOR_VIDEO_HOME } else { $Base = Join-Path $env:USERPROFILE ".editor-video" }
$HfVersion = "0.9.5"; $GsapVersion = "3.15.0"; $FwVersion = "1.2.1"
$env:npm_config_cache = Join-Path $Base "npm-cache"
$env:HYPERFRAMES_NO_TELEMETRY = "1"
$env:npm_config_update_notifier = "false"; $env:npm_config_fund = "false"; $env:npm_config_audit = "false"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $Arq = "arm64"; $UvArq = "aarch64" } else { $Arq = "x64"; $UvArq = "x86_64" }
$Winget = Get-Command winget.exe -ErrorAction SilentlyContinue

$script:Node = $null; $script:Npm = $null; $script:Ffmpeg = $null; $script:Ffprobe = $null
$script:PySis = $null; $script:ChromeFijo = $null

function Bajar($url, $destino) {
    try { Invoke-WebRequest -Uri $url -OutFile $destino -UseBasicParsing -ErrorAction Stop; return $true } catch { return $false }
}

function Hash($ruta) { return (Get-FileHash -Algorithm SHA256 -Path $ruta).Hash.ToLower() }

function Refrescar-Path {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$m;$u;$env:Path"
}

function Hay-Nvidia {
    $n = Get-Command nvidia-smi.exe -ErrorAction SilentlyContinue
    if (-not $n) { return $false }
    & $n.Source -L *> $null
    return ($LASTEXITCODE -eq 0)
}

function Modelo-Principal { if (Hay-Nvidia) { return "large-v3-turbo" } else { return "small" } }

# Solo el modelo que se va a usar: large-v3-turbo con GPU, small sin ella. Si CUDA fallara en una máquina con GPU,
# editor.py usa ese mismo large-v3-turbo en CPU (más lento), sin pedir otro modelo.
function Modelos-Necesarios { return @(Modelo-Principal) }

function Modelo-Ok($nombre) { return (Test-Path (Join-Path $Base "modelos\whisper-$nombre\model.bin")) }

# ------------------------------------------------------------ buscar lo que ya hay
function Version-Node($exe) {
    try { $v = & $exe -p "process.versions.node.split('.')[0]" 2>$null; return [int]$v } catch { return 0 }
}

function Buscar-Node {
    $cands = @((Join-Path $Base "node\node.exe"))
    $cands += @(Get-Command node.exe -All -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })
    $cands += @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")
    foreach ($c in $cands) {
        if ($c -and (Test-Path $c) -and ((Version-Node $c) -ge 22)) {
            $script:Node = $c
            $script:Npm = Join-Path (Split-Path $c) "npm.cmd"
            return $true
        }
    }
    $script:Node = $null; return $false
}

function Buscar-Ffmpeg {
    $dirs = @((Join-Path $Base "ffmpeg"))
    $dirs += @(Get-Command ffmpeg.exe -All -ErrorAction SilentlyContinue | ForEach-Object { Split-Path $_.Source })
    $dirs += @("$env:LOCALAPPDATA\Microsoft\WinGet\Links", "C:\ffmpeg\bin")
    $paquetes = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
    if (Test-Path $paquetes) {
        $dirs += @(Get-ChildItem -Path $paquetes -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.DirectoryName })
    }
    foreach ($d in $dirs) {
        $f = Join-Path $d "ffmpeg.exe"; $p = Join-Path $d "ffprobe.exe"
        if ((Test-Path $f) -and (Test-Path $p)) {
            & $f -version *> $null
            if ($LASTEXITCODE -eq 0) { $script:Ffmpeg = $f; $script:Ffprobe = $p; return $true }
        }
    }
    $script:Ffmpeg = $null; return $false
}

function Python-Valido($exe) {
    if (-not $exe -or $exe -like "*WindowsApps*") { return $false }
    & $exe -c "import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Buscar-Python {
    $cands = @()
    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) {
        foreach ($v in @("3.12", "3.11", "3.13", "3.10")) {
            $r = & py.exe "-$v" -c "import sys; print(sys.executable)" 2>$null
            if ($LASTEXITCODE -eq 0 -and $r) { $cands += "$r".Trim() }
        }
    }
    foreach ($v in @("312", "311", "313", "310")) { $cands += "$env:LOCALAPPDATA\Programs\Python\Python$v\python.exe" }
    $cands += @(Get-Command python.exe -All -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })
    foreach ($c in $cands) { if ((Test-Path $c) -and (Python-Valido $c)) { $script:PySis = $c; return $true } }
    $script:PySis = $null; return $false
}

function Venv-Ok {
    $p = Join-Path $Base "venv\Scripts\python.exe"
    if (-not (Test-Path $p)) { return $false }
    & $p -c "import faster_whisper, cv2, mediapipe, PIL, numpy" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Buscar-Chrome {
    $cands = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
               "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
               "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe")
    foreach ($c in $cands) { if (Test-Path $c) { return $c } }
    return $null
}

function Motor-Ok {
    return ((Test-Path (Join-Path $Base "hyperframes\node_modules\hyperframes\bin\hyperframes.mjs")) -and
            (Test-Path (Join-Path $Base "hyperframes\node_modules\gsap\dist\gsap.min.js")))
}

# Lista de lo que falta, con lo que se bajaría (nombre y tamaño aproximado).
function Faltan {
    Buscar-Node | Out-Null; Buscar-Ffmpeg | Out-Null; Buscar-Python | Out-Null
    $f = @()
    if (-not $script:Node) { $f += "Node.js 22 portable (nodejs.org, ~30 MB)" }
    if (-not $script:Ffmpeg) { $f += "FFmpeg y FFprobe (winget Gyan.FFmpeg, ~90 MB)" }
    if (-not (Venv-Ok)) {
        $t = "~600 MB"; if (Hay-Nvidia) { $t = "~1,5 GB con las librerías CUDA" }
        $f += "Whisper y librerías de efectos en un Python propio (faster-whisper, mediapipe, opencv; $t)"
    }
    if (-not (Motor-Ok)) { $f += "HyperFrames $HfVersion y GSAP $GsapVersion con su navegador (npm, ~250 MB)" }
    foreach ($m in (Modelos-Necesarios)) {
        if (-not (Modelo-Ok $m)) {
            $t = "~240 MB"; if ($m -like "large*") { $t = "~1,6 GB" }
            $f += "Modelo de voz Whisper $m (Hugging Face, $t)"
        }
    }
    return ,$f
}

function Informe {
    Buscar-Node | Out-Null; Buscar-Ffmpeg | Out-Null; Buscar-Python | Out-Null
    $g = "no"; if (Hay-Nvidia) { $g = "sí (Whisper irá en la tarjeta gráfica)" }
    Write-Host "Sistema: Windows $Arq · GPU NVIDIA: $g · carpeta de herramientas: $Base"
    if ($script:Node) { Write-Host ("OK    Node.js " + (& $script:Node -v) + " ($($script:Node))") } else { Write-Host "FALTA Node.js 22 o posterior" }
    if ($script:Ffmpeg) { Write-Host "OK    FFmpeg ($($script:Ffmpeg))" } else { Write-Host "FALTA FFmpeg y FFprobe" }
    if ($script:PySis) { Write-Host "OK    Python ($($script:PySis))" } else { Write-Host "FALTA Python 3.10-3.13 (se usaría uv con un Python propio)" }
    if (Venv-Ok) { Write-Host "OK    Whisper y librerías de efectos ($Base\venv)" }
    else { Write-Host "FALTA Whisper y librerías de efectos (faster-whisper, mediapipe, opencv)" }
    if (Motor-Ok) { Write-Host "OK    HyperFrames ($Base\hyperframes)" } else { Write-Host "FALTA HyperFrames (subtítulos animados y recursos)" }
    foreach ($m in (Modelos-Necesarios)) {
        if (Modelo-Ok $m) { Write-Host "OK    modelo de voz Whisper $m" } else { Write-Host "FALTA modelo de voz Whisper $m" }
    }
}

# ------------------------------------------------------------ instalar (solo con -Acepto)
function Instalar-Node {
    if (Buscar-Node) { return $true }
    Write-Host "· Descargando Node.js 22 portable (nodejs.org, comprobado con SHASUMS256)..."
    $tmp = Join-Path $env:TEMP ("node-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    if (-not (Bajar "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt" "$tmp\SHASUMS256.txt")) { Write-Host "FALLO no se pudo descargar la lista de Node.js"; return $false }
    $linea = Get-Content "$tmp\SHASUMS256.txt" | Where-Object { $_ -match "node-v22\.[0-9.]+-win-$Arq\.zip$" } | Select-Object -First 1
    if (-not $linea) { Write-Host "FALLO no hay Node.js 22 para win-$Arq"; return $false }
    $suma, $fich = $linea -split "\s+"
    if (-not (Bajar "https://nodejs.org/dist/latest-v22.x/$fich" "$tmp\$fich")) { Write-Host "FALLO no se pudo descargar $fich"; return $false }
    if ((Hash "$tmp\$fich") -ne $suma.ToLower()) { Write-Host "FALLO Node.js no coincide con su sha256; descartado"; Remove-Item -Recurse -Force $tmp; return $false }
    Expand-Archive -Path "$tmp\$fich" -DestinationPath $tmp -Force
    $dentro = Get-ChildItem -Path $tmp -Directory | Where-Object { $_.Name -like "node-v22*" } | Select-Object -First 1
    $destino = Join-Path $Base "node"
    if (Test-Path $destino) { Remove-Item -Recurse -Force $destino }
    Move-Item -Path $dentro.FullName -Destination $destino
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    return (Buscar-Node)
}

function Instalar-Ffmpeg {
    if (Buscar-Ffmpeg) { return $true }
    if ($Winget) {
        Write-Host "· Instalando FFmpeg con winget (Gyan.FFmpeg, sin administrador)..."
        & winget.exe install -e --id Gyan.FFmpeg --silent --accept-source-agreements --accept-package-agreements --disable-interactivity *> $null
        Refrescar-Path
        if (Buscar-Ffmpeg) { return $true }
    }
    Write-Host "FALLO no he podido instalar FFmpeg. Bájalo de https://www.gyan.dev/ffmpeg/builds/ (essentials),"
    Write-Host "      descomprime la carpeta bin en $Base\ffmpeg y vuelve a ejecutar."
    return $false
}

function Conseguir-Uv {
    $local = Join-Path $Base "uv\uv.exe"
    if (Test-Path $local) { return $local }
    $g = Get-Command uv.exe -ErrorAction SilentlyContinue
    if ($g) { return $g.Source }
    Write-Host "· Descargando uv (gestor de Python de Astral, comprobado con su sha256)..."
    $nombre = "uv-$UvArq-pc-windows-msvc.zip"
    $tmp = Join-Path $env:TEMP ("uv-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $url = "https://github.com/astral-sh/uv/releases/latest/download/$nombre"
    if (-not ((Bajar $url "$tmp\$nombre") -and (Bajar "$url.sha256" "$tmp\uv.sha256"))) { return $null }
    $esperado = ((Get-Content "$tmp\uv.sha256" -Raw).Trim() -split "\s+")[0].ToLower()
    if ((Hash "$tmp\$nombre") -ne $esperado) { Write-Host "FALLO uv no coincide con su sha256; descartado"; return $null }
    New-Item -ItemType Directory -Force -Path (Join-Path $Base "uv") | Out-Null
    Expand-Archive -Path "$tmp\$nombre" -DestinationPath (Join-Path $Base "uv") -Force
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    if (Test-Path $local) { return $local }
    return $null
}

function Paquetes {
    $p = @("faster-whisper==$FwVersion", "mediapipe", "opencv-python", "pillow", "numpy", "pytest")
    if (Hay-Nvidia) { $p += @("nvidia-cublas-cu12", "nvidia-cudnn-cu12==9.*") }
    return $p
}

function Instalar-Whisper {
    if (Venv-Ok) { return $true }
    Buscar-Python | Out-Null
    $venv = Join-Path $Base "venv"
    $vpy = Join-Path $venv "Scripts\python.exe"
    $paq = Paquetes
    Write-Host "· Instalando en $venv : $($paq -join ', ') (puede tardar unos minutos)..."
    if (Test-Path $venv) { Remove-Item -Recurse -Force $venv }
    if ($script:PySis) {
        & $script:PySis -m venv $venv *> $null
        if (Test-Path $vpy) { & $vpy -m pip install -q --disable-pip-version-check @paq *> $null }
        if (Venv-Ok) { return $true }
    }
    Write-Host "· El Python del sistema no sirve; uso uv con un Python 3.12 propio..."
    if (Test-Path $venv) { Remove-Item -Recurse -Force $venv }
    $uv = Conseguir-Uv
    if (-not $uv) { Write-Host "FALLO no se pudo descargar uv"; return $false }
    $env:UV_PYTHON_INSTALL_DIR = Join-Path $Base "uv\python"; $env:UV_CACHE_DIR = Join-Path $Base "uv\cache"
    & $uv venv -q --python 3.12 $venv *> $null
    & $uv pip install -q --python $vpy @paq *> $null
    Remove-Item -Recurse -Force (Join-Path $Base "uv\cache") -ErrorAction SilentlyContinue
    if (Venv-Ok) { return $true }
    Write-Host "FALLO no se pudo instalar faster-whisper y las librerías de efectos"; return $false
}

function Instalar-Modelos {
    $vpy = Join-Path $Base "venv\Scripts\python.exe"
    foreach ($m in (Modelos-Necesarios)) {
        if (Modelo-Ok $m) { continue }
        $destino = Join-Path $Base "modelos\whisper-$m"
        Write-Host "· Descargando el modelo de voz Whisper $m (Hugging Face, una sola vez)..."
        New-Item -ItemType Directory -Force -Path $destino | Out-Null
        & $vpy -c "import sys; from faster_whisper import download_model; download_model(sys.argv[1], output_dir=sys.argv[2])" $m $destino *> $null
        if (-not (Modelo-Ok $m)) { Write-Host "FALLO el modelo $m no se ha descargado entero; borra $destino y repite"; return $false }
    }
    return $true
}

function Instalar-Motor {
    $env:Path = (Split-Path $script:Node) + ";" + (Split-Path $script:Ffmpeg) + ";" + $env:Path
    $dir = Join-Path $Base "hyperframes"
    if (-not (Motor-Ok)) {
        Write-Host "· Instalando HyperFrames $HfVersion y GSAP $GsapVersion (sin skills globales)..."
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        & $script:Npm install -q --prefix $dir "hyperframes@$HfVersion" "gsap@$GsapVersion" *> $null
        if (-not (Motor-Ok)) { Write-Host "FALLO npm no pudo instalar HyperFrames"; return $false }
    }
    $hf = Join-Path $dir "node_modules\hyperframes\bin\hyperframes.mjs"
    & $script:Node $hf browser ensure *> $null
    if ($LASTEXITCODE -ne 0) {
        $script:ChromeFijo = Buscar-Chrome
        if (-not $script:ChromeFijo) { Write-Host "AVISO HyperFrames no pudo bajar su navegador; se reintentará al montar" }
    }
    return (Motor-Ok)
}

function Escribir-Rutas {
    New-Item -ItemType Directory -Force -Path $Base | Out-Null
    $ruta = Join-Path $Base "rutas.json"
    $datos = [ordered]@{}
    if (Test-Path $ruta) {
        try { (Get-Content $ruta -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $datos[$_.Name] = $_.Value } } catch {}
    }
    $datos["node"] = $script:Node; $datos["npm"] = $script:Npm
    $datos["ffmpeg"] = $script:Ffmpeg; $datos["ffprobe"] = $script:Ffprobe
    $datos["python"] = (Join-Path $Base "venv\Scripts\python.exe")
    $datos["hyperframes"] = (Join-Path $Base "hyperframes")
    if ($script:ChromeFijo) { $datos["chrome"] = $script:ChromeFijo }
    $datos["modelo"] = Modelo-Principal
    $json = $datos | ConvertTo-Json -Depth 3
    [IO.File]::WriteAllText($ruta, $json, (New-Object Text.UTF8Encoding $false))
    Write-Host "OK    rutas guardadas en $ruta"
}

# ------------------------------------------------------------ orden
Informe
if ($SoloComprobar) { exit 0 }

$faltan = Faltan
if ($faltan.Count -gt 0 -and -not $Acepto) {
    Write-Host ""
    Write-Host "Para seguir hay que descargar e instalar (todo en $Base, nada en el sistema):"
    foreach ($f in $faltan) { Write-Host "  - $f" }
    Write-Host "No he descargado nada. Si das permiso, vuelve a ejecutar con -Acepto."
    exit 3
}
if ($faltan.Count -gt 0) {
    New-Item -ItemType Directory -Force -Path $Base | Out-Null
    if (-not (Instalar-Node)) { Write-Host "FALLO Node.js"; exit 1 }
    if (-not (Instalar-Ffmpeg)) { Write-Host "FALLO FFmpeg"; exit 1 }
    if (-not (Instalar-Whisper)) { Write-Host "FALLO Whisper"; exit 1 }
    if (-not (Instalar-Modelos)) { Write-Host "FALLO modelo de voz"; exit 1 }
    if (-not (Instalar-Motor)) { Write-Host "FALLO HyperFrames"; exit 1 }
    Remove-Item -Recurse -Force (Join-Path $Base "npm-cache") -ErrorAction SilentlyContinue
    Write-Host ""; Informe
}
Escribir-Rutas
Write-Host "LISTO. Python del editor: $(Join-Path $Base 'venv\Scripts\python.exe')"
exit 0
