function import_collada(addr, scale, position, rotation){ // import collada files
    loader = new THREE.ColladaLoader();
    loader.load(addr, function(collada) {
      collada.scene.scale.set(scale[0],scale[1],scale[2]);
      collada.scene.position.x = position[0];
      collada.scene.position.y = position[1];
      collada.scene.position.z = position[2];
      collada.scene.rotation.x = rotation[0];
      scene.add(collada.scene)
    })
}// end import_collada

function tableau(txt, size,  x, z, y, roty){
    // on créé un  plan pour lequel on définit un matériau puis on l’ajoute à la scène
    var geom = new THREE.PlaneGeometry( size, size, 2);
    var mat= new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture(txt), overdraw: true } );
    var tabl = new THREE.Mesh( geom, mat); // , new THREE.SphericalReflectionMapping()

    tabl.position.x = +x;
    tabl.position.z = +z;
    tabl.rotation.y += roty;
    tabl.position.y = y; //hauteur
    return tabl
    //scene.add(tabl);
}

function make_ground(pic, size, level) {
  var geom = new THREE.CubeGeometry( size, 1, size);
  var mat = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( pic
  ), overdraw: true, receiveShadow : true  } ); // new THREE.SphericalReflectionMapping()
  ground = new THREE.Mesh(geom, mat);
  ground.position.y = level;
  scene.add(ground);
}

function make_ground_repetitive(pic, level, size) {
    halfnb = 10
    for (j=-halfnb; j<halfnb; j++){
          for (i=-halfnb; i<halfnb; i++){
              var geom = new THREE.CubeGeometry( size, 1, size);
              var mat = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( pic
              ), overdraw: true, receiveShadow : true  } ); // new THREE.SphericalReflectionMapping()
              ground = new THREE.Mesh(geom, mat);
              ground.position.y = level;
              ground.position.x = size*i
              ground.position.z = size*j;
              scene.add(ground);
         }
      }

}

var hollow_cube_sphere = function(size, col){
    /*
    Emptying cube with a sphere
    */
    var color = col || 'white'
	size_hollow_cube = size
	size_sphere_cube = size_hollow_cube/5*3

		var cube_geometry = new THREE.CubeGeometry( size_hollow_cube, size_hollow_cube, size_hollow_cube );
		var cube_mesh = new THREE.Mesh( cube_geometry );
		cube_mesh.position.x = 0;
		var cube_bsp = new ThreeBSP( cube_mesh );
		var sphere_geometry = new THREE.SphereGeometry( size_sphere_cube, 32, 32 );
		var sphere_mesh = new THREE.Mesh( sphere_geometry );
		sphere_mesh.position.x = 0;
		var sphere_bsp = new ThreeBSP( sphere_mesh );

		var subtract_bsp = cube_bsp.subtract( sphere_bsp );
		var result = subtract_bsp.toMesh( new THREE.MeshLambertMaterial({
			shading: THREE.SmoothShading,
			//map: new THREE.TextureLoader().load('texture.png')
			color: color
		}));

		result.geometry.computeVertexNormals();
	return result
}
