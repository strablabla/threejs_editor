
var building_with_brick = function(nb_buildings, esp, dist_inter_build){

	//Houses
	/*
	nb_buildings : number of buidlings
	esp : space inside each block of the building
	dist_inter_build : distance between each building
	*/


		group = new THREE.Group();
		scene.add( group );

		sx = 10;
		sy = 100;
		sz = 50;
		var geom_wall = new THREE.CubeGeometry( sx, sy, sz )
		var material_wall = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		wall0 = new THREE.Mesh( geom_wall, material_wall )
		//------
		var geom_ceiling = new THREE.CubeGeometry( 200, 5, 200 )
		var material_ceiling = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		ceil0 = new THREE.Mesh( geom_ceiling, material_ceiling )
		//------
		ceil0.position.set(100,60,-100);
		//------
		wall0.position.set(0,0,0);
		wall1 = wall0.clone()
		wall1.position.set(sz/2,0,sz/2);
		wall1.rotation.y = Math.PI / 2;
		wall2 = wall1.clone()
		wall2.position.set(2*sz,0,sz/2);
		wall3 = wall0.clone()
		wall3.position.set(2*sz,0,0);
		wall4 = wall0.clone()
		wall4.position.set(2*sz,0,-sz);
		wall5 = wall0.clone()
		wall5.position.set(0,0,-sz);
		wall6 = wall1.clone()
		wall6.position.set(sz/2,0,-3*sz/2);
		wall7 = wall0.clone()
		wall7.position.set(sz,0,-2*sz);
		wall8 = wall0.clone()
		wall8.position.set(2*sz,0,-2*sz);
		wall9 = wall1.clone()
		wall9.position.set(5*sz/2,0,-5*sz/2);
		wall10 = wall1.clone()
		wall10.position.set(7*sz/2,0,-5*sz/2);
		wall11 = wall1.clone()
		wall11.position.set(5*sz,0,-5*sz/2);
		wall12 = wall0.clone()
		wall12.position.set(11*sz/2,0,-2*sz);
		wall13 = wall0.clone()
		wall13.position.set(11*sz/2,0,-sz);
		wall14 = wall0.clone()
		wall14.position.set(11*sz/2,0,-0);
		wall15 = wall1.clone()
		wall15.position.set(5*sz,0,sz/2);
		wall16 = wall1.clone()
		wall16.position.set(4*sz,0,sz/2);
		group.add( ceil0 );
		group.add( wall0 );
		group.add( wall1 );
		group.add( wall2 );
		group.add( wall3 );
		group.add( wall4 );
		group.add( wall5 );
		group.add( wall6 );
		group.add( wall7 );
		group.add( wall8 );
		group.add( wall9 );
		group.add( wall10 );
		group.add( wall11 );
		group.add( wall12 );
		group.add( wall13 );
		group.add( wall14 );
		group.add( wall15 );
		group.add( wall16 );

return group

}
