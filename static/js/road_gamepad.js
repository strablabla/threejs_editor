
var car_forward = -13
var car_backward = 13
var car_left = -13
var car_right = 13

window.gamepad = new Gamepad();

gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    console.log('Connected', device);
    // alert("device.index: " + device.index + "device.id: " + device.id)
    $('#connect-notice').hide();
});

gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
    console.log('Disconnected', device);
    if (gamepad.count() == 0) {
        $('#connect-notice').show();
    }
});


function gamepad_handle_event(){

    gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
        var gamepad, control, value, i, j;

        for (i = 0; i < gamepads.length; i++) {
            gamepad = gamepads[i];
            if (gamepad) {
                for (control in gamepad.state) {
                    value = gamepad.state[control];
                    if (value!=0){
                        //alert(control + '_' + value)
                        if (control=='LEFT_TOP_SHOULDER'){
                            car1.position.x += car_left
                        }
                        if (control=='RIGHT_TOP_SHOULDER'){
                            car1.position.x += car_right
                        }
                        if (control=='FACE_1'){
                            car_velocity.z += car_forward
                        }
                        if (control=='FACE_3'){
                            car_velocity.z += car_backward
                        }
                    }
                } // end for
            } // end if game
        }
    }); // end gamepad.bind(Gamepad.Event.TICK

}

if (!gamepad.init()) {
    alert('Your browser does not support gamepads, get the latest Google Chrome or Firefox.');
}
