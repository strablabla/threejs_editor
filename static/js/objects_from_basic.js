

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

function CustomCylinder( scale ) {
      THREE.Curve.call( this );
      this.scale = ( scale === undefined ) ? 1 : scale;
  }

CustomCylinder.prototype = Object.create( THREE.Curve.prototype );
CustomCylinder.prototype.constructor = CustomCylinder;
CustomCylinder.prototype.getPoint = function ( t ) {

        var tx = 0;
        var ty = 0;
        var tz = 60*t;

        return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );
    };

function CustomSpiral( scale ) {
      THREE.Curve.call( this );
      this.scale = ( scale === undefined ) ? 1 : scale;
  }

CustomSpiral.prototype = Object.create( THREE.Curve.prototype );
CustomSpiral.prototype.constructor = CustomSpiral;
CustomSpiral.prototype.getPoint = function ( t ) {

        rspring = 5
        nbturns = 5
        var tx = rspring*Math.sin( 2*nbturns * Math.PI * t );
        var ty = rspring*Math.cos( 2*nbturns * Math.PI * t );
        var tz = 60*t;

        return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );
    };

function spring(name,p,r,col){

        /*
        Spring
        */

        var path = new CustomSpiral( 7 );
        var geometry = new THREE.TubeGeometry( path, 200, 10, 20, false );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } ); //
        var object = new THREE.Mesh( geometry, material );
        //object.scale.set(0.1,0.2,0.1)
        object = obj_basics(object,p,r,name)
        object.type = "spring"
        scene.add( object );
        objects.push( object )

        return object

}

function elastic(name,p,r,col){

        /*
        Elastic
        */
        //
        // var geometry = new THREE.CylinderGeometry( radius_elastic, radius_elastic, 1, 32 );
        // var material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } ); //
        // var object = new THREE.Mesh( geometry, material );

        var path = new CustomCylinder( 7 );
        var geometry = new THREE.TubeGeometry( path, 200, 10, 20, false );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } ); //
        var object = new THREE.Mesh( geometry, material );

        object = obj_basics(object,p,r,name)
        object.type = "elastic"
        scene.add( object );
        objects.push( object )

        return object

}


function side1_side2(selpos){

        /*

        */

        var side1 = Math.abs(selpos[0].position.x - selpos[1].position.x)
        var side2 = Math.abs(selpos[0].position.y - selpos[1].position.y)

        return [side1, side2]

}

function middle_side1_side2(selpos){

        /*

        */

        var middle_side1 = (selpos[0].position.x + selpos[1].position.x)/2
        var middle_side2 = (selpos[0].position.y + selpos[1].position.y)/2

        return [middle_side1, middle_side2]

}

function make_horizontal_area(selpos){

        /*
        Horizontal rectangular area..
        triggered with H key..
        */

        var [side1, side2] = side1_side2(selpos)
        var geometry = new THREE.CubeGeometry( side1, side2, 5 );
        var square_color = 0xffffff
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: square_color } ) );
        object.material.ambient = object.material.color;
        //----------
        var [middle_side1, middle_side2] = middle_side1_side2(selpos)
        object.position.x = middle_side1
        object.position.y = middle_side2
        object.position.z = 160
        //--------- Shadow
        object.castShadow = true;
        object.receiveShadow = true;
        //----------
        object.opacity = 0.4;
        scene.add( object );
        objects.push( object )

} // end function make area


function wall_for_box(pos, dim, orientation){

      var newname = random_name()
      basic_tex = new THREE.ImageUtils.loadTexture( basic_tex_addr ) // Default white texture
      listmat[newname] = new THREE.MeshBasicMaterial({ map : basic_tex, color : color_basic_default_pale_grey})

      var object = simple_parallelepiped(newname,pos,{"x":0, "y":0, "z":0},listmat[newname],dim,'wall_box')
      object.orientation = orientation
      listorig[newname] = object
      scene.add(object)
      objects.push(object)
      //alert("wall box is ok")

}

function four_pos_for_box(side1, side2, middle_side1, middle_side2){

      /*

      */

      var pos1 = new THREE.Vector3(middle_side1+side1/2, middle_side2, 0)
      var pos2 = new THREE.Vector3(middle_side1-side1/2, middle_side2, 0)
      var pos3 = new THREE.Vector3(middle_side1, middle_side2+side2/2, 0)
      var pos4 = new THREE.Vector3(middle_side1, middle_side2-side2/2, 0)

      return [ pos1, pos2, pos3, pos4 ]

}

function make_new_box(selpos){

      /*

      */

      var [side1, side2] = side1_side2(selpos)
      var [middle_side1, middle_side2] = middle_side1_side2(selpos)
      var [pos1, pos2, pos3, pos4] = four_pos_for_box(side1, side2, middle_side1, middle_side2)

      //var dim = {'width':2,'height':150,'thickness':200}

      var side2_orient = new THREE.Vector3(1,0,0)
      var side1_orient = new THREE.Vector3(0,1,0)

      wall_for_box(pos1, {'width':side2,'height':150,'thickness':2}, side2_orient)
      wall_for_box(pos2, {'width':side2,'height':150,'thickness':2}, side2_orient)
      wall_for_box(pos3, {'width':2,'height':150,'thickness':side1}, side1_orient)
      wall_for_box(pos4, {'width':2,'height':150,'thickness':side1}, side1_orient)

}

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
