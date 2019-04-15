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
        When ending the track retrieve the control of the mouse and the ground.
        */

        if (select_make_track){
            SELECTED = null;
            controls.enabled = true;
            scene.remove(last_mark_track)
        }
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
           if (select_move_group){ var col = color_group_medium_blue }    // color group
           else{ var col = color_object_inside_pink}                      // color ungroup
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

      dict_shift_clone = {"wall":100, "simple_cube":200, "pavement": 200}     // shift distance for clone
      clone = INTERSECTED.clone();
      clone_basics(clone)
      //-----------  Clone infos
      INTERSECTED.clone_infos.numclone += 1;
      clone.clone_infos = {"numclone":0,"cloned":true,"origclone":INTERSECTED.name}
      //-----------
      clone.position.x += dict_shift_clone[clone.type];                      // shift position in relation with the original piece
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
      Delete the objects inside the area
      */

      for (i in list_obj_inside){
            for (j in objects){
                  if (objects[j].name == list_obj_inside[i].name){
                      objects[j].del = true
                      scene.remove(objects[j])
                  } //end if
              } // end for j
          } // end for i
      list_obj_inside = []

  } // end delete_objects_inside

function delete_object(){

      /*
      Delete the selected object
      */

      if(list_obj_inside.length > 0){ delete_objects_inside() } // end else if
      else if ( INTERSECTED ){
          for (i in objects){
                if (objects[i].name == INTERSECTED.name){
                    INTERSECTED.del = true
                } // end if
            } // end for

      } // end else if

      objects.forEach(function(elem){
          if (elem.del){ scene.remove(elem) } // remove all the element with the del attribute at true..
      })
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
