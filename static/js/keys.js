/*

Keys for interacting with the scene..

*/

function keyDownTextField0(event){

    /*

    */

    if(event.keyCode == 14){    												  //
          $('#curr_func').click(function(){
                $(this).css('background-color','red')
                //new_wall_ok = true
          })
      } // end if key code

  } // end keyDownTextField2

function rotate_obj(obj){

  /*
  Make the object rotate.
  */

   obj.rotation.z += -Math.PI/2;

}

function move_obj_up(obj){

  /*
  Make the object going up.
  */

   obj.position.z += step_up_down;

}

function move_obj_down(obj){

  /*
  Make the object going down
  */

   obj.position.z += -step_up_down;

}

function link_toggle(event, namekey, nameparam){

  /*
  Toggle value of parameter with keys
  */

  if (keyev(namekey, event)){             							    // create or not a new object with the mouse..
       window[nameparam] = !window[nameparam]
    } // end if key code
}

function indicate_picking(){

  if (select_picking){ document.getElementById("curr_func").textContent = "picking" }
  else { document.getElementById("curr_func").textContent = "" }

}

function apply_to_one_obj_or_group(action, oneshot){

  if ( INTERSECTED ){ action(INTERSECTED)} // Pi/2 rotation
  else if(list_obj_inside.length > 0){ apply_to_all(action, oneshot) }

}

function keyDownTextField1(event){

    /*

    c : clone
    d : delete
    k : select camera position with mouse..
    h : make an horizontal plane
    l : simple cube
    m : cube with multiple texture
    n : new piece with mouse
    r : rotate
    s : selected area (dotted area)
    arrow up : move up
    arrow down : move down
    SHIFT : pick diff objects..
    */

    $('#curr_func').css('background-color','red')

    if (event.keyCode == 16){    	         // SHIFT key, Picking objects to apply the same action after..
          select_picking = !select_picking
          indicate_picking()
      } // end if key code
    if (event.keyCode == 38 ){ apply_to_one_obj_or_group(move_obj_up, false)  }  // Up
    if (event.keyCode == 40 ){ apply_to_one_obj_or_group(move_obj_down, false) } // Down
    if ( keyev('c', event) ){ if (INTERSECTED){ clone_object() } }   						 // Clone the selected object
    if ( keyev('d', event) ){ delete_object() }   				  // Delete object selected
    if ( keyev('b', event) ){ delete_area() }               // Delete selection area
    if ( keyev('r', event) ){ apply_to_one_obj_or_group(rotate_obj, true) } 						// Rotation

    //--------------------- Change variables

    link_toggle(event, 'g', 'select_move_group')          // move group
    link_toggle(event, 'm', 'new_cube_texture_ok')        // create nw cube with texture
    link_toggle(event, 'n', 'new_wall_ok')                // create new wall
    link_toggle(event, 'l', 'new_simple_cube_ok')         // create new simple cube
    link_toggle(event, 's', 'select_obj')                 // select object in area
    link_toggle(event, 'h', 'make_plane')                 // horizontal plane
    link_toggle(event, 'k', 'select_poscam')              // create new wall
    link_toggle(event, 'i', 'select_obj_infos')           // infos about the object selected
    link_toggle(event, 't', 'select_traj')                // create a trajectory


  } // end keyDownTextField1

  function keyDownTextField2(event){

      /*

      */


    } // end keyDownTextField2

  //-------------------------

  var selectdic = { 'k' : select_poscam, 'n' : new_wall_ok }

  function select_exclude(key){
      // new_wall_ok = false;
      // select_poscam = false;
      selectdic[key] = !selectdic[key];
      for (k in Object.keys(selectdic)){
          if ( k != key ){ selectdic[k] = false; }
      }

  }
  var current_key = ""
  var currfuncdic = {'k':'camera', 'c':'clone', 'r':'rotation',
                      'n':'new piece', 's':'select area', 'd':'delete'}

  function curr_func(key){

      /*
      Show the current action
      */

      current_key = key;
      document.getElementById("curr_func").textContent = currfuncdic[key];
      //select_exclude(key)

  }

  var keyev = function(key, event){

        /*
        generic code for key event with a key letter..
        */

        if (event.keyCode == key.charCodeAt(0)-32 ){
            curr_func(key)
            return true
        }else{ return false }

      } // end keyev

//------------------------- Keys actions

  function clone_object(){

      /*
      Clone the selected object
      */

      dict_shit_clone = {"wall":100, "simple_cube":200}     // shift distance for clone
      clone = INTERSECTED.clone();
      clone.name = INTERSECTED.name + "_" + INTERSECTED.clone_infos.numclone;
      clone.type = INTERSECTED.type;
      //-----------  Clone infos
      INTERSECTED.clone_infos.numclone += 1;
      clone.clone_infos = {"numclone":0,"cloned":true,"origclone":INTERSECTED.name}
      //-----------
      clone.position.x += dict_shit_clone[clone.type];                      // shift position in relation with the original piece
      clone.material.color.setHex( color_clone_pale_blue );      // clone color, pale blue
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
                    } //end if
                } // end for j (reading the list objects)
            } // end for i (reading the list list_obj_inside)
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


  document.addEventListener("keydown", keyDownTextField1, false);
  //document.addEventListener("keydown", keyDownTextField0, false);
