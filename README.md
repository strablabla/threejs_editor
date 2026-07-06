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

### Installation automatique (recommandé)

```bash
./install.sh
```

Le script `install.sh` :

- **crée le venv** avec `python3.8` **seulement s'il n'existe pas** (relançable sans risque : un venv déjà présent n'est pas réinstallé) et installe `requirements.txt` ;
- génère `launch.sh`, un lanceur qui active le venv et démarre `run.py` ;
- pose un **raccourci sur le bureau** (`~/Bureau/threejs_editor.desktop`) avec l'icône de l'appli, prêt à l'emploi (double-clic).

Sur une machine où `python3.8` n'est pas le binaire par défaut, forcer une autre version :

```bash
PYTHON_BIN=python3 ./install.sh
```

### Installation manuelle

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
| 🔧 | **Tools** | distance, propriétés de groupe, stats de zone |
| 🧲 | **Dynamics** | pilotage de la physique en direct — onglets **Interactions / Initial speeds / Monitoring** |
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
2. **Cliquer dans le plan** pour déposer l'objet (la **boîte** se dessine en 2 clics). Les
   boules sont déposées **coplanaires** (plan `z = 0`) et **roses** par défaut.

`TrackballControls` : rotation / zoom de la vue à la souris.

### Autres raccourcis clavier
`a` lancer l'animation · `x` play/pause · `c` cloner · `d` supprimer · `r` rotation ·
`s` sélectionner une zone · `p` sélection multiple · `g` déplacer un groupe ·
`h` plan horizontal · `i` infos objet · `k` position caméra · `u` relier deux objets
par un ressort · flèches haut/bas pour monter/descendre.
**Ctrl+Z** annuler · **Ctrl+Y** (ou **Ctrl+Maj+Z**) rétablir.

### Éditer un objet / un élastique (clic droit)
Le **clic droit** ouvre **seulement** le menu contextuel — il n'attrape pas l'objet (pas
de déplacement).
- **Clic droit sur un objet** → **menu contextuel** de ses attributs **éditables en
  direct** : `mass`, **`vx` / `vy` / `vz`** (composantes de vitesse), `opacity`,
  **`color`**, `friction`, `radius_interact`, `radius` (sphères), `magnet`, `blocked`,
  **`trajectory`**. Effet immédiat sur le moteur et **sauvegardé** avec la scène.
- **Case « all »** (sphères) : quand elle est cochée, **chaque** modification d'attribut
  (masse, vitesse, couleur, rayon…) s'applique à **toutes** les boules d'un coup ; sinon à
  la seule boule cliquée.
- **Couleur** : sélecteur de couleur ; la teinte est propre à l'objet (le matériau est
  dupliqué au besoin, donc les autres ne changent pas) et **persistée**.
- **Rayon des boules** (`radius`, sphères) : glissière qui met à jour le **visuel**, le
  **rayon de collision** (contact = somme des rayons) et le **rebond sol** ; **persisté**.
- **`trajectory`** : suit la trajectoire de cette boule (voir *Trajectoires & MSD*).
- **Clic droit sur un élastique** → menu de sa **raideur (`stiffness`)**. Chaque élastique
  a sa **propre raideur** (repli sur `harmonic_const`), donc une boule reliée par deux
  élastiques peut avoir **deux raideurs différentes**.

Le menu se ferme par sa **×** ou en cliquant ailleurs. Les couleurs des objets sont
**préservées pendant l'animation** (pas de recoloration automatique).

### Voix — pilotage
« animation » (démarre) · « stoppe l'animation » · « reprends l'animation » ·
« vitesse zéro ».

---

## Physique

Le moteur utilise un intégrateur **Velocity Verlet symplectique** (énergie bornée, pas
de dérive) pour les forces lisses ; collisions, rebonds murs et sol sont des
**impulsions** appliquées après le pas Verlet.

Tout est **3D** en permanence (pas de « mode planaire » qui figerait `z`). La gravité est
une **simple force optionnelle**. Un **nuage coplanaire reste coplanaire** tout seul (les
normales de choc n'ont pas de composante `z`), donc un gaz 2D se comporte comme tel sans
traitement spécial — et l'énergie est **réellement conservée**.

Réglages en direct dans le panneau **Dynamics**, organisé en **trois onglets** :

**Onglet « Interactions »**
- **Gravity (z)** — gravité verticale. **Décochée** = pas de force de gravité (ni de sol) ;
  la scène évolue librement en 3D.
- **Springs (chains)** — forces de ressort des chaînes (longueur au repos `lenght_spring`).
- **Object interaction (1/r²)** — **gravité newtonienne** entre objets, **adoucie**
  (softening de Plummer) : `F = G·mᵢ·mⱼ · r / (r²+ε²)^{3/2}`. Les masses comptent (un
  objet lourd attire plus). Boutons **Attraction / Repulsion** (signe), **Strength**
  (glissière réglant `G`) et **Softening ε** (glissière) : `ε = 0` → 1/r² pur ; `ε > 0`
  supprime la singularité à courte distance et **stabilise l'énergie** (voir *Collisions*).
- **deactivate the interactions** — case maîtresse : désactive/réactive **toutes** les
  interactions ci-dessus d'un coup (cochée automatiquement si aucune n'est active).

**Onglet « Initial speeds »**
- **Random** + **Strength** — vitesse de départ aléatoire **symétrique** (centrée sur 0,
  loi quasi-gaussienne) d'intensité réglable, injectée **à la création** de chaque boule
  (ou départ à 0 si décochée / Strength = 0).
- **z component** — ajoute une composante `z` à la vitesse initiale (sinon dans le plan x-y).
- **reinitialize all** — réattribue la vitesse de **toutes** les boules selon les
  paramètres ci-dessus, pour **relancer une simulation de zéro** à tout moment (Random
  décoché ⇒ toutes à l'arrêt). Ne touche pas aux positions.
- **flatten z=0** — projette toutes les boules sur le plan `z = 0` et met `vz = 0`. Utile
  pour **nettoyer** une scène dont les positions z auraient dérivé et retrouver un **gaz
  parfaitement plan** (qui le reste ensuite, cf. ci-dessus).

**Onglet « Monitoring »** — cases `energy graph` et `velocity histogram` (voir plus bas).

### Collisions
- **Bille-bille** : collision **élastique** résolue par **impulsion le long de la ligne
  des centres** (seule la composante normale de la vitesse relative est inversée ;
  tangentielle inchangée) → conserve quantité de mouvement **et** énergie, et **thermalise**
  vers Maxwell-Boltzmann. Le contact est détecté à la **somme des rayons réels** des billes.
- **Dé-pénétration** : à chaque choc, les billes qui se chevauchent sont **écartées à la
  distance de contact** (réparties selon leur inverse-masse), pour que le rebond ait
  toujours lieu à la même profondeur — sinon une interpénétration variable **pompe de
  l'énergie**. Les **objets bloqués** (ancres) agissent comme des murs immobiles.
- **Rayon des billes** réglable par clic droit (voir plus haut) ; il pilote à la fois la
  taille et la distance de contact.

#### Conservation de l'énergie avec la gravité 1/r²
Une force **1/r² pure est singulière** : en rencontre proche, l'accélération explose et le
pas de temps fixe de Verlet ne la résout plus → l'énergie **dérive**. Deux remèdes sont en
place : le **softening ε** (borne la force à courte distance) et la **dé-pénétration** des
chocs. Avec `ε > 0`, la courbe d'énergie **totale** reste bien plus plate. Si elle dérive
encore avec un `G` très fort, **augmenter ε** (ou réduire le pas de temps).

### Murs, sol & boîtes
- **boîte** (`w` / « boîte ») → enceinte de **4 murs latéraux réfléchissants** (`wall_box`,
  normales en x-y). Pas de plafond/plancher : sans gravité, rien ne confine en `z` (une
  scène plane le reste, mais un mouvement z volontaire n'est pas borné).
- **Murs durs (anti-tunneling)** : détection **continue** (on teste si le centre a franchi
  le plan du mur pendant le pas) + **repositionnement** de la bille du bon côté à distance
  = son rayon, puis réflexion élastique. Une bille **ne peut jamais traverser** une paroi,
  même à grande vitesse.
- **Sol** (uniquement si `Gravity` est cochée) : la bille **repose pile dessus** (seuil au
  rayon) et n'est réfléchie **que si elle descend** — elle ne peut plus être piégée sous le
  sol ni « s'enfoncer ».
- **mur** (« mur ») isolé → panneau décoratif (ne réfléchit pas).
- Un objet **bloqué** (`blocked`) devient une **ancre statique** (mur, ou point fixe
  d'une chaîne de ressorts), et agit comme un obstacle immobile dans les chocs.

---

## Diagnostic d'énergie

`Dynamics → Monitoring → ☑ energy graph` affiche un **graphe temporel** (en bas à gauche) des énergies
**total / cinétique / potentielle**, avec axe gradué (unités arbitraires). La potentielle
inclut la **gravité uniforme (z) + la gravité newtonienne (−G·mᵢ·mⱼ/r)** et l'élastique
`½·k·(L−L₀)²`. Avec Verlet, la courbe **totale doit rester quasi constante** — c'est le
diagnostic de conservation.

## Distribution des vitesses

`Dynamics → Monitoring → ☑ velocity histogram` affiche (en bas à droite) un **histogramme instantané** des
**normes de vitesse** `|v|` des objets massifs mobiles (mêmes exclusions que l'énergie
cinétique : ni statiques/ancres, ni ressorts/élastiques/pions). Axe X = `|v|` (0 → max
courant, échelle auto), axe Y = nombre d'objets par classe (20 classes). Le **nombre
total d'objets comptés** est affiché en haut à droite (`N = …`). Il se dessine **dès
qu'on coche la case** puis se met à jour à chaque frame pendant l'animation.

## Trajectoires & MSD

`Dynamics → Monitoring → ☑ trajectories` ouvre une fenêtre (en haut à gauche) à **deux
canvas** :
- **Trajectories** : le **chemin x-y** de chaque boule suivie (échelle isotrope, point =
  position courante) ;
- **MSD** : le **déplacement quadratique moyen `|r−r₀|²`** en fonction du temps, une
  courbe par trajectoire — signature du régime **balistique** (∝ t²) aux temps courts puis
  **diffusif** (∝ t) aux temps longs (mouvement brownien).

On choisit **quelles** boules suivre via la case **`trajectory`** de leur menu contextuel
(clic droit). Le bouton **reset** (dans la fenêtre) réinitialise tous les tracés et refixe
l'origine `r₀`. L'historique n'est pas plafonné (borne mémoire ~200 000 pts) et le tracé
est **décimé** pour rester fluide.

---

## Scènes (sauvegarde / chargement)

Panneau **Scene** :

- **pos.json** (état de travail) est **auto-sauvegardé à chaque relâchement de souris**
  → la scène courante est rechargée au rafraîchissement. Il est **non versionné**
  (dans `.gitignore`) ; sur un dépôt fraîchement cloné, l'appli démarre sur une **scène
  vide** puis le recrée au premier enregistrement.
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

### Undo / redo (Ctrl+Z / Ctrl+Y)
Chaque changement validé (relâchement de souris) enregistre un **snapshot** de la scène.
**Ctrl+Z** revient en arrière, **Ctrl+Y** (ou **Ctrl+Maj+Z**) avance. L'historique est
**propre à chaque scène** (clé = nom de scène) et stocké en **localStorage** : il **survit
au rafraîchissement** de la page. Une simple rotation caméra ne crée pas d'entrée
(dédoublonnage) ; profondeur bornée (`HISTORY_MAX`).

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
│   ├── create_3d.html           page principale — charge tous les JS dans l'ordre
│   ├── main_menus.html             navbar : 🎬 📦 👁 🔧 🧲  …  ?  ⏻
│   ├── secondary_menus.html
│   ├── interface.html              dialogue maison + menus contextuels (objet / élastique)
│   └── panel_*.html                scene · object · views · tools · interaction · one_object
│
├── static/
│   ├── js/                         (variables GLOBALES partagées entre fichiers)
│   │   ├── init_scene.js           construction scène + save/load (get_scene_data, load_scene)
│   │   ├── scene_history.js        undo/redo par scène (Ctrl+Z / Ctrl+Y, localStorage)
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
| `install.sh` | Installe le venv (si absent) + génère `launch.sh` + pose le raccourci bureau |
| `launch.sh` | Lanceur généré : active le venv et démarre `run.py` (utilisé par le raccourci) |
| `static/img/app_icon.svg`, `app_icon.png` | Icône de l'appli (raccourci bureau) |
| `run.py` | Serveur Flask + SocketIO (page, routes scènes, upload, shutdown) + ouverture auto du navigateur |
| `templates/create_3d.html` | Page principale ; inclut tous les modules JS |
| `templates/main_menus.html`, `panel_*.html`, `interface.html` | Barre de menus + panneaux + dialogue Bootstrap maison |
| `static/js/init_scene.js` | Construction de la scène, sauvegarde/chargement (`get_scene_data`, `load_scene`) |
| `static/js/objects_animation.js` | Moteur physique : **Velocity Verlet**, gravité newtonienne, ressorts, collisions, **énergies + graphe** |
| `static/js/scene_params.js` | Paramètres globaux (constantes physiques, flags) |
| `static/js/basic_objects.js`, `objects_from_basic.js`, `make_objects.js` | Fabriques d'objets 3D |
| `static/js/*_interact.js` | Interactions souris/clavier (sélection, magnétisme, pistes, groupes, vues…) |
| `static/js/keys.js`, `keys_interactions1.js` | Raccourcis clavier |
| `static/js/interaction_voice.js` | Commandes vocales (Artyom) |
| `static/css/create_3d.css` | Styles (panneaux, icônes, graphe…) |

---

## Remarques

- Toute la logique partage des **variables globales** (d'où le découpage en nombreux
  petits fichiers chargés dans l'ordre par `create_3d.html`).
- **Cache navigateur désactivé** : `run.py` envoie des en-têtes `no-store, no-cache` sur
  toutes les réponses (+ `SEND_FILE_MAX_AGE_DEFAULT = 0`), pour que chaque rechargement
  serve **toujours** les derniers JS/CSS modifiés (fini les `Ctrl+Shift+R`).
- `library/game.js` et `templates/tests/` sont des modules/assets **hérités, non utilisés**.
- Réglages physiques principaux dans `static/js/scene_params.js` :
  `gravity_ok`, `springs_ok`, `one_over_r2`, `attract_strength_one_over_r2` (G),
  `harmonic_const`, `lenght_spring`, `random_initial_speed`, `random_speed_module`.
