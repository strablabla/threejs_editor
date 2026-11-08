'''
The server's output, for the debug panel of the page (static/debug_panel.js,
Ctrl+Shift+D).

The shortcut starts the server with no window: what it writes is kept here and
sent to the panels. capture() is called first thing in run.py and wraps
sys.stdout and sys.stderr; only what a subprocess writes straight to the
terminal, or a crash of Python itself, escapes it. Those are in logs/server.log.

The panels use a namespace of their own, and it accepts this computer only.
'''
import sys

HISTORY_MAX = 2000
NAMESPACE = '/debug'
LOCAL_ADDRESSES = ('127.0.0.1', '::1', '::ffff:127.0.0.1')

history = []
channel = None                  # the SocketIO instance, once attached
sending = False                 # emit() may itself write: no endless loop


def record(stream, text):
    entry = {'stream': stream, 'text': text}
    history.append(entry)
    if len(history) > HISTORY_MAX:
        del history[0]


def broadcast(entry):
    global sending
    if channel is None or sending:
        return
    sending = True
    try:
        channel.emit('line', entry, namespace=NAMESPACE)
    finally:
        sending = False


def is_access_log(line):
    '''The web server logs each request on stderr: not errors, and not to be red.'''
    return '] "' in line or ') accepted (' in line


class Tee(object):
    '''Writes to the real stream and keeps the lines for the panels.'''

    def __init__(self, stream, name):
        self.stream = stream
        self.name = name
        self.pending = ''

    def write(self, text):
        written = self.stream.write(text)
        try:
            lines = (self.pending + text).split('\n')
            self.pending = lines.pop()              # an unfinished line waits for its end
            for line in lines:
                # The request log of socket.io's polling is left out: sending a
                # line ends a poll, whose next request would log a line, for ever.
                if '/socket.io/' not in line:
                    record('out' if is_access_log(line) else self.name, line)
                    broadcast(history[-1])
        except Exception:
            pass                                    # the panel must never break a print
        return written

    def __getattr__(self, name):
        return getattr(self.stream, name)


def capture():
    for name, label in (('stdout', 'out'), ('stderr', 'err')):
        stream = getattr(sys, name)
        # Redirected to a file, Python would hold the lines back, and on Windows
        # write in cp1252, failing on the first character outside it.
        stream.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
        setattr(sys, name, Tee(stream, label))


def attach(socketio):
    '''Serves the history to each panel that connects.'''
    global channel
    from flask import request
    from flask_socketio import emit

    def on_connect():
        if request.remote_addr not in LOCAL_ADDRESSES:
            return False
        emit('history', history)

    socketio.on_event('connect', on_connect, namespace=NAMESPACE)
    channel = socketio
