disp = 5

function obj_basics(object, p, r, name){

    /*
    Generic function for rotation, shadow, name, cloning etc..
    */

    object.material.ambient = object.material.color;
    //----------
    object.position.x = p.x     // pos x
    object.position.y = p.y     // pos y
    object.position.z = p.z     // pos z
    object.rotation.x = r.x     // rot x
    object.rotation.y = r.y     // rot y
    object.rotation.z = r.z     // rot z
    //object.rotation = r.rotation;
    object.castShadow = true;
    object.receiveShadow = true;
    object.name = name;
    object.clone_infos = {"cloned":false,"origclone":"", "numclone":0}
    return object;
}

function make_mark(name,p,r,col){

    /*
    Marks for delimiting the area for selecting the pieces.
    name : name of the object
    p : position of the object
    r : rotation of the object
    col : color of the object
    */

    var size_pawns = 50;
    square_color = col;
    p.z = size_pawns/2;

    var geometry = new THREE.CubeGeometry( size_pawns, size_pawns, size_pawns );
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );

    object = obj_basics(object,p,r,name)
    object.type = "pawn"
    scene.add( object );
    objects.push( object )

    return object

} // end function

function dotted_area(nbelem1,nbelem2,elem, minx, maxx, miny, maxy, size_elem){

    /*
    Dotted area
    */

    dotted_line(nbelem2,elem,'x',minx,miny,size_elem)
    dotted_line(nbelem1,elem,'y',minx,miny,size_elem)
    dotted_line(nbelem2,elem,'x',maxx,miny,size_elem)
    dotted_line(nbelem1,elem,'y',minx,maxy,size_elem)

}

function dotted_line(nbelem,elem,kind,posx,posy,size_elem){

    /*
    Dotted lines
    */

    for (var i=0; i<nbelem+1; i++){
          var elem_clone = elem.clone()
          if (kind == "x"){
              elem_clone.position.x = posx;
              elem_clone.position.y = posy+2*i*size_elem;
          }
          else if (kind == 'y'){
              elem_clone.position.x = posx+2*i*size_elem;
              elem_clone.position.y = posy
          }
          elem_clone.position.z = 25;
          scene.add(elem_clone)
      } // end for
}

function make_dotted_area(selpos){

    /*
    Area for selecting the pieces
    */

    var side1 = Math.abs(selpos[0].position.x - selpos[1].position.x)
    var side2 = Math.abs(selpos[0].position.y - selpos[1].position.y)
    size_elem = 40
    var geometry = new THREE.CubeGeometry( size_elem, size_elem, 3 );
    var square_color = 0xffffff
    var elem = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );

    nbelem1 = Math.round(side1/(2*size_elem))
    nbelem2 = Math.round(side2/(2*size_elem))

    var minx = Math.min(selpos[0].position.x,selpos[1].position.x)
    var miny = Math.min(selpos[0].position.y,selpos[1].position.y)
    var maxx = Math.max(selpos[0].position.x,selpos[1].position.x)
    var maxy = Math.max(selpos[0].position.y,selpos[1].position.y)

    dotted_area(nbelem1,nbelem2,elem, minx, maxx, miny, maxy, size_elem)

} // end function make area

function make_horizontal_area(selpos){

    /*
    Horizontal rectangular area..
    triggered with H key..
    */

    var side1 = Math.abs(selpos[0].position.x - selpos[1].position.x)
    var side2 = Math.abs(selpos[0].position.y - selpos[1].position.y)
    var geometry = new THREE.CubeGeometry( side1, side2, 5 );
    var square_color = 0xffffff
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
    object.material.ambient = object.material.color;
    object.position.x = (selpos[0].position.x + selpos[1].position.x)/2
    object.position.y = (selpos[0].position.y + selpos[1].position.y)/2
    object.position.z = 160
    object.castShadow = true;
    object.receiveShadow = true;
    object.opacity = 0.4;
    scene.add( object );
    objects.push( object )

} // end function make area

function make_uniform_ground(){

    /*
    Principal ground
    */

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
    object.opacity = 0.2;
    object.name = "ground";
    object.size = size_square;
    scene.add( object );
    return object
} // end function

function make_ground_chess(){

    /*
    Ground with cases of different color, chess game etc..
    */
    var col1 = 0x000000
    var col2 = 0xffffff
    var size_square = 150;
    var geometry = new THREE.CubeGeometry( size_square, size_square, 5 );
    var square_color
    for ( var i = 0; i < 64; i ++ ) {
        if ((i+Math.floor(i/8))%2==0){square_color = col1}
        else{square_color = col12}
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

function make_wall(name,p,r,material){

    /*
    Wall
    name : name of the object
    p : position of the object
    r : rotation of the object
    material : color and texture of the object
    */

    //wall_color = col;
    var wall_length = 150;
    var wall_width = 5;
    var wall_height = 300;
    p.z = wall_height/2;
    var geometry = new THREE.CubeGeometry( wall_width, wall_length, wall_height );
    var object = new THREE.Mesh( geometry, material );
    object = obj_basics(object,p,r,name)
    object.type = "wall"
    scene.add( object );
    objects.push( object )

    return object

} // end function

function make_small_seats(){

    /*
    make small seats..
    */

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
        object.position.x = disp * Math.random() * size_square
        object.position.y = disp * Math.random() * size_square
        object.position.z = size_pawns/2
        object.castShadow = true;
        object.receiveShadow = true;
        //object.name = "small_seat_"+i
        scene.add( object );
        //objects.push( {"small_seat_"+i : object} );
    } // end for
} // end function

function make_seat(){

    /*
    function to make seat.
    */

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
