/*

Interactions attached to keys..

*/


function toggle_cases_ending(){

        /*
        Different endings
        */

        ending_track() // T key

}

function ending_track(){

        /*
        End of a track: give the mouse and the ground back. Called by toggle_cases_ending (so by
        EVERY link_toggle key) and by reinit_params_ok (switching tool in the Object panel).

        The two guards matter. It used to test « if (new_track_ok) » while link_toggle flips the
        flag BEFORE calling us, so the cleanup ran when ENTERING track mode instead of leaving it
        — and pressing any other toggle key (i, k, m, u, x…) mid-track wiped the segment in
        progress. We now key off the actual state: still in track mode -> hands off; no mark
        standing -> nothing to end.
        */

        if (new_track_ok){ return }                  // track still being laid: do not interrupt it
        if (!list_marks_track.length){ return }      // no track in progress
        end_track()
}

function apply_movement(obj){

        /*
        Put object in interaction list..
        */

         if (list_moving_objects.indexOf(obj) == -1){
               list_moving_objects.push(obj)
         }

}

function indicate_picking(){

      /*
      Indicate the picking mode..
      */

      if (select_picking){ document.getElementById("curr_func").textContent = "picking" }
      else { document.getElementById("curr_func").textContent = "" }

}

//----------------------------- Operations on the objects

function rotate_obj(obj){ obj.rotation.z += -Math.PI/2 }
function move_obj_up(obj){ obj.position.z += step_up_down }
function move_obj_down(obj){ obj.position.z += -step_up_down }

//------------------ Handling the color

function color_group(){

      /*
      Indicate if in group
      */

      for (var i in list_obj_inside) {
           var col
           if (list_obj_inside[i].group_id !== undefined){ col = color_group_persistent_violet }  // persistent group -> violet (priority)
           else if (select_move_group){ col = color_group_medium_blue }          // temporary group move -> blue
           else { col = color_object_inside_pink }                               // simply selected -> pink
           list_obj_inside[i].material.color.setHex(col)
       }

}

function color_toggle(nameparam){

      /*
      Changing the color
      */

      if (nameparam == 'select_move_group'){ color_group() }

}

//------------------------- Clone

function clone_basics(clone){

      /*
      Clone basic attributes
      */

      clone.name = INTERSECTED.name + "_" + INTERSECTED.clone_infos.numclone;
      clone.type = INTERSECTED.type;
      clone.tex_addr = INTERSECTED.tex_addr;
      clone.blocked = INTERSECTED.blocked;

}

function clone_object(){

      /*
      Clone the selected object
      */

      dict_shift_clone = {"wall":100, "simple_cube":200, "pavement": 200, "sphere":100}     // shift distance for clone
      clone = INTERSECTED.clone();
      clone.material = clone.material.clone();   // OWN material (THREE.clone() shares it) -> independent color/selection
      clone._ownMaterial = true
      clone_basics(clone)
      //-----------  Clone infos
      INTERSECTED.clone_infos.numclone += 1;
      clone.clone_infos = {"numclone":0,"cloned":true,"origclone":INTERSECTED.name}
      //-----------
      clone.position.x += (dict_shift_clone[clone.type] || 100);             // shift position in relation with the original piece (fallback 100 if type is missing)
      clone.material.color.setHex( color_clone_pale_blue );      // clone color, pale blue
      //-----------
      scene.add(clone)
      objects.push(clone)

  }

function reinit_selection(){

      /*
       Reinitialize the selection
      */

      list_obj_inside = []  // reinitializing list_obj_inside
      select_picking = false

  }

function apply_to_all(func_all, oneshot){

      /*
       Apply the same func_all to all the objects..
      */

      for (i in list_obj_inside){
            for (j in objects){
                  if (objects[j].name == list_obj_inside[i].name){
                      func_all(objects[j])
                  }     //end if
              }     // end for j (reading the list objects)
          }     // end for i (reading the list list_obj_inside)
      if (oneshot){
          reinit_selection()
      }

  }

function delete_objects_inside(){

      /*
      Delete the objects inside the area.

      remove_single_object does the CLEAN removal: scene, objects, list_moving_objects,
      listorig, the springs that reference them, the selection, and the GPU memory. Merely
      flagging `del = true` + scene.remove() only made them INVISIBLE — they stayed in
      `objects`, and a raycast does not need a mesh to be in the scene graph (their matrixWorld
      is still valid). Every pick therefore kept hitting them where they used to be: a
      right-click on the emptied area re-opened the context menu of a deleted object.
      */

      var victims = list_obj_inside.slice()      // snapshot: remove_single_object empties the list as it goes
      for (var i = 0; i < victims.length; i++){ remove_single_object(victims[i]) }
      list_obj_inside = []
      // The area outlived its contents: the dotted rectangle and the black corner marks were
      // still floating over an empty zone. Same cleanup as Ctrl+S, which also drops the corner
      // marks from `objects` (they are pickable) and leaves the selection tool off.
      if (typeof clear_area_selection === 'function'){ clear_area_selection() }

  } // end delete_objects_inside

function delete_object(){

      /*
      Delete the selected object
      */

      if(list_obj_inside.length > 0){ delete_objects_inside() } // end else if
      else if ( INTERSECTED ){ remove_single_object(INTERSECTED) }   // same clean removal (it resets INTERSECTED)
      // safety net: an object still flagged `del` (a scene saved back when deletion left
      // tombstones behind) is removed for good, so it stops being picked by the raycasts.
      for (var i = objects.length - 1; i >= 0; i--){
            if (objects[i] && objects[i].del){ remove_single_object(objects[i]) }
      }
      emit_infos_scene() // send infos to the server..

} // end delete_object

function curr_func(key){

        /*
        Show the current action
        */

        current_key = key;
        document.getElementById("curr_func").textContent = currfuncdic[key];
        //select_exclude(key)

  }
