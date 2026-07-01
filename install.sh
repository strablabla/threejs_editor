#!/usr/bin/env bash
#
# Installe le venv (une seule fois) et crée un raccourci bureau pour lancer l'appli.
# Relançable sans risque : si le venv existe déjà il n'est pas réinstallé.
#
set -euo pipefail

# --- Emplacements -----------------------------------------------------------
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # racine du projet
VENV_DIR="$APP_DIR/venv"
PYTHON_BIN="${PYTHON_BIN:-python3.8}"                     # surchargeable : PYTHON_BIN=python3 ./install.sh
ICON="$APP_DIR/static/img/app_icon.png"

# --- 1. venv ----------------------------------------------------------------
if [ -d "$VENV_DIR" ] && [ -x "$VENV_DIR/bin/python" ]; then
    echo "[venv] déjà présent -> pas de réinstallation ($VENV_DIR)"
else
    if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
        echo "[erreur] '$PYTHON_BIN' introuvable. Installe-le ou lance : PYTHON_BIN=python3 ./install.sh" >&2
        exit 1
    fi
    echo "[venv] création avec $PYTHON_BIN ..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
    echo "[venv] installation des dépendances ..."
    "$VENV_DIR/bin/python" -m pip install --upgrade pip
    "$VENV_DIR/bin/python" -m pip install -r "$APP_DIR/requirements.txt"
    echo "[venv] terminé."
fi

# --- 2. Script de lancement -------------------------------------------------
LAUNCHER="$APP_DIR/launch.sh"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
cd "$APP_DIR"
exec "$VENV_DIR/bin/python" run.py
EOF
chmod +x "$LAUNCHER"
echo "[launcher] $LAUNCHER"

# --- 3. Raccourci bureau (.desktop) -----------------------------------------
DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Bureau")"
[ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME/Desktop"
[ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME"
DESKTOP_FILE="$DESKTOP_DIR/threejs_editor.desktop"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Three.js Editor
Comment=Lance l'éditeur 3D
Exec=$LAUNCHER
Icon=$ICON
Terminal=true
Categories=Development;Graphics;
EOF
chmod +x "$DESKTOP_FILE"

# Autorise le lancement depuis GNOME (marque comme "de confiance")
gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true

echo "[raccourci] $DESKTOP_FILE"
echo "Installation terminée. Double-clique sur le raccourci « Three.js Editor » du bureau."
