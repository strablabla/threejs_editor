# Éditeur de scènes 3D — bac à sable physique

Éditeur de scènes 3D dans le navigateur : on crée des objets (murs, cubes, sphères,
pistes, ressorts…) à la souris ou **à la voix** (en français), on les anime avec un
petit moteur physique (gravité, collisions élastiques, attraction en 1/r², ressorts),
et l'état de la scène est sauvegardé en JSON côté serveur.

- **Client** : [Three.js](https://threejs.org) (r75), jQuery, Bootstrap, Dropzone,
  [Artyom.js](https://github.com/sdkcarlos/artyom.js) pour la reconnaissance vocale.
  Toute la logique métier est dans `static/js/` (≈20 fichiers, variables globales partagées).
- **Serveur** : Flask + Flask-SocketIO. Sert la page et persiste l'état de la scène en JSON.

## Prérequis

- **Python 3.8** (versions épinglées dans `requirements.txt`).
- **Chrome** recommandé côté navigateur.
- **Une connexion Internet** : Three.js, socket.io et les polices sont chargés depuis
  des CDN, et la reconnaissance vocale utilise l'API Web Speech de Google.

## Installation

```bash
python3 -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

Créer les dossiers de sauvegarde (sinon l'enregistrement de scène échoue) :

```bash
mkdir -p static/old static/scenes
```

## Lancement

```bash
python run.py
```

Puis ouvrir **http://localhost:5000** dans Chrome.

Le message `no serial connection` est **normal** : c'est la connexion accéléromètre
série optionnelle (`/dev/ttyACM0`), inutile pour un usage standard.

## Utilisation

- **Souris** : sélectionner un outil (clavier ou voix) puis cliquer dans le plan pour
  créer l'objet. `TrackballControls` permet de tourner / zoomer la vue.
- **Raccourcis clavier** (voir `static/js/init_scene.js`) :
  `c` cloner · `d` supprimer · `r` rotation · `s` sélectionner une zone ·
  `p` sélection multiple · `g` déplacer un groupe · `h` plan horizontal ·
  `i` infos objet · `l` cube simple · `m` cube texturé · `n` mur ·
  flèches haut/bas pour monter/descendre.
- **Commandes vocales** (français, voir `static/js/interaction_voice.js`) :
  « cube », « boule », « mur », « piste », « pavé », « plan », « chaîne »… pour
  choisir l'outil ; « animation », « stoppe l'animation », « reprends l'animation »,
  « vitesse nulle » pour piloter la simulation.

## Sauvegarde

À chaque relâchement de souris, le client envoie tout l'état au serveur via SocketIO,
qui l'écrit dans `static/pos.json` (copie horodatée dans `static/old/`, et dans
`static/scenes/<nom>.json` si la scène est nommée). À l'ouverture suivante, la scène
est rechargée automatiquement.

## Structure

| Chemin | Rôle |
|---|---|
| `run.py` | Serveur Flask + SocketIO (page, sauvegarde JSON, upload textures) |
| `templates/moving_walls.html` | Page principale ; inclut tous les modules JS |
| `static/js/init_scene.js` | Construction de la scène, chargement/sauvegarde |
| `static/js/objects_animation.js` | Moteur physique (gravité, collisions, ressorts, énergies) |
| `static/js/basic_objects.js`, `objects_from_basic.js`, `make_objects.js` | Fabriques d'objets 3D |
| `static/js/*_interact.js` | Interactions souris/clavier (sélection, magnétisme, pistes, groupes…) |
| `static/js/interaction_voice.js` | Commandes vocales (Artyom) |
| `static/js/scene_params.js` | Paramètres globaux (constantes physiques, couleurs, flags d'outils) |

## Remarques

- Les versions de `requirements.txt` sont épinglées car le client embarque l'ancien
  `socket.io 1.3.5` ; Flask-SocketIO 4.x (et donc Flask/Werkzeug anciens) reste le
  combo compatible et testé.
- `library/game.js` (gamepad / AngularJS) est un module hérité, non utilisé par la page principale.
