function make_ground(dim_floor){
    // Floor

    floorMat = new THREE.MeshStandardMaterial ( {
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 0.005,
        transparence: 0.5
    });

    var floorGeometry = new THREE.PlaneBufferGeometry( dim_floor,dim_floor );
    var floorMesh = new THREE.Mesh( floorGeometry, floorMat );
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2.0;
    scene.add( floorMesh );


} // end function
