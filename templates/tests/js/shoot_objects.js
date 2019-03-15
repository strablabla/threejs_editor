
var make_balls = function(){


	/*

	*/
  listballs = []
	sizeball = 30
	for (i=1;i<5;i++){

				var geometry = new THREE.SphereGeometry( sizeball, 32, 32 );
				var texture = new THREE.TextureLoader().load( "texture/azulejos_portugal.jpg" );
				var material = new THREE.MeshBasicMaterial( {map: texture} );
				var balloon = new THREE.Mesh( geometry, material );
				//----------------
				var posball = 30*i
				balloon.position.set(posball,posball,posball)
				listballs.push(balloon)

			}

	return listballs
	}
