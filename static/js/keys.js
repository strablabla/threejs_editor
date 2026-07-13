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
      Active/désactive un outil de création (boule, chaîne...).
      Un appui active l'outil (et désactive les autres) ; un second appui le coupe.
      */

      var flag = 'new_' + key + '_ok'
      if (window[flag]){                     // déjà actif -> on le coupe
            reinit_params_ok()
            if (key == 'string'){ list_string = [] }  // repartir sur une nouvelle chaîne au prochain usage
            $('#curr_tool').text('aucun outil')
            $('#active_obj_navbar').text('')   // plus d'outil actif -> navbar vidée
      } else {
            if (key == 'string'){ list_string = [] }  // chaque activation démarre une chaîne indépendante
            tool_key(key)                    // active cet outil (et réinitialise les autres)
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

      var _t = event.target || event.srcElement                 // si on tape dans un champ (modale, nom de scène...),
      if (_t){                                                   // ne pas déclencher les raccourcis de la scène 3D
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
      // Copier / coller (Ctrl+C / Ctrl+V) — remplace l'ancien clone sur « c » seul
      if (event.ctrlKey && (event.keyCode === 67 || event.key === 'c' || event.key === 'C')){ event.preventDefault(); do_copy(); return }
      if (event.ctrlKey && (event.keyCode === 86 || event.key === 'v' || event.key === 'V')){ event.preventDefault(); do_paste(); return }

      if ( keyev('a', event) ){ scene_animation_ok = true; apply_to_one_obj_or_group(apply_movement, false) } // démarre l'animation (+ enregistre l'objet survolé)
      if ( keyev('d', event) && !event.shiftKey ){ delete_object() }   				  // Delete object selected (seul « d » supprime ; Maj+D ne fait rien)
      //if ( keyev('b', event) ){ delete_area() }               // Delete selection area
      if ( keyev('r', event) ){ apply_to_one_obj_or_group(rotate_obj, true) } 						// Rotation

      //--------------------- Change variables

      // --- Sélection / groupes (avec Ctrl, pour ne pas gêner la frappe) ---
      if (event.ctrlKey && keyev('s', event)){                // Ctrl+S : zone de sélection (toggle ; efface une sélection existante)
            event.preventDefault(); toggle_area_selection(); return
      }
      if (event.ctrlKey && event.shiftKey && keyev('g', event)){   // Ctrl+Maj+G : groupe PERSISTANT (toggle)
            event.preventDefault(); toggle_persistent_group(); return
      }
      if (event.ctrlKey && keyev('g', event)){                // Ctrl+G : déplacer le groupe (toggle ; ré-appui = dégroupe)
            event.preventDefault(); toggle_group_move(); return
      }

      link_toggle(event, 'i', 'show_obj_infos_ok')           // infos about the object selected
      link_toggle(event, 'k', 'select_poscam')              // create new wall
      link_toggle(event, 'm', 'new_cube_texture_ok')        // create new cube with texture
      link_toggle(event, 't', 'new_track_ok')               // create a track
      link_toggle(event, 'u', 'paire_harmonic')             //
      link_toggle(event, 'x', 'scene_animation_ok')         //
      if ( keyev('o', event) ){ toggle_tool('sphere') }     // outil boule : appui = on, second appui = off
      if ( keyev('e', event) ){ toggle_tool('string') }     // outil chaîne : appui = on, second appui = off
      if ( keyev('n', event) ){ toggle_tool('wall') }       // outil mur : appui = on, second appui = off
      if ( keyev('w', event) ){ toggle_tool('box') }        // outil boîte (enceinte de murs réfléchissants)
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
