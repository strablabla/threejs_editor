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

//------------------ Toggle

function link_toggle(event, namekey, nameparam){

      /*
      Toggle value of parameter with keys
      */

      if (keyev(namekey, event)){            // create or not a new object with the mouse..
           window[nameparam] = !window[nameparam]
        } // end if key code
      color_toggle(nameparam)
      toggle_cases_ending()

}



function apply_to_one_obj_or_group(action, oneshot){

      if ( INTERSECTED ){ action(INTERSECTED)} // Pi/2 rotation
      else if(list_obj_inside.length > 0){ apply_to_all(action, oneshot) }

}

function keyDownTextField1(event){

      /*

      a : trigger interactions
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

      //--------------

      if (event.keyCode == 38 ){ apply_to_one_obj_or_group(move_obj_up, false)  }  // Up
      if (event.keyCode == 40 ){ apply_to_one_obj_or_group(move_obj_down, false) } // Down
      if ( keyev('a', event) ){ apply_movement() }
      if ( keyev('c', event) ){ if (INTERSECTED){ clone_object() } }   						 // Clone the selected object
      if ( keyev('d', event) ){ delete_object() }   				  // Delete object selected
      if ( keyev('b', event) ){ delete_area() }               // Delete selection area
      if ( keyev('r', event) ){ apply_to_one_obj_or_group(rotate_obj, true) } 						// Rotation

      //--------------------- Change variables

      link_toggle(event, 'g', 'select_move_group')          // move group
      link_toggle(event, 'h', 'make_plane')                 // horizontal plane
      link_toggle(event, 'i', 'select_obj_infos')           // infos about the object selected
      link_toggle(event, 'k', 'select_poscam')              // create new wall
      link_toggle(event, 'l', 'new_simple_cube_ok')         // create new simple cube
      link_toggle(event, 'm', 'new_cube_texture_ok')        // create nw cube with texture
      link_toggle(event, 'n', 'new_wall_ok')                // create new wall
      link_toggle(event, 'p', 'new_pavement_ok')            // create new pavement
      link_toggle(event, 's', 'select_obj')                 // select object in area
      link_toggle(event, 't', 'select_make_track')          // create a track

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

var keyev = function(key, event){

        /*
        generic code for key event with a key letter..
        */

        if (event.keyCode == key.charCodeAt(0)-32 ){
            curr_func(key)
            return true
        }else{ return false }

      } // end keyev




document.addEventListener("keydown", keyDownTextField1, false);
//document.addEventListener("keydown", keyDownTextField0, false);
