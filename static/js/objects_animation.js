function gravity(delta){

    /*

    Gravity for all the objects

    */

    for (var i in list_moving_objects){
          if (delta < 0){ alert("negative value !!! ")}
          //var oldspeed = list_moving_objects[i].speed.z
          list_moving_objects[i].speed.z += -9.81*delta*100
          //var newspeed = list_moving_objects[i].speed.z
          //if ((oldspeed-newspeed) < 0){ alert("regressing speed !!! ")}
     }
    //alert("in gravity")

}

function increment_pos(delta){

    /*

    Increment position of all the objects

    */

    //alert("in increment_pos")
    for (var i in list_moving_objects){
        //alert('beginning increment_pos  !!!')
        //list_moving_objects[i].material.color.setHex(0x00ff00)
        //var new_delta = delta*0.1
        var step_pos = list_moving_objects[i].speed.multiplyScalar(delta)
        //list_moving_objects[i].position.add(step_pos)
        var abs_step = Math.abs(step_pos.z)
        if ((abs_step < 50) & (list_moving_objects[i].position.z > list_moving_objects[i].height) ){
            list_moving_objects[i].position.add(step_pos)
        }

        //alert("increment !!! ")
        //console.log(step_pos.z)
        //alert(step_pos.z)
        list_steps.push(step_pos.z)
        //$('#curr_func').text(list_moving_objects[i].position.z)
        //$('#curr_func').text(list_moving_objects[i].speed.z)
        $('#curr_func').text(abs_step)
        //$('#curr_func').text(list_steps[0] + '___' + list_steps[1])
      }

}
