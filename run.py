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
import os, sys, time, json
sys.path.append('/usr/lib/python2.7/dist-packages')
from threading import Thread
import flask
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit
from time import sleep
import serial
import platform
platf = platform.system()

app = Flask(__name__, static_url_path = '/static')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app) #, async_mode=async_mode
thread = None

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

    print("position x is {0} ".format(message))
    with open('static/pos.json', 'w') as f:
        f.write(str(message))

@socketio.on('begin', namespace='/pos')
def receive(begin):
    '''
    begin the communication and send the initial positions..
    '''

    print("position x is {0} ".format(begin))
    with open('static/pos.json','r') as f:
        data = json.load(f)
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
            file_in_folder_path = request.form.get('fullPath')
            file_name = request.form.get('name')
            if file_in_folder_path :
                if debug>0: print("Server side, file_in_folder_path are ", file_in_folder_path)
                full_path = os.path.join('static', 'upload', file_in_folder_path)
                try:
                    f.save(full_path)
                except IOError as e:
                    os.makedirs(os.path.dirname(full_path))    # Makes folder
                    f.save(full_path)                          # Save locally the file in the folder upload
                    if debug>0: print("###################### Saved file {0} !!!! ".format(full_path))
            elif file_name:
                print("in file_name")
                full_path = os.path.join('static', 'upload', file_name)
                print("fullpath for name is ", full_path)
                f.save(full_path)

    #print("####### On the point to scan UPLOADED_PATH !!!")
    return render_template('moving_walls.html')

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
    return render_template('moving_walls.html') #
    #return render_template('test_dropzone.html') #
    #return render_template('first_page.html') #

if __name__ == '__main__':
    socketio.run(app, debug=True)
