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

function actions_with_block_unblock(obj){

  /*
  Block or unblock the objects
  */

  if (LAST_SELECTED.blocked){
      unblock_obj(obj)
   }
  else{
      block_obj(obj)
   }
}

function hide_show_keys(){

    /*
    panel keys actions
    */

    $('.panel_keys').html(simple_md(keys))

    $('#keys').click(function(){
          $('.panel_keys').toggle() 											     // show hide the key panel
      })
    $('.panel_keys').mouseleave(function(){
          $('.panel_keys').hide()
      })

}

function hide_show_objects(){

    /*
    panel object actions
    */

    $("#objects").click(function(){
          //$('.panel_keys').toggle() 										     // show hide the Objects panel
          $('.panel_objects').toggle()
      })
    $('.panel_objects').mouseleave(function(){
          $('.panel_objects').hide()
      })

    $('.panel').hover(function(){
          controls.enabled = false;    											         // deactivate the controls when mouse is hover..
          $('#curr_func').css('background-color','yellow')
          //document.removeEventListener("keydown", keyDownTextField1, true);
      })

}

function hide_show_views(){

    /*
    panel views actions
    */

    $("#views").click(function(){
          //$('.panel_keys').toggle() 										     // show hide the views panel
          $('.panel_views').toggle()
      })
    $('.panel_views').mouseleave(function(){
          $('.panel_views').hide()
      })

    $(document).ready(function(){

    $('#front_view').click(function(){
          alert('hello')
          //camera_pos_orient({-300,0,100}, {0,0,0})
      })

  })

}

function hide_show_scenes(){

    /*
    panel scene actions
    */

    $("#scene").click(function(){
          //$('.panel_keys').toggle() 										     // show hide the views panel
          $('.panel_scene').toggle()
      })

    $('.panel_scene').mouseleave(function(){
          $('.panel_scene').hide()
      })
}

function hide_show_help(){

    /*
    panel help actions
    */

    $("#help").click(function(){
          //$('.panel_keys').toggle() 										    // show hide the key panel
          $('.panel_help').toggle()
      })
    $('.panel_help').mouseleave(function(){
            $('.panel_help').hide() 											    // show hide the help panel
        })

}

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
    Save the params
    */

    $('#save_param').click(function(){

        $('.panel').css({'top':"10px","left":"-300px"})            // close panel about object infos when mouse leaves..
        controls.enabled = true;

        for (i in objects){
            if (objects[i].name == $('#name_panel').text()){
               objects[i].rotation.z = $('#angle_panel').val()     // change the angle
            } // end if
        } // end for
    })


}

function init_interf_actions(){

      /*
      Define the actions in the interface..
      */

      hide_show_keys()       //---------------------- Keys
      hide_show_objects()    //---------------------- Objects..
      hide_show_views()      //---------------------- Views..
      hide_show_scenes()     //---------------------- scene
      hide_show_help()       //---------------------- Help

      // Actions

      block_pos_object()     //-------------------- Block
      save_params_panel_object()  //--------- Save Parameters

      //---------------------- Dropzone for textures

      manage_drop()  // manage the Dropzone

 }
