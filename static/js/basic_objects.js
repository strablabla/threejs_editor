disp = 5

function obj_basics(object, p, r, name){

        /*
        Generic function for rotation, shadow, name, cloning etc..
        */

        object.material.ambient = object.material.color;
        //----------
        object.position.set(p.x,p.y,p.z)
        object.rotation.set(r.x,r.y,r.z)     // rot x
        object.castShadow = true;
        object.receiveShadow = true;
        object.name = name;
        object.clone_infos = {"cloned":false,"origclone":"", "numclone":0}
        object.blocked = false
        object.del = false    // if true = to be deleted
        object.mass = 1    //
        object.speed = new THREE.Vector3() //

        return object;
}

function sphere_blocked(pos){

        var radius = 20;
        var geometry = new THREE.SphereGeometry( radius, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        var sphere = new THREE.Mesh( geometry, material );
        scene.add( sphere );
        sphere.position.set(pos.x, pos.y, 0)

        return sphere

}

function basic_sphere(name,p,r,col){

        var radius = 40;
        var geometry = new THREE.SphereGeometry( radius, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: col} );
        var object = new THREE.Mesh( geometry, material );
        object = obj_basics(object,p,r,name)
        object.type = 'sphere'
        scene.add( sphere );

        return sphere

}

function make_meshFaceMaterial(tex_mult_addr){

        /*
        Make meshFaceMaterial
        */

        //$('#curr_func').css('background-color','blue')
        var tex_addr = "static/upload/" + tex_mult_addr ;
        var materials = [];
        for (var i=0; i<6; i++){
            materials.push(new THREE.MeshBasicMaterial({
                map:  THREE.ImageUtils.loadTexture( tex_addr + '/' + i +'.jpg' ),
                color: 0xffffff
                }) // end MeshBasicMaterial
           ) // end push
        } // end for
        //$('#curr_func').css('background-color','red')
        //var meshbasemat = new THREE.MeshBasicMaterial( materials );
        var meshbasemat = new THREE.MeshFaceMaterial( materials );

        return meshbasemat

}

function arrow(){

        var dir = new THREE.Vector3( 1, 2, 0 );

        //normalize the direction vector (convert to vector of length 1)
        dir.normalize();

        var origin = new THREE.Vector3( 0, 0, 0 );
        var length = 100;
        var hex = 0xffff00;

        var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
        scene.add( arrowHelper );

}

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

function simple_parallelepiped(name,p,r,material,dim,type){

        /*
        Simple parallelepiped
        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object
        */

        p.z = dim.height/2;
        var geometry = new THREE.CubeGeometry( dim.thickness, dim.width, dim.height );
        var object = new THREE.Mesh( geometry, material );
        object = obj_basics(object,p,r,name)
        object.width = dim.width;
        object.height = dim.height;
        object.thickness = dim.thickness;
        object.type = type
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

function make_cube_texture(name,p,r,meshFaceMaterial){

        /*

        Cube with Multiple textures

        name : name of the object
        p : position of the object
        r : rotation of the object
        material : color and texture of the object

        */

        var cube_width = 100;
        var cube_thickness = 100;
        var cube_height = 100;
        p.z = cube_height/2;
        //$('#curr_func').css('background-color','blue')
        var geometry = new THREE.BoxGeometry(cube_thickness,cube_width,cube_height);
        $('#curr_func').css('background-color','red')
        var object = new THREE.Mesh(geometry, meshFaceMaterial);
        object.material.ambient = object.material.color;
        //----------
        object = obj_basics(object,p,r,name)
        object.width = cube_width;
        object.height = cube_height;
        object.type = 'cube_mult_tex'

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


function cubes_col_tex(){

      /*
      Cubes with color and texture
      */

      texture1 =  new THREE.ImageUtils.loadTexture( "static/upload/48.jpg" )
      //texture1 = new THREE.MeshLambertMaterial( { color: 0x800000 } )

      size = 400;
      geom_step = new THREE.CubeGeometry( size,size,size )
      material_step = new THREE.MeshBasicMaterial({ map: texture1 })
      mesh = new THREE.Mesh( geom_step, material_step )
      mesh.position.set(0,0,0)
      scene.add( mesh );
      objects.push( mesh )

      //----------------------

      size = 400;
      geom_step0 = new THREE.CubeGeometry( size,size,size )
      material_step0 = new THREE.MeshLambertMaterial( { color: 0x800000 } )
      mesh = new THREE.Mesh( geom_step0, material_step0 )
      var pos_cube = 300
      mesh.position.set(pos_cube,pos_cube,pos_cube)
      scene.add( mesh );
      objects.push( mesh )

}
