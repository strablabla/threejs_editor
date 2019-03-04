function make_objects(){
    //alert("in make_objects")
    var geometry = new THREE.CubeGeometry( 40, 40, 40 );
    for ( var i = 0; i < 200; i ++ ) {

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        object.material.ambient = object.material.color;

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600 - 300;
        object.position.z = Math.random() * 800 - 400;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        object.castShadow = true;
        object.receiveShadow = true;

        scene.add( object );

        objects.push( object );

    }

} // end function

function make_objects_onflat(){
    //alert("in make_objects")
    var geometry = new THREE.CubeGeometry( 40, 40, 40 );
    for ( var i = 0; i < 20; i ++ ) {

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        object.material.ambient = object.material.color;

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600 - 300;
        object.position.z = 0 //Math.random() * 800 - 400;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = 0 // Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = 1 // Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        object.castShadow = true;
        object.receiveShadow = true;

        scene.add( object );
        objects.push( object );

    }

} // end function

function make_cube(){
    //alert("make cube")
    var geometry = new THREE.CubeGeometry( 40, 40, 40 );

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        object.material.ambient = object.material.color;

        object.position.x = Math.random() * 200 - 50;
        object.position.y = 20 ;//Math.random() * 600 - 300;
        object.position.z = Math.random() * 200 - 40;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = 0 // Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() + 1;
        object.scale.y = 1 // Math.random() * 2 + 1;
        object.scale.z = Math.random() + 1;

        object.castShadow = true;
        object.receiveShadow = true;

        scene.add( object );
        objects.push( object );
        return object

} // end function

function make_racket(){
    //alert("make racket")
    var geometry = new THREE.CubeGeometry( 40, 40, 40 );

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x809fff } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = 50;
        object.position.y = 20 ;
        object.position.z = 40;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        //----------------
        scene.add( object );
        objects.push( object );
        return object

} // end function
