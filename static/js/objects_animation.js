/*

Animation of the objects

*/

function gravity(delta){

      /*
      Gravity for all the objects
      */

      for (var i in list_moving_objects){
            list_moving_objects[i].speed.z += -9.81*delta*0.1
       }

}

function check_movement(i,delta){

      /*
      Increment position of all the objects
      */

      var speedz = list_moving_objects[i].speed.z
      var posz = list_moving_objects[i].position.z
      $('#curr_func').text( Math.round(speedz,1) + '___' + Math.round(posz,1) + '___' + delta)

}

function vdt(i,delta){

      /*
      increment of position for object i in x, y and z
      */

      var dtx = list_moving_objects[i].speed.x*delta
      var dty = list_moving_objects[i].speed.y*delta
      var dtz = list_moving_objects[i].speed.z*delta

      return [dtx, dty, dtz]

}

function movez(i, abs_step, posz, vdtz, hz){

      /*
      Change position of object in z
      */

      if ((abs_step < 100) & ( (posz + vdtz) > hz) ){
          list_moving_objects[i].position.z += vdtz
        }
      else{ list_moving_objects[i].speed.z *= -1 } // rebouncing on the ground..

}

function movexy(i, vdtx, vdty){

      /*
      Change position of object in x and y
      */

      list_moving_objects[i].position.x += vdtx
      list_moving_objects[i].position.y += vdty

}

function param_posz(i,vdtz){

      /*
      Parameters for pos z
      */

      var abs_step = Math.abs(vdtz)
      var posz = list_moving_objects[i].position.z
      var hz = list_moving_objects[i].height/2

      return [abs_step, posz, hz]

}

function change_pos(i, vdtx, vdty, vdtz){

      /*
      Change position of object
      */

      var [abs_step, posz, hz] = param_posz(i,vdtz)
      movexy(i, vdtx, vdty)                   // change pos x and y
      movez(i, abs_step, posz, vdtz, hz)      // change pos z

}

function change_all_pos(delta){

      /*
      Increment position of all the objects
      */

      for (var i in list_moving_objects){
            var [vdtx, vdty, vdtz] = vdt(i,delta)     // translation during time delta..
            change_pos(i, vdtx, vdty, vdtz)           // change position of object i
            check_movement(0,delta)                   // control what is going on..
        } // end for

}

function check_change_color(obj,col0){

      /*
      Change color and keep in memory
      */

      if (list_interact.indexOf(obj) == -1){
            list_interact.push(obj)
            obj.material.color.setHex(col0)
      }

}

function masses_and_speeds(i,j){

      var mi = list_moving_objects[i].mass
      var mj = list_moving_objects[j].mass
      var vi = list_moving_objects[i].speed
      var vj = list_moving_objects[j].speed

      return [mi,mj,vi,vj]

}

function change_speed_after_interaction(i,j){

      var vc = speed_center_mass(i,j)
      var [dvi,dvj] = dv_in_center_of_mass(i,j)

      var new_vi = new THREE.Vector3();
      var new_vj = new THREE.Vector3();

      list_moving_objects[i].speed = new_vi.add(vc).add(dvi)
      list_moving_objects[j].speed = new_vj.add(vc).add(dvj)

}

function dv_in_center_of_mass(i,j){

      /*
      Speed in center of mass after interaction
      */

      var [mi,mj,vi,vj] = masses_and_speeds(i,j)
      var dvi = new THREE.Vector3();
      var dvj = new THREE.Vector3();
      dvi.subVectors(vi,vj).multiplyScalar(-mj/(mi+mj))
      dvj.subVectors(vj,vi).multiplyScalar(-mi/(mi+mj))

      return [dvi,dvj]

}

function speed_center_mass(i,j){

      /*
      Speed of the center of mass
      */

      var [mi,mj,vi,vj] = masses_and_speeds(i,j)
      var vc = new THREE.Vector3();
      vc.add( vi.multiplyScalar(mi) ) ;
      vc.add( vj.multiplyScalar(mj) ) ;
      vc.multiplyScalar( 1/(mi+mj) ) ;

      return vc

}

function interaction_color(i,j){

      /*
      Change color to red in case of interaction
      */

      var obji = list_moving_objects[i]
      var objj = list_moving_objects[j]
      var dist = getDistance(obji, objj)
      if (dist < 100){
          check_change_color(obji,0xff0000)
          check_change_color(objj,0xff0000)
          change_speed_after_interaction(i,j)  // physical interaction
     } // end if dist

}

function no_interaction_color(){

      /*
      Change color to white in case of no interaction
      */

      for (var i in list_moving_objects){
            if (list_interact.indexOf(list_moving_objects[i]) == -1) {
                  list_moving_objects[i].material.color.setHex(0xffffff)
            }
      }

}

function interactions_between_objects(){

      /*
      Interactions
      */

      list_interact = []
      for (var i=0; i< list_moving_objects.length; i++){
            for (var j=i+1; j <  list_moving_objects.length; j++){
                  interaction_color(i,j)

              } // end for j
        } // end for i
        no_interaction_color()

}
