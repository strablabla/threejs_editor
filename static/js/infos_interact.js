/*

Infos about the object

*/


//----------------------------------- Panels interactions

function attr_dict(attr0){

      var valc = {}
      var listc = ['x','y','z']
      for (var i in listc){
          var coord = listc[i]
          valc[coord] = Math.round(INTERSECTED[attr0][coord], 3)
      }

      return valc['x'] + '_' + valc['y'] + '_' + valc['z']

}

// GO to see in panel_one_object.html

function link_panel_text(name){ $('#'+name+'_panel').text(INTERSECTED[name]); }
function link_panel0(name){ $('#'+name+'_panel').val(INTERSECTED[name]); }
function link_panel1(name, attr0, attr1){ $('#'+name+'_panel').val(INTERSECTED[attr0][attr1].toFixed(2)); }
function link_panel2(name, attr0, attr1, arg){ $('#'+name+'_panel').val(INTERSECTED[attr0][attr1](arg)); }
function link_panel3(name, attr0, attr1){ $('#'+name+'_panel').val(attr_dict(attr0)); }

function modify_values(INTERSECTED){

      /*
      Change the vaues in the panel for infos about the object selected..
      */

      link_panel_text('name')
      link_panel0('width')
      link_panel0('height')
      link_panel0('thickness')
      link_panel1('angle', 'rotation', 'z')
      link_panel2('color', 'currentHex', 'toString',16)
      link_panel1('alpha', 'material', 'opacity')
      link_panel0('type')
      link_panel0('mass')
      link_panel3('speed', 'speed')
      $('.dz-message').css('top','2px')
      $('.dz-message').text(INTERSECTED.tex)            // text in Dropzone..
      show_block_unblock()              // show if the object position is blocked or not with the message on the button ..
      $("#dropz").children().hide();         // hide the message under the box
      $('#drop-message').one('click',function(){ $("#dropz").click() }) // execute one time dropz..

}

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

      if (show_obj_infos_ok){                    //  show_obj_infos_ok must be activated for accessing to the infos..
          if ( INTERSECTED ){ show_infos() }
          modify_values(INTERSECTED)            // give the current values
        } // end if show_obj_infos_ok

} // end give infos
