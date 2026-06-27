/*

Different actions on the scene

*/

function position_panel_under_icon(name_obj, class_obj){

      /*
      Place le panneau juste sous son icône de menu (sans déborder de l'écran)
      et règle la position horizontale de la flèche (variable CSS --caret-left).
      */

      var $icon = $(name_obj), $panel = $(class_obj)
      var r = $icon[0].getBoundingClientRect()
      var iconCenter = r.left + r.width/2
      var panelW = $panel.outerWidth()
      var winW = $(window).width()
      var left = Math.round(iconCenter - 30)
      if (left + panelW > winW - 6){ left = winW - panelW - 6 }   // pas de débordement à droite
      if (left < 6){ left = 6 }
      $panel.css({ left: left + 'px', right: 'auto' })
      var caret = Math.round(iconCenter - left - 9)               // 9 ~ demi-base du triangle
      caret = Math.max(12, Math.min(panelW - 24, caret))
      $panel[0].style.setProperty('--caret-left', caret + 'px')

}

function generic_action_panel(name_obj, class_obj){

      /*
      Typical actions
      */

      $(name_obj).click(function(){                            // clic sur l'icône : ouvrir CE panneau, fermer les autres
            var was_visible = $(class_obj).is(':visible')
            for (var k in list_panels){ $('.panel_' + list_panels[k]).hide() }  // ferme tous les panneaux de menu
            if (!was_visible){
                  $(class_obj).show()                          // toggle : rouvre celui-ci s'il était fermé
                  position_panel_under_icon(name_obj, class_obj)  // sous l'icône + flèche
            }
      })
      $(name_obj).hover(function(){ controls.enabled = false }) // deactivate the controls when mouse is hover..
      // plus d'auto-masquage à la sortie : on gère seulement les contrôles caméra
      $(class_obj).hover(
            function(){ controls.enabled = false },   // entrée dans le panneau : pas de rotation caméra
            function(){ controls.enabled = true }     // sortie : on réactive les contrôles
      )

      // petite croix de fermeture en haut à droite du panneau
      var $close = $('<div class="panel_close" title="Fermer"></div>').html('&times;')
      $close.on('click', function(){ $(class_obj).hide() })
      $(class_obj).append($close)

}

function mouseleave_hide_panel(class_panel){
      $(class_panel).mouseleave(function(){ $(class_panel).hide() }) // Hide when leaving the panel
}

function block_obj(obj){

      /*
      Block
      */

      $('#block_pos').text('block')
      var objname = dic_sphere_blocked[obj.name]
      scene.remove( objname )
      delete(objname)

}

function unblock_obj(obj){

      /*
      Unblock
      */

      $('#block_pos').text('unblock')
      sphblk = sphere_blocked(obj.position)
      dic_sphere_blocked[obj.name] = sphblk;

}

function show_block_unblock(){

      /*
      Value button block, unblock
      */

      if (LAST_SELECTED.blocked){ $('#block_pos').text('unblock') }
      else{ $('#block_pos').text('block') }

}

function actions_with_block_unblock(obj){

      /*
      Block or unblock the objects
      */

      if (LAST_SELECTED.blocked){ unblock_obj(obj) }
      else{ block_obj(obj) }

}

//------------------------   dicths, panels

dicths = {}
list_panels = ['objects', 'views', 'scene', 'tools', 'interaction', 'help']

function one_element_dicths(name_panel){
    dicths[name_panel] = function(){ generic_action_panel("#" + name_panel, '.panel_' + name_panel) }}
for (var i in list_panels){ one_element_dicths(list_panels[i]) } // make_dicths

//------------------------

function hide_show_keys(){

      /*
      panel keys actions
      */

      $('.panel_keys').html(simple_md(keys))
      $('#keys').click(function(){ $('.panel_keys').toggle() })			// show hide the key panel
      mouseleave_hide_panel('.panel_keys')

}

function camera_pos_orient(s0,s1,altit){

      /*
      newview parameters
      */

      camera.position.set(s0.x, s0.y, s0.z + altit); // Set position like this
      camera.up = new THREE.Vector3(0,0,1);
      controls.target = new THREE.Vector3(s1.x, s1.y, s1.z + altit);

}

function set_new_view(x, y, altit){

      /*
      Setting the view
      */

      var target = {'x':0,'y':0,'z':0}
      var pos = {'x':x,'y':y,'z':altit}
      camera_pos_orient( pos, target , altit )

}

$(document).ready(function(){

      /*
      Change the views
      */

      altit_high = 2000
      altit_low = 200

      $('#above_view').click(function(){ set_new_view(0,0,altit_high)})
      $('#front_view').click(function(){ set_new_view(0,-2000,altit_low)})
      $('#back_view').click(function(){ set_new_view(0,2000,altit_low)})
      $('#left_view').click(function(){ set_new_view(-2000,0,altit_low)})
      $('#right_view').click(function(){ set_new_view(2000,0,altit_low)})

  })// end ready

function block_pos_object(){

      /*
      block/unblock
      */

      $('#block_pos').click(function(){     // block the movement of the object..

            for (i in objects){
                if (objects[i].name == $('#name_panel').text()){
                   objects[i].blocked = ! objects[i].blocked;
                   actions_with_block_unblock(objects[i])
                } // end if
            } // end for
      }) // end block_pos.click

}
//

function change_orientation(i){

      /*
      Modify orientation for rebounce
      */

      objects[i].orientation.x = Math.cos(objects[i].rotation.z)
      objects[i].orientation.y = Math.sin(objects[i].rotation.z)

}

function save_params_panel_object(){

    /*
    Save the params of the class .panel
    */

    $('#save_param').click(function(){
        $('.panel').css({'top':"10px","left":"-300px"})            // close panel about object infos when mouse leaves..

        for (i in objects){
            if (objects[i].name == $('#name_panel').text()){
               objects[i].rotation.z = parseFloat($('#angle_panel').val())            // angle
               objects[i].material.opacity = parseFloat($('#alpha_panel').val())      // opacity
               objects[i].material.needsUpdate = true;                    // refreshing
               objects[i].mass = parseFloat($('#mass_panel').val())            // mass
               // change the orientation
               if (objects[i].type == 'wall_box'){
                  change_orientation(i)
               }
               //alert(objects[i].name + ' has orientation x ' + objects[i].orientation.x)
            } // end if
        } // end for
        controls.enabled = true;
    }) // end click

}

function init_interf_actions(){

      /*
      Define the actions in the interface..
      */

      hide_show_keys()        //---------------------- Keys
      dicths.objects()        //---------------------- Objects..
      dicths.views()          //---------------------- Views..
      dicths.scene()          //---------------------- scene
      dicths.tools()          //---------------------- scene
      dicths.interaction()    //---------------------- Interaction (physique)
      dicths.help()           //---------------------- Help

      // Actions

      block_pos_object()     //-------------------- Block
      save_params_panel_object()  //--------- Save Parameters

      //---------------------- Dropzone for textures

      manage_drop()  // manage the Dropzone

      //---------------------- Tooltips des icônes de menu

      $('[data-toggle="tooltip"]').tooltip({ container: 'body', placement: 'bottom' })

 }
