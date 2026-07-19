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

function toggle_tool(key){

      /*
      Enable/disable a creation tool (ball, chain...).
      One press enables the tool (and disables the others); a second press turns it off.
      */

      var flag = 'new_' + key + '_ok'
      if (window[flag]){                     // already active -> turn it off
            reinit_params_ok()
            if (key == 'string'){ list_string = [] }  // start a new chain on next use
            $('#curr_tool').text('aucun outil')
            $('#active_obj_navbar').text('')   // no active tool -> navbar cleared
      } else {
            if (key == 'string'){ list_string = [] }  // each activation starts an independent chain
            tool_key(key)                    // enable this tool (and reset the others)
      }

}

function apply_to_one_obj_or_group(action, oneshot){

      if ( INTERSECTED ){ action(INTERSECTED)}        // Apply to one object, the intersected one..
      else if(list_obj_inside.length > 0){ apply_to_all(action, oneshot) } // Apply to the list of selected objects..

}

function keyDownTextField1(event){

      /*

      a : trigger interactions
      c : clone
      d : delete
      k : select camera position with mouse..
      h : make an horizontal plane
      m : cube with multiple texture
      p : pick diff objects..
      r : rotate
      s : selected area (dotted area)
      arrow up : move up
      arrow down : move down

      */

      var _t = event.target || event.srcElement                 // if typing in a field (modal, scene name...),
      if (_t){                                                   // don't trigger the 3D scene shortcuts
            var _tag = (_t.tagName || '').toLowerCase()
            if (_tag === 'input' || _tag === 'textarea' || _tag === 'select' || _t.isContentEditable){ return }
      }

      $('#curr_func').css('background-color','red')

      //if (event.keyCode == 16){    	         // SHIFT key, Picking objects to apply the same action after..
      if ( keyev('p', event) ){
            select_picking = !select_picking
            indicate_picking()
        } // end if key code

      //--------------

      if (event.keyCode == 38 ){ apply_to_one_obj_or_group(move_obj_up, false)  }  // Up
      if (event.keyCode == 40 ){ apply_to_one_obj_or_group(move_obj_down, false) } // Down
      // Copy / paste (Ctrl+C / Ctrl+V) — replaces the old clone on « c » alone
      if (event.ctrlKey && (event.keyCode === 67 || event.key === 'c' || event.key === 'C')){ event.preventDefault(); do_copy(); return }
      if (event.ctrlKey && (event.keyCode === 86 || event.key === 'v' || event.key === 'V')){ event.preventDefault(); do_paste(); return }

      if ( keyev('a', event) ){ scene_animation_ok = true; apply_to_one_obj_or_group(apply_movement, false) } // starts the animation (+ records the hovered object)
      if ( keyev('d', event) && !event.shiftKey ){ delete_object() }   				  // Delete object selected (only « d » deletes; Shift+D does nothing)
      //if ( keyev('b', event) ){ delete_area() }               // Delete selection area
      if ( keyev('r', event) ){ apply_to_one_obj_or_group(rotate_obj, true) } 						// Rotation

      //--------------------- Change variables

      // --- Selection / groups (with Ctrl, so as not to interfere with typing) ---
      if (event.ctrlKey && keyev('s', event)){                // Ctrl+S: selection area (toggle; clears an existing selection)
            event.preventDefault(); toggle_area_selection(); return
      }
      if (event.ctrlKey && event.shiftKey && keyev('g', event)){   // Ctrl+Shift+G: PERSISTENT group (toggle)
            event.preventDefault(); toggle_persistent_group(); return
      }
      if (event.ctrlKey && keyev('g', event)){                // Ctrl+G: move the group (toggle; press again = ungroup)
            event.preventDefault(); toggle_group_move(); return
      }
      // Ctrl+K: show/hide the keyboard shortcuts card (intercepted BEFORE « k » alone = camera position)
      if (event.ctrlKey && (event.keyCode === 75 || event.key === 'k' || event.key === 'K')){
            event.preventDefault(); $('.panel_keys').toggle(); return
      }

      link_toggle(event, 'i', 'show_obj_infos_ok')           // infos about the object selected
      link_toggle(event, 'k', 'select_poscam')              // create new wall
      link_toggle(event, 'm', 'new_cube_texture_ok')        // create new cube with texture
      link_toggle(event, 't', 'new_track_ok')               // create a track
      link_toggle(event, 'u', 'paire_harmonic')             //
      link_toggle(event, 'x', 'scene_animation_ok')         //
      if ( keyev('o', event) ){ toggle_tool('sphere') }     // ball tool: press = on, second press = off
      if ( keyev('e', event) ){ toggle_tool('string') }     // chain tool: press = on, second press = off
      if ( keyev('n', event) ){ toggle_tool('wall') }       // wall tool: press = on, second press = off
      if ( keyev('w', event) ){ toggle_tool('box') }        // box tool (enclosure of reflecting walls)
      if (keyev('b', event)){ reinit_params_ok() } // dict_obj_param_false()

  } // end keyDownTextField1

function keyDownTextField2(event){

      /*

      */


    } // end keyDownTextField2

//-------------------------

var current_key = ""
var currfuncdic = {'k':'camera', 'c':'clone', 'r':'rotation',
                    'n':'mur', 'w':'boîte', 's':'select area',
                    'd':'delete', 'a':'apply movement',
                    'u':'paire harmonic', 'o':'new sphere',
                    'e':'chaîne', 't': 'select track'}

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
