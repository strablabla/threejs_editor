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

      if (poscam_dragging){ poscam_update(event); return }   // "camera position" drag (k key): arrow + dotted line
      if (vdrag_dragging){ vdrag_mouse_move(event); return } // altitude mode (double-click): only z follows the mouse
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

      if ( event.button === 2 ){ return }   // right click -> context menu only (no selection/grab)
      if (vdrag_mouse_down(event)){ return }              // altitude mode: vertical drag (no selection/horizontal drag)
      if (select_poscam){ poscam_begin(event); return }   // k key: start the "camera position" drag (A fixed here)

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
      if (poscam_dragging){ poscam_end(event); return }   // end of the "camera position" drag: apply the view + clean up
      if (vdrag_dragging){ vdrag_mouse_up() }             // end of the vertical drag (we stay in altitude mode) -> common cleanup below
      controls.enabled = true;
      if (dragging_box){ box_drag_end() }       // end of moving a box -> persist
      if (nearest_elem){ magnet_between_objects(nearest_elem) }  // attraction between walls.. by the sides..
      restore_yellow()                          // restore the true color of the last yellow object
      nearest_elem = null
      if ( SELECTED && selpos.length === 0 ) { // release the grabbed object, EXCEPT while defining an area
          LAST_SELECTED = SELECTED;            // (area corners must follow the mouse until the 2nd click).
          SELECTED = null;                     // selpos empty => real object drag: we release it (fixes the "stuck to the mouse").
      }
      container.style.cursor = 'auto';
      color_pick()                          // Color the picked objects..

}
