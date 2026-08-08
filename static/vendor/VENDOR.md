# Third-party libraries

Same idea as `requirements.txt` for Python: the JavaScript dependencies are
**pinned and vendored on purpose**, so the editor runs with no internet
connection. This app is a local desktop tool (`install.sh` creates a shortcut
that opens `localhost:5000`), so it must not depend on a third-party server to
start. Two CDNs it used to rely on are already gone: `rawgit.com` (closed 2019)
and `netdna.bootstrapcdn.com`.

Nothing here is our code. Do not edit these files; to upgrade, replace the file
and update the version below.

## Vendored here

| File | Library | Version | Source |
|---|---|---|---|
| `three-r75.min.js` | Three.js | **r75** | `https://cdnjs.cloudflare.com/ajax/libs/three.js/r75/three.min.js` |
| `socket.io-1.3.5.min.js` | socket.io client | **1.3.5** | `https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.3.5/socket.io.min.js` |

    three-r75.min.js         sha384-MqF2uAwxdWhDFc7G9Q+/b0MO0UpZDDnzbJOv5qUJ9cPmOYXSMHVS9FOiZSqL0ZQN

**Why socket.io 1.3.5.** It is the client the pinned server stack expects
(`Flask-SocketIO==4.3.2` / `python-socketio==4.6.1`, see `requirements.txt`).
Upgrading the client means upgrading that whole stack together.

**Why r75 and not a recent release.** The whole editor is written against the
r75 API, and `static/js/simple_flat/TrackballControls.js` carries an explicit r75
compatibility patch. Upgrading Three.js means porting that code — a deliberate
project, not a drop-in swap.

Until this change the page loaded **two** Three.js at once — a local r57 then r75
from a CDN, the second silently overwriting the first. Without a connection the
app fell back to r57 (early 2013) and broke in confusing ways instead of failing
cleanly. A third copy, r67, sat in `static/js/three.js` and was loaded by nobody.

## Still in `static/js/`, to be moved here

These are third-party too and should end up in this directory. Versions marked
`?` could not be read from the file header and need checking before any upgrade.

| File | Library | Version |
|---|---|---|
| `jquery.min.js` | jQuery | 1.12.0 |
| `jquery-ui.js` | jQuery UI | 1.11.4 |
| `jquery.contextMenu.js` | jQuery contextMenu | 2.1.0 |
| `dat.js` | dat.GUI | 2.0 |
| `perfect-scrollbar.min.js` | perfect-scrollbar | 0.6.11 |
| `dropzone.js` | Dropzone | ? |
| `moment.min.js` | Moment.js | ? |
| `d3.min.js` | D3 | ? |
| `gamepad.js`, `road_gamepad.js` | Gamepad controller lib | ? |
| `Detector.js`, `TrackballControls.js` | Three.js examples | matches r75 |
| `simple_flat/TrackballControls.js` | Three.js example, patched for r75 | — |
| `bootstrap.js`, `bootstrap.min.js` | Bootstrap | 3.x |
| `modernizr-custom.js` | Modernizr | ? |
| `EventSource.js` | EventSource polyfill | ? |
| `strapdown.js` | Strapdown (markdown) | ? |

Unused copies still in the tree, safe to delete once confirmed:
`jquery-3.0.0.min.js`, `jquery.js`, `queue.v1.min.js`.

## Remaining network dependency

`create_3d.html` still links the Lato webfont from `fonts.googleapis.com`. It is
cosmetic: with no connection the browser falls back to a system font and the
editor works. `road.html` also still pulls jQuery 3.2.1, Three.js r84 and
annyang from CDNs — that page has not been converted.
