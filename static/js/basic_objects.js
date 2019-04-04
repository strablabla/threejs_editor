disp = 5

function sphere_blocked(pos){

        var radius = 20;
        var geometry = new THREE.SphereGeometry( radius, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        var sphere = new THREE.Mesh( geometry, material );
        scene.add( sphere );
        sphere.position.set(pos.x, pos.y, 0)

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
        //------------------
        var geometry = new THREE.CubeGeometry( size_pawns, size_pawns, size_pawns );
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
        //------------------
        object = obj_basics(object,p,r,name)
        object.type = "pawn"
        scene.add( object );
        objects.push( object )

        return object

} // end function

function delete_area(){

        /*
        Delete area
        */

        for (i in list_dotted_area){ scene.remove(list_dotted_area[i]) }
        list_dotted_area = []
        reinit_selection()

} // end delete_area

function dotted_area(nbelem,elem, limits_minmax, size_elem_dotted_line){

        /*
        Dotted area
        */

        var [minx, maxx, miny, maxy] = limits_minmax
        var [nbelem1,nbelem2] = nbelem

        dotted_line(nbelem2,elem,'x',minx,miny,size_elem_dotted_line)
        dotted_line(nbelem1,elem,'y',minx,miny,size_elem_dotted_line)
        dotted_line(nbelem2,elem,'x',maxx,miny,size_elem_dotted_line)
        dotted_line(nbelem1,elem,'y',minx,maxy,size_elem_dotted_line)

}

function dotted_line(nbelem,elem,kind,posx,posy,size_elem_dotted_line){

        /*
        Dotted lines
        */

        for (var i=0; i < nbelem+1; i++){
              var elem_clone = elem.clone()
              if (kind == "x"){
                  elem_clone.position.x = posx;
                  elem_clone.position.y = posy+2*i*size_elem_dotted_line;
              }
              else if (kind == 'y'){
                  elem_clone.position.x = posx+2*i*size_elem_dotted_line;
                  elem_clone.position.y = posy
              }
              elem_clone.position.z = 25;
              scene.add(elem_clone)
              list_dotted_area.push(elem_clone)

          } // end for
}

function make_dotted_area(selpos){

        /*
        Area for selecting the pieces
        */

        //alert("selpos.length " + selpos.length)
        var side1 = Math.abs(selpos[0].position.x - selpos[1].position.x) // length side1
        var side2 = Math.abs(selpos[0].position.y - selpos[1].position.y) // length side2
        //alert(side1 + '__' + side2)
        $('#curr_func').css('background-color','grey')

        //-----------------
        var geometry = new THREE.CubeGeometry( size_elem_dotted_line, size_elem_dotted_line, 3 );
        var elem = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: color_dotted_line_black } ) );
        //----------------- number of elements
        nbelem1 = Math.round(side1/(2*size_elem_dotted_line))
        nbelem2 = Math.round(side2/(2*size_elem_dotted_line))
        //----------------- limits
        var minx = Math.min(selpos[0].position.x,selpos[1].position.x)
        var miny = Math.min(selpos[0].position.y,selpos[1].position.y)
        var maxx = Math.max(selpos[0].position.x,selpos[1].position.x)
        var maxy = Math.max(selpos[0].position.y,selpos[1].position.y)
        //-----------------
        var limits_minmax = [minx, maxx, miny, maxy]
        var nbelem = [nbelem1,nbelem2]
        dotted_area(nbelem,elem, limits_minmax, size_elem_dotted_line)

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
          object.position.x = 0
          object.position.y = 0
          object.position.z = 0
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
          var geometry = new THREE.CubeGeometry( size_square, size_square, 5 );
          var texture =  new THREE.ImageUtils.loadTexture( "static/upload/48.jpg" )
          var square_color
          for ( var i = 0; i < 64; i ++ ) {
              if ((i+Math.floor(i/8))%2==0){square_color = col1}
              else{square_color = col12}
              //var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map : texture } ) );
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
