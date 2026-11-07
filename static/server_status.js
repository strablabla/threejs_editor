// ============================================
// SERVER STATUS BANNER
// ============================================
//
// A page whose server has stopped (Ctrl+C, terminal closed, crash) used to look
// alive: actions led to browser errors, edits were silently lost. This script
// watches the socket.io connection: when it drops and does not come back
// within DELAY_MS, a red banner says the server has stopped; when the server
// is started again, socket.io reconnects by itself, the banner goes and a
// green note says so for a few seconds.
//
// The same file serves node_diapo, node_straptoc and threejs_editor, set by
// the attributes of its script tag, placed after the socket.io client:
//     <script src=".../server_status.js" data-app="node_diapo"
//             data-namespace="/pos"></script>
// data-app is the name shown; data-namespace the socket.io namespace the
// server answers on ("/" by default). Works with the socket.io 1.x client
// (threejs_editor) as with 4.x.
//
// No banner when the page itself is leaving (a reload, a link followed).
// The banner lives in a shadow root, out of reach of the page's styles.

(function() {
    if (typeof io !== 'function') return;

    var script = document.currentScript;
    var APP = (script && script.getAttribute('data-app')) || 'application';
    var NAMESPACE = (script && script.getAttribute('data-namespace')) || '/';
    var DELAY_MS = 1500;
    var leaving = false;
    var timer = null;
    var wasDown = false;

    window.addEventListener('pagehide', function() { leaving = true });
    window.addEventListener('beforeunload', function() { leaving = true });

    var host = document.createElement('div');
    host.id = 'server-status';
    host.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; z-index: 30000; ' +
                         'display: none; margin: 0; padding: 0;';
    var shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
        '<style>' +
        '  .bar { all: initial; display: block; padding: 12px 20px; text-align: center;' +
        '         font: 16px/1.4 Arial, sans-serif; color: #fff;' +
        '         box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35); }' +
        '  .down { background: #c62828; }' +
        '  .up   { background: #2e7d32; }' +
        '  b { font-weight: bold; }' +
        '</style>' +
        '<div class="bar"></div>';
    var bar = shadow.querySelector('.bar');

    function showDown() {
        if (!host.parentNode) document.body.appendChild(host);
        wasDown = true;
        bar.className = 'bar down';
        bar.innerHTML = '';
        var strong = document.createElement('b');
        strong.textContent = 'The ' + APP + ' server has stopped.';
        bar.appendChild(strong);
        bar.appendChild(document.createTextNode(' This page is no longer saved nor updated. ' +
            'Start ' + APP + ' again: the page will reconnect by itself.'));
        host.style.display = 'block';
    }

    function showUp() {
        bar.className = 'bar up';
        bar.textContent = APP + ' is running again.';
        host.style.display = 'block';
        setTimeout(function() {
            if (bar.className === 'bar up') host.style.display = 'none';
        }, 4000);
    }

    // A full URL: the 1.x client completes a bare "/pos" with the host but
    // without the port. With that client, io() on a namespace the page already
    // uses returns the page's own socket: the handlers below just join its own.
    var url = location.protocol + '//' + location.host + (NAMESPACE === '/' ? '' : NAMESPACE);
    var watch = io(url, { reconnectionDelayMax: 3000 });

    watch.on('disconnect', function() {
        if (leaving) return;
        clearTimeout(timer);
        timer = setTimeout(function() {
            if (!watch.connected && !leaving) showDown();
        }, DELAY_MS);
    });

    function back() {
        clearTimeout(timer);
        if (wasDown) { wasDown = false; showUp(); }
    }
    watch.on('connect', back);
    watch.on('reconnect', back);             // the 1.x client
})();
