/*

Animation of the objects

*/

function gravity(delta){

    /*
    Gravity for all the objects
    */

    for (var i in list_moving_objects){
          if (delta < 0){ alert("negative value !!! ")}
          //var oldspeed = list_moving_objects[i].speed.z
          list_moving_objects[i].speed.z += -9.81*delta*0.1
          //var newspeed = list_moving_objects[i].speed.z
          //if ((oldspeed-newspeed) < 0){ alert("regressing speed !!! ")}
     }

}

function check_movement(i,delta){

    /*
    Increment position of all the objects
    */

    var speedz = list_moving_objects[i].speed.z
    var posz = list_moving_objects[i].position.z
    //$('#curr_func').text(list_moving_objects[i].position.z)
    $('#curr_func').text( Math.round(speedz,1) + '___' + Math.round(posz,1) + '___' + delta)
    //$('#curr_func').text(move_z)
    //$('#curr_func').text(list_steps[0] + '___' + list_steps[1])

}

function vdt(i,delta){

    /*
    increment of position for object i
    */

    var dtx = list_moving_objects[i].speed.x*delta
    var dty = list_moving_objects[i].speed.y*delta
    var dtz = list_moving_objects[i].speed.z*delta

    return [dtx, dty, dtz]

}

function movez(i, abs_step, posz, vdtz, hz){

      if ((abs_step < 100) & ( (posz + vdtz) > hz) ){
          list_moving_objects[i].position.z += vdtz
        }
      else{ list_moving_objects[i].speed.z *= -1 } // rebouncing on the ground..

}

function movexy(i, vdtx, vdty){

    list_moving_objects[i].position.x += vdtx
    list_moving_objects[i].position.y += vdty

}

function param_posz(i,vdtz){

      var abs_step = Math.abs(vdtz)
      var posz = list_moving_objects[i].position.z
      var hz = list_moving_objects[i].height/2

      return [abs_step, posz, hz]

}

function change_pos(i,vdtx, vdty, vdtz){

      var [abs_step, posz, hz] = param_posz(i,vdtz)
      movexy(i, vdtx, vdty)
      movez(i, abs_step, posz, vdtz, hz)

}

function change_all_pos(delta){

      /*
      Increment position of all the objects
      */

      for (var i in list_moving_objects){
            var [vdtx, vdty, vdtz] = vdt(i,delta)
            change_pos(i, vdtx, vdty, vdtz)
            check_movement(0,delta)
        } // end for

}
