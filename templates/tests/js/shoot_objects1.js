
var make_towers = function(){
	/*

	*/
  listtowers = []
	sizetower = 100
	for ( i=1; i < 10; i++ ){

				var geometry = new THREE.CubeGeometry( 10, sizetower, 10 );
				//var texture = new THREE.TextureLoader().load( "texture/azulejos_portugal.jpg" );
        //var texture = new THREE.TextureLoader().load( "textures/hardwood2_diffuse.jpg" );
        var texture = new THREE.TextureLoader().load( "texture/brique_noire.jpg" );
				var material = new THREE.MeshBasicMaterial( { map: texture } );
				var tow = new THREE.Mesh( geometry, material );
				//----------------
				var postow = 10*i
				tow.position.set(10*Math.random()*postow, 10, 10*Math.random()*postow)
        //balloon.rotation.y = Math.PI/4
				listtowers.push(tow)
			}
	return listtowers
	}

var make_balls = function(){
	/*

	*/
  listballs = []
	sizeball = 10
	for ( i=1; i < 20; i++ ){

				var geometry = new THREE.SphereGeometry( sizeball, 32, 32 );
				//var texture = new THREE.TextureLoader().load( "texture/azulejos_portugal.jpg" );
        //var texture = new THREE.TextureLoader().load( "textures/hardwood2_diffuse.jpg" );
        var texture = new THREE.TextureLoader().load( "texture/tete-de-mort.jpg" );
				var material = new THREE.MeshBasicMaterial( { map: texture } );
				var balloon = new THREE.Mesh( geometry, material );
				//----------------
				var posball = 10*i
				balloon.position.set(Math.random()*posball, posball, 10*posball)
        balloon.rotation.y = Math.PI/4
				listballs.push(balloon)
			}
	return listballs
	}

  var make_explosion = function(){
  	/*

  	*/
    var listballs = []
  	var sizeball = 100
  	for ( i=1; i < 4; i++ ){

  				var geometry = new THREE.SphereGeometry( sizeball, 32, 32 );
  				//var texture = new THREE.TextureLoader().load( "texture/azulejos_portugal.jpg" );
          var texture = new THREE.TextureLoader().load( "textures/hardwood2_diffuse.jpg" );
  				var material = new THREE.MeshBasicMaterial( { map: texture } );
  				var balloon = new THREE.Mesh( geometry, material );
  				//----------------
          var posball = 30*i
          balloon.position.set(posball, posball, posball)
  				listballs.push(balloon)
  			}

  	return listballs
  	}
