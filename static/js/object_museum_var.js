disp = 5
function make_uniform_ground(){
    //alert("in make_board")
    var size_square = 5000;
    var geometry = new THREE.CubeGeometry( size_square, size_square, 5 );
    var square_color = 0xffffff
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
    object.material.ambient = object.material.color;
    object.position.x = 0
    object.position.y = 0
    object.position.z = 0
    object.castShadow = true;
    object.receiveShadow = true;
    object.opacity = 0.4;
    scene.add( object );
} // end function
function make_ground_chess(){
    //alert("in make_board")
    var size_square = 150;
    var geometry = new THREE.CubeGeometry( size_square, size_square, 5 );
    var square_color
    for ( var i = 0; i < 64; i ++ ) {
        if ((i+Math.floor(i/8))%2==0){square_color = 0x000000}
        else{square_color = 0xffffff}
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
        object.material.ambient = object.material.color;
        object.position.x = (i%8-4) * size_square
        object.position.y = (Math.floor(i/8)-4) * size_square
        object.position.z = 0
        object.castShadow = true;
        object.receiveShadow = true;
        scene.add( object );
        // objects.push( object );
    }
} // end function


function obj_basics(object, p, r, name){
  /*
  Position, rotation, shadow, name
  */
  object.material.ambient = object.material.color;
  object.position = p;
  object.rotation = r;
  //----------
  // object.position.x = p.x     // pos x
  // object.position.y = p.y     // pos y
  // object.position.z = p.z     // pos z
  // object.rotation.x = r.x     // rot x
  // object.rotation.y = r.y     // rot y
  // object.rotation.z = r.z     // rot z
  object.castShadow = true;
  object.receiveShadow = true;
  object.name = name;
  object.cloned = false;
  object.origclone = "";
  object.numclone = 0;
  return object;
}

function make_wall(name,p,r,col){
    /*
    Wall
    name: name of the object
    p: position of the object
    r: rotation of the object
    */
    wall_color = col;
    var wall_length = 150;
    var wall_width = 5;
    var wall_height = 300;
    p.z = wall_height/2;
    var geometry = new THREE.CubeGeometry( wall_width, wall_length, wall_height );
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: wall_color } ) );
    object = obj_basics(object,p,r,name)
    //object.type = "wall"
    scene.add( object );
    objects.push( object )

    return object

} // end function

function make_small_seats(){
    //alert("in make_small_seats")
    var size_square = 150;
    var size_pawns = 50;
    var geometry = new THREE.CubeGeometry( size_pawns, size_pawns, size_pawns );
    var square_color;
    for ( var i = 0; i < 16; i ++ ) {
        if (Math.floor(i/8)%2==0){
            square_color = 0x800000
            var posy = 1
           }
        else{
            square_color = 0xf0f0f5
            var posy = 6
           }
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
        object.material.ambient = object.material.color;
        object.position.x = disp*Math.random() * size_square
        object.position.y = disp*Math.random() * size_square
        object.position.z = size_pawns/2
        object.castShadow = true;
        object.receiveShadow = true;
        //object.name = "small_seat_"+i
        scene.add( object );
        //objects.push( {"small_seat_"+i : object} );
    } // end for
} // end function

function make_seat(){
    //alert("in make_pawns")
    var size_square = 150;
    var size_seat = 100;
    var geometry = new THREE.CylinderGeometry( 50, 25, size_seat);
    var square_color;
    for ( var i = 0; i < 4; i ++ ) {
        if (Math.floor(i/2)%2==0){
            square_color = 0x800000
            var posy = 1
           }
        else{
            square_color = 0xf0f0f5
            var posy = 6
           }
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
        object.material.ambient = object.material.color;
        object.position.x = disp*Math.random() * size_square
        object.position.y = disp*Math.random() * size_square
        object.position.z = size_seat/2
        object.rotation.x = -Math.PI/2
        object.castShadow = true;
        object.receiveShadow = true;
        scene.add( object );
        //objects.push( object );
    } // end for
} // end function
