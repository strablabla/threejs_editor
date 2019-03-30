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
   obj.material.color.setHex( 0xff33f5 ); // change color
}

function keyDownTextField1(event){

    /*
    r : rotate
    c : clone
    d : delete
    n : new piece with mouse
    s : selected area (dotted area)
    k : select camera position with mouse..
    h : make an horizontal plane
    arrow up : move up
    arrow down : move down
    SHIFT : pick diff objects..
    */

    $('#curr_func').css('background-color','red')

    if (event.keyCode == 16){    												  // Picking objects to aplly the same action after..
          select_picking = !select_picking
          if (select_picking){
              document.getElementById("curr_func").textContent = "picking";
          }
          else {
            document.getElementById("curr_func").textContent = "";
          }

      } // end if key code

    if (event.keyCode == 38){    												  // Up
          if ( INTERSECTED ){
            INTERSECTED.position.z += 50;
          }
      } // end if key code

    if (event.keyCode == 40){    												  // Down
          if ( INTERSECTED ){
            INTERSECTED.position.z += -50;
          }
      } // end if key code


    if (keyev('c', event)){    											    // Clone the selected object
          if ( INTERSECTED ){
              clone_object()
          }
      } // end if key code
    if (keyev('d', event)){    											    // Delete object selected
        delete_object()
      } // end if key code

    if (keyev('g', event)){             							    // create or not a new object with the mouse..
         select_move_group = !select_move_group
      } // end if key code

    if (keyev('m', event)){             							    // create or not a new object with the mouse..
         new_cube_texture_ok = !new_cube_texture_ok
      } // end if key code

    if (keyev('n', event)){             							    // create or not a new object with the mouse..
         new_wall_ok = !new_wall_ok
      } // end if key code

    if (keyev('r', event)){    												  // Rotation
          if ( INTERSECTED ){
            INTERSECTED.rotation.z += -Math.PI/2; 		  // Pi/2 rotation
          }
          else if(list_obj_inside.length > 0){
            apply_to_all(rotate_obj)
          }
      } // end if key code

    if (keyev('s', event)){             							    // select area..
         select_obj = !select_obj
      } // end if key code

    if (keyev('h', event)){             							    // horizontal plane..
         make_plane = !make_plane
      } // end if key code

    if (keyev('k', event)){             							    // change camera's position with the mouse.
         select_poscam = ! select_poscam;
      } // end if key code

    if (keyev('i', event)){             							    // infos about the object selected
         select_obj_infos = ! select_obj_infos;
      } // end if key code

    if (keyev('t', event)){             							    // infos about the object selected
         select_traj = ! select_traj;
      } // end if key code

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
          if ( k != key ){
              selectdic[k] = false;
          }
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
        }
        else{
            return false
        }
      }

//------------------------- Keys actions

  function clone_object(){

      /*
      Clone the selected object
      */

      clone = INTERSECTED.clone();
      clone.name = INTERSECTED.name + "_" + INTERSECTED.clone_infos.numclone;
      clone.type = INTERSECTED.type;
      //-----------  Clone infos
      INTERSECTED.clone_infos.numclone += 1;
      clone.clone_infos = {"numclone":0,"cloned":true,"origclone":INTERSECTED.name}
      //-----------
      clone.position.x += 100;                      // shift position in relation with the original piece
      clone.material.color.setHex( 0xcceeff );      // clone color, pale blue
      scene.add(clone)
      objects.push(clone)

  }

  function apply_to_all(func_all){

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
        list_obj_inside = []  // reinitializing list_obj_inside
        select_picking = false
  }

  function delete_object(){

      /*
      Delete the selected object
      */

      if ( INTERSECTED){
          for (i in objects){
                if (objects[i].name == INTERSECTED.name){
                    delete objects[i];
                }
            }
          scene.remove( INTERSECTED )
      }

      else if(list_obj_inside.length > 0){
          for (i in list_obj_inside){
                for (j in objects){
                      if (objects[j].name == list_obj_inside[i].name){
                          delete objects[j];
                      } //end if
                  } // end for
                scene.remove(list_obj_inside[i]);
                //delete list_obj_inside[i];
              } // end for
        } // end else if
      else{
          console.log('delete nothing')
        }
      list_obj_inside = []

    } // end delete_object

//}

  document.addEventListener("keydown", keyDownTextField1, false);
  //document.addEventListener("keydown", keyDownTextField0, false);
