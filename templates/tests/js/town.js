var hollow_by_cube = function(size, col, main, inside){
    /*
    Emptying cube or sphere with cubes
    */
    var color = col || 'white'
	size_hollow_cube = size
    size_hollow_sphere = size/2
	size_rectangle = size_hollow_cube*1.1
    list_rect = []
        if (main == 'cube'){
            var main_geometry = new THREE.CubeGeometry( size_hollow_cube, size_hollow_cube, size_hollow_cube );
            var main_mesh = new THREE.Mesh( main_geometry );
            main_mesh.position.x = 0;
            var main_bsp = new ThreeBSP( main_mesh );
        }
        else if (main == 'sphere'){
            var main_geometry = new THREE.SphereGeometry( size_hollow_sphere, 32,32 );
            var main_mesh = new THREE.Mesh( main_geometry );
            main_mesh.position.x = 0;
            var main_bsp = new ThreeBSP( main_mesh );
        }

        var a = size_rectangle
        var b = size_hollow_cube*inside
        list_dim = [[a,b,b],[b,a,b],[b,b,a]]

        for (i=0; i<3; i++){
            var dim = list_dim[i]
            var rect_geometry = new THREE.CubeGeometry( dim[0], dim[1], dim[2] );
            var rect_mesh = new THREE.Mesh( rect_geometry );
            rect_mesh.position.x = 0;
            var rect_bsp = new ThreeBSP( rect_mesh );
            var main_bsp = main_bsp.subtract( rect_bsp );
        }

		var result = main_bsp.toMesh( new THREE.MeshLambertMaterial({
			shading: THREE.SmoothShading,
			//map: new THREE.TextureLoader().load('texture.png')
			color: color
		}));

		result.geometry.computeVertexNormals();
	return result
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

var pyramid_hollow = function(side){
	/*
	pyramid with hollow cubes
	*/
	var size_hc = 50
	var hc = hollow_cube_sphere(size_hc, 'blue')
	for ( var i = 0; i < side; i ++ ) {
		for (var j = i; j < side-i; j ++){
			for (var k = i; k < side-i; k ++){
				var new_hc = hc.clone()
				new_hc.position.set(600+size_hc*j,size_hc*i,size_hc*k)
				scene.add( new_hc );
				}
		}
	}
} // end pyramid

var pyramid_hollow_flat = function(side){
	/*
	pyramid with hollow cubes
	*/
	var size_hc = 50
	var hc = hollow_cube_sphere(size_hc, 'blue')
	for ( var i = 0; i < side; i ++ ) {
		for (var j = 0; j < side-i; j ++){
			for (var k = 0; k < side-i; k ++){
				var new_hc = hc.clone()
				new_hc.position.set(600+size_hc*j,size_hc*i,size_hc*k)
				scene.add( new_hc );
				}
		}
	}
} // end pyramid


var simple_colored_buildings = function(nb_buildings, esp, dist_inter_build){

	//Houses
	/*
	nb_buildings : number of buidlings
	esp : space inside each block of the building
	dist_inter_build : distance between each building
	*/

	for ( var j = 0; j < nb_buildings; j ++ ) {
		group = new THREE.Group();
		scene.add( group );

		// Cube

		var geometry = new THREE.BoxGeometry( 50,50,50 );

		for ( var i = 0; i < geometry.faces.length; i += 2 ) {

				var hex = Math.random() * 0xffffff;
				geometry.faces[ i ].color.setHex( hex );
				geometry.faces[ i + 1 ].color.setHex( hex );

		}

		//var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
		//var material = new THREE.MeshStandardMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5, roughness: 0.5, metalness: 1.0 } );
		var material = new THREE.MeshPhongMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5, roughness: 0.5, metalness: 1.0 } );

		for ( var i = 0; i < 7; i ++ ) {

			var cube = new THREE.Mesh( geometry, material );
			cube.position.x = Math.random() * esp;
			cube.position.y = Math.random() * esp;
			cube.position.z = Math.random() * esp;
			cube.scale.multiplyScalar( Math.random() + 0.5 );
			group.add( cube );
			group.position.y = 50/2; //*Math.power(-1,i);
			group.position.z = Math.random()*dist_inter_build;
			group.position.x = Math.random()*dist_inter_build;

		} // end for
	}

}

function make_trunk(){
    //alert("make racket")
    var geometry = new THREE.CubeGeometry( 20, 80, 20 );

        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x000000 } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = 0;
        object.position.y = 130 ;
        object.position.z = 0;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        var hex = Math.random() * 0xffffff;
        object.material.color.setHex( hex );
        return object

} // end function

function make_green_bowl(){
    //alert("make_head")
    var geometry = new THREE.SphereGeometry( 70, 32, 32 );
        var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x33cc33 } ) );
        object.material.ambient = object.material.color;
        //----------------
        object.position.x = 0;
        object.position.y = 200 ;
        object.position.z = 0;
        //----------------
        object.castShadow = true;
        object.receiveShadow = true;
        return object
} // end function


function make_simple_tree(){
    group_tree = new THREE.Object3D();//create an empty container
    //-------------------------------
    var green_bowl = make_green_bowl()
    var trunk = make_trunk()
    group_tree.add( green_bowl );
    group_tree.add( trunk );
    scene.add( group_tree );//when done, add the group to the scene
    return group_tree
} // end function
