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
        object.radius_interact = 0 //
        object.magnet = true

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

        /*
        Basic sphere
        */

        var radius = radius_spring;
        var geometry = new THREE.SphereGeometry( radius, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: col} );
        var object = new THREE.Mesh( geometry, material );
        object = obj_basics(object,p,r,name)
        object.type = 'sphere'
        object.height = radius // useful for gravity
        scene.add( object );
        objects.push( object )

        return object

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
