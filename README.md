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
`a` lancer l'animation · `x` play/pause · `d` supprimer · `r` rotation ·
`p` sélection multiple · `h` plan horizontal · `i` infos objet · `k` position caméra ·
`u` relier deux objets par un ressort · flèches haut/bas pour monter/descendre.
**Ctrl+Z** annuler · **Ctrl+Y** (ou **Ctrl+Maj+Z**) rétablir.
**Ctrl+C** copier · **Ctrl+V** coller (voir *Copier / coller* ci-dessous).

### Copier / coller (Ctrl+C / Ctrl+V)
**Ctrl+C** copie, **Ctrl+V** colle **sous la souris** (le barycentre des copiés est recollé
à la position du curseur, disposition relative conservée ; l'altitude `z` est préservée).
La cible copiée est choisie ainsi, par priorité :
1. **Souris dans une zone de sélection** → **tous les objets sélectionnés** de la zone.
2. Sinon, **objet survolé** : s'il appartient à un **groupe persistant**, c'est **tout le
   groupe** qui est copié ; sinon, l'objet **seul**.

Les copies reçoivent de **nouveaux noms** ; si l'original était un groupe persistant, la
copie forme un **nouveau groupe indépendant** (nouveau `group_id`). De même, une **boîte
copiée devient une boîte neuve et indépendante** (nouveau `box_id` partagé par ses 4 parois),
sans lien avec la boîte d'origine. Types copiables : sphères, cubes, pavés, murs, boîtes (ni
ressorts, ni pions, ni couvercles). Le collage est **persisté** avec la scène. *(Remplace
l'ancien clone rapide sur « c ».)*

### Sélection & groupes (Ctrl+S / Ctrl+G / Ctrl+Maj+G)
- **Ctrl+S** — **zone de sélection** : clique-glisse un rectangle (coins = **marques noires**,
  bords en **pointillés**) ; les objets dedans passent en **rose**. Activer une sélection
  **coupe les outils de création** (on trace la zone au lieu de créer). **Ré-appui Ctrl+S**
  → **efface** la sélection (pointillés, coins, couleurs).
  - **Redimensionner** : **glisser un coin noir** redessine la zone et **recalcule** les
    objets sélectionnés (entrants en rose, sortants restaurés).
- **Ctrl+G** — **déplacer le groupe** : la sélection passe en **bleu** ; glisser **n'importe
  quel membre** — y compris une **paroi de boîte** (pourtant fixe hors sélection) — déplace
  **tout le groupe**, et les **pointillés et les coins suivent** aussi.
  **Ré-appui** → dégroupe (retour au rose).
- **Ctrl+Maj+G** — **groupe PERSISTANT** : les objets sélectionnés reçoivent un `group_id`
  partagé (marqués en **violet** comme retour visuel). **À la désélection, les couleurs
  d'origine reviennent** (le violet n'est pas permanent). Ensuite, **glisser un membre
  déplace tout le groupe en bloc**, à tout moment. Mais dans la **physique ils restent
  indépendants** (collisions, gravité… ne tiennent pas compte du groupe). **Ré-appui** (sur
  une re-sélection du groupe) → dégroupe. Le `group_id` est **sauvegardé** avec la scène.
  Tant que la zone de sélection est présente, elle **suit le groupe** (pointillés + coins se
  déplacent avec lui, comme pour le groupe temporaire).
  - **Voir le groupe** : clic droit sur un membre — **boule, cube ou paroi de boîte** —
    → bascule **« coloration groupe »** pour (dés)activer le violet et repérer d'un coup
    d'œil qui appartient au groupe.

Convention de couleur : **rose** = sélectionné · **bleu** = groupe temporaire (Ctrl+G) ·
**violet** = groupe persistant (Ctrl+Maj+G) · couleur d'origine sinon.

### Éditer un objet / un élastique (clic droit)
Le **clic droit** ouvre **seulement** le menu contextuel — il n'attrape pas l'objet (pas
de déplacement).
- **Clic droit sur un objet** → **menu contextuel** de ses attributs **éditables en
  direct**, organisé en **trois onglets** :
  - **Attributes** : `mass`, `opacity`, **`color`**, `radius` (sphères) ;
  - **Dynamics** : **`vx` / `vy` / `vz`** (composantes de vitesse), `friction`, `radius_interact` ;
  - **Miscellaneous** : `magnet`, `blocked`, **`trajectory`** (+ *coloration groupe* si l'objet
    appartient à un groupe persistant).

  Effet immédiat sur le moteur et **sauvegardé** avec la scène.
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
- **Clic droit sur une paroi de boîte** → menu **« box wall »** : `opacity` (de la paroi),
  **movable** (autorise/bloque le déplacement de la boîte), **box height** (hauteur de la
  boîte, redimensionne les 4 parois), **add balls** (ajoute N boules aléatoires **dans** la
  boîte, N réglable), **add lid / remove lid** (couvercle). Si **movable** est coché, on
  **glisse la boîte** (parois **+ couvercle**) en bloc à la souris ; l'option et les
  positions sont **persistées**.
- **Clic droit sur un couvercle** → menu **« lid »** : `opacity` du couvercle.

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
- **Fast collisions (cell lists, O(n))** — accélère les collisions via une **grille
  spatiale** au lieu de tester toutes les paires (voir *Performance* ci-dessous). Le
  résultat est **physiquement identique** — c'est un simple filtrage des paires, sans
  approximation. Utile surtout au-delà de quelques centaines de billes.
- **Fast attraction (Barnes-Hut, O(n log n))** + glissière **θ** — accélère l'attraction
  1/r² par **octree** (voir *Performance*). **Approximation** réglée par θ (défaut 0.5) ;
  repli automatique sur l'exact en dessous de 64 corps.

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

### Performance (grand nombre d'objets)
Le coût par frame est dominé par les boucles sur les **paires** d'objets, naturellement
en **O(n²)**. Deux optimisations réduisent ce coût **sans changer la physique** :

- **Collisions — cell lists** (case *Fast collisions*, onglet Interactions) : les billes
  sont rangées dans une **grille spatiale** (cellule = 2× le plus grand rayon), et chaque
  bille n'est testée qu'avec sa cellule et ses **voisines immédiates** — les seules où un
  contact est géométriquement possible. On passe de **O(n²)** à **O(n)**. Les murs
  (`wall_box`), trop grands pour une grille uniforme, restent traités à part (boucle
  objets × murs). Décochée, le moteur repart sur la double boucle exacte de référence :
  les deux voies donnent **exactement le même résultat**, on peut basculer pour comparer.
- **Énergie potentielle — court-circuit** : la somme `−Σ G·mᵢ·mⱼ/√(r²+ε²)` est elle aussi
  en O(n²) et ne sert **qu'au graphe d'énergie**. Quand le graphe est masqué, elle n'est
  **pas calculée du tout** (voir *Diagnostic d'énergie*).
- **Attraction 1/r² — court-circuit** : la boucle qui calcule la force d'attraction
  (`compute_accelerations`) est **entièrement sautée** quand **Object interaction (1/r²)**
  est décochée — inutile de parcourir les paires si aucune force n'en résulte.
- **Attraction 1/r² — Barnes-Hut** (case *Fast attraction*, onglet Interactions) : quand
  l'attraction **est** active, elle est à **longue portée** — toutes les paires comptent, donc
  pas de filtrage exact possible. Barnes-Hut range les corps dans un **octree** et approxime
  un **amas lointain** par **une seule masse à son centre de masse** (critère d'ouverture
  `s/d < θ`), ramenant le coût de **O(n²)** à **O(n log n)**. Écarte les murs de la gravité.
  C'est une **APPROXIMATION**, réglée par **θ** (glissière) :
  - `θ = 0` → exact (descend jusqu'aux feuilles), mais O(n²) ;
  - `θ ≈ 0.5` (défaut) → erreur ~0.7 % sur les forces, très rapide ;
  - `θ` grand → plus rapide, moins précis.

  Contrairement aux cell lists (exactes), les forces Barnes-Hut ne sont **pas exactement
  antisymétriques** → la courbe d'énergie **dérive légèrement**. En dessous de **64 corps**,
  le moteur repasse automatiquement sur la double boucle **exacte** (plus rapide à cette
  taille). Décochée, on retrouve le calcul exact O(n²) — on peut basculer pour comparer.

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
- **Couvercle (lid)** : ajouté par **clic droit sur une paroi → add lid**, c'est un panneau
  horizontal au **sommet de la boîte** qui **contraint les boules à ne pas dépasser** (rebond
  élastique, symétrique du sol). La boîte devient ainsi une **enceinte fermée en haut**. Les
  4 parois d'une boîte partagent un `box_id` ; le menu de paroi permet aussi de régler la
  **hauteur** de la boîte et d'y **ajouter des boules**. Persisté avec la scène (clé `_lids`).
- **mur** (« mur ») isolé → panneau décoratif (ne réfléchit pas).
- **cubes & pavés pleins** (`simple_cube`, `cube_mult_tex`, `pavement`) → **obstacles
  solides** : les billes **rebondissent sur leurs 6 faces** (collision sphère-boîte dans le
  repère local du cube, donc **rotation prise en compte**) : dé-pénétration à la surface +
  réflexion élastique de la vitesse normale. Les cubes restent **statiques et déplaçables à
  la souris** (ils ne sont pas dans la boucle physique — gravité/attraction ne les
  concernent pas) ; une passe dédiée `bounce_balls_on_cubes()` gère le rebond, en O(billes ×
  cubes). Une bille rapide pourrait théoriquement traverser un cube très fin (détection
  discrète, pas de continu comme les murs de boîte).
- Un objet **bloqué** (`blocked`) devient une **ancre statique** (mur, ou point fixe
  d'une chaîne de ressorts), et agit comme un obstacle immobile dans les chocs.

---

## Diagnostic d'énergie

`Dynamics → Monitoring → ☑ energy graph` affiche un **graphe temporel** (en bas à gauche) des énergies
**total / cinétique / potentielle**, avec axe gradué (unités arbitraires). La potentielle
inclut la **gravité uniforme (z) + la gravité newtonienne (−G·mᵢ·mⱼ/r)** et l'élastique
`½·k·(L−L₀)²`. Avec Verlet, la courbe **totale doit rester quasi constante** — c'est le
diagnostic de conservation.

> **Coût** : la part newtonienne de l'énergie potentielle est une somme sur toutes les
> paires (O(n²)). Elle n'est calculée **que lorsque le graphe est affiché** ; case
> décochée, ce calcul est **entièrement sauté** à chaque frame.

## Distribution des vitesses

`Dynamics → Monitoring → ☑ velocity histogram` affiche (en bas à droite) un **histogramme instantané** des
**normes de vitesse** `|v|` des objets massifs mobiles (mêmes exclusions que l'énergie
cinétique : ni statiques/ancres, ni ressorts/élastiques/pions). Axe X = `|v|` (0 → max
courant, échelle auto), axe Y = nombre d'objets par classe (20 classes). Le **nombre
total d'objets comptés** est affiché en haut à droite (`N = …`). Il se dessine **dès
qu'on coche la case** puis se met à jour à chaque frame pendant l'animation.

## Trajectoires & MSD

`Dynamics → Monitoring → ☑ trajectories` ouvre la fenêtre **Monitoring** (en haut à gauche)
avec **quatre graphes que l'on coche indépendamment** (toutes les combinaisons sont possibles) :

- **Trajectories** — le **chemin x-y** de chaque boule suivie (échelle isotrope en vue auto,
  point = position courante) ;
- **z(t)** — l'**altitude** en fonction du temps ; une ligne **⟨z⟩** en pointillés donne la
  **moyenne** depuis le dernier *reset* ;
- **MSD** — le **déplacement quadratique moyen `|r−r₀|²`** vs temps : signature **balistique**
  (∝ t²) aux temps courts puis **diffusive** (∝ t) aux temps longs (mouvement brownien) ;
- **|v|(t)** — la **norme de la vitesse** vs temps.

### Choisir les boules suivies

Deux entrées équivalentes : les **cases par couleur** dans la fenêtre Monitoring (une case =
suivre **toutes** les boules de cette couleur) ou la case **`trajectory`** du menu contextuel
(clic droit) d'une boule. Les tracés reprennent la **couleur de chaque boule**.

**Décocher une couleur masque sa courbe, mais l'enregistrement continue en tâche de fond**,
**en phase** avec les courbes restées visibles. **Recocher** la fait réapparaître — et la
portion acquise **pendant qu'elle était masquée** est tracée **en pointillés**, la courbe
reprenant **au même point temporel** que les autres. Seul **reset** (dans la fenêtre) remet
les tracés à zéro et refixe l'origine `r₀`. L'historique est plafonné (~200 000 pts/trajectoire,
borne mémoire) et le tracé **décimé** pour rester fluide.

### Infobulles (moyennes)

Survoler la ligne **⟨z⟩** de z(t) — ou le **niveau de vitesse moyenne** sur |v|(t) (cible de
survol invisible, pas de ligne dessinée) — affiche une bulle **couleur — masse — rayon —
⟨valeur⟩**. Les boules de mêmes couleur/masse/rayon sont **regroupées** en une seule ligne
(moyenne des moyennes, avec **×N**).

### Zoom, pan et intervalles (indépendants par graphe)

- **Vue auto** : **glisser** dessine une **fenêtre de sélection** (pointillés, mention
  *« clic = zoom »*) ; **clic dedans** → zoome dessus, **clic à côté** → l'enlève.
- **Vue zoomée** : mode **pan** par défaut (curseur **main**) — **glisser** déplace la vue
  vers les zones contiguës ; **double-clic** → retour vue auto.
  **Clic droit** dans le graphe bascule l'outil **pan ↔ zoom** : en mode zoom, on redessine
  une fenêtre pour **re-zoomer dans le zoom**.
- **Poignées triangulaires** (aux 4 bords) : un **petit triangle** — visible **seulement au
  survol du bord** (pour ne pas encombrer les graphes) — pointe l'endroit de la courbe qui
  définit cette borne : en bas = début/fin de l'**intervalle de temps**, à gauche = min/max de
  l'**intervalle de valeurs**. On **tire un triangle** (une ligne-guide pointillée montre où
  sera la coupe) ; le **changement d'échelle n'intervient qu'au relâchement**, pas avant.
- **Suivi temps réel** : **clic droit sur la poignée droite** (axe des temps de z(t)/MSD/|v|(t))
  colle le bord droit au **dernier échantillon** ; la fenêtre **glisse** en gardant sa largeur
  (badge vert **⏱ live**). Tirer manuellement la poignée droite désactive le suivi.

## Profil d'altitude

`Dynamics → Monitoring → ☑ altitude histogram` affiche (en haut à droite) le **nombre de
particules en fonction de l'altitude `z`** : axe **vertical = altitude** (haut = z max,
gradué), **barres horizontales = comptage** par tranche (24 tranches, échelle z auto), et
`N = …` = total compté (mêmes exclusions que l'énergie cinétique). Surtout parlant avec
**Gravity (z) activée** : on observe alors le **profil barométrique** — densité qui décroît
avec l'altitude (`n(z) ∝ e^{−mgz/kT}`) une fois le gaz thermalisé.

**Ajustement Python** : sous le graphe, le champ **« N(z) ≈ »** accepte une **expression
Python de `z`** (ex. `50*exp(-z/300)`). Un clic sur **fit** (ou Entrée) l'évalue **côté
serveur** (route `/eval_fit`, module `math`, namespace restreint) et **superpose la courbe
en rouge** — pratique pour ajuster à la main une loi barométrique. L'expression est
**sauvegardée avec la scène** et ré-évaluée au chargement. Fonctions dispo : `exp, sqrt,
log, sin, cos, tan, tanh, pow, abs, pi, e, erf…`.

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
  liste déroulante** (état figé) ; **✏️ Rename** la renomme ; **❌ remove** la supprime —
  boutons à **icônes + tooltips**. À l'ouverture du panneau, la liste se **positionne sur
  la scène courante**.
- **✏️ Rename** demande un **nouveau nom** pour la scène sélectionnée et renomme le fichier
  côté serveur (refus si le nom **existe déjà**, pour ne pas écraser une autre scène).
  L'**historique undo/redo** (indexé par nom) est **migré** vers le nouveau nom, et si c'est
  la **scène courante** qui est renommée, le nom est mis à jour partout (champ, navbar, liste).
- **New scene** → archive la scène courante (si nommée) puis repart à vide.
- **Clear** (tooltip *clear the scene*) → vide l'éditeur.
- **Quit** est désormais l'icône **⏻** dans la navbar (et non plus dans ce panneau).

### Rangement en dossiers virtuels

La liste déroulante des scènes est un **arbre repliable** façon messagerie. Le rangement est
**virtuel** : sur le disque tout reste **plat** dans `static/scenes/`, mais chaque scène
mémorise son chemin dans **son propre JSON** (clé **`_folder`**, ex. `Thermo/atmo` — même
esprit que `_dynamics`). Côté serveur, `/scenes` renvoie `[{name, folder}]` (dossier lu via un
**cache par mtime**, pas de re-parsing des scènes à chaque ouverture) et `POST
/scene_set_folder/<nom>` écrit le `_folder` ; ré-enregistrer une scène **préserve** son dossier.

- **Clic droit sur une scène** : la ranger dans un **dossier existant**, créer un **nouveau
  (sous-)dossier** (chemin `A/B/C` → imbrication), la **sortir à la racine**, ou la
  **supprimer** via la **croix noire ✕** de l'en-tête (supprime aussi son rapport).
- **Clic droit sur un dossier** : le **renommer** (re-préfixe toutes les scènes dessous) ou le
  **vider vers la racine**.
- Chaque dossier se **plie/déplie** (▸/▾, état mémorisé) ; le bouton **⊞/⊟** à droite du nom
  ouvre/ferme **tous ses sous-dossiers** d'un coup.
- La hauteur de la liste est **bornée au bas du panneau** (défilement interne) pour que la
  dernière scène reste toujours atteignable.

> **Versionnement** : les scènes nommées (`static/scenes/`) **et** les rapports d'expérience
> (`static/reports/`) sont **générés au runtime et non versionnés** (`.gitignore`) — gardés en
> local, un `.gitkeep` préserve chaque dossier pour un clone frais.

Sphères, **chaînes de ressorts** (liaisons reconstruites), **boîtes** (`wall_box`, avec
leur `box_id` et l'option `movable`) et **couvercles** (clé `_lids`, recréés depuis leur
boîte) sont persistés. Les **groupes persistants** (`group_id`) et l'**ajustement Python**
d'altitude (dans `_dynamics`) le sont aussi. Une copie horodatée de l'ancien `pos.json` est
gardée dans `static/old/`.

**Réglages Dynamics sauvegardés avec la scène** (clé `_dynamics`) : chaque scène
embarque sa **configuration physique** — `Gravity`, `Springs`, `Object interaction (1/r²)`
avec sa **Strength** (signe compris), son **softening ε**, l'option **Fast collisions**
(cell lists) et l'option **Fast attraction** (Barnes-Hut + son **θ**), ainsi que les paramètres
d'**Initial speeds** (`Random`, `Strength`, `z component`) — **et** les toggles
d'affichage de **Monitoring** (`energy graph`, `velocity histogram`, `altitude histogram`,
`trajectories`). Au chargement, ces valeurs sont **restaurées** et le panneau + les
fenêtres de monitoring se **remettent à jour** automatiquement. Recharger une scène
restitue donc exactement l'expérience telle qu'elle avait été réglée.

### Undo / redo (Ctrl+Z / Ctrl+Y)
Chaque changement validé (relâchement de souris) enregistre un **snapshot** de la scène.
**Ctrl+Z** revient en arrière, **Ctrl+Y** (ou **Ctrl+Maj+Z**) avance. L'historique est
**propre à chaque scène** (clé = nom de scène) et stocké en **localStorage** : il **survit
au rafraîchissement** de la page. Une simple rotation caméra ne crée pas d'entrée
(dédoublonnage) ; profondeur bornée (`HISTORY_MAX`).

> Les fichiers générés au runtime — scènes (`static/scenes/*.json`), **rapports**
> (`static/reports/*.json`) et `static/pos.json` — sont **ignorés par git** (voir
> `.gitignore`) ; un `.gitkeep` conserve chaque dossier.

---

## Vues

Les **flèches 3D** de direction (il n'y a plus de panneau *Views*) :
- **Touche `V`** → affiche / masque **5 flèches 3D** (une par vue), atténue les objets à 0,5 ;
  **cliquer une flèche** applique la vue correspondante et restaure l'opacité. **Ré-appui `V`**
  → masque. *(`Ctrl+V` reste « coller » ; `V` seul pilote les flèches.)*

---

## Routes serveur (`run.py`)

| Route | Rôle |
|---|---|
| `/` | page principale |
| `/upload_file` | upload de textures (Dropzone) |
| `/scenes` | liste des scènes nommées : `[{name, folder}]` (dossier virtuel, cache par mtime) |
| `/scene/<nom>` | charge une scène (et la copie dans `pos.json`) |
| `/scene_delete/<nom>` | supprime une scène |
| `/scene_rename/<nom>?new=<nouveau>` | renomme une scène (refus si `<nouveau>` existe déjà) |
| `/scene_set_folder/<nom>` *(POST `folder=…`)* | range la scène dans un dossier virtuel (écrit `_folder`) |
| `/eval_fit` | évalue une expression Python de `z` (ajustement du profil d'altitude) |
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
│   └── panel_*.html                scene · object · tools · interaction · one_object
│                                    (panel_views.html : plus de panneau, garde la logique des flèches 3D + touche V)
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
│   │   ├── *_interact.js           souris/clavier : sélection, magnétisme, pistes, groupes, vues, copier/coller
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
    │   ├── accel_attraction()         gravité newtonienne  G·mᵢ·mⱼ / r²  (ou Barnes-Hut O(n log n) si Fast attraction)
    │   └── accel_spring()             ressorts  −k·(L−L₀)   (k = raideur propre, repli global)
    ├── verlet_positions()             x(t+dt)  ← Velocity Verlet
    ├── compute_accelerations()        a(t+dt)
    ├── verlet_velocities()            v(t+dt)
    ├── interactions_between_objects()  collisions + rebonds murs (double boucle, ou grille si Fast collisions)
    ├── ground_bounce()                rebond sur le sol (impulsion)
    ├── lid_bounce()                   rebond sur les couvercles de boîte (plafonds)
    └── energy_calculation()           cinétique + potentielle → graphe d'énergie (PE sautée si graphe masqué)
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
| `static/js/box_interact.js` | Boîtes : regroupement des parois (`box_id`), ajout de boules, couvercle, hauteur |
| `static/js/copy_paste_interact.js` | Copier/coller d'objets (Ctrl+C / Ctrl+V) : objet survolé, groupe, ou sélection |
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
  `harmonic_const`, `lenght_spring`, `random_initial_speed`, `random_speed_module`,
  `use_cell_lists` (collisions O(n) par grille spatiale), `use_barnes_hut` +
  `barnes_hut_theta` (attraction 1/r² O(n log n) par octree).
