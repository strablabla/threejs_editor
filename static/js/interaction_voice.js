/*

Initialization of the scene..

*/

// Create a global accesible instance of artyom
const artyom = new Artyom();

artyom.initialize({
  lang:'fr-FR',
  continuous:true,
  debug:false,
  listen:true
})

function add_commands(dict, func){

      var dctools = {}

      Object.entries(dict).forEach(([key, value]) => {

          dctools[key] = {
              indexes:[value], // These spoken words will trigger the execution of the command
              action: function(){ func(key) } // dftools[key]
            }
          artyom.addCommands(dctools[key]); // Add the command with addCommands method. Now

      }); // end for each
}

//--------------------------- Tools

var dic_tools = {
                  'cube':'cube', 'select':'sélection', 'sphere':'boule',
                  'box':'boîte', 'wall':'mur',
                  'track':'piste', 'plane':'plan',
                  'string':'chaîne', 'pavement':'pavé',
                  'no_tool':"pas d'outil"
                  // , 'no_animation':"stop l'animation",
                  // 'animation':"reprends l'animation"

                   } // dict voice tool

function tool_key(key){

      /*
      function associated to each sound..
      */

      reinit_params_ok();
      $('#curr_tool').text(key)
      window['new_' + key + '_ok'] = true;

}

//------------------ Levels

dic_levels = {'0':'niveau zéro','1':'premier niveau',
              '2':'deuxième niveau', 'sup':'niveau supérieur',
              'inf':'niveau inférieur'}

function level_key(key){   alert('niveau ' + key); }

// ------------------ Animation..

dic_anim = {
    indexes:['animation'], // spoken word..
    action: function(){
          $('#curr_tool').text('animation ok')
          apply_to_one_obj_or_group(apply_movement, false)
     } //
  }

dic_anim_again = {
    indexes:["reprends l'animation"], // spoken word..
    action: function(){
          scene_animation_ok = true
          $('#curr_tool').text('animated again')
     } //
  }

dic_anim_stop = {
    indexes:["stoppe l'animation"], // spoken word..
    action: function(){
          scene_animation_ok = false
          $('#curr_tool').text('not animated')
     } //
  }

dic_speed_null = {
    indexes:["toutes les vitesses à zéro"], // spoken word..
    action: function(){
        
          for ( i in list_obj_inside ){
              list_obj_inside[i].speed = new THREE.Vector3(0,0,0)
              // alert(i)
              // alert(list_moving_objects[i].speed.x)
          }
          $('#curr_tool').text('speed null')
     } //
  }

artyom.addCommands(dic_anim); // Add the command with addCommands method. Now
artyom.addCommands(dic_anim_again);
artyom.addCommands(dic_anim_stop);
artyom.addCommands(dic_speed_null);

//--------------------

add_commands(dic_tools, tool_key)
add_commands(dic_levels, level_key)
