function message_block_unblock(){

  if (LAST_SELECTED.blocked){ $('#block_pos').text('unblock') }
  else{ $('#block_pos').text('block') }

}

function init_interf_actions(){

      $('.panel_keys').html(simple_md(keys))

         //---------------------- Keys

         $('#keys').click(function(){
               $('.panel_keys').toggle() 											     // show hide the key panel
           })
         // $('#keys').hover(function(){
         // 			$('.panel_keys').show() 											     // show hide the key panel
         // 	})

         $('.panel_keys').mouseleave(function(){
               $('.panel_keys').hide()
           })

         //---------------------- Objects..

         $("#objects").hover(function(){
               //$('.panel_keys').toggle() 										     // show hide the Objects panel
               $('.panel_objects').show()
           })
         $('.panel_objects').mouseleave(function(){
               $('.panel_objects').hide()
           })

         //---------------------- Views..

         $("#views").hover(function(){
               //$('.panel_keys').toggle() 										     // show hide the views panel
               $('.panel_views').show()
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

         //---------------------- scene

         $("#scene").hover(function(){
               //$('.panel_keys').toggle() 										     // show hide the views panel
               $('.panel_scene').show()
           })

         $('.panel_scene').mouseleave(function(){
               $('.panel_scene').hide()
           })

         //---------------------- Help

         $("#help").hover(function(){
               //$('.panel_keys').toggle() 										    // show hide the key panel
               $('.panel_help').show()
           })
         $('.panel_help').mouseleave(function(){
                 $('.panel_help').hide() 											    // show hide the help panel
             })

         //---------------------- Actions on the panel about object
         //
         // $('.panel').mouseleave(function(){                       // panel about the object..
         // 			$('.panel').css({'top':"10px","left":"-300px"})    // close panel about object infos when mouse leaves..
         // 			controls.enabled = true;
         // 			//document.addEventListener("keydown", keyDownTextField1, false);
         // 	})
         $('#block_pos').click(function(){     // block the movement of the object..

               for (i in objects){
                   if (objects[i].name == $('#name_panel').text()){
                      objects[i].blocked = ! objects[i].blocked;
                      message_block_unblock()
                   } // end if
               } // end for

         })

         $('#save_param').click(function(){

             $('.panel').css({'top':"10px","left":"-300px"})            // close panel about object infos when mouse leaves..
             controls.enabled = true;

             for (i in objects){
                 if (objects[i].name == $('#name_panel').text()){
                    objects[i].rotation.z = $('#angle_panel').val()     // change the angle
                 } // end if
             } // end for

         })

         $('.panel').hover(function(){
               controls.enabled = false;    											         // deactivate the controls when mouse is hover..
               $('#curr_func').css('background-color','yellow')
               //document.removeEventListener("keydown", keyDownTextField1, true);
           })

         //---------------------- Dropzone for textures

       manage_drop()                                              // manage the Dropzone

 }
