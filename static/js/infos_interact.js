/*

Infos about the object

*/


function show_infos_at_mouse_pos(x,i){

      /*
      Show the infos in the place of the object..
      */

      x[i].style.left = event.pageX + "px";  				// using mouse x
      x[i].style.top = event.pageY + "px";   				// using mouse y

}

function show_infos_upper_left(x,i){

      /*
      Show the infos on the upper left corner
      */

      x[i].style.left = "0px";  				  //  pos x
      x[i].style.top =  "50px";   				//  pos y

}

function show_infos(){

      /*
      Show or hide the informations about the object..
      */

      var x = document.getElementsByClassName("panel");
      for (var i = 0; i < x.length; i++) {
          x[i].style.visibility = "visible";    // make the panel visible
          x[i].style.backgroundColor = "white";
          if (infos_in_place){ show_infos_at_mouse_pos(x,i) }
          else{ show_infos_upper_left(x,i) } // upper left, hidden..
      } // end for

} // end show_hide_infos

//
function give_infos(){

      /*
      Give infos about the selected object.
      The information appears close to the object selected..
      Infos are :
          * the name
          * the orientation..
      play with .panel
      */

      if (select_obj_infos){                    //  select_obj_infos must be activated for accessing to the infos..
          if ( INTERSECTED ){ show_infos() }
          modify_values(INTERSECTED)            // give the current values
        } // end if select_obj_infos

} // end give infos
