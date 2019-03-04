var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var car_velocity = new THREE.Vector3();
car_velocity.set(0,0,100);

//alert('Helllooo welcome in point_locker.js !!!! ')

THREE.PointerLockControls = function ( camera ) {
    //alert('Helllooo welcome in PointerLockControls !!!! ')
	var scope = this;
	camera.rotation.set( 0, 0, 0 );
	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);
	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.008; //0.002
		pitchObject.rotation.x -= movementY * 0.008; //0.002
		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	this.dispose = function() {
		document.removeEventListener( 'mousemove', onMouseMove, false );
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	this.enabled = false;
	this.getObject = function () {
		return yawObject;
	};

	this.getDirection = function() {
		// assumes the camera itself is not rotated
		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );
		return function( v ) {
			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );
			v.copy( direction ).applyEuler( rotation );
			return v;
		};
	}();
};

var posy = 150

function init() {
    //alert('Helllooo welcome in init !!!! ')
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );
    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 90: // z
                moveForward = true;
                break;

            case 37: // left
                moveLeft = true;
				break;

            case 40: // down
			case 68: // d
                moveBackward = true;
                break;

            case 39: // right
                moveRight = true;
                break;

			case 65: // a
				posy += 5;
				break;

			case 83: // s
				posy += -5;
				break;

            case 32: // space
                if ( canJump === true ) controls.getObject().translateY(100); // velocity.y += 1000;  // jump

                canJump = false;
                break;
        }
    };

    var onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 38: // up
            case 90: // z
                moveForward = false;
                break;

            case 37: // left
                moveLeft = false;
                break;

            case 40: // down
			case 68: // d
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );

}

function animate() {
	//alert('Helllooo welcome in animate !!!! ')
    requestAnimationFrame( animate );

    if ( controlsEnabled ) {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );
        var isOnObject = intersections.length > 0;
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 1.0 * delta;                 // velocity x
        velocity.z -= velocity.z * 1.0 * delta;                 // velocity z
        // velocity.y = 0;
        velocity.y -= 9.8 * 10.0 * delta; // 100.0 = mass       // velocity y  taking in account the gravity.

		var horiz_speed = 180.0                                  // Horizontal speed
		var vert_speed = 40.0                                   // Vertical speed
        if ( moveForward ) velocity.z -= horiz_speed * delta;
        if ( moveBackward ) velocity.z += horiz_speed * delta;
        if ( moveLeft ) velocity.x -= horiz_speed * delta;
        if ( moveRight ) velocity.x += horiz_speed * delta;

        if ( isOnObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

		//if (delta<0.1){ 										 // avoiding going out of the pitch at the beginning of the game.
			car1.position.z += car_velocity.z * delta           // car position main axis
			controls.getObject().position.z = car1.position.z
		//}

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta ); // velocity.y * delta
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < posy ) {
            velocity.y = 0;
            controls.getObject().position.y = posy;
            canJump = true;
        }
        prevTime = time;
    }
    renderer.render( scene, camera );
}

function ptlock() {
	    //alert('Helllooo welcome in ptlock !!!! ')
		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if ( havePointerLock ) {
			var element = document.body;
			var pointerlockchange = function ( event ) {
				if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
					controlsEnabled = true;
					controls.enabled = true;
					blocker.style.display = 'none';

				} else {

					controls.enabled = false;
					blocker.style.display = '-webkit-box';
					blocker.style.display = '-moz-box';
					blocker.style.display = 'box';
					instructions.style.display = '';
				}
			};

			var pointerlockerror = function ( event ) {
				instructions.style.display = '';
			};

			// Hook pointer lock state change events
			document.addEventListener( 'pointerlockchange', pointerlockchange, false );
			document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'pointerlockerror', pointerlockerror, false );
			document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
			document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

			instructions.addEventListener( 'click', function ( event ) {
				//alert('just clicked !!! ')
				instructions.style.display = 'none';
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

				if ( /Firefox/i.test( navigator.userAgent ) ) {

					var fullscreenchange = function ( event ) {
						if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
							document.removeEventListener( 'fullscreenchange', fullscreenchange );
							document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
							element.requestPointerLock();
						}
					};

					document.addEventListener( 'fullscreenchange', fullscreenchange, false );
					document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
					element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
					element.requestFullscreen();
				} else {
					element.requestPointerLock();
				}
			}, false );

		} else {

			instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
		}
}
