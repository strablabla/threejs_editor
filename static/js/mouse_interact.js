/*

Mouse interactions with the scene.

*/


function init_drag(){

      /*
      Init the dragging function..
      */

      projector = new THREE.Projector();
      var size_plane = 10000
      var geom = new THREE.PlaneGeometry( size_plane, size_plane, 8, 8 )
      var mat = new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } )
      plane = new THREE.Mesh( geom, mat );
      plane.visible = true;
      scene.add( plane );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

      /*
      Mouse moving
      */

      var raycaster = make_raycaster(event)
      if (new_select_ok){ refresh_dotted_area() } // refresh the dotted line
      if ( SELECTED ) {
          action_on_selected_when_moving(raycaster)
          return;
      } // end if SELECTED
      var intersects = raycaster.intersectObjects( objects );
      if ( intersects.length > 0 ) { mouse_move_case_intersections(intersects) }
      else { mouse_move_case_no_intersection() }
      color_pick() // Color the picked objects..

} // end mouse move

function onDocumentMouseDown( event ) {

      /*
      Mouse down
      */

      var raycaster = make_raycaster(event)
      var intersects = raycaster.intersectObjects( objects );
      if ( intersects.length > 0 ) { intersects = mouse_down_case_intersections(intersects,raycaster) }
      else{ $('.panel').css({'top':"10px","left":"-300px"}) }             // hide panel when mouse leaves..
      MouseDown_actions()

}

function onDocumentMouseUp( event ) {

      /*
      Mouse up
      */

      event.preventDefault();
      controls.enabled = true;
      if (nearest_elem){ magnet_between_objects(nearest_elem) }  // attraction between walls.. by the sides..
      if ( INTERSECTED ) {
          LAST_SELECTED = SELECTED;
          SELECTED = null;
      }
      container.style.cursor = 'auto';
      color_pick()                          // Color the picked objects..

}
