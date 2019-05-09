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
      Check values
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

      if ( (abs_step < 100) & ( (posz + vdtz) > hz) ){  //
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
      Change position of object with intervall delta
      */

      var [abs_step, posz, hz] = param_posz(i,vdtz)
      movexy(i, vdtx, vdty)                   // change pos x and y
      movez(i, abs_step, posz, vdtz, hz)      // change pos z

}

function update_all_pos(delta){

      /*
      Increment position of all the objects
      */

      for (var i in list_moving_objects){
            var [vdtx, vdty, vdtz] = vdt(i,delta)     // translation during time delta..
            change_pos(i, vdtx, vdty, vdtz)           // change position of object i
            //check_movement(0,delta)                   // control what is going on..
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
      //--------------
      var vi = list_moving_objects[i].speed
      var vj = list_moving_objects[j].speed

      return [mi,mj,vi,vj]

}

function change_speed_after_center_center_collision(i,j){

      /*
      Change the speeds after collision..
      */

      var vc = speed_center_mass(i,j)
      var [dvi,dvj] = dv_in_center_of_mass(i,j)
      //--------------
      var new_vi = new THREE.Vector3();
      var new_vj = new THREE.Vector3();
      //--------------
      list_moving_objects[i].speed = new_vi.add(vc).add(dvi)  // vc + dvi
      list_moving_objects[j].speed = new_vj.add(vc).add(dvj)  // vc + dvj

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

function wall_box_rebounce(obji, objj){

      /*
      Rebounce
      */

      var comment = false
      if (comment){
          alert("rebouncing")
          alert(objj.type)
          alert(objj.orientation.x)
          alert(objj.orientation.y)
          alert(objj.orientation.z)
      }
      var dotspeed = objj.orientation.dot(obji.speed)  // scalar product between wall and object
      if (comment){ alert( dotspeed ) }
      var ojo = new THREE.Vector3( objj.orientation.x, objj.orientation.y, objj.orientation.z )
      var rebounce = ojo.multiplyScalar(2*dotspeed).negate()
      obji.speed.add(rebounce)
      //obji.material.color.setHex(0x0000ff)
}

function find_obj_wall(objj,obji){

      /*
      Find obj from wall
      */

      if (objj.type  == 'wall_box'){
          var wall = objj
          var obj = obji
      }
      else{
          var wall = obji
          var obj = objj
      }
      return [obj,wall]

}

function objj_obji(i,j){

      var obji = list_moving_objects[i]
      var objj = list_moving_objects[j]

      return [obji, objj]

}

function interaction_obj_plane(i,j){

      /*
      Interaction with plane
      */
      //var scale_rebounce = 3
      var [obji, objj] = objj_obji(i,j)
      var [obj, wall] = find_obj_wall(objj,obji) // find which is obj, which is wall..
      var [dist_to_plane, dist_lat_in_plane] = getDistanceToPLane(obj, wall) // distance center-plane
      var cnd1 = dist_to_plane < dist_inter_wall_obj
      var cnd2 = dist_lat_in_plane < wall.width/2
      if (cnd1 & cnd2){
          // obj.material.color.setHex(0x00ff00)
          //obj.scale.set(scale_rebounce,scale_rebounce,scale_rebounce)
          //obj.material.color.setHex(0xff0000)
          wall_box_rebounce(obj, wall) // handle the rebounce on the walls of the box..
          //obj.scale.set(1,1,1)
      }

}

function conditions_interaction_obj_plane(i,j){

      /*
      Conditions for interaction obj plane
      */

      var [obji, objj] = objj_obji(i,j)
      var cnd1 = objj.type == 'wall_box' | obji.type == 'wall_box'
      var cnd2 = objj.type != obji.type
      var cnd3 = (objj.type != 'pawn') & (obji.type !='pawn')

      return [cnd1, cnd2, cnd3]

}

function interaction_center_center(i,j){

      /*
      Interaction center to center
      */

      var [obji, objj] = objj_obji(i,j)
      var dist = getDistance(obji, objj) // distance center-center
      if (dist < dist_min_center_center){
            check_change_color(obji,0xff0000)
            check_change_color(objj,0xff0000)
            change_speed_after_center_center_collision(i,j)  // physical interaction
        } // end if dist

}

function interaction_between_ij(i,j){

      /*
      Change color to red in case of interaction
      */

      var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
      if ( cnd1 & cnd2 &cnd3 ){ interaction_obj_plane(i,j) } // interaction between object and plane.  .
      else { interaction_center_center(i,j) } // // interaction center to center

}

function comment_harmonic(vec_harm_interact, lphi0, lphi1,text){

      alert(text)
      alert("____lphi0.speed.x " + lphi0.speed.x)
      alert("____lphi1.speed.x " + lphi1.speed.x)
      alert("vec_harm_interact.x " + vec_harm_interact.x)

}

function check_movement_spring(new_spring){

      /*
      Check spring's values
      */

      var speedx = new_spring.speed.x
      var speedy = new_spring.speed.y
      $('#curr_func').text( Math.round(speedx,1) + '___' + Math.round(speedy,1) )

}

function change_spring(obj){

      /*
      Change the orientation, position and length of the spring
      */

      var new_spring = obj[2]
      new_spring.position.copy(obj[0].matrixWorld.getPosition()); // stick spring to object..
      var new_spring_scale = getDistance(obj[0], obj[1])/420
      new_spring.scale.set(1,1,new_spring_scale)
      new_spring.lookAt(obj[1].position)
      // new_spring.geometry.radius = radius_spring
      // new_spring.geometry.verticesNeedUpdate = true;
      //new_spring.setGeometry('TubeGeometry', { radius: radius_spring });

      // scene.remove(myMesh);
      // myMesh.geometry.dispose();
      // myMesh.material.dispose();
      // myMesh = undefined;

}

function change_elastic(obj){

      /*
      Change the orientation, position and length of the elastic
      */

      var new_elastic = obj[2]
      new_elastic.position.copy(obj[0].matrixWorld.getPosition()); // stick spring to object..
      var new_elastic_scale = getDistance(obj[0], obj[1])/420
      new_elastic.scale.set(1,1,new_elastic_scale)
      new_elastic.lookAt(obj[1].position)

}

function interact_harmonic_vectors(i){

      /*
      Vectors for harmonic interaction
      */

      var vec_harm_interact = new THREE.Vector3()
      var lphi0 = list_paired_harmonic[i][0]
      var lphi1 = list_paired_harmonic[i][1]
      vec_harm_interact.subVectors(lphi1.position, lphi0.position) // vector from O to 1 ..
      ///////change_spring(list_paired_harmonic[i])
      var diff_length = vec_harm_interact.length() - lenght_spring // compare lengths
      //alert("diff_length is " + diff_length)
      vec_harm_interact = vec_harm_interact.normalize().multiplyScalar( diff_length )
      // alert('vec_harm_interact.x ' + vec_harm_interact.x)
      // alert('vec_harm_interact.y ' + vec_harm_interact.y)
      change_elastic(list_paired_harmonic[i])

      return [vec_harm_interact, lphi0, lphi1]
}

function interaction_harmonic_between_pairs(){

      /*
      Harmonic interaction
      */

      for (var i in list_paired_harmonic){
            var [vec_harm_interact, lphi0, lphi1] = interact_harmonic_vectors(i)
            //-------- Change the speeds
            lphi0.speed.addScaledVector(vec_harm_interact,harmonic_const)
            lphi1.speed.addScaledVector(vec_harm_interact,-harmonic_const)
      }

}

function no_interaction_color(){

      /*
      Change color to white in case of no interaction
      */

      for (var i in list_moving_objects){
            if (list_interact.indexOf(list_moving_objects[i]) == -1) {
                  list_moving_objects[i].material.color.setHex(color_no_interaction_pink)
            }
      }

}

function permitted_interaction(index){

      /*
      Permitted index
      */

      obj = list_moving_objects[index]
      for (var i in list_forbid_obj_for_interact){
          if (obj.type != list_forbid_obj_for_interact[i]){ continue }
          else{ return false }
      } // end for
      return true
}

function allow_interaction_ij(i,j){

      /*
      Allow the interaction betwwen objects i and j
      */

      return permitted_interaction(i) & permitted_interaction(j)

}

function interactions_between_objects(){

      /*
      Interactions :
          * object-plane
          * center-center
          * harmonic
      */

      list_interact = []
      if (list_moving_objects.length > 0){
          for (var i=0; i< list_moving_objects.length; i++){
                for (var j=i+1; j <  list_moving_objects.length; j++){
                      if(allow_interaction_ij(i,j)){ interaction_between_ij(i,j) } // i j interaction
                  } // end for j
            } // end for i
          interaction_harmonic_between_pairs()
      } // end if in moving_objects
      no_interaction_color()

}

function initialize_energies(){


      /*
      Energies initialization
      */

      tot_energy = 0
      elast_energy = 0
      kin_energy = 0
      grav_energy = 0

}

function energy_calculation(){

      /*
      Energies calculations
      */

      initialize_energies()
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){      // case it is a spring or an elastic..
                  elast_energy += 5*0.5*harmonic_const*(obj.scale.z*420)**2
            }else{
              kin_energy += 0.5*obj.mass*obj.speed.dot(obj.speed)
              grav_energy += obj.mass*9.81*obj.position.z*0.1
             }  // case object with mass
      }
      tot_energy = elast_energy + kin_energy + grav_energy

      return [elast_energy, kin_energy, grav_energy, tot_energy]
}

function max_energies_and_text(){

      /*
      Max  values for energy
      */

      if (max_kin < kin_energy){max_kin = kin_energy}
      if (max_elast < elast_energy){max_elast = elast_energy}
      var txt_max_kin = ' __ max kinet = ' +  Math.round(max_kin,2)
      var txt_max_elast = ' __ max elast = ' +  Math.round(max_elast,2)

      return [txt_max_kin, txt_max_elast]
}

function energies_and_text(){

      /*

      */

      var txt_elast = ' _ elast = ' +  Math.round(elast_energy,2)
      var txt_grav = ' _ grav = ' +  Math.round(grav_energy,2)
      var txt_kin = ' _ kinet = ' +  Math.round(kin_energy,2)
      var txt_tot = ' _ tot = ' +  Math.round(tot_energy,2)

      return [txt_elast, txt_grav, txt_kin, txt_tot]

}

function calculate_total_energy(){

      /*
      Total energy of the system
      */

      var [elast_energy, kin_energy, grav_energy, tot_energy] = energy_calculation()
      var [txt_elast, txt_grav, txt_kin, txt_tot] = energies_and_text()
      var [txt_max_kin,txt_max_elast] = max_energies_and_text()
      //$('#curr_func').text( txt_elast + txt_kin + txt_grav + txt_tot )
      $('#curr_func').text( txt_max_elast + txt_max_kin + txt_grav + txt_tot )

}

function interactions_and_movement(delta){

      /*
      Gravity and other interactions..
      */

      gravity(delta)
      interactions_between_objects()
      update_all_pos(delta)
      calculate_total_energy()

}

function animate_physics(){

      /*
      Animation of the scene or empty loop ..
      */

      if (scene_animation_ok){
            var time = performance.now();
            var delta = ( time - prevTime ) / 100;
            interactions_and_movement(delta)
            prevTime = time;
        }
        else{ prevTime = performance.now() }
}
