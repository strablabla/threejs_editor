#!/usr/bin/env bash
#
# Installs the venv (once) and creates a clickable shortcut for the current OS.
# Safe to re-run: an existing, working venv is not reinstalled.
#
# Prefer Docker if you would rather install nothing at all: see the README.
#
set -euo pipefail

# --- Locations --------------------------------------------------------------
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # project root
VENV_DIR="$APP_DIR/venv"
PYTHON_BIN="${PYTHON_BIN:-python3.8}"                     # override: PYTHON_BIN=python3.11 ./install.sh
ICON_PNG="$APP_DIR/static/img/app_icon.png"

case "$(uname -s)" in
    Linux)                PLATFORM=linux ;;
    Darwin)               PLATFORM=macos ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM=windows ;;             # Git Bash / MSYS2 / Cygwin
    *)                    PLATFORM=unknown ;;
esac
echo "[platform] $PLATFORM"

# The venv layout differs on Windows: Scripts/python.exe, not bin/python.
venv_python() {
    if   [ -x "$VENV_DIR/bin/python" ];         then echo "$VENV_DIR/bin/python"
    elif [ -x "$VENV_DIR/Scripts/python.exe" ]; then echo "$VENV_DIR/Scripts/python.exe"
    fi
}

# --- 1. venv ----------------------------------------------------------------
# The venv counts as valid only if the dependencies really import: a half-created
# venv (missing ensurepip) does have a bin/python but nothing in it, which made
# the old test pass wrongly.
VENV_PY="$(venv_python || true)"
if [ -n "$VENV_PY" ] && "$VENV_PY" -c 'import flask, eventlet' 2>/dev/null; then
    echo "[venv] already present and working -> no reinstall ($VENV_DIR)"
else
    [ -e "$VENV_DIR" ] && { echo "[venv] incomplete venv -> removing"; rm -rf "$VENV_DIR"; }

    # eventlet 0.30.2 imports the 'imp' module, removed in Python 3.12: 3.8 is
    # really needed. uv downloads it on its own, with no sudo and no apt.
    UV_BIN="$(command -v uv || echo "$HOME/.local/bin/uv")"

    if [ -x "$UV_BIN" ]; then
        echo "[venv] creating with uv (Python 3.8) ..."
        "$UV_BIN" venv --python 3.8 "$VENV_DIR"
        VENV_PY="$(venv_python)"
        echo "[venv] installing dependencies ..."
        "$UV_BIN" pip install --python "$VENV_PY" pip -r "$APP_DIR/requirements.txt"
    elif command -v "$PYTHON_BIN" >/dev/null 2>&1; then
        echo "[venv] creating with $PYTHON_BIN ..."
        "$PYTHON_BIN" -m venv "$VENV_DIR"
        VENV_PY="$(venv_python)"
        echo "[venv] installing dependencies ..."
        "$VENV_PY" -m pip install --upgrade pip
        "$VENV_PY" -m pip install -r "$APP_DIR/requirements.txt"
    else
        echo "[error] neither uv nor '$PYTHON_BIN' found." >&2
        echo "        Simplest fix: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
        echo "        then re-run ./install.sh" >&2
        exit 1
    fi
    echo "[venv] done."
fi
VENV_PY="$(venv_python)"

# --- 2. Launch scripts ------------------------------------------------------
LAUNCHER="$APP_DIR/launch.sh"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
cd "$APP_DIR"
exec "$VENV_PY" run.py
EOF
chmod +x "$LAUNCHER"
echo "[launcher] $LAUNCHER"

if [ "$PLATFORM" = windows ]; then
    # A .bat is what a Windows shortcut can actually target -- launch.sh needs
    # Git Bash, the .bat runs from plain Explorer / cmd.
    cat > "$APP_DIR/launch.bat" <<'EOF'
@echo off
cd /d "%~dp0"
"%~dp0venv\Scripts\python.exe" run.py
EOF
    echo "[launcher] $APP_DIR/launch.bat"
fi

# --- 3. Clickable shortcut --------------------------------------------------

make_linux_shortcut() {
    DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Bureau")"
    [ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME/Desktop"
    [ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME"
    DESKTOP_FILE="$DESKTOP_DIR/threejs_editor.desktop"

    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Three.js Editor
Comment=Launches the 3D editor
Exec=$LAUNCHER
Icon=$ICON_PNG
Terminal=true
Categories=Development;Graphics;
EOF
    chmod +x "$DESKTOP_FILE"
    gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true   # GNOME: mark as trusted
    echo "[shortcut] $DESKTOP_FILE"
}

make_macos_app() {
    # A .desktop file means nothing here: macOS needs an .app bundle, which is
    # just a directory with a fixed layout. Double-clicking it runs launch.sh.
    DESKTOP_DIR="$HOME/Desktop"
    [ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME"
    APP_BUNDLE="$DESKTOP_DIR/Three.js Editor.app"
    rm -rf "$APP_BUNDLE"
    mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"

    cat > "$APP_BUNDLE/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>           <string>Three.js Editor</string>
    <key>CFBundleDisplayName</key>    <string>Three.js Editor</string>
    <key>CFBundleIdentifier</key>     <string>local.threejs.editor</string>
    <key>CFBundleVersion</key>        <string>1.0</string>
    <key>CFBundlePackageType</key>    <string>APPL</string>
    <key>CFBundleExecutable</key>     <string>launcher</string>
    <key>CFBundleIconFile</key>       <string>app_icon</string>
</dict>
</plist>
EOF

    cat > "$APP_BUNDLE/Contents/MacOS/launcher" <<EOF
#!/usr/bin/env bash
exec "$LAUNCHER"
EOF
    chmod +x "$APP_BUNDLE/Contents/MacOS/launcher"

    # Same source icon as Linux, converted with the stock macOS tools.
    if command -v sips >/dev/null 2>&1 && command -v iconutil >/dev/null 2>&1; then
        ICONSET="$(mktemp -d)/app_icon.iconset"
        mkdir -p "$ICONSET"
        # iconutil expects exactly these names.
        for spec in "16 icon_16x16" "32 icon_16x16@2x" "32 icon_32x32" "64 icon_32x32@2x" \
                    "128 icon_128x128" "256 icon_128x128@2x" "256 icon_256x256" \
                    "512 icon_256x256@2x" "512 icon_512x512" "1024 icon_512x512@2x"; do
            set -- $spec
            sips -z "$1" "$1" "$ICON_PNG" --out "$ICONSET/$2.png" >/dev/null 2>&1 || true
        done
        iconutil -c icns "$ICONSET" -o "$APP_BUNDLE/Contents/Resources/app_icon.icns" 2>/dev/null \
            || echo "[shortcut] icns conversion failed -> default icon"
    else
        echo "[shortcut] sips/iconutil missing -> default icon"
    fi
    echo "[shortcut] $APP_BUNDLE"
}

make_windows_shortcut() {
    # Windows needs an .ico. Rather than ship a second icon file, wrap the very
    # same PNG in an ICO container: Vista and later read PNG-compressed icons,
    # so a 22-byte header in front of the file is enough.
    ICON_ICO="$APP_DIR/static/img/app_icon.ico"
    "$VENV_PY" - "$ICON_PNG" "$ICON_ICO" <<'PY' || echo "[shortcut] ico conversion failed -> default icon"
import struct, sys
png = open(sys.argv[1], 'rb').read()
if png[:8] != b'\x89PNG\r\n\x1a\n':
    raise SystemExit('not a PNG')
w, h = struct.unpack('>II', png[16:24])          # IHDR width/height
b = lambda v: 0 if v >= 256 else v               # 0 means 256 in an ICO entry
hdr = struct.pack('<HHH', 0, 1, 1)               # reserved, type=icon, count=1
hdr += struct.pack('<BBBBHHII', b(w), b(h), 0, 0, 1, 32, len(png), 22)
open(sys.argv[2], 'wb').write(hdr + png)
PY

    # Git Bash speaks POSIX paths; the Windows shell needs native ones.
    WIN_BAT="$(cygpath -w "$APP_DIR/launch.bat" 2>/dev/null || echo "$APP_DIR/launch.bat")"
    WIN_DIR="$(cygpath -w "$APP_DIR" 2>/dev/null || echo "$APP_DIR")"
    WIN_ICO="$(cygpath -w "$ICON_ICO" 2>/dev/null || echo "$ICON_ICO")"

    powershell.exe -NoProfile -NonInteractive -Command "
        \$link = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Three.js Editor.lnk'
        \$s = (New-Object -ComObject WScript.Shell).CreateShortcut(\$link)
        \$s.TargetPath       = '$WIN_BAT'
        \$s.WorkingDirectory = '$WIN_DIR'
        \$s.IconLocation     = '$WIN_ICO'
        \$s.Description      = 'Launches the 3D editor'
        \$s.Save()
        Write-Output \$link
    " 2>/dev/null && echo "[shortcut] created on the Desktop" \
      || echo "[shortcut] PowerShell unavailable -> run launch.bat directly"
}

case "$PLATFORM" in
    linux)   make_linux_shortcut ;;
    macos)   make_macos_app ;;
    windows) make_windows_shortcut ;;
    *)       echo "[shortcut] unknown platform -> no shortcut, use ./launch.sh" ;;
esac

echo "Installation complete."
