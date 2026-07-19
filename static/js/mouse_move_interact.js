
/*

Mouse move 

*/

function action_on_selected_when_moving(raycaster){

      /*
      Action when selected and moving
      */

      var intersects = raycaster.intersectObject( plane );
      if (dragging_box && intersects.length){                          // moving a movable box as a block
            box_drag_move(intersects[0].point)
            return
      }
      var interptsub = intersects[ 0 ].point.sub( offset )
      interptsub.z = SELECTED.position.z
      var group_drag = (select_move_group && list_obj_inside.indexOf(SELECTED) >= 0)  // group move: we drag even a blocked wall
      if ( !SELECTED.blocked || group_drag ){
              SELECTED.position.copy( interptsub )  // move SELECTED at mouse position..
              if (new_track_ok & perpendicular_track){
                    track_in_mouse_moving()
              }
         }  // move the object selected if not blocked..
      if (!new_select_ok && selpos.length === 0 && list_sel_corners.length === 2 && list_sel_corners.indexOf(SELECTED) >= 0){   // outside drawing (no area IN PROGRESS: selpos empty): drag a corner -> re-edit the area
              reshape_selection()                              // NB: without the selpos===0 test, this guard triggered while drawing a BOX/plane/view (new_select_ok=false) -> selection instead of box
              return
      }
      nearest_elem = nearest_object(SELECTED)                           // change the color of the nearest objects in yellow..
      if (select_move_group){ move_group() }                            // move the whole group, obj in list_obj_inside

}

function mouse_move_case_intersections(intersects){

      /*
      One intersection or more detected
      */

      if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED && list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); }  // not a selected object
            INTERSECTED = intersects[ 0 ].object;
            if ( list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.currentHex = INTERSECTED.material.color.getHex(); }  // do not overwrite currentHex of a selected object (keeps its true color)
      }
      container.style.cursor = 'pointer';
}

function mouse_move_case_no_intersection(){

      /*
      No intersection detected
      */

      if ( INTERSECTED && list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); }  // do not "restore" a selected object (handled by the selection)
      INTERSECTED = null;
      container.style.cursor = 'auto';

}
