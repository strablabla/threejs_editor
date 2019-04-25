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

      var dftools = {}
      var dctools = {}

      Object.entries(dict).forEach(([key, value]) => {

          dftools[key] = function(){ func(key) }
          dctools[key] = {
              indexes:[value], // These spoken words will trigger the execution of the command
              action: dftools[key]
            }
          artyom.addCommands(dctools[key]); // Add the command with addCommands method. Now

      }); // end for each
}

//--------------------------- Tools

var dic_tools = {'cube':'cube', 'sphere':'boule',
            'box':'boîte', 'wall':'mur',
            'track':'piste', 'plane':'plan',
            'pavement':'pavé', 'no_tool':"pas d'outil"} // dict voice tool

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

function level_key(key){

      alert('niveau ' + key);
}


add_commands(dic_tools, tool_key)
add_commands(dic_levels, level_key)
