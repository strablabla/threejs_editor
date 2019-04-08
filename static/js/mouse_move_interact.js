
/*

Mouse move 

*/

function action_on_selected_when_moving(raycaster){

      /*
      Action when selected and moving
      */

      var intersects = raycaster.intersectObject( plane );
      var interptsub = intersects[ 0 ].point.sub( offset )
      interptsub.z = SELECTED.position.z
      if ( !SELECTED.blocked ){
              SELECTED.position.copy( interptsub )  // move SELECTED at mouse position..
              if (select_make_track & perpendicular_track){
                    track_in_mouse_moving()
              }
         }  // move the object selected if not blocked..
      nearest_elem = nearest_object(SELECTED)                           // change the color of the nearest objects in yellow..
      if (select_move_group){ move_group() }                            // move the whole group, obj in list_obj_inside

}

function mouse_move_case_intersections(intersects){

      /*
      One intersection or more detected
      */

      if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); //
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      }
      container.style.cursor = 'pointer';
}

function mouse_move_case_no_intersection(){

      /*
      No intersection detected
      */

      if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
      INTERSECTED = null;
      container.style.cursor = 'auto';

}
