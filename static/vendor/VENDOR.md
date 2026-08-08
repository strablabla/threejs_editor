# Third-party libraries

Same idea as `requirements.txt` for Python: the JavaScript and CSS dependencies
are **pinned and vendored on purpose**, so the editor runs with no internet
connection. This app is a local desktop tool (`install.sh` creates a shortcut
that opens `localhost:5000`), so it must not depend on a third-party server to
start. Two CDNs it used to rely on are already gone: `rawgit.com` (closed 2019)
and `netdna.bootstrapcdn.com`.

**Nothing in this directory is our code.** `static/js/` and `static/css/` hold
only code written for this project. To upgrade a library, replace the file here
and update the version in the table — do not edit these files in place.

## Contents

| File | Library | Version | Loaded by |
|---|---|---|---|
| `three-r75.min.js` | Three.js | r75 | `three.html` |
| `socket.io-1.3.5.min.js` | socket.io client | 1.3.5 | `create_3d`, `first_page`, `road`, `test_dropzone` |
| `jquery-1.12.0.min.js` | jQuery | 1.12.0 | `jquery.html` |
| `jquery-ui-1.11.4.js` | jQuery UI | 1.11.4 | `jquery.html` |
| `bootstrap-3.3.6.min.js` | Bootstrap JS | 3.3.6 | `bootstrap.html` |
| `bootstrap-3.3.6.min.css` | Bootstrap CSS | 3.3.6 | `head.html` |
| `dropzone-4.3.0.js` | Dropzone | 4.3.0 | `dropzone.html` |
| `dropzone-4.3.0.css` | Dropzone CSS | 4.3.0 | `dropzone.html` |
| `moment-2.24.0.min.js` | Moment.js | 2.24.0 | `create_3d.html` |
| `dat.js` | dat.GUI | 2.0 (file header) | `road.html` |
| `gamepad.js` | Gamepad controller lib | unknown | `road.html` |
| `Detector.js` | Three.js example — WebGL detector | matches r75 | `road.html` |
| `TrackballControls.js` | Three.js example | matches r75 | `road.html` |
| `simple_flat/TrackballControls.js` | Three.js example, **patched locally** | see below | `three.html` |
| `simple_flat/stats.js` | Three.js example — stats.js | unknown | `create_3d.html` |

`three-r75.min.js` sha384:
`MqF2uAwxdWhDFc7G9Q+/b0MO0UpZDDnzbJOv5qUJ9cPmOYXSMHVS9FOiZSqL0ZQN`

## The one patched file

`simple_flat/TrackballControls.js` carries a local fix so that
`THREE.EventDispatcher` exposes its methods the way r75 expects. It is the only
file here that differs from upstream. Re-applying that patch is part of the cost
of any Three.js upgrade.

## Why these versions

**Three.js r75.** Not a free choice. Git history shows it was found by hand in
March 2019 (commit `33ed47e`, "picking etc..") while adding mouse picking:
versions 40, 50, 60, r57, r65, 80, 89, 90 and 102 were each tried and rejected,
and r75 is where it landed — the one release where picking worked and
TrackballControls still did. The editor is written against that API. Upgrading
means redoing that search and porting the code, not swapping a file.

**socket.io 1.3.5.** It is the client the pinned server stack expects
(`Flask-SocketIO==4.3.2` / `python-socketio==4.6.1`, see `requirements.txt`).
Upgrading the client means upgrading that whole stack together.

## Remaining network dependency

`create_3d.html` still links the Lato webfont from `fonts.googleapis.com`. It is
cosmetic: with no connection the browser falls back to a system font and the
editor works. `road.html` still pulls annyang from a CDN — that page is a
side demo and has not been converted.
