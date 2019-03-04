var road_length = 200000

function make_pitch(){
    //alert("make racket")
    var geometry = new THREE.CubeGeometry( 200, 10, road_length );

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x000000 } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = 0;
        object.position.y = 0 ;
        object.position.z = 0;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        //----------------
        scene.add( object );
        objects.push( object );
        return object

} // end function


posx = 0

function make_car(pos_z){
    //alert("make racket")
    var geometry = new THREE.CubeGeometry( 20, 20, 50 );

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = posx;
        object.position.y = 20 ;
        object.position.z = pos_z;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        //----------------
        scene.add( object );
        objects.push( object );
        return object

} // end function

linespace = 10
function make_line(){
    //alert("make_line")
    for (var i=-road_length/linespace/2; i<road_length/linespace/2; i++){

        var geometry = new THREE.CubeGeometry( 5, 1, 7 );
        if (i%2==0){color_line = 0xffffff }
        else{color_line = 0xffff99}
            var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color:color_line } ) );
            object.material.ambient = object.material.color;
            //----------------
            object.position.x = 0;
            object.position.y = 10 ;
            object.position.z = i*linespace;
            //----------------
            object.castShadow = true;
            object.receiveShadow = true;
            //----------------
            scene.add( object );
            objects.push( object );
    }
} // end function

function make_bullet(){
    //alert("make ball")
    var geometry = new THREE.SphereGeometry( 5, 16, 16 );
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffdd99 } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = posx;
        object.position.y = 20 ;
        object.position.z = 0;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        //----------------
        scene.add( object );
        objects.push( object );
        return object
} // end function

function make_square_bullet(){
    //alert("make ball")
    var geometry = new THREE.CubeGeometry( 5, 5, 5 );
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = posx;
        object.position.y = 20 ;
        object.position.z = 0;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        //----------------
        scene.add( object );
        objects.push( object );
        return object
} // end function
