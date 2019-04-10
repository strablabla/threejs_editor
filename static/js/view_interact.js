/*

Change view

*/


function camera_pos_orient(s0,s1,altit){

      /*
      newview parameters
      */

      camera.position.set(s0.x, s0.y, s0.z + altit); // Set position like this
      camera.up = new THREE.Vector3(0,0,1);
      controls.target = new THREE.Vector3(s1.x, s1.y, s1.z + altit);

}

function params_newview(selpos){

      /*
      newview parameters
      */

      var altit = 250;
      var s0 = selpos[0].position
      var s1 = selpos[1].position

      return [altit, s0, s1]

}

function reinit_params_newview(){

      /*
      Reinitialize some params after newview
      */

      select_poscam = false;
      selpos = []
      $('#curr_func').css('background-color','blue')

}

function newview(selpos){

      /*
      put the camera at positon selpos[0] and look at selpos[1]
      */

      var [altit, s0, s1] = params_newview(selpos)
      camera_pos_orient(s0,s1,altit)
      reinit_params_newview()
}
