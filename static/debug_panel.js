// ============================================
// DEBUG PANEL - Opens with Ctrl+Shift+D
// ============================================
//
// Two tabs:
//   - Terminal: what the server writes (server_log.py), which has no window
//     when started from the shortcut;
//   - Console: what this page logs, and its JavaScript errors.
//
// Loaded early, from head.html, to catch the page's first messages. The
// connection to the server is only made when the panel is first opened.
//
// The panel lives in a shadow root, out of reach of the page's stylesheets.
// Keys and mouse events in it are kept from the editor's own handlers, which
// listen on the document ('d' deletes the selected object).

(function() {

    var MAX_LINES = 2000;
    var consoleEntries = [];
    var terminalEntries = [];
    var host = null, shadow = null, channel = null;

    var CSS = `
        .overlay {
            all: initial;
            position: fixed; inset: 0;
            display: flex; justify-content: center; align-items: center;
            background: rgba(0, 0, 0, 0.6);
            font: 14px/1.4 Arial, sans-serif; color: #222;
        }
        .panel {
            background: white; border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            width: min(1100px, 92vw); height: 86vh;
            padding: 18px 22px; box-sizing: border-box;
            display: flex; flex-direction: column; outline: none;
        }
        .header { display: flex; justify-content: space-between; align-items: center; }
        h3 { margin: 0; font-size: 20px; font-weight: bold; }
        .hint { font-size: 12px; color: #777; margin: 2px 0 10px; }
        .bar { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .spacer { flex: 1; }
        button { font: inherit; cursor: pointer; border: 1px solid #bbb; border-radius: 4px;
                 background: white; color: #333; padding: 5px 14px; }
        button:hover { background: #eee; }
        button.on { background: #2196F3; border-color: #2196F3; color: white; }
        .close { border: 2px solid black; border-radius: 50%; width: 30px; height: 30px; padding: 0;
                 color: black; font-size: 18px; font-weight: bold; line-height: 1; }
        .output {
            flex: 1; min-height: 0; overflow: auto; margin: 0; padding: 10px 12px;
            background: #1e1e1e; color: #ddd; border-radius: 4px;
            font: 12.5px/1.45 monospace; white-space: pre-wrap; word-break: break-word;
        }
        .err { color: #ff8a80; }
        .warn { color: #ffd54f; }
        .time { color: #888; }
    `;

    var HTML =
        '<div class="overlay"><div class="panel" tabindex="-1">' +
        '  <div class="header"><h3>Debug</h3><button class="close" title="Close (Esc)">×</button></div>' +
        '  <div class="hint">Ctrl+Shift+D or Esc to close. Server output is also in logs/server.log.</div>' +
        '  <div class="bar">' +
        '    <button data-tab="terminal" class="on">Terminal</button>' +
        '    <button data-tab="console">Console</button>' +
        '    <span class="spacer"></span>' +
        '    <button class="clear">Clear</button>' +
        '  </div>' +
        '  <pre class="output"></pre>' +
        '</div></div>';

    var tab = 'terminal';

    function isOpen() { return host && host.style.display !== 'none' }

    function format(arg) {
        if (arg instanceof Error) return arg.stack || String(arg);
        if (typeof arg !== 'object' || arg === null) return String(arg);
        try { return JSON.stringify(arg) } catch (e) { return String(arg) }
    }

    function push(list, entry) {
        list.push(entry);
        if (list.length > MAX_LINES) list.shift();
    }

    function lineElement(entry) {
        var line = document.createElement('div');
        if (entry.cls) line.className = entry.cls;
        if (entry.time) {
            var t = document.createElement('span');
            t.className = 'time';
            t.textContent = '[' + entry.time + '] ';
            line.appendChild(t);
        }
        line.appendChild(document.createTextNode(entry.text || ' '));
        return line;
    }

    function entries() { return tab === 'terminal' ? terminalEntries : consoleEntries }

    function render() {
        if (!isOpen()) return;
        var output = shadow.querySelector('.output');
        var fragment = document.createDocumentFragment();
        entries().forEach(function(entry) { fragment.appendChild(lineElement(entry)) });
        output.textContent = '';
        output.appendChild(fragment);
        output.scrollTop = output.scrollHeight;
    }

    // One line more: rebuilding everything for each would be slow during the
    // bursts of server messages. Scrolls only if already at the bottom.
    function append(list, entry) {
        push(list, entry);
        if (!isOpen() || list !== entries()) return;
        var output = shadow.querySelector('.output');
        var atBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 40;
        output.appendChild(lineElement(entry));
        while (output.childNodes.length > MAX_LINES) output.removeChild(output.firstChild);
        if (atBottom) output.scrollTop = output.scrollHeight;
    }

    // --- The page's console and errors ---------------------------------------

    function addConsole(cls, text) {
        append(consoleEntries, { cls: cls, text: text, time: new Date().toLocaleTimeString() });
    }

    [['log', ''], ['info', ''], ['warn', 'warn'], ['error', 'err']].forEach(function(m) {
        var original = console[m[0]];
        console[m[0]] = function() {
            original.apply(console, arguments);
            try { addConsole(m[1], Array.prototype.map.call(arguments, format).join(' ')) }
            catch (e) { /* logging must never break the page */ }
        };
    });

    window.addEventListener('error', function(e) {
        if (e.message) addConsole('err', e.message + ' (' + e.filename + ':' + e.lineno + ')');
    });
    window.addEventListener('unhandledrejection', function(e) {
        addConsole('err', 'Unhandled rejection: ' + format(e.reason));
    });

    // --- The server's output --------------------------------------------------

    function terminalEntry(e) { return { cls: e.stream === 'err' ? 'err' : '', text: e.text } }

    function connect() {
        if (channel || typeof io !== 'function') return;
        channel = io(location.protocol + '//' + location.host + '/debug');
        // At each connection, so a reconnection adds no duplicates.
        channel.on('history', function(lines) {
            terminalEntries = lines.map(terminalEntry);
            render();
        });
        channel.on('line', function(e) { append(terminalEntries, terminalEntry(e)) });
        channel.on('error', function(err) {     // refused: not this computer (Docker)
            terminalEntries = [{ cls: 'err', text: 'No server output here: ' + err }];
            render();
        });
    }

    // --- The panel --------------------------------------------------------------

    function create() {
        host = document.createElement('div');
        host.id = 'debug-panel';
        host.style.cssText = 'position: fixed; inset: 0; z-index: 100001; display: none; margin: 0; padding: 0;';
        shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>' + CSS + '</style>' + HTML;
        document.body.appendChild(host);

        shadow.querySelector('.close').addEventListener('click', close);
        shadow.querySelector('.overlay').addEventListener('click', function(e) {
            if (e.target === shadow.querySelector('.overlay')) close();
        });
        shadow.querySelector('.clear').addEventListener('click', function() {
            entries().length = 0;
            render();
        });
        shadow.querySelectorAll('[data-tab]').forEach(function(button) {
            button.addEventListener('click', function() {
                tab = button.getAttribute('data-tab');
                shadow.querySelectorAll('[data-tab]').forEach(function(b) {
                    b.classList.toggle('on', b === button);
                });
                render();
            });
        });
        ['keydown', 'keypress', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'click',
         'dblclick', 'contextmenu', 'wheel'].forEach(function(type) {
            host.addEventListener(type, function(e) { e.stopPropagation() });
        });
    }

    function open() {
        if (!host) create();
        connect();
        host.style.display = 'block';
        render();
        shadow.querySelector('.panel').focus();
    }

    function close() { if (host) host.style.display = 'none' }

    // In the capture phase, ahead of the host's stopPropagation above.
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && !e.altKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen()) close(); else open();
        } else if (e.key === 'Escape' && isOpen()) {
            e.stopPropagation();
            close();
        }
    }, true);

})();
