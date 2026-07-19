
/*

Mouse_down

*/

function mouse_down_case_intersections(intersects,raycaster){

      /*
      One intersection or more detected
      */

      controls.enabled = false;
      SELECTED = intersects[ 0 ].object;
      intersects = raycaster.intersectObject( plane );
      container.style.cursor = 'move';
      if (typeof box_drag_begin === 'function' && intersects.length){ box_drag_begin(intersects[0].point) }  // movable box?

      return intersects
}

function MouseDown_actions(){

      /*
      Mouse down actions
      */

      if ( INTERSECTED && list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.material.color.setHex( color_intersected_green ); }   // green on click, except for an already selected object (keeps its pink/color)
      if (select_picking){ picking_action() }                             // adding the object to the list of the picked elements..
      if (select_move_group){ keep_relative_positions() }                 // save the relative positions inside the group
      if (new_track_ok){
          if (list_marks_track.length > 1){ make_oriented_track() }  // Draw the track
      }

}
