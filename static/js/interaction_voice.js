/*

Initialization of the scene..

*/

// Create a global accesible instance of artyom
const artyom = new Artyom();

artyom.initialize({
  lang:'fr',
  continuous:true,
  debug:false,
  listen:true
})

var dvt = {'cube':'cube', 'sphere':'boule',
            'box':'boîte', 'wall':'mur',
            'track':'piste', 'plane':'plan',
            'pavement':'pavé'} // dict voice tool
var dftools = {}
var dctools = {}

Object.entries(dvt).forEach(([key, value]) => {

  dftools[key] = function(){
        reinit_params_ok();
        $('#curr_tool').text(key)
        window['new_' + key + '_ok'] = true;
  }
  dctools[key] = {

    indexes:[value], // These spoken words will trigger the execution of the command
    action: dftools[key]

  }
  artyom.addCommands(dctools[key]); // Add the command with addCommands method. Now
});
