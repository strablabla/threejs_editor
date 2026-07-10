
/*

Mouse move 

*/

function action_on_selected_when_moving(raycaster){

      /*
      Action when selected and moving
      */

      var intersects = raycaster.intersectObject( plane );
      if (dragging_box && intersects.length){                          // déplacement d'une boîte movable en bloc
            box_drag_move(intersects[0].point)
            return
      }
      var interptsub = intersects[ 0 ].point.sub( offset )
      interptsub.z = SELECTED.position.z
      var group_drag = (select_move_group && list_obj_inside.indexOf(SELECTED) >= 0)  // déplacement de groupe : on tire même une paroi bloquée
      if ( !SELECTED.blocked || group_drag ){
              SELECTED.position.copy( interptsub )  // move SELECTED at mouse position..
              if (new_track_ok & perpendicular_track){
                    track_in_mouse_moving()
              }
         }  // move the object selected if not blocked..
      if (!new_select_ok && list_sel_corners.length === 2 && list_sel_corners.indexOf(SELECTED) >= 0){   // hors tracé : glisser un coin -> ré-édite la zone
              reshape_selection()
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
            if ( INTERSECTED && list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); }  // pas un objet sélectionné
            INTERSECTED = intersects[ 0 ].object;
            if ( list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.currentHex = INTERSECTED.material.color.getHex(); }  // ne pas écraser currentHex d'un objet sélectionné (garde sa vraie couleur)
      }
      container.style.cursor = 'pointer';
}

function mouse_move_case_no_intersection(){

      /*
      No intersection detected
      */

      if ( INTERSECTED && list_obj_inside.indexOf(INTERSECTED) < 0 ){ INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); }  // ne pas « restaurer » un objet sélectionné (géré par la sélection)
      INTERSECTED = null;
      container.style.cursor = 'auto';

}
