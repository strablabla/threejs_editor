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
      Tracking of interacting objects (without changing their color: we preserve the
      custom colors during the animation).
      */

      if (list_interact.indexOf(obj) == -1){
            list_interact.push(obj)
      }

}

function change_speed_after_center_center_collision(i,j){

      /*
      3D elastic collision via impulse along the line of centers.
      Only the NORMAL component of the relative velocity is reversed; the tangential
      components stay unchanged. This is essential for thermalization:
      a simple swap of the full velocity vectors (equal masses) would merely
      permute the velocities -> frozen |v| distribution (no statistical equilibrium).

      Impulse (restitution e = 1):  J = -2·v_n / (w_i + w_j)   (w = 1/m, 0 if blocked)
            v_i += J·w_i·n     v_j -= J·w_j·n     with n = unit normal j->i
      Also: DE-PENETRATION — the balls are pushed apart to the contact distance
      (sum of the radii), so the bounce always happens at the same depth of the
      attractive well (otherwise varying interpenetration pumps energy).
      */

      var oi = list_moving_objects[i], oj = list_moving_objects[j]
      var n = new THREE.Vector3().subVectors(oi.position, oj.position)
      var d = n.length()
      if (d === 0){ return }                                   // coincident centers: no defined normal
      n.divideScalar(d)                                        // unit normal j->i
      var wi = oi.blocked ? 0 : 1/oi.mass                      // inverse-mass (0 = frozen/anchor)
      var wj = oj.blocked ? 0 : 1/oj.mass
      var wsum = wi + wj
      if (wsum === 0){ return }                                // two frozen objects

      // --- de-penetration: bring back to the contact distance (r_i + r_j) ---
      var contact = collision_radius(oi) + collision_radius(oj)
      if (d < contact){
            var push = contact - d
            oi.position.addScaledVector(n,  push * wi/wsum)     // each pushed apart according to its inverse-mass
            oj.position.addScaledVector(n, -push * wj/wsum)
      }

      // --- elastic impulse (normal component) ---
      var vn = new THREE.Vector3().subVectors(oi.speed, oj.speed).dot(n)  // normal relative velocity
      if (vn >= 0){ return }                                   // objects already separating: no collision
      var imp = -2 * vn / wsum                                 // scalar impulse (elastic)
      oi.speed.addScaledVector(n,  imp*wi)
      oj.speed.addScaledVector(n, -imp*wj)

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
      ROBUST ball-wall bounce (hard wall, anti-tunneling):
        - CONTINUOUS detection: if the center crossed the wall plane between the old
          (_ppos) and the new position, within the lateral footprint, it's a crossing;
        - POSITION correction: the ball is brought back to the right side, at distance = radius;
        - elastic reflection of the NORMAL component of the velocity.
      => a ball can never end a frame on the other side of a wall.
      */

      var [obji, objj] = objj_obji(i,j)
      var [obj, wall] = find_obj_wall(objj,obji)               // identify ball / wall

      var n = new THREE.Vector3().copy(wall.orientation)       // wall normal
      var nlen = n.length()
      if (nlen === 0){ return }
      n.divideScalar(nlen)                                     // normalized

      //--- lateral footprint (in the wall plane): is the ball facing the wall?
      var vec_lat = new THREE.Vector3().crossVectors(new THREE.Vector3(0,0,1), n).normalize()
      var lat = Math.abs(obj.position.dot(vec_lat) - wall.position.dot(vec_lat))
      var rad = (obj.radius !== undefined) ? obj.radius : dist_inter_wall_obj
      if (lat > wall.width/2 + rad){ return }                  // outside the wall -> no collision

      //--- signed distances to the plane (before / after the step)
      var contact = rad + (wall.thickness ? wall.thickness/2 : 0)  // ball surface flush with the wall
      var wp = wall.position.dot(n)
      var sd_now  = obj.position.dot(n) - wp
      var sd_prev = obj._ppos ? (obj._ppos.dot(n) - wp) : sd_now
      var crossed = (sd_prev > 0) !== (sd_now > 0)             // side change = crossing
      if (!crossed && Math.abs(sd_now) >= contact){ return }   // neither crossing nor contact

      //--- side to preserve = the one BEFORE the step (the inside of the box)
      var side = (sd_prev !== 0) ? Math.sign(sd_prev) : (Math.sign(sd_now) || 1)
      obj.position.addScaledVector(n, side*contact - sd_now)   // reposition at 'contact' from the plane, correct side
      var vn = obj.speed.dot(n)
      obj.speed.addScaledVector(n, side*Math.abs(vn) - vn)     // send the normal velocity back inward (elastic)
      check_change_color(obj, 0xff0000)

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

// ---- Bounce of balls on solid boxes (cubes/blocks): sphere-box collision ----

var SOLID_BOX_TYPES = ['simple_cube', 'pavement', 'cube_mult_tex']   // solid boxes -> bounce on the 6 faces
function is_solid_box(o){ return o && SOLID_BOX_TYPES.indexOf(o.type) >= 0 }

function interaction_obj_cube(ball, cube){

      /*
      Bounce of a ball on a solid box (cube/block). We work in the LOCAL frame
      of the cube (handles its rotation): we find the point of the box closest to the
      center of the ball; if it's within one radius, we de-penetrate the ball along
      the face normal and reflect the normal component of its velocity (immobile
      wall, elastic bounce — like the ground/the walls).
      */

      if (!ball || ball.type !== 'sphere' || ball.blocked){ return }
      var R = (ball.radius !== undefined) ? ball.radius : collision_radius(ball)
      var hx = cube.thickness/2, hy = cube.width/2, hz = cube.height/2   // CubeGeometry(thickness, width, height)

      cube.updateMatrixWorld()                                    // matrix up to date (the cube is draggable with the mouse)
      var local = cube.worldToLocal(ball.position.clone())        // ball center in the cube frame
      var cx = Math.max(-hx, Math.min(hx, local.x))               // closest point on the box (clamp)
      var cy = Math.max(-hy, Math.min(hy, local.y))
      var cz = Math.max(-hz, Math.min(hz, local.z))
      var dx = local.x - cx, dy = local.y - cy, dz = local.z - cz
      var d2 = dx*dx + dy*dy + dz*dz
      if (d2 >= R*R){ return }                                    // no contact

      var nlx, nly, nlz, push
      if (d2 > 1e-9){                                             // center OUTSIDE the box: normal = toward the ball
            var d = Math.sqrt(d2)
            nlx = dx/d; nly = dy/d; nlz = dz/d
            push = R - d
      } else {                                                   // center INSIDE the box: exit through the nearest face
            var px = hx - Math.abs(local.x), py = hy - Math.abs(local.y), pz = hz - Math.abs(local.z)
            if (px <= py && px <= pz){ nlx = (local.x < 0 ? -1 : 1); nly = 0; nlz = 0; push = px + R }
            else if (py <= pz){        nlx = 0; nly = (local.y < 0 ? -1 : 1); nlz = 0; push = py + R }
            else {                     nlx = 0; nly = 0; nlz = (local.z < 0 ? -1 : 1); push = pz + R }
      }
      var n = new THREE.Vector3(nlx, nly, nlz).applyQuaternion(cube.quaternion).normalize()  // normal LOCAL -> WORLD
      ball.position.addScaledVector(n, push)                     // de-penetration: ball brought back to the surface
      var vn = ball.speed.dot(n)
      if (vn < 0){ ball.speed.addScaledVector(n, -2*vn) }        // elastic reflection if the ball is entering (v' = v - 2(v·n)n)
      check_change_color(ball, 0xff0000)

}

function bounce_balls_on_cubes(){

      /*
      Bounces all balls off all solid boxes (cubes/blocks).
      The cubes are NOT in list_moving_objects (they stay static and draggable
      with the mouse): we iterate over them from `objects`. O(balls × cubes) — few cubes.
      */

      var cubes = []
      for (var k in objects){ if (is_solid_box(objects[k]) && !objects[k].del){ cubes.push(objects[k]) } }
      if (!cubes.length){ return }
      for (var i in list_moving_objects){
            var ball = list_moving_objects[i]
            if (ball.type !== 'sphere' || ball.blocked){ continue }
            for (var c = 0; c < cubes.length; c++){ interaction_obj_cube(ball, cubes[c]) }
      }

}


function attraction(i,j,dist){

      if (one_over_r2){

        var [obji, objj] = objj_obji(i,j)
        var vec_attract_interact = new THREE.Vector3()
        vec_attract_interact.subVectors(obji.position, objj.position) // vector from O to 1 ..
        objj.speed.addScaledVector(vec_attract_interact, attract_strength_one_over_r2/dist**2)
        obji.speed.addScaledVector(vec_attract_interact, -attract_strength_one_over_r2/dist**2)

      }
}

function collision_radius(o){

      /*
      Collision radius of an object: its actual radius if it has one (spheres),
      otherwise fall back to dist_min_center_center/2 (compat. old objects without .radius).
      */

      return (o.radius !== undefined) ? o.radius : dist_min_center_center/2

}

function collision(i,j,dist){

      /*
      Collision interaction: contact when the center-center distance drops below the
      SUM OF the actual RADII of the two balls (hard spheres), rather than below a
      fixed constant.
      */

      var [obji, objj] = objj_obji(i,j)
      var contact = collision_radius(obji) + collision_radius(objj)
      if (dist < contact){
            check_change_color(obji,0xff0000)
            check_change_color(objj,0xff0000)
            change_speed_after_center_center_collision(i,j)  // physical interaction
        } // end if dist

}

function interaction_center_center(i,j){

      /*
      Interaction center to center
      */

      var [obji, objj] = objj_obji(i,j)
      var dist = getDistance(obji, objj) // distance center-center
      collision(i,j,dist)  // collision interaction (impulsive)
      // attraction: moved to compute_accelerations (smooth force integrated in Verlet)

}

function interaction_between_ij(i,j){

      /*
      Change color to red in case of interaction
      */

      var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
      if ( cnd1 & cnd2 &cnd3 ){ interaction_obj_plane(i,j) }   // interaction between object and plane.  .
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
      new_elastic.position.copy(obj[0].position); // stick spring to object (local position = world, non-nested objects)
      var new_elastic_scale = getDistance(obj[0], obj[1])/420
      new_elastic.scale.set(1,1,new_elastic_scale)
      new_elastic.lookAt(obj[1].position)

}

function update_all_elastics(){

      /*
      Realigns all springs/elastics on the current position of the balls.
      Called each frame (including during a drag, with animation stopped)
      so that the chain visually follows the moved balls.
      */

      for (var i in list_paired_harmonic){
            change_elastic(list_paired_harmonic[i])
      }

}

function interact_harmonic_vectors(i){

      /*
      Vectors for harmonic interaction
      Taking in account if length of equilibrium.. (lenght_spring)
      */

      var vec_harm_interact = new THREE.Vector3()
      var lphi0 = list_paired_harmonic[i][0]
      var lphi1 = list_paired_harmonic[i][1]
      vec_harm_interact.subVectors(lphi1.position, lphi0.position) // vector from O to 1 ..
      ///////change_spring(list_paired_harmonic[i])
      var diff_length = vec_harm_interact.length() - lenght_spring // compare lengths
      vec_harm_interact = vec_harm_interact.normalize().multiplyScalar( diff_length )
      //alert("diff_length is " + diff_length)
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
            lphi0.speed.addScaledVector(vec_harm_interact,harmonic_const)  // change speed of first pair element..
            lphi1.speed.addScaledVector(vec_harm_interact,-harmonic_const)  // change speed of second pair element..
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
      Impulsive interactions (not derived from a smooth potential):
          * object-wall bounce
          * elastic center-center collision
      (springs and attraction are handled as accelerations -> compute_accelerations)
      */

      list_interact = []
      if (list_moving_objects.length > 0){
          if (use_cell_lists){ interactions_between_objects_grid() }   // O(n): spatial grid
          else {
              for (var i=0; i< list_moving_objects.length; i++){       // O(n²): all pairs (exact reference)
                    for (var j=i+1; j <  list_moving_objects.length; j++){
                          if ( allow_interaction_ij(i,j) ) { interaction_between_ij(i,j) } // i j interaction
                      } // end for j
                } // end for i
          }
      } // end if in moving_objects
      // (no more pink/red recoloring: we preserve the objects' colors)

}

// 3D "half-neighborhood" stencil: the current cell + 13 "forward" cells.
// Sweeping these 14 offsets for each cell visits each pair of adjacent cells
// exactly once (the reverse offset is never in the list) -> no duplicate pair.
var HALF_NEIGHBORS = [
      [0,0,0],
      [1,0,0],
      [-1,1,0],[0,1,0],[1,1,0],
      [-1,-1,1],[0,-1,1],[1,-1,1],
      [-1,0,1],[0,0,1],[1,0,1],
      [-1,1,1],[0,1,1],[1,1,1]
]

function interactions_between_objects_grid(){

      /*
      O(n) version of the impulsive interactions via "cell lists" (spatial grid).
      Physically IDENTICAL to the double loop: we call the SAME functions
      (interaction_center_center / interaction_between_ij), only the pair
      filtering changes — two balls are tested only if a contact is geometrically
      possible (same cell or neighboring cell).

        * balls ↔ balls: filtered by the grid (contact = R_i + R_j);
        * walls (wall_box): too large for a uniform grid -> objects × walls loop.
      */

      var objs = list_moving_objects
      var n = objs.length

      // 1) separate walls / non-walls and compute the max collision radius (sizes the cell)
      var wall_idx = [], cell_idx = [], rmax = 0
      for (var i=0; i<n; i++){
            if (objs[i].type === 'wall_box'){ wall_idx.push(i) }
            else {
                  cell_idx.push(i)
                  var r = collision_radius(objs[i])
                  if (r > rmax){ rmax = r }
            }
      }

      // 2) place the non-walls into the grid. Cell = 2·rmax: guarantees that any pair
      //    in contact (dist < R_i+R_j <= 2·rmax) falls into at most neighboring cells.
      var cell = (rmax > 0) ? 2*rmax : dist_min_center_center
      var inv = 1 / cell
      var grid = new Map()
      for (var k=0; k<cell_idx.length; k++){
            var o = objs[cell_idx[k]]
            o._cx = Math.floor(o.position.x*inv)
            o._cy = Math.floor(o.position.y*inv)
            o._cz = Math.floor(o.position.z*inv)
            var key = o._cx + ',' + o._cy + ',' + o._cz
            var bucket = grid.get(key)
            if (!bucket){ bucket = []; grid.set(key, bucket) }
            bucket.push(cell_idx[k])
      }

      // 3) ball ↔ ball pairs: current cell + 13 "forward" neighbors
      for (var k=0; k<cell_idx.length; k++){
            var ia = cell_idx[k], o = objs[ia]
            for (var s=0; s<HALF_NEIGHBORS.length; s++){
                  var off = HALF_NEIGHBORS[s]
                  var bucket = grid.get((o._cx+off[0]) + ',' + (o._cy+off[1]) + ',' + (o._cz+off[2]))
                  if (!bucket){ continue }
                  var same_cell = (off[0]===0 && off[1]===0 && off[2]===0)
                  for (var b=0; b<bucket.length; b++){
                        var ib = bucket[b]
                        if (same_cell){ if (ib <= ia){ continue } }   // same cell: each pair only once
                        var i = (ia < ib) ? ia : ib, j = (ia < ib) ? ib : ia
                        if ( allow_interaction_ij(i,j) ){ interaction_center_center(i,j) }  // both non-walls -> center-center
                  }
            }
      }

      // 4) walls: few in number -> direct walls × balls loop (ball-wall bounces)
      for (var w=0; w<wall_idx.length; w++){
            for (var k=0; k<cell_idx.length; k++){
                  var i = (wall_idx[w] < cell_idx[k]) ? wall_idx[w] : cell_idx[k]
                  var j = (wall_idx[w] < cell_idx[k]) ? cell_idx[k] : wall_idx[w]
                  if ( allow_interaction_ij(i,j) ){ interaction_between_ij(i,j) }
            }
      }

}

function initialize_energies(){


      /*
      Energies initialization
      */

      tot_energy = 0
      elast_energy = 0
      kin_energy = 0
      grav_energy = 0
      attract_energy = 0

}

function attraction_potential_energy(){

      /*
      SOFTENED Newtonian gravity potential energy (consistent with accel_attraction):
      U = - Σ G·m_i·m_j / √(r² + ε²)   (Plummer softening, ε = attract_softening).
      */

      // Short-circuit: this sum is O(n²) and serves ONLY the energy graph.
      // Graph hidden -> no reason to compute it (U=0, only affects #curr_func, hidden).
      if (!show_energy_graph){ return 0 }

      var U = 0
      if (one_over_r2 && list_moving_objects.length > 1){
            for (var i=0; i< list_moving_objects.length; i++){
                  for (var j=i+1; j< list_moving_objects.length; j++){
                        if ( allow_interaction_ij(i,j) ){
                              var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                              if ( !(cnd1 & cnd2 & cnd3) ){                 // center-center pairs (like accel_attraction)
                                    var oi = list_moving_objects[i], oj = list_moving_objects[j]
                                    var dist = getDistance(oi, oj)
                                    var soft = Math.sqrt(dist*dist + attract_softening*attract_softening)  // √(r²+ε²)
                                    U += - attract_strength_one_over_r2 * oi.mass * oj.mass / soft
                              }
                        }
                  }
            }
      }
      return U

}

function energy_calculation(){

      /*
      Energies calculations
      */

      initialize_energies()
      for (var i in list_moving_objects){                                  // kinetic + uniform gravity (z) of the moving objects
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }                                   // static objects (walls, anchors) excluded
            if (list_forbid_obj_for_interact.indexOf(obj.type) == -1){     // object with mass (not spring/elastic)
                  kin_energy += 0.5*obj.mass*obj.speed.dot(obj.speed)
                  grav_energy += obj.mass*9.81*obj.position.z*0.1
            }
      }
      for (var k in list_paired_harmonic){                                 // spring elastic energy: ½·k·(L-L0)²
            var dx = getDistance(list_paired_harmonic[k][0], list_paired_harmonic[k][1]) - lenght_spring
            var kc = (list_paired_harmonic[k].k_spring !== undefined) ? list_paired_harmonic[k].k_spring : harmonic_const
            elast_energy += 0.5 * kc * dx * dx
      }
      attract_energy = attraction_potential_energy()                       // Newtonian gravity PE (pairs)
      grav_energy += attract_energy                                        // gravity = uniform (z) + Newtonian
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
      record_energy()                                        // time graph (if enabled)
      draw_velocity_hist()                                   // velocity histogram (if enabled)
      draw_altitude_hist()                                   // altitude histogram (if enabled)
      record_trajectories()                                  // trajectories + MSD (if enabled)

}

//===================================================================== Energy graph

var energy_hist = { tot: [], kin: [], pot: [] }
var ENERGY_HIST_MAX = 400

function record_energy(){

      /*
      Stores the current energy and redraws the graph (only if enabled).
      */

      if (!show_energy_graph){ return }
      energy_hist.tot.push(tot_energy)
      energy_hist.kin.push(kin_energy)
      energy_hist.pot.push(grav_energy + elast_energy)        // potential = gravity (uniform+Newton) + elastic
      if (energy_hist.tot.length > ENERGY_HIST_MAX){
            energy_hist.tot.shift(); energy_hist.kin.shift(); energy_hist.pot.shift()
      }
      draw_energy_graph()

}

function fmt_energy(v){                                       // compact format of an energy value

      var a = Math.abs(v)
      if (a !== 0 && (a >= 1e5 || a < 1e-2)){ return v.toExponential(1) }
      if (a >= 100){ return v.toFixed(0) }
      return v.toFixed(1)

}

function draw_energy_graph(){

      var cv = document.getElementById('energy_graph')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var n = energy_hist.tot.length
      if (n < 2){ return }
      var ML = 48, MT = 6, MB = 6                             // margins (left = axis labels)
      var plotW = W - ML, plotH = H - MT - MB
      //--- automatic vertical scale over the 3 curves
      var lo = Infinity, hi = -Infinity
      function scan(a){ for (var k=0;k<a.length;k++){ if (a[k]<lo) lo=a[k]; if (a[k]>hi) hi=a[k] } }
      scan(energy_hist.tot); scan(energy_hist.kin); scan(energy_hist.pot)
      if (lo === hi){ hi = lo + 1; lo = lo - 1 }
      var pad = (hi - lo) * 0.1; lo -= pad; hi += pad
      function X(i){ return ML + i / (ENERGY_HIST_MAX - 1) * plotW }
      function Y(v){ return MT + (1 - (v - lo) / (hi - lo)) * plotH }
      //--- grid + numeric ticks (Y axis = energy, arbitrary units)
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      var NT = 4
      for (var t=0; t<=NT; t++){
            var val = hi - (hi - lo) * t / NT
            var y = Y(val)
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W, y); ctx.stroke()
            ctx.fillText(fmt_energy(val), ML - 4, y)
      }
      //--- zero line (marked) if it's within the range
      if (lo < 0 && hi > 0){
            ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke()
      }
      //--- curves
      function line(a, color){
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5
            for (var i=0;i<a.length;i++){ var x = X(i), y = Y(a[i]); if (i === 0){ ctx.moveTo(x, y) } else { ctx.lineTo(x, y) } }
            ctx.stroke()
      }
      line(energy_hist.pot, '#1e88e5')   // potential (blue)
      line(energy_hist.kin, '#e53935')   // kinetic (red)
      line(energy_hist.tot, '#000000')   // total (black)

}

//===================================================================== Velocity histogram

var VELO_HIST_BINS = 20                                       // number of |v| bins

function collect_speeds(){

      /*
      Speed magnitudes of the moving massive objects (same exclusions as the kinetic
      energy: neither static/anchors, nor springs/elastics/pawns).
      */

      var speeds = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            speeds.push(Math.sqrt(obj.speed.dot(obj.speed)))
      }
      return speeds

}

//===================================================================== 3D velocity arrows (show_speeds)

var speed_arrows = []                                        // active arrows: list of { obj, arrow }
var SPEED_ARROW_SCALE = 1.0                                  // arrow length = |v| * scale (adjustable)
var SPEED_ARROW_COLOR = 0x00b0ff                             // light blue

function speed_arrow_objects(){                              // moving objects carrying a velocity (same exclusions as the kinetic energy)
      var res = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            if (!obj.speed){ continue }
            res.push(obj)
      }
      return res
}

function clear_speed_arrows(){                               // removes all arrows from the scene
      for (var i=0;i<speed_arrows.length;i++){
            scene.remove(speed_arrows[i].arrow)
            if (speed_arrows[i].obj){ speed_arrows[i].obj._speed_arrow = null }
      }
      speed_arrows = []
}

function update_speed_arrows(){

      /*
      Draws/updates a 3D velocity arrow on each moving object (called each frame
      from render()). The arrows are NOT added to objects[]: neither selectable nor persisted.
      */

      if (!show_speeds){ if (speed_arrows.length){ clear_speed_arrows() } return }

      var objs = speed_arrow_objects()
      var present = {}
      for (var k=0;k<objs.length;k++){
            var obj = objs[k]
            present[obj.id] = true                          // .id: unique THREE identifier
            var v = obj.speed
            var len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
            var arrow = obj._speed_arrow
            if (len < 1e-6){                                 // zero velocity -> no direction: hide the arrow
                  if (arrow){ arrow.visible = false }
                  continue
            }
            var dir = new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(1/len)
            var alen = len * SPEED_ARROW_SCALE
            if (!arrow){
                  arrow = new THREE.ArrowHelper(dir, obj.position.clone(), alen, SPEED_ARROW_COLOR,
                                                Math.min(alen*0.25, 30), Math.min(alen*0.15, 18))
                  scene.add(arrow)
                  obj._speed_arrow = arrow
                  speed_arrows.push({ obj: obj, arrow: arrow })
            } else {
                  arrow.visible = true
                  arrow.position.copy(obj.position)
                  arrow.setDirection(dir)
                  arrow.setLength(alen, Math.min(alen*0.25, 30), Math.min(alen*0.15, 18))
            }
      }
      //--- remove the arrows of objects that disappeared or became ineligible
      for (var i = speed_arrows.length - 1; i >= 0; i--){
            var rec = speed_arrows[i]
            if (!present[rec.obj.id]){
                  scene.remove(rec.arrow)
                  if (rec.obj){ rec.obj._speed_arrow = null }
                  speed_arrows.splice(i, 1)
            }
      }
}

function draw_velocity_hist(){

      /*
      (Instantaneous) histogram of the distribution of speed magnitudes.
      X axis = |v| (0 -> current max), Y axis = number of objects per bin.
      */

      if (!show_velocity_hist){ return }
      var cv = document.getElementById('velocity_hist')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var speeds = collect_speeds()
      var n = speeds.length
      //--- total number of counted objects (always displayed, top-right corner)
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'
      ctx.fillText('N = ' + n, W - 4, 2)
      if (n === 0){ return }
      //--- max speed -> horizontal scale
      var vmax = 0
      for (var k=0;k<n;k++){ if (speeds[k] > vmax) vmax = speeds[k] }
      if (vmax <= 0){ vmax = 1 }
      //--- filling the bins
      var bins = new Array(VELO_HIST_BINS).fill(0)
      for (var k=0;k<n;k++){
            var b = Math.floor(speeds[k] / vmax * VELO_HIST_BINS)
            if (b >= VELO_HIST_BINS){ b = VELO_HIST_BINS - 1 }
            bins[b]++
      }
      var cmax = 0
      for (var b=0;b<VELO_HIST_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      //--- geometry
      var ML = 26, MT = 6, MB = 16                             // margins (left = counts, bottom = |v|)
      var plotW = W - ML - 6, plotH = H - MT - MB
      //--- Y axis: integer ticks (counts)
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      var NT = Math.min(cmax, 4)
      for (var t=0; t<=NT; t++){
            var val = Math.round(cmax * t / NT)
            var y = MT + (1 - t / NT) * plotH
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - 6, y); ctx.stroke()
            ctx.fillText(val, ML - 4, y)
      }
      //--- bars
      var bw = plotW / VELO_HIST_BINS
      ctx.fillStyle = '#43a047'                                // green
      for (var b=0;b<VELO_HIST_BINS;b++){
            var h = bins[b] / cmax * plotH
            ctx.fillRect(ML + b * bw + 1, MT + plotH - h, bw - 2, h)
      }
      //--- X axis: bounds 0 and vmax
      ctx.fillStyle = '#666'; ctx.textBaseline = 'top'
      ctx.textAlign = 'left';  ctx.fillText('0', ML, MT + plotH + 3)
      ctx.textAlign = 'right'; ctx.fillText(fmt_energy(vmax), W - 6, MT + plotH + 3)

}

//===================================================================== Previews (Initial speeds tab)

var PANEL_ANGLE_BINS = 24                                    // sectors of the angular rose (x-y)

function collect_velocities(){

      /*
      Velocities (Vector3) of the moving massive objects, same exclusions as collect_speeds().
      Returns the list of velocity vectors to derive magnitude AND direction.
      */

      var vels = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            vels.push(obj.speed)
      }
      return vels

}

function draw_panel_speed_hist(){

      /*
      Small histogram of the speed magnitudes embedded in the "Initial speeds" tab.
      Same data as the Monitoring window but independent of its toggle.
      */

      var cv = document.getElementById('panel_speed_hist')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var speeds = collect_speeds()
      var n = speeds.length
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'
      ctx.fillText('N = ' + n, W - 3, 2)
      if (n === 0){ return }
      var vmax = 0
      for (var k=0;k<n;k++){ if (speeds[k] > vmax) vmax = speeds[k] }
      if (vmax <= 0){ vmax = 1 }
      var bins = new Array(VELO_HIST_BINS).fill(0)
      for (var k=0;k<n;k++){
            var b = Math.floor(speeds[k] / vmax * VELO_HIST_BINS)
            if (b >= VELO_HIST_BINS){ b = VELO_HIST_BINS - 1 }
            bins[b]++
      }
      var cmax = 0
      for (var b=0;b<VELO_HIST_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      var MT = 4, MB = 12, ML = 4, MR = 4
      var plotW = W - ML - MR, plotH = H - MT - MB
      var bw = plotW / VELO_HIST_BINS
      ctx.fillStyle = '#43a047'
      for (var b=0;b<VELO_HIST_BINS;b++){
            var h = bins[b] / cmax * plotH
            ctx.fillRect(ML + b * bw + 1, MT + plotH - h, bw - 1, h)
      }
      ctx.fillStyle = '#666'; ctx.textBaseline = 'top'
      ctx.textAlign = 'left';  ctx.fillText('0', ML, MT + plotH + 2)
      ctx.textAlign = 'right'; ctx.fillText(fmt_energy(vmax), W - MR, MT + plotH + 2)

}

function draw_panel_angle_hist(){

      /*
      Angular dispersion rose of the velocities in the x-y plane (angle = atan2(vy, vx)).
      Each sector has a radius proportional to the number of objects whose velocity points
      in that direction: reveals the anisotropy (e.g.: directed jet vs isotropic gas).
      */

      var cv = document.getElementById('panel_angle_hist')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var cx = W / 2, cy = H / 2
      var R = Math.min(W, H) / 2 - 8
      var vels = collect_velocities()
      //--- distribution of directions (we ignore ~zero velocities: no defined direction)
      var bins = new Array(PANEL_ANGLE_BINS).fill(0)
      var counted = 0
      for (var i=0;i<vels.length;i++){
            var vx = vels[i].x, vy = vels[i].y
            if (vx*vx + vy*vy < 1e-9){ continue }
            var a = Math.atan2(vy, vx)                          // -π .. π
            if (a < 0){ a += 2 * Math.PI }
            var b = Math.floor(a / (2 * Math.PI) * PANEL_ANGLE_BINS)
            if (b >= PANEL_ANGLE_BINS){ b = PANEL_ANGLE_BINS - 1 }
            bins[b]++; counted++
      }
      //--- reference circle
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy)
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke()
      if (counted === 0){ return }
      var cmax = 0
      for (var b=0;b<PANEL_ANGLE_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      //--- sectors (rose); screen y goes downward -> we invert the angle for a mathematical frame
      var dA = 2 * Math.PI / PANEL_ANGLE_BINS
      ctx.fillStyle = 'rgba(67,160,71,0.55)'
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.5
      for (var b=0;b<PANEL_ANGLE_BINS;b++){
            if (bins[b] === 0){ continue }
            var r = bins[b] / cmax * R
            var a0 = b * dA, a1 = (b + 1) * dA
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.arc(cx, cy, r, -a0, -a1, true)               // -angle: counterclockwise on screen
            ctx.closePath()
            ctx.fill(); ctx.stroke()
      }

}

function draw_speed_panels(){                                 // the two previews of the Initial speeds tab
      draw_panel_speed_hist()
      draw_panel_angle_hist()
}

//===================================================================== Colors (tracking filters)

function obj_hex(obj){

      /*
      ACTUAL color of an object, as '#rrggbb'.
      We read currentHex and not material.color: the latter is temporarily overwritten by the
      highlights (yellow = nearest, green = clicked, orange = picked, purple = group).
      */

      var hex = (obj.currentHex !== undefined) ? obj.currentHex : obj.material.color.getHex()
      return '#' + ('000000' + hex.toString(16)).slice(-6)

}

function distinct_colors(list){                               // distinct colors present, sorted (stable order from one frame to the next)
      var seen = {}, out = []
      for (var i=0;i<list.length;i++){
            var h = obj_hex(list[i])
            if (!seen[h]){ seen[h] = true; out.push(h) }
      }
      out.sort()
      return out
}

//===================================================================== Altitude histogram

var ALT_HIST_BINS = 24                                        // number of altitude slices
var altitude_fit = null                                      // fit curve { z:[], y:[] } (overlay), evaluated in Python
var altitude_fit_expr = ''                                   // Python expression of the fit (saved with the scene)
var alt_zmin = 0, alt_zmax = 1                               // current altitude range (for the fit request)

function request_altitude_fit(expr){

      /*
      Sends a Python expression of z to the server (/eval_fit) and overlays the resulting
      curve on the altitude histogram. Empty expression -> removes the fit.
      */

      expr = (expr || '').trim()
      altitude_fit_expr = expr                               // stored (persisted with the scene)
      $('#altitude_fit_err').text('')
      if (!expr){ altitude_fit = null; draw_altitude_hist(); return }
      $.ajax({ url:'/eval_fit', method:'POST', contentType:'application/json',
               data: JSON.stringify({ expr:expr, zmin:alt_zmin, zmax:alt_zmax, n:120 }) })
       .done(function(resp){
             var r = (typeof resp === 'string') ? JSON.parse(resp) : resp
             if (r && r.ok){ altitude_fit = { z:r.z, y:r.y } }
             else { altitude_fit = null; $('#altitude_fit_err').text((r && r.error) || 'erreur') }
             draw_altitude_hist()
       })
       .fail(function(){ $('#altitude_fit_err').text('serveur injoignable') })
}

function altitude_objects(){                                  // moving massive objects (same exclusions as the kinetic energy)
      var a = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            a.push(obj)
      }
      return a
}

function collect_altitudes(){                                 // z of the retained objects, filtered by the panel's color select
      var a = altitude_objects(), zs = []
      for (var i=0;i<a.length;i++){
            if (alt_color_filter !== 'all' && obj_hex(a[i]) !== alt_color_filter){ continue }
            zs.push(a[i].position.z)
      }
      return zs
}

var _alt_colors_sig = null                                    // signature of the present colors -> only rebuilds the <select> if it changes

function refresh_alt_color_options(){

      /*
      Populates the color select ("all" + one entry per present color).
      Called each frame from draw_altitude_hist: we compare a signature before touching the
      DOM, otherwise we'd destroy the menu 60 times per second (impossible to open).
      */

      var sel = document.getElementById('alt_color_sel')
      if (!sel){ return }
      var a = altitude_objects()
      var cols = distinct_colors(a)
      var counts = {}
      for (var i=0;i<a.length;i++){ var h = obj_hex(a[i]); counts[h] = (counts[h] || 0) + 1 }
      var sig = cols.map(function(h){ return h + ':' + counts[h] }).join(',')
      if (sig === _alt_colors_sig){ return }
      _alt_colors_sig = sig
      if (alt_color_filter !== 'all' && cols.indexOf(alt_color_filter) < 0){ alt_color_filter = 'all' }  // the filtered color has disappeared
      while (sel.firstChild){ sel.removeChild(sel.firstChild) }
      var o = document.createElement('option')
      o.value = 'all'; o.textContent = 'all (' + a.length + ')'
      sel.appendChild(o)
      for (var i=0;i<cols.length;i++){
            o = document.createElement('option')
            o.value = cols[i]
            o.textContent = cols[i] + '  (' + counts[cols[i]] + ')'   // the hex alone is unreadable: we give the count
            o.style.background = cols[i]                      // swatch: the option takes the color it designates
            sel.appendChild(o)
      }
      sel.value = alt_color_filter

}

function draw_altitude_hist(){

      /*
      Number of particles as a function of altitude (z).
      VERTICAL axis = altitude (top = z max), horizontal bars = count per slice.
      */

      if (!show_altitude_hist){ return }
      var cv = document.getElementById('altitude_hist')
      if (!cv){ return }
      refresh_alt_color_options()                             // updates the select if the scene's colors have changed
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var zs = collect_altitudes()
      var n = zs.length
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'
      ctx.fillText('N = ' + n, W - 4, 2)
      if (n === 0){ return }
      //--- altitude range
      var zmin = Infinity, zmax = -Infinity
      for (var k=0;k<n;k++){ if (zs[k]<zmin) zmin=zs[k]; if (zs[k]>zmax) zmax=zs[k] }
      if (zmin === zmax){ zmax = zmin + 1; zmin = zmin - 1 }
      alt_zmin = zmin; alt_zmax = zmax                        // stored for the Python fit request
      //--- bins
      var bins = new Array(ALT_HIST_BINS).fill(0)
      for (var k=0;k<n;k++){
            var b = Math.floor((zs[k]-zmin)/(zmax-zmin)*ALT_HIST_BINS)
            if (b >= ALT_HIST_BINS){ b = ALT_HIST_BINS - 1 }
            if (b < 0){ b = 0 }
            bins[b]++
      }
      var cmax = 0
      for (var b=0;b<ALT_HIST_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      //--- geometry: altitude on Y (top = zmax), count on X (horizontal bars)
      //    ML leaves room for the ticks + the "z" title; MB for the bounds + the "N" title
      var ML = 56, MT = 6, MB = 30, MR = 6
      var plotW = W - ML - MR, plotH = H - MT - MB
      //--- Y axis: altitude ticks (top = zmax, bottom = zmin)
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      for (var t=0; t<=4; t++){
            var zval = zmax - (zmax - zmin) * t / 4
            var y = MT + t / 4 * plotH
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke()
            ctx.fillText(fmt_energy(zval), ML - 4, y)
      }
      //--- horizontal bars (bin 0 = low altitude -> at the bottom)
      var bh = plotH / ALT_HIST_BINS
      ctx.fillStyle = '#3949ab'                                // indigo
      for (var b=0;b<ALT_HIST_BINS;b++){
            var w = bins[b] / cmax * plotW
            var y = MT + plotH - (b + 1) * bh                  // b increasing -> upward
            ctx.fillRect(ML, y + 1, w, bh - 2)
      }
      //--- Python fit curve (overlay N(z), in red)
      if (altitude_fit && altitude_fit.z && altitude_fit.z.length > 1){
            ctx.strokeStyle = '#c62828'; ctx.lineWidth = 1.8; ctx.beginPath()
            for (var k=0;k<altitude_fit.z.length;k++){
                  var zz = altitude_fit.z[k], yy = altitude_fit.y[k]
                  var X = ML + Math.max(0, Math.min(1, yy / cmax)) * plotW    // count -> X (like the bars)
                  var Y = MT + (1 - (zz - zmin) / (zmax - zmin)) * plotH      // altitude -> Y (top = zmax)
                  if (k === 0){ ctx.moveTo(X, Y) } else { ctx.lineTo(X, Y) }
            }
            ctx.stroke()
      }
      //--- X axis: bounds 0 and cmax (count)
      ctx.fillStyle = '#666'; ctx.textBaseline = 'top'
      ctx.textAlign = 'left';  ctx.fillText('0', ML, MT + plotH + 3)
      ctx.textAlign = 'right'; ctx.fillText(cmax, W - MR, MT + plotH + 3)
      //--- axis names: z (altitude, vertical) and N (count, horizontal)
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText('N', ML + plotW / 2, MT + plotH + 15)      // below the bounds 0/cmax
      ctx.save()                                              // "z" written vertically along the altitude axis
      ctx.translate(9, MT + plotH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('z', 0, 0)
      ctx.restore()

}

//===================================================================== Trajectories + MSD

var TRAJ_MAX = 200000                                       // max samples per trajectory (memory bound, ~1h @60fps)
var TRAJ_DRAW_MAX = 2000                                    // max points plotted per curve (decimation -> fast rendering)
function traj_color(obj){ return obj_hex(obj) }             // ACTUAL color of the ball (currentHex = tint outside highlight)

function tracked_objects(){                                 // objects whose trajectory is tracked
      var a = []
      for (var k in objects){ if (objects[k] && objects[k].track_trajectory){ a.push(objects[k]) } }
      return a
}

function traj_candidate_objects(){

      /*
      Objects that can be offered for tracking: the moving objects (same exclusions as altitude)
      + any object ALREADY tracked via the context menu, even if it's not moving (cube, wall...),
      so that its color still appears in the list and can still be unchecked.
      */

      var a = altitude_objects()
      var t = tracked_objects()
      for (var i=0;i<t.length;i++){ if (a.indexOf(t[i]) < 0){ a.push(t[i]) } }
      return a

}

function color_is_tracked(hex){                             // is at least one object of this color tracked?
      var a = traj_candidate_objects()
      for (var i=0;i<a.length;i++){
            if (obj_hex(a[i]) === hex && a[i].track_trajectory){ return true }
      }
      return false
}

function set_track_by_color(hex, on){

      /*
      Enables/disables tracking of ALL objects of a color — this is the action of the checkboxes
      in the Trajectories window: we choose the objects to track by their color.
      */

      var a = traj_candidate_objects(), n = 0
      for (var i=0;i<a.length;i++){
            if (obj_hex(a[i]) !== hex){ continue }
            a[i].track_trajectory = on
            if (on){ reset_trajectory(a[i]) } else { a[i].traj = null }
            n++
      }
      return n

}

function traj_mass_label(lo, hi){                           // "masse 1.0", or "masse 1.0…5.0" if the color mixes masses
      if (lo === undefined){ return 'masse inconnue' }
      var a = fmt_energy(lo), b = fmt_energy(hi)
      return 'masse ' + (a === b ? a : a + '…' + b)
}

var _traj_colors_sig = null                                 // signature (colors + checked state + masses) -> only rebuilds the checkboxes if it changes

function refresh_traj_color_filters(){

      /*
      One checkbox per color present in the scene: checking = track the objects of that
      color. We compare a signature before touching the DOM (this code runs each frame:
      recreating the checkboxes continuously would make them impossible to click).
      The signature includes the checked state -> the checkbox stays in sync if tracking is changed elsewhere
      (the "trajectory" checkbox of the right-click menu).
      */

      var box = document.getElementById('traj_color_filters')
      if (!box){ return }
      var a = traj_candidate_objects()
      var cols = distinct_colors(a)
      var counts = {}, tracked = {}, mmin = {}, mmax = {}
      for (var i=0;i<a.length;i++){
            var h = obj_hex(a[i])
            counts[h] = (counts[h] || 0) + 1
            var m = a[i].mass                             // min/max masses of the color (a color can mix masses)
            if (typeof m === 'number' && isFinite(m)){
                  if (mmin[h] === undefined || m < mmin[h]){ mmin[h] = m }
                  if (mmax[h] === undefined || m > mmax[h]){ mmax[h] = m }
            }
            if (a[i].track_trajectory){ tracked[h] = true }
      }
      var nsel = 0
      for (var i=0;i<cols.length;i++){ if (tracked[cols[i]]){ nsel++ } }
      var sig = cols.map(function(h){ return h + (tracked[h] ? '1' : '0') + counts[h] + '/' + mmin[h] + '-' + mmax[h] }).join(',')
      if (sig === _traj_colors_sig){ return }
      _traj_colors_sig = sig
      $(box).empty()
      $('#traj_colors_count').text('(' + cols.length + ' couleur(s)' + (nsel ? ', ' + nsel + ' suivie(s)' : '') + ')')
      if (!cols.length){
            $(box).append($('<span style="color:#999; grid-column:1/-1">').text('aucun objet dans la scène'))
            return
      }
      for (var i=0;i<cols.length;i++){
            (function(hex){
                  var $cb = $('<input type="checkbox" style="margin:0">').prop('checked', !!tracked[hex])
                  $cb.on('change', function(){
                        set_track_by_color(hex, $cb.is(':checked'))
                        this.blur()                                     // returns keyboard focus to the scene (the 'x' shortcut stays active)
                        _traj_colors_sig = null                         // the checked state changed -> let the checkboxes resynchronize
                        draw_trajectories()
                  })
                  // (the isolation from TrackballControls is set once and for all
                  //  on #traj_colors_wrap, cf. panel_interaction.html — no need to repeat it here)
                  var $sw = $('<span style="display:inline-block; width:9px; height:9px; border:1px solid #999; vertical-align:middle; margin:0 2px">')
                              .css('background', hex)
                  $(box).append($('<label style="cursor:pointer; white-space:nowrap; display:flex; align-items:center">')
                        .append($cb).append($sw)
                        .append($('<span style="color:#888">').text(counts[hex]))
                        .attr('title', hex + ' — ' + counts[hex] + ' objet(s) — ' + traj_mass_label(mmin[hex], mmax[hex])))
            })(cols[i])
      }

}

function fmt_hms(sec){                                      // seconds -> H:MM:SS (hours omitted if zero)
      var s = Math.floor(sec % 60), m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600)
      var mm = (m < 10 && h > 0 ? '0' : '') + m
      return (h > 0 ? h + ':' : '') + mm + ':' + (s < 10 ? '0' : '') + s
}

function update_traj_time(){                                // simulation time elapsed since the last reset / start of tracking
      var el = document.getElementById('traj_time')
      if (el){ el.textContent = 't = ' + sim_time.toFixed(1) + ' u.a. (' + fmt_hms(sim_time / 10) + ')' }
}                                                          // 1 u.a. = 100 ms of real time (cf. animate_physics)

// traj_show = { xy, z, msd, v } (independent toggles) is declared in scene_params.js (Monitoring settings)

function apply_traj_mode(){                                 // shows/hides each plot according to traj_show
      var wxy = document.getElementById('traj_xy_wrap');  if (wxy){ wxy.style.display = traj_show.xy  ? '' : 'none' }
      var wz  = document.getElementById('traj_z_wrap');   if (wz){  wz.style.display  = traj_show.z   ? '' : 'none' }
      var wm  = document.getElementById('traj_msd_wrap'); if (wm){  wm.style.display  = traj_show.msd ? '' : 'none' }
      var wv  = document.getElementById('traj_v_wrap');   if (wv){  wv.style.display  = traj_show.v   ? '' : 'none' }
}

function reset_trajectory(obj){                             // (re)starts recording from the current position
      obj.traj = { x:[], y:[], z:[], msd:[], v:[], x0:null, y0:null, z0:null, zsum:0, zcount:0 }  // v: |velocity| per sample ; zsum/zcount: ⟨z⟩ since the reset (independent of the sliding window)
}

function reset_all_trajectories(){
      if (typeof clear_traj_zoom === 'function'){ clear_traj_zoom() }   // restart with an auto-fit view
      sim_time = 0                                                      // the timer restarts with the plots ("since the last Reset")
      var t = tracked_objects(); for (var i=0;i<t.length;i++){ reset_trajectory(t[i]) }
}

function record_trajectories(){                             // called each animation frame

      if (!show_trajectories){ return }
      var t = tracked_objects()
      for (var i=0;i<t.length;i++){
            var o = t[i]; if (!o.traj){ reset_trajectory(o) }
            var tr = o.traj
            if (tr.x0 === null){ tr.x0 = o.position.x; tr.y0 = o.position.y; tr.z0 = o.position.z }  // origin r0
            var dx = o.position.x-tr.x0, dy = o.position.y-tr.y0, dz = o.position.z-tr.z0
            tr.x.push(o.position.x); tr.y.push(o.position.y); tr.z.push(o.position.z); tr.msd.push(dx*dx+dy*dy+dz*dz)  // |r-r0|²
            var sp = o.speed                               // |velocity| = speed magnitude at this sample
            tr.v.push(sp ? Math.sqrt(sp.x*sp.x + sp.y*sp.y + sp.z*sp.z) : 0)
            tr.zsum += o.position.z; tr.zcount++            // cumulative z mean since the reset (all points, not just the window)
            if (tr.x.length > TRAJ_MAX){ tr.x.shift(); tr.y.shift(); tr.z.shift(); tr.msd.shift(); tr.v.shift() }
      }
      draw_trajectories()

}

function traj_stride(n){ return Math.max(1, Math.ceil(n / TRAJ_DRAW_MAX)) }  // decimation: at most TRAJ_DRAW_MAX points

/*
Rubber-band zoom on the trajectory graphs. Each canvas has:
  - traj_zoom[key]: null (auto-fit) or {a0,a1,b0,b1} = domain imposed in DATA coordinates
                     (a = abscissa, b = ordinate; for z(t)/MSD the abscissa is the sample index)
  - traj_view[key]: last displayed transform {L,T,W,H (plot rect in px), a0,a1,b0,b1 (domain)}
                     -> allows inverting pixel -> data on release of the rectangle.
Drag = zoom on the rectangle; double-click = return to auto-fit.
*/
var traj_zoom = { xy:null, z:null, msd:null }
var traj_view = { xy:null, z:null, msd:null }
var traj_drag = null                                        // rectangle in progress: {canvasId, key, x0,y0,x1,y1} (only one drag at a time)
var traj_z_means = []                                       // ⟨z⟩ lines of the last drawing: {y (canvas px), value, mass, color} -> hover tooltip
var _traj_zoom_setup = false

function clear_traj_zoom(){ traj_zoom = { xy:null, z:null, msd:null } }

function hide_traj_tooltip(){ var el=document.getElementById('traj_tooltip'); if(el){ el.style.display='none' } }

function show_traj_tooltip(clientX, clientY, groups){

      /*
      Tooltip when hovering a ⟨z⟩ mean line: one entry per hovered (color, mass)
      — several particles of the same color/mass then share a single summary line
      (mean of the ⟨z⟩, with ×N), otherwise 2000 balls of one color would give 2000 lines.
      */

      var el = document.getElementById('traj_tooltip'); if (!el){ return }
      var html = ''
      for (var i=0;i<groups.length;i++){
            var g = groups[i], mean = g.sum/g.count
            html += '<div style="display:flex; align-items:center; gap:4px; white-space:nowrap">'
                  + '<span style="display:inline-block; width:9px; height:9px; border:1px solid #999; background:' + g.color + '"></span>'
                  + 'masse ' + fmt_energy(g.mass) + ' — ⟨z⟩ = ' + fmt_energy(mean)
                  + (g.count > 1 ? ' <span style="color:#bbb">(×' + g.count + ')</span>' : '')
                  + '</div>'
      }
      el.innerHTML = html
      el.style.display = 'block'
      // positions near the cursor, staying within the window (flips to the left/above if it overflows)
      var pad = 12, w = el.offsetWidth, h = el.offsetHeight
      var x = clientX + pad; if (x + w > window.innerWidth - 4){ x = clientX - pad - w }
      var y = clientY + pad; if (y + h > window.innerHeight - 4){ y = clientY - pad - h }
      el.style.left = Math.max(4, x) + 'px'
      el.style.top  = Math.max(4, y) + 'px'
}

function draw_traj_drag_rect(){

      /*
      Selection rectangle, drawn AT THE END of draw_trajectories() and not in the
      mousemove handler: the animation calls draw_trajectories() each frame, which clears the canvas.
      Painted from the handler, the rectangle would disappear on the next frame — hence invisible.
      */

      if (!traj_drag){ return }
      var cv = document.getElementById(traj_drag.canvasId); if (!cv){ return }
      var ctx = cv.getContext('2d')
      var x = Math.min(traj_drag.x0, traj_drag.x1), y = Math.min(traj_drag.y0, traj_drag.y1)
      var w = Math.abs(traj_drag.x1-traj_drag.x0), h = Math.abs(traj_drag.y1-traj_drag.y0)
      ctx.save(); ctx.fillStyle='rgba(0,119,255,0.12)'; ctx.strokeStyle='#0077ff'; ctx.lineWidth=1
      ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h); ctx.restore()

}

function _bind_traj_zoom(canvasId, key){
      var cv = document.getElementById(canvasId); if (!cv){ return }
      cv.style.cursor = 'crosshair'
      function pos(e){ var r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height } }
      cv.addEventListener('mousedown', function(e){
            // stopPropagation: TrackballControls is bound to document and would rotate the camera
            // during the rectangle drawing (the isolation set on #trajectories_box already covers this case,
            // we repeat it here so the canvas stays safe even outside that container).
            e.stopPropagation()
            var v = traj_view[key]; if (!v){ return }
            var p = pos(e)
            if (p.x<v.L || p.x>v.L+v.W || p.y<v.T || p.y>v.T+v.H){ return }   // outside the plot area
            traj_drag = { canvasId:canvasId, key:key, x0:p.x, y0:p.y, x1:p.x, y1:p.y }
            e.preventDefault()
      })
      cv.addEventListener('mousemove', function(e){
            if (!traj_drag || traj_drag.key !== key){ return }
            e.stopPropagation()
            var v = traj_view[key], p = pos(e)
            traj_drag.x1 = Math.max(v.L, Math.min(v.L+v.W, p.x))
            traj_drag.y1 = Math.max(v.T, Math.min(v.T+v.H, p.y))
            draw_trajectories()                              // redraws the graph + the rectangle on top
      })
      function finish(){
            if (!traj_drag || traj_drag.key !== key){ return }
            var v = traj_view[key]
            var x0=Math.min(traj_drag.x0,traj_drag.x1), x1=Math.max(traj_drag.x0,traj_drag.x1)
            var y0=Math.min(traj_drag.y0,traj_drag.y1), y1=Math.max(traj_drag.y0,traj_drag.y1)
            traj_drag = null
            if (v && (x1-x0)>4 && (y1-y0)>4){                 // ignore clicks/micro-rectangles
                  var a0 = v.a0 + (x0-v.L)/v.W*(v.a1-v.a0)
                  var a1 = v.a0 + (x1-v.L)/v.W*(v.a1-v.a0)
                  var b1 = v.b0 + (1-(y0-v.T)/v.H)*(v.b1-v.b0)   // top of the screen -> large value
                  var b0 = v.b0 + (1-(y1-v.T)/v.H)*(v.b1-v.b0)
                  traj_zoom[key] = { a0:a0, a1:a1, b0:b0, b1:b1 }
            }
            draw_trajectories()
      }
      cv.addEventListener('mouseup', finish)
      cv.addEventListener('mouseleave', finish)
      cv.addEventListener('dblclick', function(){ traj_zoom[key]=null; draw_trajectories() })   // reset zoom of this graph
}

function _bind_traj_z_means_hover(){

      /*
      Hover over the ⟨z⟩ lines of the z(t) graph: tooltip with color + mass + current mean.
      Separate from the zoom handler (same canvas): the zoom only acts during a drag (traj_drag),
      the hover only outside a drag. Groups nearby lines by (color, mass) — cf. show_traj_tooltip.
      */

      var cv = document.getElementById('z_canvas'); if (!cv){ return }
      var THRESH = 5                                          // vertical capture distance (canvas px)
      function pos(e){ var r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height } }
      cv.addEventListener('mousemove', function(e){
            if (traj_drag){ hide_traj_tooltip(); return }     // in the middle of a zoom -> no tooltip
            var v = traj_view.z, p = pos(e)
            if (!v || p.x<v.L || p.x>v.L+v.W){ hide_traj_tooltip(); cv.style.cursor='crosshair'; return }
            var groups = {}, order = []                       // groups the means in range by (color+mass)
            for (var i=0;i<traj_z_means.length;i++){
                  var m = traj_z_means[i]
                  if (Math.abs(m.y - p.y) > THRESH){ continue }
                  var key = m.color + '|' + m.mass
                  if (!groups[key]){ groups[key] = { color:m.color, mass:m.mass, sum:0, count:0 }; order.push(key) }
                  groups[key].sum += m.value; groups[key].count++
            }
            if (!order.length){ hide_traj_tooltip(); cv.style.cursor='crosshair'; return }
            order.sort()                                       // stable order from one hover to the next
            show_traj_tooltip(e.clientX, e.clientY, order.slice(0,6).map(function(k){ return groups[k] }))
            cv.style.cursor='pointer'
      })
      cv.addEventListener('mouseleave', hide_traj_tooltip)
}

function setup_traj_zoom(){                                 // idempotent: attaches the handlers only once
      if (_traj_zoom_setup){ return }
      _traj_zoom_setup = true
      _bind_traj_zoom('traj_canvas','xy'); _bind_traj_zoom('z_canvas','z'); _bind_traj_zoom('msd_canvas','msd'); _bind_traj_zoom('v_canvas','v')
      _bind_traj_z_means_hover()
}

function draw_trajectories(){

      setup_traj_zoom()
      refresh_traj_color_filters()                              // checkboxes: colors to track
      update_traj_time()
      var t = tracked_objects()

      //---- window 1: trajectories (x-y projection, isotropic scale if no zoom) ----
      var cv = document.getElementById('traj_canvas')
      if (cv){
            var ctx = cv.getContext('2d'), W = cv.width, H = cv.height
            ctx.clearRect(0,0,W,H)
            var xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity, npts=0
            for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.x.length)continue
                  var n=tr.x.length, st=traj_stride(n)
                  for (var k=0;k<n;k+=st){ npts++
                        if(tr.x[k]<xmin)xmin=tr.x[k]; if(tr.x[k]>xmax)xmax=tr.x[k]
                        if(tr.y[k]<ymin)ymin=tr.y[k]; if(tr.y[k]>ymax)ymax=tr.y[k] }
                  var lx=tr.x[n-1], ly=tr.y[n-1]                 // always include the last point
                  if(lx<xmin)xmin=lx; if(lx>xmax)xmax=lx; if(ly<ymin)ymin=ly; if(ly>ymax)ymax=ly }
            if (npts>0){
                  var dom
                  if (traj_zoom.xy){ dom = traj_zoom.xy }
                  else { var cxx=(xmin+xmax)/2, cyy=(ymin+ymax)/2, half=Math.max((xmax-xmin)||1,(ymax-ymin)||1)*0.55
                        dom = { a0:cxx-half, a1:cxx+half, b0:cyy-half, b1:cyy+half } }   // square domain -> isotropic
                  var pad=10, side=Math.min(W,H)-2*pad, L=(W-side)/2, T=(H-side)/2, PW=side, PH=side
                  traj_view.xy = { L:L, T:T, W:PW, H:PH, a0:dom.a0, a1:dom.a1, b0:dom.b0, b1:dom.b1 }
                  var PX=function(x){ return L + (x-dom.a0)/((dom.a1-dom.a0)||1)*PW }
                  var PY=function(y){ return T + (1-(y-dom.b0)/((dom.b1-dom.b0)||1))*PH }
                  ctx.strokeStyle='#ddd'; ctx.lineWidth=1; ctx.strokeRect(L,T,PW,PH)   // frame of the plot area
                  ctx.save(); ctx.beginPath(); ctx.rect(L,T,PW,PH); ctx.clip()          // only shows the interior (useful when zoomed)
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||tr.x.length<2)continue
                        var n=tr.x.length, st=traj_stride(n), col=traj_color(t[i])
                        ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=PX(tr.x[k]),Y=PY(tr.y[k]); if(first){ctx.moveTo(X,Y);first=false}else ctx.lineTo(X,Y) }
                        ctx.lineTo(PX(tr.x[n-1]),PY(tr.y[n-1]))   // last point
                        ctx.stroke()
                        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(tr.x[n-1]),PY(tr.y[n-1]),3,0,2*Math.PI); ctx.fill()
                  }
                  ctx.restore()
            } else { traj_view.xy = null }
      }

      //---- window z(t): altitude z vs time (sample index) ----
      var cvz = document.getElementById('z_canvas')
      if (cvz){
            var cz = cvz.getContext('2d'), Wz=cvz.width, Hz=cvz.height
            cz.clearRect(0,0,Wz,Hz)
            traj_z_means = []                                // hoverable ⟨z⟩ lines (repopulated on each drawing)
            var nz=0, zmax=0                                 // y axis anchored at 0 (zmin = 0)
            for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.z||!tr.z.length)continue
                  if(tr.z.length>nz)nz=tr.z.length
                  var n=tr.z.length, st=traj_stride(n)
                  for(var k=0;k<n;k+=st){ if(tr.z[k]>zmax)zmax=tr.z[k] }
                  if(tr.z[n-1]>zmax)zmax=tr.z[n-1] }
            if (nz>1 && zmax>0){
                  var dz = traj_zoom.z || { a0:0, a1:nz-1, b0:0, b1:zmax }
                  var zL=46, zT=6, zB=6, zR=4, L=zL, T=zT, PW=Wz-zL-zR, PH=Hz-zT-zB
                  traj_view.z = { L:L, T:T, W:PW, H:PH, a0:dz.a0, a1:dz.a1, b0:dz.b0, b1:dz.b1 }
                  var ZX=function(k){ return L + (k-dz.a0)/((dz.a1-dz.a0)||1)*PW }
                  var ZY=function(v){ return T + (1-(v-dz.b0)/((dz.b1-dz.b0)||1))*PH }
                  cz.font='10px sans-serif'; cz.fillStyle='#666'; cz.textAlign='right'; cz.textBaseline='middle'
                  for (var g=0;g<=4;g++){ var v=dz.b0+(dz.b1-dz.b0)*g/4, y=ZY(v); cz.strokeStyle='#eee'; cz.lineWidth=1
                        cz.beginPath(); cz.moveTo(L,y); cz.lineTo(L+PW,y); cz.stroke(); cz.fillText(fmt_energy(v),L-4,y) }
                  cz.save(); cz.beginPath(); cz.rect(L,T,PW,PH); cz.clip()
                  var means_only = (typeof z_means_only !== 'undefined' && z_means_only)
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.z||tr.z.length<2)continue
                        var n=tr.z.length, st=traj_stride(n), col=traj_color(t[i])
                        //--- z(t): curve (hidden in "means only" mode)
                        if (!means_only){
                              cz.strokeStyle=col; cz.lineWidth=1.5; cz.beginPath()
                              var first=true
                              for (var k=0;k<n;k+=st){ var X=ZX(k),Y=ZY(tr.z[k]); if(first){cz.moveTo(X,Y);first=false}else cz.lineTo(X,Y) }
                              cz.lineTo(ZX(n-1),ZY(tr.z[n-1]))         // last point
                              cz.stroke()
                        }
                        //--- ⟨z⟩ mean since the reset: dashed with the curve, solid if displayed alone
                        if (tr.zcount > 0){
                              var zmean=tr.zsum/tr.zcount, yzmean=ZY(zmean)
                              traj_z_means.push({ y:yzmean, value:zmean, mass:t[i].mass, color:col })   // for the hover tooltip
                              cz.strokeStyle=col; cz.lineWidth=1.5
                              if (!means_only){ cz.lineWidth=1; cz.setLineDash([4,3]) }
                              cz.beginPath(); cz.moveTo(L,yzmean); cz.lineTo(L+PW,yzmean); cz.stroke()
                              cz.setLineDash([])
                        }
                  }
                  cz.restore()
            } else { traj_view.z = null }
      }

      //---- window 2: MSD |r-r0|² vs time (sample index) ----
      var cv2 = document.getElementById('msd_canvas')
      if (cv2){
            var c2 = cv2.getContext('2d'), W2=cv2.width, H2=cv2.height
            c2.clearRect(0,0,W2,H2)
            var nmax=0, vmaxm=0
            for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.msd.length)continue
                  if(tr.msd.length>nmax)nmax=tr.msd.length
                  var n=tr.msd.length, st=traj_stride(n)
                  for(var k=0;k<n;k+=st){ if(tr.msd[k]>vmaxm)vmaxm=tr.msd[k] }
                  if(tr.msd[n-1]>vmaxm)vmaxm=tr.msd[n-1] }
            if (nmax>1 && vmaxm>0){
                  var dm = traj_zoom.msd || { a0:0, a1:nmax-1, b0:0, b1:vmaxm }
                  var ML=46, MT=6, MB=6, MR=4, L=ML, T=MT, PW=W2-ML-MR, PH=H2-MT-MB
                  traj_view.msd = { L:L, T:T, W:PW, H:PH, a0:dm.a0, a1:dm.a1, b0:dm.b0, b1:dm.b1 }
                  var MX=function(k){ return L + (k-dm.a0)/((dm.a1-dm.a0)||1)*PW }
                  var MY=function(v){ return T + (1-(v-dm.b0)/((dm.b1-dm.b0)||1))*PH }
                  c2.font='10px sans-serif'; c2.fillStyle='#666'; c2.textAlign='right'; c2.textBaseline='middle'
                  for (var g=0;g<=4;g++){ var v=dm.b0+(dm.b1-dm.b0)*g/4, y=MY(v); c2.strokeStyle='#eee'; c2.lineWidth=1
                        c2.beginPath(); c2.moveTo(L,y); c2.lineTo(L+PW,y); c2.stroke(); c2.fillText(fmt_energy(v),L-4,y) }
                  c2.save(); c2.beginPath(); c2.rect(L,T,PW,PH); c2.clip()
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||tr.msd.length<2)continue
                        var n=tr.msd.length, st=traj_stride(n)
                        c2.strokeStyle=traj_color(t[i]); c2.lineWidth=1.5; c2.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=MX(k),Y=MY(tr.msd[k]); if(first){c2.moveTo(X,Y);first=false}else c2.lineTo(X,Y) }
                        c2.lineTo(MX(n-1),MY(tr.msd[n-1]))        // last point
                        c2.stroke()
                  }
                  c2.restore()
            } else { traj_view.msd = null }
      }

      //---- window |v|(t): velocity magnitude vs time (sample index) ----
      var cvv = document.getElementById('v_canvas')
      if (cvv){
            var c3 = cvv.getContext('2d'), W3=cvv.width, H3=cvv.height
            c3.clearRect(0,0,W3,H3)
            var nmaxv=0, vmaxv=0
            for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.v||!tr.v.length)continue
                  if(tr.v.length>nmaxv)nmaxv=tr.v.length
                  var n=tr.v.length, st=traj_stride(n)
                  for(var k=0;k<n;k+=st){ if(tr.v[k]>vmaxv)vmaxv=tr.v[k] }
                  if(tr.v[n-1]>vmaxv)vmaxv=tr.v[n-1] }
            if (nmaxv>1 && vmaxv>0){
                  var dvv = traj_zoom.v || { a0:0, a1:nmaxv-1, b0:0, b1:vmaxv }
                  var VL=46, VT=6, VB=6, VR=4, L=VL, T=VT, PW=W3-VL-VR, PH=H3-VT-VB
                  traj_view.v = { L:L, T:T, W:PW, H:PH, a0:dvv.a0, a1:dvv.a1, b0:dvv.b0, b1:dvv.b1 }
                  var VX=function(k){ return L + (k-dvv.a0)/((dvv.a1-dvv.a0)||1)*PW }
                  var VY=function(v){ return T + (1-(v-dvv.b0)/((dvv.b1-dvv.b0)||1))*PH }
                  c3.font='10px sans-serif'; c3.fillStyle='#666'; c3.textAlign='right'; c3.textBaseline='middle'
                  for (var g=0;g<=4;g++){ var v=dvv.b0+(dvv.b1-dvv.b0)*g/4, y=VY(v); c3.strokeStyle='#eee'; c3.lineWidth=1
                        c3.beginPath(); c3.moveTo(L,y); c3.lineTo(L+PW,y); c3.stroke(); c3.fillText(fmt_energy(v),L-4,y) }
                  c3.save(); c3.beginPath(); c3.rect(L,T,PW,PH); c3.clip()
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||!tr.v||tr.v.length<2)continue
                        var n=tr.v.length, st=traj_stride(n)
                        c3.strokeStyle=traj_color(t[i]); c3.lineWidth=1.5; c3.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=VX(k),Y=VY(tr.v[k]); if(first){c3.moveTo(X,Y);first=false}else c3.lineTo(X,Y) }
                        c3.lineTo(VX(n-1),VY(tr.v[n-1]))        // last point
                        c3.stroke()
                  }
                  c3.restore()
            } else { traj_view.v = null }
      }

      draw_traj_drag_rect()                                     // zoom rectangle in progress, on top of the freshly redrawn plot

}

//===================================================================== Velocity Verlet

/*
Symplectic Velocity Verlet integrator for the smooth (conservative) forces:
gravity, harmonic springs, attraction. Scheme (per object, mass m):

      x_{n+1} = x_n + v_n·dt + ½·a_n·dt²
      v_{n+1} = v_n + ½·(a_n + a_{n+1})·dt

with a = F/m computed from the positions (velocity-independent forces).
Collisions/bounces (wall, ground, center-center impact) are impulses applied
after the Verlet step: they do not derive from a smooth potential.
*/

function accel_attraction(i,j){

      /*
      SOFTENED Newtonian gravity (Plummer softening):
            F = G·m_i·m_j · r_vec / (r² + ε²)^{3/2}     (ε = attract_softening)
      For ε = 0 we recover the pure 1/r². The softening removes the singularity at r→0
      (bounded accelerations): the Verlet step stays accurate even in a close encounter,
      so energy is conserved. r_vec (unnormalized) already carries the direction.
      */

      if (!one_over_r2){ return }
      var [obji, objj] = objj_obji(i,j)
      var rvec = new THREE.Vector3().subVectors(obji.position, objj.position)   // j -> i (length = r)
      var soft2 = rvec.lengthSq() + attract_softening*attract_softening         // r² + ε²
      var g = attract_strength_one_over_r2 / (soft2 * Math.sqrt(soft2))         // G / (r²+ε²)^{3/2}
      objj.acc.addScaledVector(rvec,  g*obji.mass)             // a_j toward i
      obji.acc.addScaledVector(rvec, -g*objj.mass)             // a_i toward j

}

function accel_spring(k){

      /*
      Harmonic restoring force (spring) of a pair, added to the acceleration.
      F = -harmonic_const·(length - rest_length) along the spring.
      */

      var p0 = list_paired_harmonic[k][0]
      var p1 = list_paired_harmonic[k][1]
      var kc = (list_paired_harmonic[k].k_spring !== undefined) ? list_paired_harmonic[k].k_spring : harmonic_const  // stiffness specific to the pair (global fallback)
      var vec = new THREE.Vector3().subVectors(p1.position, p0.position)
      var diff_length = vec.length() - lenght_spring
      vec.normalize().multiplyScalar(diff_length)
      p0.acc.addScaledVector(vec,  kc/p0.mass)
      p1.acc.addScaledVector(vec, -kc/p1.mass)

}

// ===================================================================== Barnes-Hut
// Newtonian 1/r² attraction approximated in O(n log n): a distant cluster is treated
// as ONE single mass at its center of mass (opening criterion s/d < θ). Behind
// the "Fast attraction" checkbox. It's an APPROXIMATION (θ tunes accuracy/speed): the
// forces are no longer exactly antisymmetric -> slight drift of the energy graph.

var BH_MIN_N     = 64    // below this, the exact double loop is faster AND exact -> fallback
var BH_MAX_DEPTH = 24    // safeguard against infinite subdivision (nearly overlapping balls)

function bh_new_node(cx, cy, cz, half){
      return { cx:cx, cy:cy, cz:cz, half:half,        // center + half-side of the cube
               mass:0, comx:0, comy:0, comz:0,         // total mass + center of mass (aggregated)
               body:-1, bucket:null, children:null }   // leaf (1 body) / saturated leaf / internal node
}

function bh_child_index(node, x, y, z){                // which octant does (x,y,z) fall into?
      var idx = 0
      if (x >= node.cx){ idx |= 1 }
      if (y >= node.cy){ idx |= 2 }
      if (z >= node.cz){ idx |= 4 }
      return idx
}

function bh_ensure_children(node){                     // splits the cube into 8 sub-cubes
      if (node.children){ return }
      var q = node.half/2
      node.children = new Array(8)
      for (var i=0; i<8; i++){
            var ccx = node.cx + ((i&1) ? q : -q)
            var ccy = node.cy + ((i&2) ? q : -q)
            var ccz = node.cz + ((i&4) ? q : -q)
            node.children[i] = bh_new_node(ccx, ccy, ccz, q)
      }
}

function bh_insert(node, idx, x, y, z, depth){
      if (node.children){                              // internal node -> descend
            bh_insert(node.children[bh_child_index(node, x,y,z)], idx, x,y,z, depth+1)
            return
      }
      if (node.bucket){ node.bucket.push(idx); return } // saturated leaf (max depth) -> push
      if (node.body === -1){ node.body = idx; return }  // empty leaf -> place the body there
      // leaf already occupied: subdivide (or bucketize if too deep = ~identical positions)
      if (depth >= BH_MAX_DEPTH){ node.bucket = [node.body, idx]; node.body = -1; return }
      var old = node.body, oo = list_moving_objects[old]
      node.body = -1
      bh_ensure_children(node)
      bh_insert(node.children[bh_child_index(node, oo.position.x,oo.position.y,oo.position.z)], old, oo.position.x,oo.position.y,oo.position.z, depth+1)
      bh_insert(node.children[bh_child_index(node, x,y,z)], idx, x,y,z, depth+1)
}

function bh_compute_mass(node){                        // post-order: mass + center of mass
      if (node.children){
            var m=0, sx=0, sy=0, sz=0
            for (var i=0; i<8; i++){
                  var c = node.children[i]
                  bh_compute_mass(c)
                  if (c.mass > 0){ m += c.mass; sx += c.comx*c.mass; sy += c.comy*c.mass; sz += c.comz*c.mass }
            }
            node.mass = m
            if (m > 0){ node.comx=sx/m; node.comy=sy/m; node.comz=sz/m }
            return
      }
      if (node.bucket){
            var m=0, sx=0, sy=0, sz=0
            for (var b=0; b<node.bucket.length; b++){
                  var o = list_moving_objects[node.bucket[b]]
                  m += o.mass; sx += o.position.x*o.mass; sy += o.position.y*o.mass; sz += o.position.z*o.mass
            }
            node.mass = m
            if (m > 0){ node.comx=sx/m; node.comy=sy/m; node.comz=sz/m }
            return
      }
      if (node.body !== -1){                           // leaf with 1 body
            var o = list_moving_objects[node.body]
            node.mass = o.mass
            node.comx = o.position.x; node.comy = o.position.y; node.comz = o.position.z
      }
      // empty leaf: mass stays 0
}

function bh_add_direct(o, src, eps2, G){               // exact (softened) force of a source body on o
      var dx = src.position.x - o.position.x
      var dy = src.position.y - o.position.y
      var dz = src.position.z - o.position.z
      var soft2 = dx*dx + dy*dy + dz*dz + eps2          // r² + ε²
      var f = G * src.mass / (soft2 * Math.sqrt(soft2)) // G·m / (r²+ε²)^{3/2}
      o.acc.x += f*dx; o.acc.y += f*dy; o.acc.z += f*dz
}

function bh_accel_on(node, o, ti, theta2, eps2, G){
      if (node.mass <= 0){ return }                    // empty subtree
      if (node.children === null && node.bucket === null){  // leaf with 1 body
            if (node.body !== -1 && node.body !== ti){ bh_add_direct(o, list_moving_objects[node.body], eps2, G) }  // never on itself
            return
      }
      if (node.bucket){                                // saturated leaf: bodies one by one
            for (var b=0; b<node.bucket.length; b++){
                  if (node.bucket[b] !== ti){ bh_add_direct(o, list_moving_objects[node.bucket[b]], eps2, G) }
            }
            return
      }
      var dx = node.comx - o.position.x                // internal node: opening test s/d < θ
      var dy = node.comy - o.position.y
      var dz = node.comz - o.position.z
      var d2 = dx*dx + dy*dy + dz*dz
      var s  = 2*node.half                             // side of the cube
      if (s*s < theta2 * d2){                          // far enough -> approximate by the center of mass
            var soft2 = d2 + eps2
            var f = G * node.mass / (soft2 * Math.sqrt(soft2))
            o.acc.x += f*dx; o.acc.y += f*dy; o.acc.z += f*dz
            return
      }
      for (var i=0; i<8; i++){ bh_accel_on(node.children[i], o, ti, theta2, eps2, G) }  // too close -> descend
}

function bh_eligible_indices(){
      // Same exclusions as the exact double loop, restricted to the proper "all pairs"
      // group: NON-wall and NON-forbidden objects (spring/elastic/pawn). Walls only attract
      // other walls in the exact version (negligible case, blocked): we exclude them from gravity.
      var elig = []
      for (var i=0; i<list_moving_objects.length; i++){
            if (list_moving_objects[i].type === 'wall_box'){ continue }
            if (!permitted_interaction(i)){ continue }
            elig.push(i)
      }
      return elig
}

function barnes_hut_attraction(eligible){
      var n = eligible.length
      if (n === 0){ return }
      // 1) bounding cube of all eligible bodies
      var minx=Infinity,miny=Infinity,minz=Infinity,maxx=-Infinity,maxy=-Infinity,maxz=-Infinity
      for (var k=0;k<n;k++){
            var p = list_moving_objects[eligible[k]].position
            if (p.x<minx)minx=p.x; if (p.x>maxx)maxx=p.x
            if (p.y<miny)miny=p.y; if (p.y>maxy)maxy=p.y
            if (p.z<minz)minz=p.z; if (p.z>maxz)maxz=p.z
      }
      var cx=(minx+maxx)/2, cy=(miny+maxy)/2, cz=(minz+maxz)/2
      var half = Math.max(maxx-minx, maxy-miny, maxz-minz)/2
      if (!(half > 0)){ half = 1 }                     // all at the same point / n=1
      half *= 1.0001                                   // margin to include the bounds
      var root = bh_new_node(cx,cy,cz,half)
      // 2) insertion + mass/center-of-mass aggregation
      for (var k=0;k<n;k++){
            var p = list_moving_objects[eligible[k]].position
            bh_insert(root, eligible[k], p.x,p.y,p.z, 0)
      }
      bh_compute_mass(root)
      // 3) force on each body via tree traversal
      var theta2 = barnes_hut_theta*barnes_hut_theta
      var eps2   = attract_softening*attract_softening
      var G      = attract_strength_one_over_r2
      for (var k=0;k<n;k++){
            var ti = eligible[k]
            bh_accel_on(root, list_moving_objects[ti], ti, theta2, eps2, G)
      }
}

function accel_attraction_bruteforce(){                // exact O(n²) double loop (reference)
      for (var i=0; i< list_moving_objects.length; i++){
            for (var j=i+1; j< list_moving_objects.length; j++){
                  if ( allow_interaction_ij(i,j) ){
                        var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                        if ( !(cnd1 & cnd2 & cnd3) ){ accel_attraction(i,j) } // not a wall-object pair
                  }
            }
      }
}

function compute_accelerations(){

      /*
      Acceleration a(x) of each moving object from the smooth forces:
      gravity (constant in z) + attraction (center-center) + springs.
      */

      for (var i in list_moving_objects){                      // reset + gravity
            var o = list_moving_objects[i]
            if (!o.acc){ o.acc = new THREE.Vector3() }
            if (o.blocked || !gravity_ok){ o.acc.set(0, 0, 0) }  // static/anchor or gravity turned off
            else { o.acc.set(0, 0, -9.81*0.1) }
      }
      if (one_over_r2){                                        // otherwise no need to iterate over the pairs
            if (use_barnes_hut){
                  var eligible = bh_eligible_indices()
                  if (eligible.length >= BH_MIN_N){ barnes_hut_attraction(eligible) }  // O(n log n) approximate
                  else { accel_attraction_bruteforce() }         // too few bodies -> exact (and faster)
            } else {
                  accel_attraction_bruteforce()                  // O(n²) exact (reference)
            }
      }
      if (springs_ok){ for (var k in list_paired_harmonic){ accel_spring(k) } }   // springs

}

function verlet_positions(delta){

      /*
      x_{n+1} = x_n + v_n·dt + ½·a_n·dt²  then first velocity half-kick (½·a_n·dt).
      obj.acc holds a_n (computed on the previous frame).
      */

      var hdt2 = 0.5*delta*delta
      var hdt  = 0.5*delta
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (!o.acc){ o.acc = new THREE.Vector3() }
            if (o.blocked){ continue }                         // static/anchor object: does not move
            if (!o._ppos){ o._ppos = new THREE.Vector3() }
            o._ppos.copy(o.position)                           // position BEFORE the step (continuous wall detection)
            o.position.x += o.speed.x*delta + o.acc.x*hdt2
            o.position.y += o.speed.y*delta + o.acc.y*hdt2
            o.position.z += o.speed.z*delta + o.acc.z*hdt2
            o.speed.x += o.acc.x*hdt
            o.speed.y += o.acc.y*hdt
            o.speed.z += o.acc.z*hdt
      }

}

function verlet_velocities(delta){

      /*
      Second velocity half-kick with a_{n+1}: v_{n+1} = v_half + ½·a_{n+1}·dt.
      */

      var hdt = 0.5*delta
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.blocked){ continue }                         // static/anchor object: frozen velocity
            o.speed.x += o.acc.x*hdt
            o.speed.y += o.acc.y*hdt
            o.speed.z += o.acc.z*hdt
      }

}

function ground_bounce(){

      /*
      Ground constraint: elastic bounce when the center drops below height/2.
      */

      if (!gravity_ok){ return }                               // no gravity -> no "down" -> no ground (everything is free 3D)
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.blocked){ continue }                         // static object: no ground bounce
            var hz = (o.radius !== undefined) ? o.radius : o.height/2   // sphere: rests exactly on the ground (bottom = center - radius); others: height/2
            if (o.position.z < hz){
                  o.position.z = hz                            // ALWAYS brings the ball back up to ground level (de-penetration)
                  if (o.speed.z < 0){ o.speed.z = -o.speed.z } // reflects ONLY if it's descending, otherwise we'd trap it under the ground
            }
      }

}

function lid_bounce(){

      /*
      Lid (ceiling) constraint: the balls within the x-y footprint of a box fitted
      with a lid cannot pass above the top. Elastic reflection (only if
      the ball is rising), symmetric to the ground bounce.
      */

      if (typeof list_lids === 'undefined'){ return }
      for (var l=0; l<list_lids.length; l++){
            var lid = list_lids[l], b = lid.bounds, zc = lid.z
            for (var i in list_moving_objects){
                  var o = list_moving_objects[i]
                  if (o.blocked || o.type !== 'sphere'){ continue }
                  if (o.position.x < b.xmin || o.position.x > b.xmax || o.position.y < b.ymin || o.position.y > b.ymax){ continue }
                  var rad = (o.radius !== undefined) ? o.radius : 0
                  if (o.position.z + rad > zc){
                        o.position.z = zc - rad
                        if (o.speed.z > 0){ o.speed.z = -o.speed.z }   // reflects only if it's rising
                  }
            }
      }
}

function interactions_and_movement(delta){

      /*
      One Velocity Verlet step + impulsive interactions.
      */

      verlet_positions(delta)            // x_{n+1} (+ ½ velocity kick, with a_n)
      compute_accelerations()            // a_{n+1} at the new positions
      verlet_velocities(delta)           // remaining ½ velocity kick (with a_{n+1})
      interactions_between_objects()     // collisions + wall bounces (impulses) + colors
      bounce_balls_on_cubes()            // bounce of balls on solid cubes/blocks (6 faces)
      ground_bounce()                    // bounce on the ground
      lid_bounce()                       // bounce on the lids (box ceilings)
      calculate_total_energy()

}

var MAX_PHYS_DELTA = 0.5    // max time step: avoids a giant step after a pause (tab in background)

function animate_physics(){

      /*
      Animation of the scene or empty loop ..
      */

      if (scene_animation_ok){
            var time = performance.now();
            var delta = ( time - prevTime ) / 100;
            if (delta > MAX_PHYS_DELTA){ delta = MAX_PHYS_DELTA }  // requestAnimationFrame is frozen in the background
            interactions_and_movement(delta)                       //  -> on return, we bound the step instead of blowing up
            sim_time += delta                                      // simulation time (u.a.): it's the physics step that we accumulate,
            prevTime = time;                                       // so it freezes on pause — consistent with z(t) and the MSD
        }
        else{ prevTime = performance.now() }
}

// When the tab becomes visible again, restart from a delta ~0 (no jump on return from background)
if (typeof document !== 'undefined'){
      document.addEventListener('visibilitychange', function(){
            if (!document.hidden){ prevTime = performance.now() }
      })
}
