# 3D scene editor — physics sandbox

A browser-based 3D scene editor: create objects (walls, cubes, spheres,
boxes, spring chains…) with the mouse or keyboard, animate them
with a physics engine (Newtonian gravity, elastic collisions, springs), and
the state is saved as JSON on the server.

- **Client**: [Three.js](https://threejs.org) (r75), jQuery, Bootstrap 3, Dropzone.
  All the business logic lives in `static/js/` (≈20 files, **shared global variables**).
- **Server**: Flask + Flask-SocketIO. Serves the page and persists scenes as JSON.
- **English UI.**

---

## Requirements

- **Python 3.8** (versions pinned in `requirements.txt`).
- **Chrome** recommended.
- **Internet connection**: Three.js, socket.io and the fonts come from CDNs.

## Install & run

### Automatic install (recommended)

```bash
./install.sh
```

The `install.sh` script:

- **creates the venv** with `python3.8` **only if it doesn't exist** (safe to re-run: an existing venv is not reinstalled) and installs `requirements.txt`;
- generates `launch.sh`, a launcher that activates the venv and starts `run.py`;
- adds a **desktop shortcut** (`~/Bureau/threejs_editor.desktop`) with the app icon, ready to use (double-click).

On a machine where `python3.8` is not the default binary, force another version:

```bash
PYTHON_BIN=python3 ./install.sh
```

### Manual install

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt   # calling the venv directly avoids conda/python2 conflicts
mkdir -p static/old static/scenes            # runtime state directories
./venv/bin/python run.py
```

On startup, **Chrome opens automatically** at **http://localhost:5000** (falls back
to Chromium then the default browser if Chrome is absent). The message
`no serial connection` is **normal** (optional serial accelerometer `/dev/ttyACM0`).

> Pinned versions: the client bundles the old `socket.io 1.3.5`, so Flask-SocketIO 4.x
> (and old Flask/Werkzeug) is the compatible, tested combo.

---

## Interface

Top menu bar, with **icons + tooltips**; each panel opens **under
its icon** (with an arrow and a shadow), **one at a time**, and closes via its
**cross** or by clicking the icon again.

| Icon | Panel | Role |
|---|---|---|
| 🎬 | **Scene** | name / save / load / clear scenes |
| 📦 | **Object** | creation-tool picker + default parameters |
| 🔧 | **Tools** | distance, group properties, area stats |
| ⚙️ | **Parameters** | live physics control — tabs **Interactions / Initial speeds / Monitoring** |
| ↻ | **Reload** | reloads the current scene (without going through the Scene panel) |
| 📝 | **Report** | opens the scene's report |
| ? | **Help** | help / shortcuts (tabs **Keys** / **Documentation**) |
| ⏻ | **Quit** | stops the server (route `/shutdown`), far right of the bar |

In the bar: the **name of the active tool** is shown to the right of the icons (clicking it =
**no tool**), and the **scene name** (prefixed “Scene: ”) to the left of the `?` — a **click on it
opens the Description panel** (the tooltip of the scene list).

---

## Creating objects

1. **Pick a tool** — either:
   - the **Object** panel → **grid of clickable icons** (wall, cube, plane, pavement, track, box, sphere, string, no tool), one info bubble per icon; the chosen icon is highlighted;
   - the **keyboard**: `o` sphere · `e` chain · `n` wall · `w` box · `m` textured cube · `t` track (press = on, 2nd press = off; `b` cuts everything).
2. **Click in the plane** to drop the object (the **box** is drawn in 2 clicks). Balls
   are dropped **coplanar** (plane `z = 0`) and **pink** by default.

`TrackballControls`: rotate / zoom the view with the mouse.

### The track tool (`t`)

A **track** is laid **segment by segment**: the 1st click drops the starting point, then the
mouse is moved **freely (no button held)** and each new click **validates a segment** and
starts the next. Each segment becomes a **blue slab** resting on the ground, of length =
the distance between the two points and of width `track_width` (40).

- **Axis snapping** — with `perpendicular_track` (default), the segment is forced onto the
  axis (x or y) along which you moved the most: successive segments are perpendicular,
  giving a Manhattan-style path. Set the flag to `false` in `scene_params.js` for a free path.
- **Guide marks** — only **two** exist at a time (the anchor of the segment being drawn and
  the one following the mouse); each is removed as soon as its slab covers it, and the last
  ones disappear when the track ends. *(They used to pile up in the scene forever — and stay
  in the picking lists, invisible but still grabbable.)*
- **Ending the track** — press `t` again, or pick another tool / *no tool* in the panel. Both
  paths clean up. A **new track never chains onto the previous one**, and pressing another
  toggle key (`x` animation, `i`, `k`, `m`, `u`) **in the middle of a track no longer wipes
  the segment in progress**.

### Other keyboard shortcuts
`x` animation (start / pause / resume) · `d` delete · `r` rotation ·
`p` multi-selection · `h` horizontal plane · `i` object info · `k` camera position ·
`u` link two objects with a spring · up/down arrows to move up/down.
**Ctrl+Z** undo · **Ctrl+Y** (or **Ctrl+Shift+Z**) redo.
**Ctrl+C** copy · **Ctrl+V** paste (see *Copy / paste* below).

### Copy / paste (Ctrl+C / Ctrl+V)
**Ctrl+C** copies, **Ctrl+V** pastes **under the mouse** (the barycenter of the copied set is
re-anchored at the cursor position, relative layout preserved; the altitude `z` is preserved).
The copy target is chosen as follows, by priority:
1. **Mouse inside a selection area** → **all selected objects** of the area.
2. Otherwise, the **hovered object**: if it belongs to a **persistent group**, the **whole
   group** is copied; otherwise the object **alone**.

Copies get **new names**; if the original was a persistent group, the copy forms a
**new independent group** (new `group_id`). Likewise, a **copied box becomes a brand-new,
independent box** (new `box_id` shared by its 4 walls), unrelated to the original box.
Copyable types: spheres, cubes, pavements, walls, boxes (not springs, pawns or lids).
Pasting is **persisted** with the scene. *(Replaces the old quick clone on “c”.)*

### Selection & groups (Ctrl+S / Ctrl+G / Ctrl+Shift+G)
- **Ctrl+S** — **selection area**: click-drag a rectangle (corners = **black marks**,
  edges **dashed**); objects inside turn **pink**. Activating a selection
  **disables the creation tools** (you draw the area instead of creating). **Pressing Ctrl+S again**
  → **clears** the selection (dashes, corners, colors).
  - **Resize**: **drag a black corner** to redraw the area and **recompute** the
    selected objects (incoming turn pink, outgoing restored).
- **Ctrl+G** — **move the group**: the selection turns **blue**; dragging **any
  member** — including a **box wall** (fixed otherwise) — moves
  **the whole group**, and the **dashes and corners follow** too.
  **Press again** → ungroup (back to pink).
- **Ctrl+Shift+G** — **PERSISTENT group**: the selected objects get a shared
  `group_id` (marked **purple** as visual feedback). **On deselection the original
  colors return** (purple isn't permanent). Then, **dragging a member
  moves the whole group as a block**, at any time. But in the **physics they stay
  independent** (collisions, gravity… ignore the group). **Press again** (on
  a re-selection of the group) → ungroup. The `group_id` is **saved** with the scene.
  As long as the selection area is present, it **follows the group** (dashes + corners
  move with it, as for the temporary group).
  - **See the group**: right-click a member — **ball, cube or box wall** —
    → toggles **“group coloring”** to (de)activate the purple and instantly spot
    who belongs to the group.

Color convention: **pink** = selected · **blue** = temporary group (Ctrl+G) ·
**purple** = persistent group (Ctrl+Shift+G) · original color otherwise.

### Editing an object / an elastic (right-click)
**Right-click** opens **only** the context menu — it doesn't grab the object (no
dragging).
- **Right-click on an object** → **context menu** of its attributes **editable
  live**, organized into **three tabs**:
  - **Attributes**: `mass`, `opacity`, **`color`**, `radius` (spheres);
  - **Dynamics**: **`vx` / `vy` / `vz`** (velocity components), `friction`, `radius_interact`;
  - **Miscellaneous**: `magnet`, `blocked`, **`trajectory`** (+ *group coloring* if the object
    belongs to a persistent group).

  Immediate effect on the engine and **saved** with the scene.
- **“all” checkbox** (spheres): when checked, **every** attribute change
  (mass, velocity, color, radius…) applies to **all** balls at once; otherwise only to
  the clicked ball.
- **Color**: color picker; the tint is specific to the object (the material is
  duplicated when needed, so the others don't change) and **persisted**.
- **Ball radius** (`radius`, spheres): a slider that updates the **visual**, the
  **collision radius** (contact = sum of radii) and the **floor bounce**; **persisted**.
- **`trajectory`**: tracks this ball's trajectory (see *Trajectories & MSD*).
- **Right-click on an elastic** → menu of its **stiffness (`stiffness`)**. Each elastic
  has its **own stiffness** (falls back to `harmonic_const`), so a ball linked by two
  elastics can have **two different stiffnesses**.
- **Right-click on a box wall** → **“box wall”** menu: `opacity` (of the wall),
  **movable** (allows/blocks moving the box), **box height** (box height,
  resizes the 4 walls), **add balls** (adds N random balls **inside** the
  box, N adjustable), **add lid / remove lid** (lid). If **movable** is checked, you
  **drag the box** (walls **+ lid**) as a block with the mouse; the option and the
  positions are **persisted**.
- **Right-click on a track segment** → **“track segment”** menu: **`height`** (slider),
  **`width (route)`**, **`solide`** (do the balls bounce off it — **checked by default**) and
  `opacity`. Like the balls, an **“all (N segments de la piste)”** checkbox at the top applies
  the change to the **whole track** at once; unchecked, only the clicked segment changes. The
  target list is **frozen when the menu opens**, so a change never shifts the criterion
  mid-drag. The chosen height also becomes the height of the segments drawn **afterwards**.
- **Right-click on a lid** → **“lid”** menu: `opacity` of the lid.

The menu closes via its **×** or by clicking elsewhere. Object colors are
**preserved during animation** (no automatic recoloring).

---

## Physics

The engine uses a **symplectic Velocity Verlet** integrator (bounded energy, no
drift) for smooth forces; collisions, wall and floor bounces are
**impulses** applied after the Verlet step.

Everything is **3D** at all times (no “planar mode” that would freeze `z`). Gravity is
a **simple optional force**. A **coplanar cloud stays coplanar** on its own (collision
normals have no `z` component), so a 2D gas behaves as such without special
handling — and energy is **truly conserved**.

Live settings in the **Parameters** panel, organized into **three tabs**:

**“Interactions” tab**
- **Gravity (z)** — vertical gravity. **Unchecked** = no gravity force (nor floor);
  the scene evolves freely in 3D.
- **Springs (chains)** — spring forces of the chains (rest length `lenght_spring`).
- **Object interaction (1/r²)** — **Newtonian gravity** between objects, **softened**
  (Plummer softening): `F = G·mᵢ·mⱼ · r / (r²+ε²)^{3/2}`. Masses matter (a
  heavy object attracts more). **Attraction / Repulsion** buttons (sign), **Strength**
  (slider setting `G`) and **Softening ε** (slider): `ε = 0` → pure 1/r²; `ε > 0`
  removes the short-range singularity and **stabilizes the energy** (see *Collisions*).
- **deactivate the interactions** — master checkbox: disables/re-enables **all** the
  interactions above at once (checked automatically if none is active).
- **Fast collisions (cell lists, O(n))** — speeds up collisions via a **spatial
  grid** instead of testing all pairs (see *Performance* below). The
  result is **physically identical** — it's just pair filtering, without
  approximation. Useful mainly beyond a few hundred beads.
- **Fast attraction (Barnes-Hut, O(n log n))** + **θ** slider — speeds up the 1/r²
  attraction via an **octree** (see *Performance*). An **approximation** tuned by θ (default 0.5);
  automatic fallback to exact below 64 bodies.

**“Initial speeds” tab**
- **Random** + **Strength** — random **symmetric** starting velocity (centered on 0,
  near-Gaussian law) of adjustable intensity, injected **at the creation** of each ball
  (or start at 0 if unchecked / Strength = 0).
- **z component** — adds a `z` component to the initial velocity (otherwise in the x-y plane).
- **reinitialize all** — reassigns the velocity of **all** balls according to the
  parameters above, to **restart a simulation from scratch** at any time (Random
  unchecked ⇒ all at rest). Doesn't touch positions.
- **flatten z=0** — projects all balls onto the plane `z = 0` and sets `vz = 0`. Useful
  to **clean up** a scene whose z positions have drifted and recover a **perfectly
  planar gas** (which stays so afterwards, see above).

**“Monitoring” tab** — `energy graph` and `velocity histogram` checkboxes (see below).

### Collisions
- **Ball-ball**: **elastic** collision resolved by an **impulse along the line of
  centers** (only the normal component of the relative velocity is reversed;
  tangential unchanged) → conserves momentum **and** energy, and **thermalizes**
  toward Maxwell-Boltzmann. Contact is detected at the **sum of the actual radii** of the beads.
- **De-penetration**: at each collision, overlapping beads are **pushed apart to the
  contact distance** (distributed by their inverse mass), so the bounce always
  happens at the same depth — otherwise a varying interpenetration **pumps
  energy**. **Blocked objects** (anchors) act as immobile walls.
- **Bead radius** adjustable by right-click (see above); it drives both the
  size and the contact distance.

#### Energy conservation with 1/r² gravity
A **pure 1/r² force is singular**: in a close encounter, acceleration blows up and the
fixed Verlet time step no longer resolves it → energy **drifts**. Two remedies are in
place: the **softening ε** (bounds the force at short range) and the **de-penetration** of
collisions. With `ε > 0`, the **total** energy curve stays much flatter. If it still
drifts with a very strong `G`, **increase ε** (or reduce the time step).

### Performance (large object counts)
The per-frame cost is dominated by the loops over **pairs** of objects, naturally
**O(n²)**. Two optimizations reduce this cost **without changing the physics**:

- **Collisions — cell lists** (*Fast collisions* checkbox, Interactions tab): the beads
  are placed into a **spatial grid** (cell = 2× the largest radius), and each
  bead is tested only against its cell and its **immediate neighbors** — the only ones where a
  contact is geometrically possible. This goes from **O(n²)** to **O(n)**. Walls
  (`wall_box`), too large for a uniform grid, remain handled separately (objects × walls
  loop). Unchecked, the engine falls back on the exact reference double loop:
  both paths give **exactly the same result**, you can toggle to compare.
- **Potential energy — short-circuit**: the sum `−Σ G·mᵢ·mⱼ/√(r²+ε²)` is also
  O(n²) and only serves **the energy graph**. When the graph is hidden, it is
  **not computed at all** (see *Energy diagnostics*).
- **1/r² attraction — short-circuit**: the loop that computes the attraction force
  (`compute_accelerations`) is **entirely skipped** when **Object interaction (1/r²)**
  is unchecked — no need to walk the pairs if no force results.
- **1/r² attraction — Barnes-Hut** (*Fast attraction* checkbox, Interactions tab): when
  the attraction **is** active, it is **long-range** — all pairs matter, so
  no exact filtering is possible. Barnes-Hut places the bodies in an **octree** and approximates
  a **distant cluster** by **a single mass at its center of mass** (opening criterion
  `s/d < θ`), bringing the cost from **O(n²)** down to **O(n log n)**. It excludes walls from gravity.
  It's an **APPROXIMATION**, tuned by **θ** (slider):
  - `θ = 0` → exact (descends to the leaves), but O(n²);
  - `θ ≈ 0.5` (default) → ~0.7 % error on the forces, very fast;
  - large `θ` → faster, less accurate.

  Unlike cell lists (exact), Barnes-Hut forces are **not exactly
  antisymmetric** → the energy curve **drifts slightly**. Below **64 bodies**,
  the engine automatically reverts to the **exact** double loop (faster at that
  size). Unchecked, you get the exact O(n²) computation back — you can toggle to compare.

### Walls, floor & boxes
- **box** (`w` / “box”) → an enclosure of **4 reflecting side walls** (`wall_box`,
  x-y normals). No ceiling/floor: without gravity, nothing confines in `z` (a
  planar scene stays so, but a deliberate z motion isn't bounded).
- **Hard walls (anti-tunneling)**: **continuous** detection (tests whether the center crossed
  the wall plane during the step) + **repositioning** of the bead on the correct side at a distance
  = its radius, then elastic reflection. A bead **can never cross** a wall,
  even at high speed.
- **Floor** (only if `Gravity` is checked): the bead **rests exactly on it** (threshold at the
  radius) and is reflected **only if descending** — it can no longer be trapped under the
  floor nor “sink in”.
- **Lid**: added via **right-click on a wall → add lid**, it's a horizontal
  panel at the **top of the box** that **keeps balls from going past** (elastic
  bounce, symmetric of the floor). The box thus becomes an **enclosure closed at the top**. The
  4 walls of a box share a `box_id`; the wall menu also lets you set the
  **height** of the box and **add balls** to it. Persisted with the scene (key `_lids`).
- **wall** (“wall”) alone → decorative panel (does not reflect).
- **solid cubes & pavements** (`simple_cube`, `cube_mult_tex`, `pavement`) → **solid
  obstacles**: beads **bounce off their 6 faces** (sphere-box collision in the
  cube's local frame, so **rotation is taken into account**): de-penetration at the surface +
  elastic reflection of the normal velocity. Cubes stay **static and mouse-draggable**
  (they are not in the physics loop — gravity/attraction don't
  affect them); a dedicated pass `bounce_balls_on_cubes()` handles the bounce, in O(beads ×
  cubes). A fast bead could theoretically pass through a very thin cube (discrete
  detection, no continuous detection like box walls).
  A cheap **bounding-sphere reject** runs before the local-frame transform of each pair, so
  the vast majority of (bead, box) pairs cost nothing — the pass otherwise did one matrix
  inversion per pair, and a track adds one box per segment.
- **Track segments** → **solid by default** (`solide` checkbox of their context menu), and
  handled as **real boxes**, through the same sphere-box pass as the cubes. So **their height
  counts**: a bead **flies over a low track** and **rolls on top of a high one**. This is
  deliberately *not* the mechanism of box walls: those are in `list_moving_objects` and act as
  **infinite vertical planes** — a ceiling on them would let beads escape over every
  enclosure — whereas a track needs a top. The choice is saved per segment (`track_solid`).

  > Before this, the two paths disagreed: a freshly drawn track was **crossed by everything**
  > (never registered), while the **same track reloaded from disk** was an infinite wall
  > (`load_wall_box` registers every `wall_box`), blocking beads at any altitude.
- A **blocked** object (`blocked`) becomes a **static anchor** (wall, or fixed point
  of a spring chain), and acts as an immobile obstacle in collisions.

---

## Energy diagnostics

`Parameters → Monitoring → ☑ energy graph` shows a **time graph** (bottom left) of the
**total / kinetic / potential** energies, with a graduated axis (arbitrary units). The potential
includes the **uniform gravity (z) + Newtonian gravity (−G·mᵢ·mⱼ/r)** and the elastic
`½·k·(L−L₀)²`. With Verlet, the **total curve should stay nearly constant** — that's the
conservation diagnostic.

> **Cost**: the Newtonian part of the potential energy is a sum over all
> pairs (O(n²)). It is computed **only when the graph is shown**; checkbox
> unchecked, this computation is **entirely skipped** each frame.

## Velocity distribution

`Parameters → Monitoring → ☑ velocity histogram` shows (bottom right) an **instantaneous histogram** of the
**velocity magnitudes** `|v|` of the mobile massive objects (same exclusions as the kinetic
energy: neither statics/anchors, nor springs/elastics/pawns). X axis = `|v|` (0 → current
max, auto scale), Y axis = number of objects per bin (20 bins). The **total
number of counted objects** is shown at the top right (`N = …`). It draws **as soon
as the box is checked** then updates each frame during the animation.

## Trajectories & MSD

`Parameters → Monitoring → ☑ trajectories` opens the **Monitoring** window (top left)
with **four graphs toggled independently** (all combinations are possible):

- **Trajectories** — the **x-y path** of each tracked ball (isotropic scale in auto view,
  dot = current position);
- **z(t)** — the **altitude** vs time; a dashed **⟨z⟩** line gives the
  **mean** since the last *reset*;
- **MSD** — the **mean squared displacement `|r−r₀|²`** vs time: **ballistic** signature
  (∝ t²) at short times then **diffusive** (∝ t) at long times (Brownian motion);
- **|v|(t)** — the **velocity magnitude** vs time.

The whole window is **in English**. The three time graphs — z(t), MSD, |v|(t) — carry a
**graduated time axis in seconds**, with the unit **`t (s)`** written under the **last
graduation**; the total elapsed time stays in the header (`t = … a.u. (h:m:s)`, 1 a.u. =
100 ms). The index → time conversion uses a **timestamp recorded per sample** (`traj_t`),
aligned on the latest sample, so it stays exact for a curve acquired later or trimmed by the
history cap.

### Choosing the tracked balls

Two equivalent entry points: the **per-color checkboxes** in the Monitoring window (one box =
track **all** balls of that color) or the **`trajectory`** checkbox of the context menu
(right-click) of a ball. The traces take the **color of each ball**.

**Unchecking a color hides its curve, but recording continues in the background**,
**in phase** with the curves left visible. **Re-checking** brings it back — and the
portion acquired **while it was hidden** is drawn **dashed**, the curve
resuming **at the same time point** as the others. Only **reset** (in the window) resets
the traces to zero and re-fixes the origin `r₀`. History is capped (~200,000 pts/trajectory,
memory bound) and the trace is **decimated** to stay smooth.

**Listing the colors** — the `sort by` selector above the list chooses how the colors are
presented:
- **color** — the compact grid (just the count per color), the default;
- **mass** / **initial speed** — **one color per line**, sorted by that quantity ascending,
  with its **value shown across from the swatch**. What tells two populations apart is
  rarely their color but their mass or their temperature (a hot red gas inside a cold blue
  one), so this is the listing that lets you pick the right one.

The mass is shown as a **range** (`1.0`, or `1.0…5.0` if the color mixes masses); the initial
speed as the **mean** `⟨371⟩` of the population — `v₀` is drawn at random per ball, so a
min…max would be pure noise (the full range stays in the row's tooltip). `v₀` is recorded when
a ball's velocity is drawn (creation, *reinitialize speeds*) or when a scene is loaded, and is
**persisted** per object. The choice of listing travels with the scene.

### Tooltips

- **z(t)** — hovering the **⟨z⟩** line shows a bubble **color — mass — radius — ⟨z⟩**.
  Balls of the same color/mass/radius are **grouped** into a single line (mean of the
  means, with **×N**).
- **|v|(t)** — hovering a **curve** gives the **instantaneous** velocity at that point plus
  the **time** of the sample, as a header line `t = … a.u. (… s)`, then **color — mass —
  radius — |v|**. *(It used to show the mean ⟨|v|⟩ since the reset, which said nothing about
  the point under the cursor.)*

### Zoom, pan and intervals (independent per graph)

- **Auto view**: **drag** draws a **selection window** (dashed, labeled
  *“click = zoom”*); **click inside** → zooms onto it, **click outside** → removes it.
  **Right-click** switches straight to **pan**: the current window is **frozen** as it is
  and can be dragged right away — no need to zoom first. (The auto domain is recomputed
  from the data on every frame, so there is nothing to pan until it is frozen; the
  real-time follow is released at the same time.)
- **Zoomed view**: **pan** mode by default (**hand** cursor) — **drag** moves the view
  toward the contiguous zones; **double-click** → back to auto view.
  **Right-click** in the graph toggles the **pan ↔ zoom** tool: in zoom mode, you redraw
  a window to **re-zoom inside the zoom**.
- **Triangular handles**: a **small triangle** — visible **only on hover** (so as not to
  clutter the graphs) — points to the spot on the curve that defines a bound: **one at the bottom
  left** = **start** of the time interval (the end = current time, no handle), **two
  on the left** = min/max of the **value interval**. You **drag a triangle** (a dashed
  guide line shows where the cut will be); the **rescaling only happens on
  release**, not before.
- **Real-time follow**: on z(t)/MSD/|v|(t), the time axis always follows the **latest
  sample**. By default the **window grows** (left edge fixed) — small green **fixed**
  badge (two bars, the left one pinched by two triangles). **Right-click on the left
  handle** switches to a **sliding fixed-width window** — **moving** badge (two bars +
  left arrow) — and vice versa.

## Altitude profile

`Parameters → Monitoring → ☑ altitude histogram` shows (top right) the **number of
particles as a function of altitude `z`**: **vertical axis = altitude** (top = z max,
graduated), **horizontal bars = count** per slice, and `N = …` = number counted in the
window (same exclusions as the kinetic energy). Most meaningful with **Gravity (z)
enabled**: you then observe the **barometric profile** — density that decreases with altitude
(`n(z) ∝ e^{−mgz/kT}`) once the gas has thermalized.

- **z observation window**: two **triangles** (hover over the vertical axis, top/bottom)
  set the observed `z` max / min; the **rescaling happens on release**. The **number
  of bins stays constant** as the window shrinks → you gain **resolution** on the area
  looked at. **Double-click** = **back to the initial parameters**: auto range **+ default bin
  count** (24) — like the “full view” double-click of the trajectory graphs.
- **Number of bins**: a **slider** (default **24**) sets the histogram resolution,
  independently of the observation window.

**Python fit**: below the graph, the **“N(z) ≈”** field accepts a **Python
expression of `z`** (e.g. `50*exp(-z/300)`). Clicking **fit** (or Enter) evaluates it **server
side** (route `/eval_fit`, `math` module, restricted namespace) and **overlays the curve
in red** — handy to fit a barometric law by hand. The expression is
**saved with the scene** and re-evaluated on load. Available functions: `exp, sqrt,
log, sin, cos, tan, tanh, pow, abs, pi, e, erf…`.

---

## Observation chrono & saved figures

Each monitoring window (**Trajectories, Altitude, Velocities, Energy**) has, under its
title, a small bar `⏱ [h:m:s] [figures ▾] ▲▼ ✕`:

- **Observation chrono**: you enter a **duration in `h:m:s`** (or `m:s`, or a number of
  seconds). The field **counts down** during the animation; when it reaches `0:00`, the
  current figure is **saved** and the animation **pauses** (“the observation is finished”).
  **Clicking** the field **clears** the limit → experiment **with no time limit**. The chrono
  **re-arms on *reset*** and its value is **saved with the scene**. *(Internal unit: sim
  time; `1 s = 10 a.u.`, consistent with the `t = … (h:m:s)` shown in the Trajectories window.)*
- **Saved figures** *(dropdown)*: **`● live`** (real time) + one entry **dated per saved
  run**. Choosing one **displays the frozen figure** in the window — redrawn from the
  saved **numeric data**, even without animation. The **arrows ▲ (newer) / ▼ (older)**
  step through the dates (to skip the ones you want to keep); the **red cross ✕**
  deletes the current date and **jumps to the next** (back to `live` when none remain).

Figures are stored in the **per-scene dated library** shared with the **Report**
(see §Report): a figure saved here also appears in the Report's “date” menu, and
vice versa. Runs are **decimated** and bounded (~15 most recent per scene).

---

## Scenes (save / load)

**Scene** panel:

- **pos.json** (working state) is **auto-saved on every mouse release**
  → the current scene is reloaded on refresh. It is **not versioned**
  (in `.gitignore`); on a freshly cloned repo, the app starts on an **empty
  scene** then recreates it on the first save.
- **Save as** *(name)* → freezes the scene into `static/scenes/<name>.json`. **Named
  scenes are written ONLY on explicit save** (not by the auto-save), so
  reloading a named scene yields **exactly the saved state**.
- **💾 Save as** *(name)* archives; **⤓ Load** reloads the scene **selected in the
  dropdown** (frozen state); **✏️ Rename** renames it; **❌ remove** deletes it —
  buttons with **icons + tooltips**. When the panel opens, the list **positions on
  the current scene**.
- **✏️ Rename** asks for a **new name** for the selected scene and renames the file
  server-side (refused if the name **already exists**, so as not to overwrite another scene).
  The **undo/redo history** (indexed by name) is **migrated** to the new name, and if it's
  the **current scene** being renamed, the name is updated everywhere (field, navbar, list).
- **New scene** → archives the current scene (if named) then starts empty.
- **Clear** (tooltip *clear the scene*) → empties the editor.
- **Quit** is now the **⏻** icon in the navbar (no longer in this panel).

### Virtual-folder organization

The scene dropdown is a **collapsible tree** like an email client. The organization is
**virtual**: on disk everything stays **flat** in `static/scenes/`, but each scene
stores its path in **its own JSON** (key **`_folder`**, e.g. `Thermo/atmo` — same
spirit as `_dynamics`). Server-side, `/scenes` returns `[{name, folder, mtime}]` (folder read via an
**mtime cache**, no re-parsing of the scenes on each opening) and `POST
/scene_set_folder/<name>` writes the `_folder`; re-saving a scene **preserves** its folder.

- **Right-click on a scene**: file it into an **existing folder**, **file it into a new
  folder** (path `A/B/C` → nesting), move it **to the root**, or
  **delete** it via the **black cross ✕** of the header (also deletes its report).
- **Right-click on a folder**: create a **new sub-folder**, **rename** it (re-prefixes all
  scenes below), **delete** it when it is **empty**, or **empty it to the root**.
- **Creating an empty folder** — a folder normally exists only because a scene claims it.
  To prepare an organization before filing anything, the **`＋ nouveau dossier…`** row at
  the bottom of the list (tree view) creates one from a path (`A/B` → sub-folder), and the
  right-click menu of a folder creates a **sub-folder** of it. These still-empty paths are
  kept server-side in **`static/scene_folders.json`** (not versioned) and merged with the
  folders deduced from the scenes; renaming a parent re-prefixes them too. Deleting one only
  forgets the path — **no scene is touched**.
- **The list stays open** while you work in it. The dropdown is a Bootstrap menu, so any
  click reaching the document — the **OK button of the confirm dialog**, typically — used to
  close it, and deleting several experiments in a row meant re-opening the list every time.
  The open state **and the scroll position** are now restored once the list has been rebuilt,
  after a deletion, a filing, a rename or a folder creation (and on *Cancel* too).
- Each folder **folds/unfolds** (▸/▾, state remembered); the **⊞/⊟** button to the right of the name
  opens/closes **all its sub-folders** at once.
- **Two views**, via the icons next to “Scenes: ”: **🗂️ tree** (folders, default)
  or **🕒 recent** — a **flat, folder-less list sorted by modification date** (most recent
  first, date shown on the right). The choice is **remembered**; right-click (filing, etc.)
  stays available in both views.
- The list height is **bounded to the bottom of the panel** (internal scrolling) so the
  last scene always stays reachable.
- The **scene name in the navbar** is **selectable**: select it then **Ctrl+C**
  copies the **name alone** (the “Scene: ” prefix and the 3D rotation don't get in the way). A **single click**
  opens the **Description** panel.

> **Versioning**: named scenes (`static/scenes/`) **and** experiment reports
> (`static/reports/`) are **generated at runtime and not versioned** (`.gitignore`) — kept
> locally, a `.gitkeep` preserves each directory for a fresh clone.

Spheres, **spring chains** (links rebuilt), **boxes** (`wall_box`, with
their `box_id` and the `movable` option) and **lids** (key `_lids`, recreated from their
box) are persisted. **Persistent groups** (`group_id`) and the altitude **Python
fit** (in `_dynamics`) are too. A timestamped copy of the old `pos.json` is
kept in `static/old/`.

Also carried by each object: **`v0`** (its initial speed, for the *initial speed* listing of
the tracked colors) and, for a **track segment**, **`is_track`** + **`track_solid`** — so a
reloaded track is still recognized as one and keeps its solidity. A segment drawn before
`is_track` existed is recognized by shape (a `wall_box` belonging to no box).

**Parameters settings saved with the scene** (key `_dynamics`): each scene
carries its **physics configuration** — `Gravity`, `Springs`, `Object interaction (1/r²)`
with its **Strength** (sign included), its **softening ε**, the **Fast collisions**
(cell lists) option and the **Fast attraction** (Barnes-Hut + its **θ**) option, plus the
**Initial speeds** parameters (`Random`, `Strength`, `z component`), the **height of the next
track segments** (`track_height`) — **and** the
display toggles of **Monitoring** (`energy graph`, `velocity histogram`, `altitude histogram`,
`trajectories`), plus the selections *inside* those windows (which plots, ⟨z⟩ only, the
`sort by` listing of the tracked colors). On load, these values are **restored** and the
panel + the monitoring windows **update** automatically. Reloading a scene
thus restores exactly the experiment as it had been set up.

### Undo / redo (Ctrl+Z / Ctrl+Y)
Every committed change (mouse release) records a **snapshot** of the scene.
**Ctrl+Z** goes back, **Ctrl+Y** (or **Ctrl+Shift+Z**) goes forward. The history is
**per scene** (key = scene name) and stored in **localStorage**: it **survives
page refresh**. A mere camera rotation doesn't create an entry
(deduplication); depth bounded (`HISTORY_MAX`). *(The **report** has its own
independent undo/redo, active in its window — see §Report.)*

> Runtime-generated files — scenes (`static/scenes/*.json`), **reports**
> (`static/reports/*.json`) and `static/pos.json` — are **ignored by git** (see
> `.gitignore`); a `.gitkeep` keeps each directory.

---

## Report

The navbar **📝 icon** opens the scene's **report**: a **lightweight markdown editor**
(headings, bold/italic, lists) with **preview**, in a **draggable** (title bar)
and **resizable** (bottom-right grip) window. The content is **persisted on disk** per
scene (`static/reports/<name>.json`) and **follows** the scene (Save as / Rename / deletion).
The panel UI is **in English** (Report, edit/preview, clear, PDF…).

- **Insert a curve**: **right-click** in the report → **choose the scene** (current or
  another) → **the date** (`● live` or a saved run) → **the graph** (x–y, z(t), |v|(t), MSD,
  energy, velocity / altitude histogram). Curves are stored **numerically**
  (not images) and **redrawn** in the report — so readable even without the scene loaded.
- **Overlay / compare**: **right-click on a figure** → “Add a curve” overlays the curve
  of **another scene / date** on the same figure — to compare experiments. The
  overlays are **snapshots** copied into the figure (deleting the source scene afterwards
  doesn't break the figure); alignment is done **by sample index** (like the live graphs).
- **Editable legends, outside the graph**: below each figure, one row per curve — a **color
  swatch** clickable (color picker), an **editable label**, an **×** to remove the curve. The
  **scene · date** metadata appears only in a **tooltip** (hover), not in the label nor the PDF.
- **Delete a figure**: an **× cross** appears on hover, top right of the figure
  (deletion **undoable** with Ctrl+Z — no confirmation).
- **Edit at the clicked spot**: **double-click** a block of the preview switches to **text
  mode** with the cursor **placed on the corresponding source line** (handy for long reports).
- **Undo / redo** of its own: **↶ ↷** buttons + **Ctrl/Cmd+Z**, **Ctrl/Cmd+Y** (or
  **Ctrl+Shift+Z**) in the window. Typing is grouped by pause; insert / overlay /
  remove / **clear** are **undoable** — an accidental *clear* is **recoverable**.
- **PDF**: the **PDF** button opens a printable version — numeric figures are
  **rasterized** on a white background with their legend (color swatches preserved in print).
- **Description**: a **click on the scene name** (navbar) opens the small **Description**
  panel (short sentence = tooltip in the scene list), **distinct** from the report.

> **Dated curve library**: at each **end of run** (observation chrono reached or
> *reset*), the scene **auto-saves** a **decimated** snapshot of its curves into a **dated
> history** (`report_state.library.runs`, ~15 most recent per scene). This same store feeds the
> Report's “date” menu **and** the *saved figures* of the monitoring windows (§Observation
> chrono & saved figures).

> **Safe writing**: the auto-capture **never** writes the report text from memory — it
> only adds the `library` field by re-reading `md/figs` **from disk**, so it never
> overwrites a report in progress (reports are not versioned: no git safety net).

---

## Views

The **3D direction arrows** (there's no more *Views* panel):
- **`V` key** → shows / hides **5 3D arrows** (one per view), dims objects to 0.5;
  **clicking an arrow** applies the corresponding view and restores opacity. **Press `V` again**
  → hides. *(`Ctrl+V` remains “paste”; `V` alone drives the arrows.)*

---

## Server routes (`run.py`)

| Route | Role |
|---|---|
| `/` | main page |
| `/upload_file` | texture upload (Dropzone) |
| `/scenes` | list of named scenes: `[{name, folder, mtime}]` (virtual folder + modification date — mtime cache; `mtime` is used to sort the chronological view) |
| `/scene/<name>` | loads a scene (and copies it into `pos.json`) |
| `/scene_delete/<name>` | deletes a scene |
| `/scene_rename/<name>?new=<new>` | renames a scene (refused if `<new>` already exists) |
| `/scene_set_folder/<name>` *(POST `folder=…`)* | files the scene into a virtual folder (writes `_folder`) |
| `/folders` | list of **empty** virtual folders (created ahead of any scene, stored in `static/scene_folders.json`) |
| `/folder_add` *(POST `folder=…`)* | creates an empty folder **and its ancestors** |
| `/folder_delete` *(POST `folder=…`)* | forgets an empty folder **and its sub-folders** (scenes untouched) |
| `/folder_rename` *(POST `old=…&new=…`)* | re-prefixes the empty folders when their parent is renamed |
| `/report/<name>` *(GET / POST)* | a scene's report: `{md, figs, seq, descr, library}` (text + figures + **dated curve library**) |
| `/reports` | `{ name : description }` to fill the tooltips of the scene list |
| `/report_delete/<name>`, `/report_rename`, `/report_copy` | delete / rename / copy a report (follow the scene) |
| `/eval_fit` | evaluates a Python expression of `z` (altitude-profile fit) |
| `/shutdown` | stops the server |
| socket `message` / `begin` | save / restore of the state |

---

## Program overview

### Module tree

```
threejs_editor/
├── run.py                          Flask + SocketIO server
│   ├── routes  /  /upload_file  /scenes  /scene/<name>  /scene_delete  /shutdown
│   ├── socket  message (save)  ·  begin (restore)
│   └── open_browser()              auto-open Chrome
│
├── templates/
│   ├── create_3d.html           main page — loads all the JS in order
│   ├── main_menus.html             navbar: 🎬 📦 👁 🔧 🧲  …  ?  ⏻
│   ├── secondary_menus.html
│   ├── interface.html              in-house dialog + context menus (object / elastic)
│   └── panel_*.html                scene · object · tools · interaction · one_object
│                                    (panel_views.html: no more panel, keeps the 3D-arrows logic + V key)
│
├── static/
│   ├── js/                         (GLOBAL variables shared across files)
│   │   ├── init_scene.js           scene build + save/load (get_scene_data, load_scene)
│   │   ├── scene_history.js        per-scene undo/redo (Ctrl+Z / Ctrl+Y, localStorage)
│   │   ├── scene_params.js         physics constants & global flags
│   │   ├── objects_animation.js    PHYSICS ENGINE (Verlet, gravity, springs, energies+graph)
│   │   ├── basic_objects.js  ┐
│   │   ├── objects_from_basic.js ├ 3D object factories (sphere, wall, cube, elastic…)
│   │   ├── make_objects.js   ┘
│   │   ├── *_interact.js           mouse/keyboard: selection, magnetism, tracks, groups, views, copy/paste
│   │   ├── keys.js / keys_interactions1.js   keyboard shortcuts
│   ├── pos.json                    working state (auto-save on every mouse release)
│   ├── scene_folders.json          virtual folders created still EMPTY (not versioned)
│   ├── scenes/*.json               named scenes (frozen on “Save as”)
│   └── old/*.json                  timestamped copies of pos.json
│
├── requirements.txt   ·   README.md   ·   .gitignore
```

### Execution flow (animation loop)

```
animate()                              render loop (requestAnimationFrame)
├── controls.update()                  camera (TrackballControls)
├── renderer.render(scene, camera)
└── if animation active:
    ├── compute_accelerations()        a = F/m for each mobile object
    │   ├── gravity (constant z, or 0 in planar mode)
    │   ├── accel_attraction()         Newtonian gravity  G·mᵢ·mⱼ / r²  (or Barnes-Hut O(n log n) if Fast attraction)
    │   └── accel_spring()             springs  −k·(L−L₀)   (k = own stiffness, global fallback)
    ├── verlet_positions()             x(t+dt)  ← Velocity Verlet
    ├── compute_accelerations()        a(t+dt)
    ├── verlet_velocities()            v(t+dt)
    ├── interactions_between_objects()  collisions + wall bounces (double loop, or grid if Fast collisions)
    ├── ground_bounce()                floor bounce (impulse)
    ├── lid_bounce()                   bounce on box lids (ceilings)
    └── energy_calculation()           kinetic + potential → energy graph (PE skipped if graph hidden)
```

---

## Structure

| Path | Role |
|---|---|
| `install.sh` | Installs the venv (if absent) + generates `launch.sh` + adds the desktop shortcut |
| `launch.sh` | Generated launcher: activates the venv and starts `run.py` (used by the shortcut) |
| `static/img/app_icon.svg`, `app_icon.png` | App icon (desktop shortcut) |
| `run.py` | Flask + SocketIO server (page, scene routes, upload, shutdown) + auto browser opening |
| `templates/create_3d.html` | Main page; includes all the JS modules |
| `templates/main_menus.html`, `panel_*.html`, `interface.html` | Menu bar + panels + in-house Bootstrap dialog |
| `static/js/init_scene.js` | Scene build, save/load (`get_scene_data`, `load_scene`) |
| `static/js/objects_animation.js` | Physics engine: **Velocity Verlet**, Newtonian gravity, springs, collisions, **energies + graph** |
| `static/js/scene_params.js` | Global parameters (physics constants, flags) |
| `static/js/basic_objects.js`, `objects_from_basic.js`, `make_objects.js` | 3D object factories |
| `static/js/*_interact.js` | Mouse/keyboard interactions (selection, magnetism, tracks, groups, views…) |
| `static/js/box_interact.js` | Boxes: wall grouping (`box_id`), adding balls, lid, height |
| `static/js/track_interact.js` | Tracks: laying marks, axis snapping, segment slabs, solidity (`set_track_solid`) |
| `static/js/simple_flat/TrackballControls.js` | Camera controls actually loaded (vendored copy, patched for the standard `wheel` event) |
| `static/js/copy_paste_interact.js` | Object copy/paste (Ctrl+C / Ctrl+V): hovered object, group, or selection |
| `static/js/keys.js`, `keys_interactions1.js` | Keyboard shortcuts |
| `static/css/create_3d.css` | Styles (panels, icons, graph…) |

---

## Notes

- All the logic shares **global variables** (hence the split into many
  small files loaded in order by `create_3d.html`).
- **Browser cache disabled**: `run.py` sends `no-store, no-cache` headers on
  all responses (+ `SEND_FILE_MAX_AGE_DEFAULT = 0`), so every reload
  **always** serves the latest modified JS/CSS (no more `Ctrl+Shift+R`).
- `library/game.js` and `templates/tests/` are **legacy, unused** modules/assets. The same
  goes for `static/js/TrackballControls.js`: the copy actually loaded is
  **`static/js/simple_flat/TrackballControls.js`** (only `<script>` referencing it:
  `templates/three.html`).
- **Wheel zoom** — it had silently died. The vendored `TrackballControls` only listened to
  `mousewheel` (legacy WebKit) and `DOMMouseScroll` (legacy Firefox), two non-standard names
  predating the standardization of `wheel` (2013); today's browsers only fire `wheel`, so the
  handler was never called. The breakage dates from the commit that switched the app to that
  local copy, after the remote one (`rawgit.com`, shut down in 2019 — the URL now returns a
  404) stopped defining `THREE.TrackballControls` at all. Rotation and panning kept working
  because they use `mousedown`/`mousemove`/`mouseup`, names that never changed — hence the
  “everything works except the zoom” symptom. The handler now reads `deltaY` (normalizing
  `deltaMode` lines/pages → px, same scale as the old `wheelDelta/40`, so the zoom *feel* is
  unchanged), and the listener is registered by **feature detection** — `wheel` when
  available, the legacy pair otherwise, never both — with **`{ passive: false }`**, without
  which `preventDefault()` is ignored on a document-level wheel listener in Chrome and the
  page scrolls while zooming.
- Main physics settings in `static/js/scene_params.js`:
  `gravity_ok`, `springs_ok`, `one_over_r2`, `attract_strength_one_over_r2` (G),
  `harmonic_const`, `lenght_spring`, `random_initial_speed`, `random_speed_module`,
  `use_cell_lists` (O(n) collisions via spatial grid), `use_barnes_hut` +
  `barnes_hut_theta` (1/r² attraction O(n log n) via octree).
