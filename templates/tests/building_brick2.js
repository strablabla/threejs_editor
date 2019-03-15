
var bulblight = function(x,y,z){
	//   Bulb light
	bulbMat = new THREE.MeshStandardMaterial ( {
		emissive: 0xffffee,
		emissiveIntensity: 1,
		color: 0x000000
	   });

	  var bulbGeometry = new THREE.SphereGeometry( size_bulb, 16, 8 );
	  bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );
	  bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
	  bulbLight.castShadow = true;
	  bulbLight.position.set( x,y,z  ); // 60, 50, -60

	  return bulbLight
}

var scale = function(rot, posx, posy, posz, heighty){
	//Scale
	/*

	*/

	hstep = 5
	lstep = 10
	wstep = 40
	sx = 0
	sz = 0
	sy = heighty+hstep
	group_scale = new THREE.Group();
	scene.add( group_scale );
	var geom_step = new THREE.CubeGeometry( wstep, hstep, lstep )
	var material_step = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
	step0 = new THREE.Mesh( geom_step, material_step )

	step0.position.set(sx,sy,sz);
	for ( i=0;i<15;i++){
		step = step0.clone()
		step.position.set(sx,sy+hstep*i,sz+lstep*i);
		group_scale.add( step );
	}
	group_scale.rotation.y = rot; // 3*Math.PI / 2;
	group_scale.position.set(posx, posy, posz); //420,0,0

}

var building2 = function(){

	//Houses
	/*

	*/

		group = new THREE.Group();
		scene.add( group );

		//------- Scale

		scale(3*Math.PI / 2, 420,0,0, 0)
		scale(3*Math.PI / 2, 420,0,-120, 0)

		//------- Building

		sx = 10;
		sy = 50;
		sz = 50;
		cy = 70;
		var geom_wall = new THREE.CubeGeometry( sx, sy, sz )
		var material_wall = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		wall0 = new THREE.Mesh( geom_wall, material_wall )
		//------
		var geom_ceiling = new THREE.CubeGeometry( 100, 7, 100 )
		var material_ceiling = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		ceil0 = new THREE.Mesh( geom_ceiling, material_ceiling )

		//------ Ceil first stage

		ceil0.position.set(25,cy,-25);
		ceil1 = ceil0.clone()
		ceil1.position.set(125,cy,-25);
		ceil2 = ceil0.clone()
		ceil2.position.set(225,cy,-25);
		ceil3 = ceil0.clone()
		ceil3.position.set(25,cy,-125);
		ceil4 = ceil0.clone()
		ceil4.position.set(125,cy,-125);
		ceil5 = ceil0.clone()
		ceil5.position.set(225,cy,-125);

		//------ Wall first stage

		wall0.position.set(0,sy,0);
		wall1 = wall0.clone()
		wall1.position.set(sz/2,sy,sz/2);
		wall1.rotation.y = Math.PI / 2;
		wall2 = wall1.clone()
		wall2.position.set(2*sz,sy,sz/2);
		wall3 = wall0.clone()
		wall3.position.set(2*sz,sy,0);
		wall4 = wall0.clone()
		wall4.position.set(2*sz,sy,-sz);
		wall5 = wall0.clone()
		wall5.position.set(0,sy,-sz);
		wall6 = wall1.clone()
		wall6.position.set(sz/2,sy,-3*sz/2);
		wall7 = wall0.clone()
		wall7.position.set(sz,sy,-2*sz);
		wall8 = wall0.clone()
		wall8.position.set(2*sz,sy,-2*sz);
		wall9 = wall1.clone()
		wall9.position.set(5*sz/2,sy,-5*sz/2);
		wall10 = wall1.clone()
		wall10.position.set(7*sz/2,sy,-5*sz/2);
		wall11 = wall1.clone()
		wall11.position.set(5*sz,sy,-5*sz/2);
		wall12 = wall0.clone()
		wall12.position.set(11*sz/2,sy,-2*sz);
		wall13 = wall0.clone()
		wall13.position.set(11*sz/2,sy,-sz);
		wall14 = wall0.clone()
		wall14.position.set(11*sz/2,sy,-0);
		wall15 = wall1.clone()
		wall15.position.set(5*sz,sy,sz/2);
		wall16 = wall1.clone()
		wall16.position.set(4*sz,sy,sz/2);

		//----- Ceil first stage
		group.add( ceil0 );
		group.add( ceil1 );
		group.add( ceil2 );
		group.add( ceil3 );
		group.add( ceil4 );
		group.add( ceil5 );

		//-----
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

		//------ second stage

		wall17 = wall0.clone()
		wall17.position.set(sz, 2*sz , -sz/2);
		wall18 = wall0.clone()
		wall18.position.set(sz, 2*sz , -3*sz/2);
		wall19 = wall1.clone()
		wall19.position.set(sz/2, 2*sz , -2*sz);
		wall20 = wall0.clone()
		wall20.position.set(2*sz, 2*sz , -sz/2);
		wall21 = wall0.clone()
		wall21.position.set(2*sz, 2*sz , -3*sz/2);
		wall22 = wall1.clone()
		wall22.position.set(5*sz/2, 2*sz , -2*sz);
		wall23 = wall1.clone()
		wall23.position.set(7*sz/2, 2*sz , -2*sz);
		wall24 = wall1.clone()
		wall24.position.set(5*sz/2, 2*sz , -3*sz);
		wall25 = wall1.clone()
		wall25.position.set(7*sz/2, 2*sz , -3*sz);
		group.add( wall17 );
		group.add( wall18 )
		group.add( wall19 )
		group.add( wall20 )
		group.add( wall21 )
		group.add( wall22 )
		group.add( wall23 )
		group.add( wall24 )
		group.add( wall25 )

		//------ Ceil second stage

		c2y = 130;
		ceil6 = ceil0.clone()
		ceil6.position.set(50,c2y,-50);
		ceil7 = ceil0.clone()
		ceil7.position.set(150,c2y,-50);
		ceil8 = ceil0.clone()
		ceil8.position.set(50,c2y,-150);
		ceil9 = ceil0.clone()
		ceil9.position.set(150,c2y,-150);

		//----- Ceil second stage

		group.add( ceil6 );
		group.add( ceil7 );
		group.add( ceil8 );
		group.add( ceil9 );

		//----- Wall 2nd

		wall26 = wall0.clone()
		wall26.position.set(sz, 3*sz , -sz);
		wall27 = wall1.clone()
		wall27.position.set(3*sz/2, 3*sz , -sz/2);
		wall28 = wall0.clone()
		wall28.position.set(2*sz, 3*sz , -sz/2);
		wall29 = wall0.clone()
		wall29.position.set(3*sz, 3*sz , -sz/2);
		wall30 = wall1.clone()
		wall30.position.set(7*sz/2, 3*sz , -sz);
		wall31 = wall1.clone()
		wall31.position.set(7*sz/2, 3*sz , -2*sz);
		wall32 = wall1.clone()
		wall32.position.set(3*sz/2, 3*sz , -2*sz);
		group.add( wall26 );
		group.add( wall27 );
		group.add( wall28 );
		group.add( wall29 );
		group.add( wall30 );
		group.add( wall31 );
		group.add( wall32 );

		//------ Ceil third stage

		c3y = 180;
		ceil10 = ceil0.clone()
		ceil10.position.set(50,c3y,-50);
		ceil11 = ceil0.clone()
		ceil11.position.set(150,c3y,-50);
		ceil12 = ceil0.clone()
		ceil12.position.set(50,c3y,-150);
		ceil13 = ceil0.clone()
		ceil13.position.set(150,c3y,-150);

		//----- Ceil third stage

		group.add( ceil10 );
		group.add( ceil11 );
		group.add( ceil12 );
		group.add( ceil13 );




}
