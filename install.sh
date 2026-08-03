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
# Le venv est considéré valide seulement si les dépendances y sont réellement
# importables : un venv créé à moitié (ensurepip manquant) a bien un bin/python
# mais rien dedans, et faisait passer l'ancien test à tort.
if [ -x "$VENV_DIR/bin/python" ] && "$VENV_DIR/bin/python" -c 'import flask, eventlet' 2>/dev/null; then
    echo "[venv] déjà présent et fonctionnel -> pas de réinstallation ($VENV_DIR)"
else
    [ -e "$VENV_DIR" ] && { echo "[venv] venv incomplet -> suppression"; rm -rf "$VENV_DIR"; }

    # eventlet 0.30.2 importe le module 'imp', supprimé en Python 3.12 : il faut
    # vraiment du 3.8. uv sait le télécharger tout seul, sans sudo ni apt.
    UV_BIN="$(command -v uv || echo "$HOME/.local/bin/uv")"

    if [ -x "$UV_BIN" ]; then
        echo "[venv] création avec uv (Python 3.8) ..."
        "$UV_BIN" venv --python 3.8 "$VENV_DIR"
        echo "[venv] installation des dépendances ..."
        "$UV_BIN" pip install --python "$VENV_DIR/bin/python" pip -r "$APP_DIR/requirements.txt"
    elif command -v "$PYTHON_BIN" >/dev/null 2>&1; then
        echo "[venv] création avec $PYTHON_BIN ..."
        "$PYTHON_BIN" -m venv "$VENV_DIR"
        echo "[venv] installation des dépendances ..."
        "$VENV_DIR/bin/python" -m pip install --upgrade pip
        "$VENV_DIR/bin/python" -m pip install -r "$APP_DIR/requirements.txt"
    else
        echo "[erreur] ni uv ni '$PYTHON_BIN' trouvés." >&2
        echo "         Le plus simple : curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
        echo "         puis relance ./install.sh" >&2
        exit 1
    fi
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
