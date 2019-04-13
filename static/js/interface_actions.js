/*

Different actions on the scene

*/

function generic_action_panel(name_obj, class_obj){

      /*
      Typical actions
      */

      $(name_obj).click(function(){ $(class_obj).toggle() })  // show hide the views panel
      $(name_obj).hover(function(){ controls.enabled = false }) // deactivate the controls when mouse is hover..
      mouseleave_hide_panel(class_obj)
      $(".panel").hover(function(){ controls.enabled = false })  // deactivate the controls wfor panel

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
list_panels = ['objects', 'views', 'scene', 'tools', 'help']

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

function save_params_panel_object(){

    /*
    Save the params of the class .panel
    */

    $('#save_param').click(function(){
        $('.panel').css({'top':"10px","left":"-300px"})            // close panel about object infos when mouse leaves..

        for (i in objects){
            if (objects[i].name == $('#name_panel').text()){
               objects[i].rotation.z = $('#angle_panel').val()            // angle
               objects[i].material.opacity = $('#alpha_panel').val()      // opacity
               objects[i].material.needsUpdate = true;                    // refreshing
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
      dicths.help()           //---------------------- Help

      // Actions

      block_pos_object()     //-------------------- Block
      save_params_panel_object()  //--------- Save Parameters

      //---------------------- Dropzone for textures

      manage_drop()  // manage the Dropzone

 }
