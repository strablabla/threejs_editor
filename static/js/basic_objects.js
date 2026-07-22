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
        object.friction = 0

        return object;
}

// All balls are identical spheres (radius = radius_spring, 32×32): per-ball size is done via
// obj.scale (set_sphere_radius), NEVER by editing the geometry. So ONE geometry is shared by
// every ball. Before this, each ball allocated its own THREE.Geometry (~1089 verts + ~2048
// Face3 as JS objects, ~hundreds of KB of HEAP each): 1200 balls ≈ 0.5 GB of JS heap, and
// switching scenes OOM'd V8 ("Ineffective mark-compacts near heap limit") — dispose() only
// frees VRAM, not this heap. Sharing => ~1 geometry total, the OOM disappears.
var _sphere_geo_cache = {}
function shared_sphere_geometry(radius, seg){
        seg = seg || 32
        var key = radius + '_' + seg
        if (!_sphere_geo_cache[key]){
              var g = new THREE.SphereGeometry( radius, seg, seg )
              g._shared = true                 // dispose_object/free_gpu must NOT dispose this: other balls still use it
              _sphere_geo_cache[key] = g
        }
        return _sphere_geo_cache[key]
}

function sphere_blocked(pos){

        var radius = 20;
        var geometry = shared_sphere_geometry( radius, 32 );
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
        var geometry = shared_sphere_geometry( radius, 32 );
        var material = new THREE.MeshBasicMaterial( {color: col} );
        var object = new THREE.Mesh( geometry, material );
        object = obj_basics(object,p,r,name)
        object.type = 'sphere'
        object.height = radius // useful for gravity
        object.radius = radius // real radius (ball-to-ball collision detection)
        scene.add( object );
        objects.push( object )

        return object

}

function set_sphere_radius(obj, R){

      /*
      Change the REAL radius of a sphere: scale the mesh (relative to the
      current radius, without storing a base radius), and update the collision
      radius (obj.radius) and the height (ground bounce).
      */

      if (obj.type !== 'sphere' || !obj.radius || R <= 0){ return }
      obj.scale.multiplyScalar(R / obj.radius)                 // factor relative to the current radius
      obj.radius = R                                           // ball-to-ball collision radius
      obj.height = R                                           // consistency of the ground bounce

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

function set_parallelepiped_dims(obj, dim){

        /*
        Resizes a parallelepiped (wall, cube, slab, pillar...) in place.
        Rebuilds the geometry with the same convention as simple_parallelepiped
        -- CubeGeometry(thickness, width, height) -- and keeps the object standing
        on the ground (z = height/2) when its height changes.
        dim : { width, height, thickness }, each one optional (kept as is if absent)
        */

        // absent, null, NaN or <= 0 -> the current dimension is kept (an empty field
        // of the parameters panel must not shrink the object to nothing)
        function kept(v, cur){ return (typeof v === 'number' && isFinite(v) && v > 0) ? v : cur }
        var w = kept(dim.width,     obj.width)
        var h = kept(dim.height,    obj.height)
        var t = kept(dim.thickness, obj.thickness)
        if (!(w > 0) || !(h > 0) || !(t > 0)){ return }        // object without usable dimensions

        if (obj.geometry && obj.geometry.dispose){ obj.geometry.dispose() }
        obj.geometry = new THREE.CubeGeometry( t, w, h );
        if (h !== obj.height){ obj.position.z = h/2 }        // the object stays laid on the ground
        obj.width = w;
        obj.height = h;
        obj.thickness = t;

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
