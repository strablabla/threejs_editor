#!/usr/bin/env python
'''
Server.
threaded = True in app.run for not blocking communication with SSE.
Integration of annyang.js for speech recognition(need a web connection).
This interface uses SocketIO. Directly inspired from Michael Grinberg.
ATTENTION !!!! pour faire connection avec pyserial faire "sudo $HOME/anaconda/bin/python run.py"
'''

# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on available packages.

import eventlet
eventlet.monkey_patch()
#################
import os, sys, time, json, glob
opd, opb = os.path.dirname, os.path.basename
import shutil as sh
import webbrowser, subprocess
sys.path.append('/usr/lib/python2.7/dist-packages')
from threading import Thread
import flask
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit
from time import sleep
import serial
from datetime import datetime
import platform
platf = platform.system()

app = Flask(__name__, static_url_path = '/static')
app.config['SECRET_KEY'] = 'secret!'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0   # pas de cache navigateur des statiques (JS/CSS) -> toujours la derniere version
socketio = SocketIO(app) #, async_mode=async_mode
thread = None

@app.after_request
def add_no_cache_headers(resp):
    # Empeche la mise en cache : evite de servir d'anciens JS/CSS/templates apres modification.
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

try:
    if platf == 'Darwin':
        ser = serial.Serial('/dev/tty.usbmodem3A22', 115200, timeout=1)    # Establish serial connection.
    else:
        ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1)             # Establish serial connection.
        print('serial connection established !! ')
except:
    print("no serial connection")

@socketio.on('message', namespace='/pos')
def receive(message):
    '''
    Retrieve the json from the client and write it in static/pos.json..
    '''

    print("infos are {0} ".format(message))
    date = datetime.now().strftime('%Y-%m-%d-%H-%M')
    if os.path.exists('static/pos.json'):                   # sauvegarde de l'etat precedent (si deja present)
        with open('static/pos.json', 'r') as f:
            with open('static/old/pos_{}.json'.format(date), 'w') as g:
                g.write(f.read())

    with open('static/pos.json', 'w') as f:                 # etat de travail courant (auto-save a chaque mouseup)
        f.write(str(message))
    g = json.loads(message)
    archive_name = (g.get('_archive') or '').strip()        # archivage UNIQUEMENT sur sauvegarde explicite (Save as)
    if archive_name and archive_name != 'None':             # -> les scenes nommees restent figees a l'etat sauvegarde
        with open('static/scenes/{}.json'.format(archive_name), 'w') as h:
            h.write(str(message))

@socketio.on('begin', namespace='/pos')
def receive(begin):
    '''
    begin the communication and send the initial positions..
    '''

    print("position x is {0} ".format(begin))
    if os.path.exists('static/pos.json'):
        with open('static/pos.json','r') as f:
            data = json.load(f)
    else:
        data = {}                                           # depot frais : pas d'etat de travail -> scene vide
    socketio.emit('server_pos', data, namespace='/pos')

def accelero(ser):
    '''
    Retrieve the accelerometer value and return it..
    '''

    l = ser.readline()
    return l

@app.route('/upload_file', methods=['GET', 'POST'])
def upload_file(debug=1):
    '''
    Upload the datasets from the Dropzone with the same tree structure and make the processing list.
    '''

    print('uploading !!! ')
    if request.method == 'POST':
        print("method is POST")
        for f in request.files.getlist('file'):                   # retrieves files names
            folder_file_path = request.form.get('fullPath')
            file_name = request.form.get('name')
            print("#####################")
            print("full_path ",folder_file_path)
            print("file_name ",file_name)
            print("#####################")
            if folder_file_path :
                if debug>0: print("Server side, full_path are ", folder_file_path)
                full_path = os.path.join('static', 'upload', folder_file_path)
                try:
                    os.makedirs(os.path.dirname(full_path))    # Makes folder
                except:
                    print("folder yet exists")
                f.save(full_path)                          # Save locally the file in the folder upload
                if debug>0: print("###################### Saved file {0} !!!! ".format(full_path))
            elif file_name:
                print("in file_name")
                full_path = os.path.join('static', 'upload', file_name)
                print("fullpath for name is ", full_path)
                f.save(full_path)

    #print("####### On the point to scan UPLOADED_PATH !!!")
    return render_template('create_3d.html')

@app.route('/scenes')
def list_scenes():
    '''
    Return the list of saved named scenes (files in static/scenes/).
    '''
    names = []
    for path in glob.glob('static/scenes/*.json'):
        name = opb(path)[:-5]              # strip the .json extension
        if name.strip():                   # skip the empty-named archive
            names.append(name)
    return flask.jsonify(sorted(names))

@app.route('/scene/<path:name>')
def load_named_scene(name):
    '''
    Load a named scene : copy it into static/pos.json (so a refresh keeps it)
    and return its JSON content to the client.
    '''
    path = os.path.join('static', 'scenes', name + '.json')
    if not os.path.exists(path):
        return flask.jsonify({'error': 'scene not found'}), 404
    with open(path, 'r') as f:
        content = f.read()
    with open('static/pos.json', 'w') as f:   # makes it the current scene
        f.write(content)
    return flask.Response(content, mimetype='application/json')

@app.route('/scene_delete/<path:name>', methods=['GET', 'POST'])
def delete_named_scene(name):
    '''
    Delete a named scene file from static/scenes/.
    '''
    path = os.path.join('static', 'scenes', name + '.json')
    if os.path.exists(path):
        os.remove(path)
        return flask.jsonify({'ok': True})
    return flask.jsonify({'error': 'scene not found'}), 404

@app.route('/shutdown', methods=['GET', 'POST'])
def shutdown():
    '''
    Stop the server (usage local). On laisse la réponse partir puis on quitte le process.
    '''
    def _kill():
        time.sleep(0.3)
        os._exit(0)
    Thread(target=_kill).start()
    return flask.jsonify({'stopping': True})

def background_thread():
    """Example of how to send server generated events to clients."""
    count = 0
    # while True:
    #     #count += 1
    #     #data_accel = str(accelero(ser))[2:-5]
    #     #socketio.emit('accel_data',{'count': count, 'accel': str(data_accel)}, namespace='/mupy')
    #     socketio.emit('server_pos',{'count': 2, 'accel': "33"}, namespace='/pos')

@app.route('/')
def index():
    global thread
    # if thread is None:
    #     thread = Thread(target=background_thread)
    #     thread.daemon = True
    #     thread.start()
    return render_template('create_3d.html') #
    #return render_template('test_dropzone.html') #
    #return render_template('first_page.html') #

def open_browser():
    '''Ouvre automatiquement le navigateur (Chrome de préférence) sur l'appli.'''
    sleep(1.5)                                            # laisser le serveur démarrer
    url = 'http://localhost:5000'
    for b in ('google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'):
        path = sh.which(b)
        if path:
            subprocess.Popen([path, url])
            return
    webbrowser.open(url)                                  # repli : navigateur par défaut

if __name__ == '__main__':
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':     # n'ouvrir qu'une fois (pas a chaque reload)
        Thread(target=open_browser, daemon=True).start()
    socketio.run(app, debug=True)
