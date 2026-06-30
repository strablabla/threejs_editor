# Éditeur de scènes 3D — bac à sable physique

Éditeur de scènes 3D dans le navigateur : on crée des objets (murs, cubes, sphères,
boîtes, chaînes de ressorts…) à la souris, au clavier ou **à la voix**, on les anime
avec un moteur physique (gravité newtonienne, collisions élastiques, ressorts), et
l'état est sauvegardé en JSON côté serveur.

- **Client** : [Three.js](https://threejs.org) (r75), jQuery, Bootstrap 3, Dropzone,
  [Artyom.js](https://github.com/sdkcarlos/artyom.js) (reconnaissance vocale).
  Toute la logique métier est dans `static/js/` (≈20 fichiers, **variables globales partagées**).
- **Serveur** : Flask + Flask-SocketIO. Sert la page et persiste les scènes en JSON.
- **Interface en anglais.**

---

## Prérequis

- **Python 3.8** (versions épinglées dans `requirements.txt`).
- **Chrome** recommandé.
- **Connexion Internet** : Three.js, socket.io et les polices viennent de CDN, et la
  reconnaissance vocale utilise l'API Web Speech de Google.

## Installation & lancement

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt   # appeler le venv directement évite les conflits conda/python2
mkdir -p static/old static/scenes            # dossiers d'état runtime
./venv/bin/python run.py
```

Au démarrage, **Chrome s'ouvre automatiquement** sur **http://localhost:5000** (repli
sur Chromium puis le navigateur par défaut si Chrome est absent). Le message
`no serial connection` est **normal** (accéléromètre série optionnel `/dev/ttyACM0`).

> Versions épinglées : le client embarque l'ancien `socket.io 1.3.5`, donc Flask-SocketIO 4.x
> (et Flask/Werkzeug anciens) est le combo compatible et testé.

---

## Interface

Barre de menus en haut, avec des **icônes + tooltips** ; chaque panneau s'ouvre **sous
son icône** (avec une flèche et une ombre), **un seul à la fois**, et se ferme par sa
**croix** ou en recliquant l'icône.

| Icône | Panneau | Rôle |
|---|---|---|
| 🎬 | **Scene** | nommer / sauvegarder / charger / effacer des scènes |
| 📦 | **Object** | sélecteur d'outil de création + paramètres par défaut |
| 👁 | **Views** | vues prédéfinies (flèches 3D) |
| 🔧 | **Tools** | distance, stats, **graphe d'énergie** |
| 🧲 | **Dynamics** | pilotage de la physique en direct |
| ? | **Help** | aide / raccourcis |
| ⏻ | **Quit** | arrête le serveur (route `/shutdown`), tout à droite de la barre |

Dans la barre : le **nom de l'outil actif** s'affiche à droite de 🧲 (cliquer dessus =
**no tool**), et le **nom de la scène** courante à gauche du `?`.

---

## Créer des objets

1. **Choisir un outil** — au choix :
   - panneau **Object** → liste déroulante (wall, cube, sphere, box, string…) ;
   - **clavier** : `o` sphère · `e` chaîne · `n` mur · `w` boîte · `m` cube texturé · `t` piste (appui = on, 2ᵉ appui = off ; `b` coupe tout) ;
   - **voix** : « cube », « boule », « mur », « boîte », « chaîne », « piste », « pavé », « plan », « pas d'outil ».
2. **Cliquer dans le plan** pour déposer l'objet (la **boîte** se dessine en 2 clics).

`TrackballControls` : rotation / zoom de la vue à la souris.

### Autres raccourcis clavier
`a` lancer l'animation · `x` play/pause · `c` cloner · `d` supprimer · `r` rotation ·
`s` sélectionner une zone · `p` sélection multiple · `g` déplacer un groupe ·
`h` plan horizontal · `i` infos objet · `k` position caméra · `u` relier deux objets
par un ressort · flèches haut/bas pour monter/descendre.

### Éditer un objet / un élastique (clic droit)
- **Clic droit sur un objet sélectionné (passé en vert)** → **menu contextuel** de ses
  attributs **éditables en direct** : `mass`, `opacity`, `friction`, `radius_interact`,
  `magnet`, `blocked`. Effet immédiat sur le moteur (ex. la masse influe sur la gravité
  newtonienne, les collisions, les ressorts) et **sauvegardé** avec la scène.
- **Clic droit sur un élastique** → menu de sa **raideur (`stiffness`)**. Chaque élastique
  a sa **propre raideur** (repli sur `harmonic_const`), donc une boule reliée par deux
  élastiques peut avoir **deux raideurs différentes**.

Le menu se ferme par sa **×** ou en cliquant ailleurs.

### Voix — pilotage
« animation » (démarre) · « stoppe l'animation » · « reprends l'animation » ·
« vitesse zéro ».

---

## Physique

Le moteur utilise un intégrateur **Velocity Verlet symplectique** (énergie bornée, pas
de dérive) pour les forces lisses ; collisions, rebonds murs et sol sont des
**impulsions** appliquées après le pas Verlet.

Réglages en direct dans le panneau **Dynamics** :

- **Gravity (z)** — gravité verticale. **Décochée = mode planaire** : `z` est figé, la
  scène n'évolue qu'en x-y (utile pour les chaînes).
- **Springs (chains)** — forces de ressort des chaînes (longueur au repos `lenght_spring`).
- **Object interaction (1/r²)** — **gravité newtonienne** entre objets :
  `F = G·mᵢ·mⱼ / r²`. Les masses comptent (un objet lourd attire plus). Boutons
  **Attraction / Repulsion** (signe) et **Strength** (la constante `G`).
- **Random initial velocity** + **Velocity strength** — vitesse de départ aléatoire
  **symétrique** (centrée sur 0) d'intensité réglable, injectée **à la création** de
  chaque boule (ou départ à 0 si décochée).

### Murs & boîtes
- **boîte** (`w` / « boîte ») → enceinte de **4 murs réfléchissants** (`wall_box`),
  actifs automatiquement : les boules rebondissent dessus.
- **mur** (« mur ») isolé → panneau décoratif (ne réfléchit pas).
- Un objet **bloqué** (`blocked`) devient une **ancre statique** (mur, ou point fixe
  d'une chaîne de ressorts).

---

## Diagnostic d'énergie

`Tools → ☑ energy graph` affiche un **graphe temporel** (en bas à gauche) des énergies
**total / cinétique / potentielle**, avec axe gradué (unités arbitraires). La potentielle
inclut la **gravité uniforme (z) + la gravité newtonienne (−G·mᵢ·mⱼ/r)** et l'élastique
`½·k·(L−L₀)²`. Avec Verlet, la courbe **totale doit rester quasi constante** — c'est le
diagnostic de conservation.

---

## Scènes (sauvegarde / chargement)

Panneau **Scene** :

- **pos.json** (état de travail) est **auto-sauvegardé à chaque relâchement de souris**
  → la scène courante est rechargée au rafraîchissement.
- **Save as** *(nom)* → fige la scène dans `static/scenes/<nom>.json`. **Les scènes
  nommées ne sont écrites QUE sur sauvegarde explicite** (pas par l'auto-save), donc
  recharger une scène nommée rend **exactement l'état sauvegardé**.
- **💾 Save as** *(nom)* archive ; **⤓ Load** recharge la scène **sélectionnée dans la
  liste déroulante** (état figé) ; **❌ remove** la supprime — boutons à **icônes + tooltips**.
  À l'ouverture du panneau, la liste se **positionne sur la scène courante**.
- **New scene** → archive la scène courante (si nommée) puis repart à vide.
- **Clear** (tooltip *clear the scene*) → vide l'éditeur.
- **Quit** est désormais l'icône **⏻** dans la navbar (et non plus dans ce panneau).

Sphères, **chaînes de ressorts** (liaisons reconstruites) et **boîtes** (`wall_box`)
sont persistées. Une copie horodatée de l'ancien `pos.json` est gardée dans `static/old/`.

> Les fichiers de scènes runtime (`static/scenes/*.json`, `static/pos.json`) sont
> **ignorés par git** (voir `.gitignore`).

---

## Vues

Panneau **Views** :
- **3D directions** → affiche 5 **flèches 3D** (une par vue), atténue les objets à 0,5 ;
  **cliquer une flèche** applique la vue correspondante et restaure l'opacité.
- **Maj+D** → ouvre un **menu contextuel** (à la souris) avec la case **« Show view
  arrows »** pour afficher / masquer ces flèches sans passer par le panneau (2ᵉ appui =
  ferme). *(`d` seul reste la suppression d'objet ; Maj+D ne supprime pas.)*
- « mouse keys navigation ».

---

## Routes serveur (`run.py`)

| Route | Rôle |
|---|---|
| `/` | page principale |
| `/upload_file` | upload de textures (Dropzone) |
| `/scenes` | liste des scènes nommées |
| `/scene/<nom>` | charge une scène (et la copie dans `pos.json`) |
| `/scene_delete/<nom>` | supprime une scène |
| `/shutdown` | arrête le serveur |
| socket `message` / `begin` | sauvegarde / restitution de l'état |

---

## Schéma du programme

### Arborescence des modules

```
threejs_editor/
├── run.py                          Serveur Flask + SocketIO
│   ├── routes  /  /upload_file  /scenes  /scene/<nom>  /scene_delete  /shutdown
│   ├── socket  message (sauvegarde)  ·  begin (restitution)
│   └── open_browser()              ouverture auto de Chrome
│
├── templates/
│   ├── moving_walls.html           page principale — charge tous les JS dans l'ordre
│   ├── main_menus.html             navbar : 🎬 📦 👁 🔧 🧲  …  ?  ⏻
│   ├── secondary_menus.html
│   ├── interface.html              dialogue maison + menus contextuels (objet / élastique)
│   └── panel_*.html                scene · object · views · tools · interaction · one_object
│
├── static/
│   ├── js/                         (variables GLOBALES partagées entre fichiers)
│   │   ├── init_scene.js           construction scène + save/load (get_scene_data, load_scene)
│   │   ├── scene_params.js         constantes physiques & flags globaux
│   │   ├── objects_animation.js    MOTEUR PHYSIQUE (Verlet, gravité, ressorts, énergies+graphe)
│   │   ├── basic_objects.js  ┐
│   │   ├── objects_from_basic.js ├ fabriques d'objets 3D (sphère, mur, cube, élastique…)
│   │   ├── make_objects.js   ┘
│   │   ├── *_interact.js           souris/clavier : sélection, magnétisme, pistes, groupes, vues
│   │   ├── keys.js / keys_interactions1.js   raccourcis clavier
│   │   └── interaction_voice.js    commandes vocales (Artyom)
│   ├── pos.json                    état de travail (auto-save à chaque relâchement souris)
│   ├── scenes/*.json               scènes nommées (figées sur « Save as »)
│   └── old/*.json                  copies horodatées de pos.json
│
├── requirements.txt   ·   README.md   ·   .gitignore
```

### Flux d'exécution (boucle d'animation)

```
animate()                              boucle de rendu (requestAnimationFrame)
├── controls.update()                  caméra (TrackballControls)
├── renderer.render(scene, camera)
└── si animation active :
    ├── compute_accelerations()        a = F/m pour chaque objet mobile
    │   ├── gravité (z constant, ou 0 en mode planaire)
    │   ├── accel_attraction()         gravité newtonienne  G·mᵢ·mⱼ / r²
    │   └── accel_spring()             ressorts  −k·(L−L₀)   (k = raideur propre, repli global)
    ├── verlet_positions()             x(t+dt)  ← Velocity Verlet
    ├── compute_accelerations()        a(t+dt)
    ├── verlet_velocities()            v(t+dt)
    ├── interactions_between_objects()  collisions + rebonds murs (impulsions)
    ├── ground_bounce()                rebond sur le sol (impulsion)
    └── energy_calculation()           cinétique + potentielle → graphe d'énergie
```

---

## Structure

| Chemin | Rôle |
|---|---|
| `run.py` | Serveur Flask + SocketIO (page, routes scènes, upload, shutdown) + ouverture auto du navigateur |
| `templates/moving_walls.html` | Page principale ; inclut tous les modules JS |
| `templates/main_menus.html`, `panel_*.html`, `interface.html` | Barre de menus + panneaux + dialogue Bootstrap maison |
| `static/js/init_scene.js` | Construction de la scène, sauvegarde/chargement (`get_scene_data`, `load_scene`) |
| `static/js/objects_animation.js` | Moteur physique : **Velocity Verlet**, gravité newtonienne, ressorts, collisions, **énergies + graphe** |
| `static/js/scene_params.js` | Paramètres globaux (constantes physiques, flags) |
| `static/js/basic_objects.js`, `objects_from_basic.js`, `make_objects.js` | Fabriques d'objets 3D |
| `static/js/*_interact.js` | Interactions souris/clavier (sélection, magnétisme, pistes, groupes, vues…) |
| `static/js/keys.js`, `keys_interactions1.js` | Raccourcis clavier |
| `static/js/interaction_voice.js` | Commandes vocales (Artyom) |
| `static/css/moving_walls.css` | Styles (panneaux, icônes, graphe…) |

---

## Remarques

- Toute la logique partage des **variables globales** (d'où le découpage en nombreux
  petits fichiers chargés dans l'ordre par `moving_walls.html`).
- `library/game.js` et `templates/tests/` sont des modules/assets **hérités, non utilisés**.
- Réglages physiques principaux dans `static/js/scene_params.js` :
  `gravity_ok`, `springs_ok`, `one_over_r2`, `attract_strength_one_over_r2` (G),
  `harmonic_const`, `lenght_spring`, `random_initial_speed`, `random_speed_module`.
