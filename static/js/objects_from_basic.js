

function make_mark(name,p,r,col){

        /*
        Marks for delimiting the area for selecting the pieces.
        name : name of the object
        p : position of the object
        r : rotation of the object
        col : color of the object
        */

        var size_pawns = 30;
        p.z = size_pawns/2;
        //------------------
        var geometry = new THREE.CubeGeometry( size_pawns, size_pawns, size_pawns );
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: col } ) );
        //------------------
        object = obj_basics(object,p,r,name)
        object.type = "pawn"
        scene.add( object );
        objects.push( object )

        return object

} // end function

function make_wall(name,p,r,material){

        /*
        Wall
        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object
        */

        var dim = { width : 150, height : 300, thickness : 5}
        var wall = simple_parallelepiped(name,p,r,material,dim,"wall")

        return wall

} // end function

function make_simple_cube(name,p,r,material){

        /*
        Simple Cube
        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object
        */
        var size_simple_cube = 150
        var dim = { width : size_simple_cube, height : size_simple_cube, thickness : size_simple_cube}
        var simple_cube = simple_parallelepiped(name,p,r,material,dim,"simple_cube")

        return simple_cube

} // end function

function make_pavement(name,p,r,material){

        /*
        Pavement
        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object
        */

        var size_pavement = 150
        var dim = { width : size_pavement, height : 4, thickness : size_pavement}
        var pavement = simple_parallelepiped(name,p,r,material,dim,"pavement")

        return pavement

} // end function

function make_square_pillar(name,p,r,material){

        /*
        Pillar
        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object
        */

        var size_pillar = 50
        var dim = { width : size_pillar, height : 150, thickness : size_pillar}
        var pillar = simple_parallelepiped(name,p,r,material,dim,"square_pillar")

        return pillar

} // end function

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
        //----------
        object.position.x = (selpos[0].position.x + selpos[1].position.x)/2
        object.position.y = (selpos[0].position.y + selpos[1].position.y)/2
        object.position.z = 160
        //--------- Shadow
        object.castShadow = true;
        object.receiveShadow = true;
        //----------
        object.opacity = 0.4;
        scene.add( object );
        objects.push( object )

} // end function make area

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

function chess_repeat_shape(col1,col2,size_square,geom,mat){

      /*
      Repeat the squares
      */

      var square_color
      for ( var i = 0; i < 64; i ++ ) {
          if ((i+Math.floor(i/8))%2==0){square_color = col1}
          else{square_color = col12}
          var object = new THREE.Mesh( geom, mat );
          object.material.ambient = object.material.color;
          object.position.set((i%8-4) * size_square, (Math.floor(i/8)-4) * size_square, 0)
          object.castShadow = true;
          object.receiveShadow = true;
          scene.add( object );
      }

}

function make_uniform_ground(){

        /*
        Principal ground
        */

        var size_square = 5000;
        var square_color = 0xe0ebeb
        var texture =  new THREE.ImageUtils.loadTexture( "static/upload/pale-rose.jpg" )//ligthgrey.jpg
        //var geometry = new THREE.CubeGeometry( size_square, size_square, 5 );
        var geometry = new THREE.BoxGeometry( size_square, size_square, 5 );
        var material = new THREE.MeshStandardMaterial( { map : texture } )
        var object = new THREE.Mesh( geometry, material );
        object.material.ambient = object.material.color;
        //--------- Position
        object.position.set(0,0,0)
        //--------- Shadow
        object.castShadow = true;
        object.receiveShadow = true;
        //---------
        object.opacity = 1;
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
      var geom = new THREE.CubeGeometry( size_square, size_square, 5 );
      var texture =  new THREE.ImageUtils.loadTexture( "static/upload/48.jpg" )
      var mat = new THREE.MeshLambertMaterial( { color: square_color } )
      chess_repeat_shape(col1,col2,size_square,geom,mat)

} // end function
