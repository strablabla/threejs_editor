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
      Suivi des objets en interaction (sans changer leur couleur : on préserve les
      couleurs personnalisées pendant l'animation).
      */

      if (list_interact.indexOf(obj) == -1){
            list_interact.push(obj)
      }

}

function change_speed_after_center_center_collision(i,j){

      /*
      Collision élastique 3D par impulsion le long de la ligne des centres.
      On n'inverse que la composante NORMALE de la vitesse relative ; les composantes
      tangentielles restent inchangées. C'est indispensable pour la thermalisation :
      un simple échange des vecteurs vitesse complets (masses égales) ne ferait que
      permuter les vitesses -> distribution des |v| figée (pas d'équilibre statistique).

      Impulsion (restitution e = 1) :  J = -2·v_n / (w_i + w_j)   (w = 1/m, 0 si bloqué)
            v_i += J·w_i·n     v_j -= J·w_j·n     avec n = normale unitaire j->i
      De plus : DÉ-PÉNÉTRATION — les billes sont écartées jusqu'à la distance de contact
      (somme des rayons), pour que le rebond ait toujours lieu à la même profondeur du
      puits attractif (sinon l'interpénétration variable pompe de l'énergie).
      */

      var oi = list_moving_objects[i], oj = list_moving_objects[j]
      var n = new THREE.Vector3().subVectors(oi.position, oj.position)
      var d = n.length()
      if (d === 0){ return }                                   // centres confondus : pas de normale définie
      n.divideScalar(d)                                        // normale unitaire j->i
      var wi = oi.blocked ? 0 : 1/oi.mass                      // inverse-masse (0 = figé/ancre)
      var wj = oj.blocked ? 0 : 1/oj.mass
      var wsum = wi + wj
      if (wsum === 0){ return }                                // deux objets figés

      // --- dé-pénétration : ramène à la distance de contact (r_i + r_j) ---
      var contact = collision_radius(oi) + collision_radius(oj)
      if (d < contact){
            var push = contact - d
            oi.position.addScaledVector(n,  push * wi/wsum)     // chacun écarté selon son inverse-masse
            oj.position.addScaledVector(n, -push * wj/wsum)
      }

      // --- impulsion élastique (composante normale) ---
      var vn = new THREE.Vector3().subVectors(oi.speed, oj.speed).dot(n)  // vitesse relative normale
      if (vn >= 0){ return }                                   // objets déjà en éloignement : pas de choc
      var imp = -2 * vn / wsum                                 // impulsion scalaire (élastique)
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
      Rebond bille-mur ROBUSTE (mur dur, anti-tunneling) :
        - détection CONTINUE : si le centre a franchi le plan du mur entre l'ancienne
          (_ppos) et la nouvelle position, dans l'emprise latérale, c'est une traversée ;
        - correction de POSITION : la bille est ramenée du bon côté, à distance = rayon ;
        - réflexion élastique de la composante NORMALE de la vitesse.
      => une bille ne peut jamais terminer une frame de l'autre côté d'une paroi.
      */

      var [obji, objj] = objj_obji(i,j)
      var [obj, wall] = find_obj_wall(objj,obji)               // identifie bille / mur

      var n = new THREE.Vector3().copy(wall.orientation)       // normale du mur
      var nlen = n.length()
      if (nlen === 0){ return }
      n.divideScalar(nlen)                                     // normalisée

      //--- emprise latérale (dans le plan du mur) : la bille est-elle en face du mur ?
      var vec_lat = new THREE.Vector3().crossVectors(new THREE.Vector3(0,0,1), n).normalize()
      var lat = Math.abs(obj.position.dot(vec_lat) - wall.position.dot(vec_lat))
      var rad = (obj.radius !== undefined) ? obj.radius : dist_inter_wall_obj
      if (lat > wall.width/2 + rad){ return }                  // hors du mur -> pas de collision

      //--- distances signées au plan (avant / après le pas)
      var contact = rad + (wall.thickness ? wall.thickness/2 : 0)  // surface bille au ras de la paroi
      var wp = wall.position.dot(n)
      var sd_now  = obj.position.dot(n) - wp
      var sd_prev = obj._ppos ? (obj._ppos.dot(n) - wp) : sd_now
      var crossed = (sd_prev > 0) !== (sd_now > 0)             // changement de côté = traversée
      if (!crossed && Math.abs(sd_now) >= contact){ return }   // ni traversée ni contact

      //--- côté à préserver = celui d'AVANT le pas (l'intérieur de la boîte)
      var side = (sd_prev !== 0) ? Math.sign(sd_prev) : (Math.sign(sd_now) || 1)
      obj.position.addScaledVector(n, side*contact - sd_now)   // repositionne à 'contact' du plan, bon côté
      var vn = obj.speed.dot(n)
      obj.speed.addScaledVector(n, side*Math.abs(vn) - vn)     // renvoie la vitesse normale vers l'intérieur (élastique)
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

// ---- Rebond des billes sur les boîtes pleines (cubes/pavés) : collision sphère-boîte ----

var SOLID_BOX_TYPES = ['simple_cube', 'pavement', 'cube_mult_tex']   // boîtes pleines -> rebond sur les 6 faces
function is_solid_box(o){ return o && SOLID_BOX_TYPES.indexOf(o.type) >= 0 }

function interaction_obj_cube(ball, cube){

      /*
      Rebond d'une bille sur une boîte pleine (cube/pavé). On travaille dans le repère
      LOCAL du cube (gère sa rotation) : on trouve le point de la boîte le plus proche du
      centre de la bille ; s'il est à moins d'un rayon, on dé-pénètre la bille le long de
      la normale de la face et on réfléchit la composante normale de sa vitesse (paroi
      immobile, rebond élastique — comme le sol/les murs).
      */

      if (!ball || ball.type !== 'sphere' || ball.blocked){ return }
      var R = (ball.radius !== undefined) ? ball.radius : collision_radius(ball)
      var hx = cube.thickness/2, hy = cube.width/2, hz = cube.height/2   // CubeGeometry(thickness, width, height)

      cube.updateMatrixWorld()                                    // matrice à jour (le cube est déplaçable à la souris)
      var local = cube.worldToLocal(ball.position.clone())        // centre de la bille en repère cube
      var cx = Math.max(-hx, Math.min(hx, local.x))               // point le plus proche sur la boîte (clamp)
      var cy = Math.max(-hy, Math.min(hy, local.y))
      var cz = Math.max(-hz, Math.min(hz, local.z))
      var dx = local.x - cx, dy = local.y - cy, dz = local.z - cz
      var d2 = dx*dx + dy*dy + dz*dz
      if (d2 >= R*R){ return }                                    // pas de contact

      var nlx, nly, nlz, push
      if (d2 > 1e-9){                                             // centre HORS de la boîte : normale = vers la bille
            var d = Math.sqrt(d2)
            nlx = dx/d; nly = dy/d; nlz = dz/d
            push = R - d
      } else {                                                   // centre DANS la boîte : ressortir par la face la plus proche
            var px = hx - Math.abs(local.x), py = hy - Math.abs(local.y), pz = hz - Math.abs(local.z)
            if (px <= py && px <= pz){ nlx = (local.x < 0 ? -1 : 1); nly = 0; nlz = 0; push = px + R }
            else if (py <= pz){        nlx = 0; nly = (local.y < 0 ? -1 : 1); nlz = 0; push = py + R }
            else {                     nlx = 0; nly = 0; nlz = (local.z < 0 ? -1 : 1); push = pz + R }
      }
      var n = new THREE.Vector3(nlx, nly, nlz).applyQuaternion(cube.quaternion).normalize()  // normale LOCAL -> MONDE
      ball.position.addScaledVector(n, push)                     // dé-pénétration : bille ramenée à la surface
      var vn = ball.speed.dot(n)
      if (vn < 0){ ball.speed.addScaledVector(n, -2*vn) }        // réflexion élastique si la bille rentre (v' = v - 2(v·n)n)
      check_change_color(ball, 0xff0000)

}

function bounce_balls_on_cubes(){

      /*
      Fait rebondir toutes les billes sur toutes les boîtes pleines (cubes/pavés).
      Les cubes ne sont PAS dans list_moving_objects (ils restent statiques et déplaçables
      à la souris) : on les parcourt depuis `objects`. O(billes × cubes) — cubes peu nombreux.
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
      Rayon de collision d'un objet : son rayon réel s'il en a un (sphères),
      sinon repli sur dist_min_center_center/2 (compat. anciens objets sans .radius).
      */

      return (o.radius !== undefined) ? o.radius : dist_min_center_center/2

}

function collision(i,j,dist){

      /*
      Collision interaction : contact quand la distance centre-centre passe sous la
      SOMME DES RAYONS réels des deux billes (sphères dures), et non plus sous une
      constante fixe.
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
      // attraction : déplacée dans compute_accelerations (force lisse intégrée en Verlet)

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
      new_elastic.position.copy(obj[0].position); // stick spring to object (position locale = monde, objets non imbriqués)
      var new_elastic_scale = getDistance(obj[0], obj[1])/420
      new_elastic.scale.set(1,1,new_elastic_scale)
      new_elastic.lookAt(obj[1].position)

}

function update_all_elastics(){

      /*
      Recale tous les ressorts/élastiques sur la position courante des boules.
      Appelé à chaque frame (y compris pendant un drag, animation à l'arrêt)
      pour que la chaîne suive visuellement les boules déplacées.
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
      Interactions impulsives (non issues d'un potentiel lisse) :
          * rebond objet-mur
          * collision élastique centre-centre
      (les ressorts et l'attraction sont traités en accélérations -> compute_accelerations)
      */

      list_interact = []
      if (list_moving_objects.length > 0){
          if (use_cell_lists){ interactions_between_objects_grid() }   // O(n) : grille spatiale
          else {
              for (var i=0; i< list_moving_objects.length; i++){       // O(n²) : toutes les paires (référence exacte)
                    for (var j=i+1; j <  list_moving_objects.length; j++){
                          if ( allow_interaction_ij(i,j) ) { interaction_between_ij(i,j) } // i j interaction
                      } // end for j
                } // end for i
          }
      } // end if in moving_objects
      // (plus de recoloration rose/rouge : on préserve les couleurs des objets)

}

// Stencil « demi-voisinage » 3D : la cellule courante + 13 cellules « en avant ».
// Balayer ces 14 offsets pour chaque cellule visite chaque paire de cellules adjacentes
// exactement une fois (l'offset inverse n'est jamais dans la liste) -> pas de doublon de paire.
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
      Version O(n) des interactions impulsives par « cell lists » (grille spatiale).
      Physiquement IDENTIQUE à la double boucle : on appelle les MÊMES fonctions
      (interaction_center_center / interaction_between_ij), seul le filtrage des
      paires change — deux billes ne sont testées que si un contact est géométriquement
      possible (même cellule ou cellule voisine).

        * billes ↔ billes : filtrées par la grille (contact = R_i + R_j) ;
        * murs (wall_box) : trop grands pour une grille uniforme -> boucle objets × murs.
      */

      var objs = list_moving_objects
      var n = objs.length

      // 1) sépare murs / non-murs et calcule le rayon de collision max (dimensionne la cellule)
      var wall_idx = [], cell_idx = [], rmax = 0
      for (var i=0; i<n; i++){
            if (objs[i].type === 'wall_box'){ wall_idx.push(i) }
            else {
                  cell_idx.push(i)
                  var r = collision_radius(objs[i])
                  if (r > rmax){ rmax = r }
            }
      }

      // 2) range les non-murs dans la grille. Cellule = 2·rmax : garantit que tout couple
      //    en contact (dist < R_i+R_j <= 2·rmax) tombe dans des cellules au plus voisines.
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

      // 3) paires bille ↔ bille : cellule courante + 13 voisines « en avant »
      for (var k=0; k<cell_idx.length; k++){
            var ia = cell_idx[k], o = objs[ia]
            for (var s=0; s<HALF_NEIGHBORS.length; s++){
                  var off = HALF_NEIGHBORS[s]
                  var bucket = grid.get((o._cx+off[0]) + ',' + (o._cy+off[1]) + ',' + (o._cz+off[2]))
                  if (!bucket){ continue }
                  var same_cell = (off[0]===0 && off[1]===0 && off[2]===0)
                  for (var b=0; b<bucket.length; b++){
                        var ib = bucket[b]
                        if (same_cell){ if (ib <= ia){ continue } }   // même cellule : chaque paire une seule fois
                        var i = (ia < ib) ? ia : ib, j = (ia < ib) ? ib : ia
                        if ( allow_interaction_ij(i,j) ){ interaction_center_center(i,j) }  // les deux non-murs -> centre-centre
                  }
            }
      }

      // 4) murs : peu nombreux -> boucle directe murs × billes (rebonds bille-mur)
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
      Énergie potentielle de gravité newtonienne ADOUCIE (cohérente avec accel_attraction) :
      U = - Σ G·m_i·m_j / √(r² + ε²)   (softening de Plummer, ε = attract_softening).
      */

      // Court-circuit : cette somme est en O(n²) et ne sert QU'au graphe d'énergie.
      // Graphe masqué -> aucune raison de la calculer (U=0, n'affecte que #curr_func, caché).
      if (!show_energy_graph){ return 0 }

      var U = 0
      if (one_over_r2 && list_moving_objects.length > 1){
            for (var i=0; i< list_moving_objects.length; i++){
                  for (var j=i+1; j< list_moving_objects.length; j++){
                        if ( allow_interaction_ij(i,j) ){
                              var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                              if ( !(cnd1 & cnd2 & cnd3) ){                 // paires centre-centre (comme accel_attraction)
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
      for (var i in list_moving_objects){                                  // cinétique + gravité uniforme (z) des objets mobiles
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }                                   // objets statiques (murs, ancres) exclus
            if (list_forbid_obj_for_interact.indexOf(obj.type) == -1){     // objet avec masse (pas ressort/élastique)
                  kin_energy += 0.5*obj.mass*obj.speed.dot(obj.speed)
                  grav_energy += obj.mass*9.81*obj.position.z*0.1
            }
      }
      for (var k in list_paired_harmonic){                                 // élastique des ressorts : ½·k·(L-L0)²
            var dx = getDistance(list_paired_harmonic[k][0], list_paired_harmonic[k][1]) - lenght_spring
            var kc = (list_paired_harmonic[k].k_spring !== undefined) ? list_paired_harmonic[k].k_spring : harmonic_const
            elast_energy += 0.5 * kc * dx * dx
      }
      attract_energy = attraction_potential_energy()                       // PE gravité newtonienne (paires)
      grav_energy += attract_energy                                        // gravité = uniforme (z) + newtonienne
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
      record_energy()                                        // graphe temporel (si activé)
      draw_velocity_hist()                                   // histogramme des vitesses (si activé)
      draw_altitude_hist()                                   // histogramme d'altitude (si activé)
      record_trajectories()                                  // trajectoires + MSD (si activé)

}

//===================================================================== Graphe d'énergie

var energy_hist = { tot: [], kin: [], pot: [] }
var ENERGY_HIST_MAX = 400

function record_energy(){

      /*
      Mémorise l'énergie courante et redessine le graphe (uniquement si activé).
      */

      if (!show_energy_graph){ return }
      energy_hist.tot.push(tot_energy)
      energy_hist.kin.push(kin_energy)
      energy_hist.pot.push(grav_energy + elast_energy)        // potentielle = gravité (uniforme+newton) + élastique
      if (energy_hist.tot.length > ENERGY_HIST_MAX){
            energy_hist.tot.shift(); energy_hist.kin.shift(); energy_hist.pot.shift()
      }
      draw_energy_graph()

}

function fmt_energy(v){                                       // format compact d'une valeur d'énergie

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
      var ML = 48, MT = 6, MB = 6                             // marges (gauche = labels d'axe)
      var plotW = W - ML, plotH = H - MT - MB
      //--- échelle verticale automatique sur les 3 courbes
      var lo = Infinity, hi = -Infinity
      function scan(a){ for (var k=0;k<a.length;k++){ if (a[k]<lo) lo=a[k]; if (a[k]>hi) hi=a[k] } }
      scan(energy_hist.tot); scan(energy_hist.kin); scan(energy_hist.pot)
      if (lo === hi){ hi = lo + 1; lo = lo - 1 }
      var pad = (hi - lo) * 0.1; lo -= pad; hi += pad
      function X(i){ return ML + i / (ENERGY_HIST_MAX - 1) * plotW }
      function Y(v){ return MT + (1 - (v - lo) / (hi - lo)) * plotH }
      //--- grille + graduations chiffrées (axe Y = énergie, unités arbitraires)
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
      //--- ligne du zéro (marquée) si elle est dans la plage
      if (lo < 0 && hi > 0){
            ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke()
      }
      //--- courbes
      function line(a, color){
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5
            for (var i=0;i<a.length;i++){ var x = X(i), y = Y(a[i]); if (i === 0){ ctx.moveTo(x, y) } else { ctx.lineTo(x, y) } }
            ctx.stroke()
      }
      line(energy_hist.pot, '#1e88e5')   // potentielle (bleu)
      line(energy_hist.kin, '#e53935')   // cinétique (rouge)
      line(energy_hist.tot, '#000000')   // totale (noir)

}

//===================================================================== Histogramme des vitesses

var VELO_HIST_BINS = 20                                       // nombre de classes de |v|

function collect_speeds(){

      /*
      Normes des vitesses des objets massifs mobiles (mêmes exclusions que l'énergie
      cinétique : ni statiques/ancres, ni ressorts/élastiques/pions).
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

//===================================================================== Flèches de vitesse 3D (show_speeds)

var speed_arrows = []                                        // flèches actives : liste de { obj, arrow }
var SPEED_ARROW_SCALE = 1.0                                  // longueur flèche = |v| * échelle (ajustable)
var SPEED_ARROW_COLOR = 0x00b0ff                             // bleu clair

function speed_arrow_objects(){                              // objets mobiles porteurs d'une vitesse (mêmes exclusions que l'énergie cinétique)
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

function clear_speed_arrows(){                               // retire toutes les flèches de la scène
      for (var i=0;i<speed_arrows.length;i++){
            scene.remove(speed_arrows[i].arrow)
            if (speed_arrows[i].obj){ speed_arrows[i].obj._speed_arrow = null }
      }
      speed_arrows = []
}

function update_speed_arrows(){

      /*
      Dessine/actualise une flèche 3D de vitesse sur chaque objet mobile (appelée chaque frame
      depuis render()). Les flèches ne sont PAS ajoutées à objects[] : ni sélectionnables ni persistées.
      */

      if (!show_speeds){ if (speed_arrows.length){ clear_speed_arrows() } return }

      var objs = speed_arrow_objects()
      var present = {}
      for (var k=0;k<objs.length;k++){
            var obj = objs[k]
            present[obj.id] = true                          // .id : identifiant unique THREE
            var v = obj.speed
            var len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
            var arrow = obj._speed_arrow
            if (len < 1e-6){                                 // vitesse nulle -> pas de direction : masque la flèche
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
      //--- retire les flèches des objets disparus ou devenus inéligibles
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
      Histogramme (instantané) de la distribution des normes de vitesse.
      Axe X = |v| (0 -> max courant), axe Y = nombre d'objets par classe.
      */

      if (!show_velocity_hist){ return }
      var cv = document.getElementById('velocity_hist')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var speeds = collect_speeds()
      var n = speeds.length
      //--- nombre total d'objets comptés (toujours affiché, coin haut-droit)
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'
      ctx.fillText('N = ' + n, W - 4, 2)
      if (n === 0){ return }
      //--- max de vitesse -> échelle horizontale
      var vmax = 0
      for (var k=0;k<n;k++){ if (speeds[k] > vmax) vmax = speeds[k] }
      if (vmax <= 0){ vmax = 1 }
      //--- remplissage des classes
      var bins = new Array(VELO_HIST_BINS).fill(0)
      for (var k=0;k<n;k++){
            var b = Math.floor(speeds[k] / vmax * VELO_HIST_BINS)
            if (b >= VELO_HIST_BINS){ b = VELO_HIST_BINS - 1 }
            bins[b]++
      }
      var cmax = 0
      for (var b=0;b<VELO_HIST_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      //--- géométrie
      var ML = 26, MT = 6, MB = 16                             // marges (gauche = comptes, bas = |v|)
      var plotW = W - ML - 6, plotH = H - MT - MB
      //--- axe Y : graduations entières (comptes)
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
      //--- barres
      var bw = plotW / VELO_HIST_BINS
      ctx.fillStyle = '#43a047'                                // vert
      for (var b=0;b<VELO_HIST_BINS;b++){
            var h = bins[b] / cmax * plotH
            ctx.fillRect(ML + b * bw + 1, MT + plotH - h, bw - 2, h)
      }
      //--- axe X : bornes 0 et vmax
      ctx.fillStyle = '#666'; ctx.textBaseline = 'top'
      ctx.textAlign = 'left';  ctx.fillText('0', ML, MT + plotH + 3)
      ctx.textAlign = 'right'; ctx.fillText(fmt_energy(vmax), W - 6, MT + plotH + 3)

}

//===================================================================== Aperçus (onglet Initial speeds)

var PANEL_ANGLE_BINS = 24                                    // secteurs de la rose angulaire (x-y)

function collect_velocities(){

      /*
      Vitesses (Vector3) des objets massifs mobiles, mêmes exclusions que collect_speeds().
      Renvoie la liste des vecteurs vitesse pour dériver module ET direction.
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
      Petit histogramme des normes de vitesse embarqué dans l'onglet "Initial speeds".
      Même donnée que la fenêtre Monitoring mais indépendant de son toggle.
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
      Rose de dispersion angulaire des vitesses dans le plan x-y (angle = atan2(vy, vx)).
      Chaque secteur a un rayon proportionnel au nombre d'objets dont la vitesse pointe
      dans cette direction : révèle l'anisotropie (ex : jet dirigé vs gaz isotrope).
      */

      var cv = document.getElementById('panel_angle_hist')
      if (!cv){ return }
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var cx = W / 2, cy = H / 2
      var R = Math.min(W, H) / 2 - 8
      var vels = collect_velocities()
      //--- répartition des directions (on ignore les vitesses ~nulles : pas de direction définie)
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
      //--- cercle de référence
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy)
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke()
      if (counted === 0){ return }
      var cmax = 0
      for (var b=0;b<PANEL_ANGLE_BINS;b++){ if (bins[b] > cmax) cmax = bins[b] }
      if (cmax <= 0){ cmax = 1 }
      //--- secteurs (rose) ; y à l'écran vers le bas -> on inverse l'angle pour un repère mathématique
      var dA = 2 * Math.PI / PANEL_ANGLE_BINS
      ctx.fillStyle = 'rgba(67,160,71,0.55)'
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 0.5
      for (var b=0;b<PANEL_ANGLE_BINS;b++){
            if (bins[b] === 0){ continue }
            var r = bins[b] / cmax * R
            var a0 = b * dA, a1 = (b + 1) * dA
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.arc(cx, cy, r, -a0, -a1, true)               // -angle : sens trigo à l'écran
            ctx.closePath()
            ctx.fill(); ctx.stroke()
      }

}

function draw_speed_panels(){                                 // les deux aperçus de l'onglet Initial speeds
      draw_panel_speed_hist()
      draw_panel_angle_hist()
}

//===================================================================== Couleurs (filtres de suivi)

function obj_hex(obj){

      /*
      Couleur RÉELLE d'un objet, en '#rrggbb'.
      On lit currentHex et non material.color : ce dernier est écrasé temporairement par les
      surbrillances (jaune = plus proche, vert = cliqué, orange = piqué, violet = groupe).
      */

      var hex = (obj.currentHex !== undefined) ? obj.currentHex : obj.material.color.getHex()
      return '#' + ('000000' + hex.toString(16)).slice(-6)

}

function distinct_colors(list){                               // couleurs distinctes présentes, triées (ordre stable d'une frame à l'autre)
      var seen = {}, out = []
      for (var i=0;i<list.length;i++){
            var h = obj_hex(list[i])
            if (!seen[h]){ seen[h] = true; out.push(h) }
      }
      out.sort()
      return out
}

//===================================================================== Histogramme d'altitude

var ALT_HIST_BINS = 24                                        // nombre de tranches d'altitude
var altitude_fit = null                                      // courbe d'ajustement { z:[], y:[] } (overlay), évaluée en Python
var altitude_fit_expr = ''                                   // expression Python de l'ajustement (sauvegardée avec la scène)
var alt_zmin = 0, alt_zmax = 1                               // plage d'altitude courante (pour la requête d'ajustement)

function request_altitude_fit(expr){

      /*
      Envoie une expression Python de z au serveur (/eval_fit) et superpose la courbe
      obtenue à l'histogramme d'altitude. Expression vide -> retire l'ajustement.
      */

      expr = (expr || '').trim()
      altitude_fit_expr = expr                               // mémorisé (persisté avec la scène)
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

function altitude_objects(){                                  // objets massifs mobiles (mêmes exclusions que l'énergie cinétique)
      var a = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            a.push(obj)
      }
      return a
}

function collect_altitudes(){                                 // z des objets retenus, filtrés par le select de couleur du panneau
      var a = altitude_objects(), zs = []
      for (var i=0;i<a.length;i++){
            if (alt_color_filter !== 'all' && obj_hex(a[i]) !== alt_color_filter){ continue }
            zs.push(a[i].position.z)
      }
      return zs
}

var _alt_colors_sig = null                                    // signature des couleurs présentes -> ne reconstruit le <select> que si elle change

function refresh_alt_color_options(){

      /*
      Peuple le select de couleurs (« all » + une entrée par couleur présente).
      Appelé à chaque frame depuis draw_altitude_hist : on compare une signature avant de toucher au
      DOM, sinon on détruirait le menu 60 fois par seconde (impossible à ouvrir).
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
      if (alt_color_filter !== 'all' && cols.indexOf(alt_color_filter) < 0){ alt_color_filter = 'all' }  // la couleur filtrée a disparu
      while (sel.firstChild){ sel.removeChild(sel.firstChild) }
      var o = document.createElement('option')
      o.value = 'all'; o.textContent = 'all (' + a.length + ')'
      sel.appendChild(o)
      for (var i=0;i<cols.length;i++){
            o = document.createElement('option')
            o.value = cols[i]
            o.textContent = cols[i] + '  (' + counts[cols[i]] + ')'   // le hex seul est illisible : on donne l'effectif
            o.style.background = cols[i]                      // pastille : l'option prend la couleur qu'elle désigne
            sel.appendChild(o)
      }
      sel.value = alt_color_filter

}

function draw_altitude_hist(){

      /*
      Nombre de particules en fonction de l'altitude (z).
      Axe VERTICAL = altitude (haut = z max), barres horizontales = comptage par tranche.
      */

      if (!show_altitude_hist){ return }
      var cv = document.getElementById('altitude_hist')
      if (!cv){ return }
      refresh_alt_color_options()                             // met à jour le select si les couleurs de la scène ont changé
      var ctx = cv.getContext('2d')
      var W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      var zs = collect_altitudes()
      var n = zs.length
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'
      ctx.fillText('N = ' + n, W - 4, 2)
      if (n === 0){ return }
      //--- plage d'altitude
      var zmin = Infinity, zmax = -Infinity
      for (var k=0;k<n;k++){ if (zs[k]<zmin) zmin=zs[k]; if (zs[k]>zmax) zmax=zs[k] }
      if (zmin === zmax){ zmax = zmin + 1; zmin = zmin - 1 }
      alt_zmin = zmin; alt_zmax = zmax                        // mémorisé pour la requête d'ajustement Python
      //--- classes
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
      //--- géométrie : altitude en Y (haut = zmax), comptage en X (barres horizontales)
      //    ML laisse la place aux graduations + au titre « z » ; MB aux bornes + au titre « N »
      var ML = 56, MT = 6, MB = 30, MR = 6
      var plotW = W - ML - MR, plotH = H - MT - MB
      //--- axe Y : graduations d'altitude (haut = zmax, bas = zmin)
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      for (var t=0; t<=4; t++){
            var zval = zmax - (zmax - zmin) * t / 4
            var y = MT + t / 4 * plotH
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke()
            ctx.fillText(fmt_energy(zval), ML - 4, y)
      }
      //--- barres horizontales (classe 0 = altitude basse -> en bas)
      var bh = plotH / ALT_HIST_BINS
      ctx.fillStyle = '#3949ab'                                // indigo
      for (var b=0;b<ALT_HIST_BINS;b++){
            var w = bins[b] / cmax * plotW
            var y = MT + plotH - (b + 1) * bh                  // b croissant -> vers le haut
            ctx.fillRect(ML, y + 1, w, bh - 2)
      }
      //--- courbe d'ajustement Python (overlay N(z), en rouge)
      if (altitude_fit && altitude_fit.z && altitude_fit.z.length > 1){
            ctx.strokeStyle = '#c62828'; ctx.lineWidth = 1.8; ctx.beginPath()
            for (var k=0;k<altitude_fit.z.length;k++){
                  var zz = altitude_fit.z[k], yy = altitude_fit.y[k]
                  var X = ML + Math.max(0, Math.min(1, yy / cmax)) * plotW    // comptage -> X (comme les barres)
                  var Y = MT + (1 - (zz - zmin) / (zmax - zmin)) * plotH      // altitude -> Y (haut = zmax)
                  if (k === 0){ ctx.moveTo(X, Y) } else { ctx.lineTo(X, Y) }
            }
            ctx.stroke()
      }
      //--- axe X : bornes 0 et cmax (comptage)
      ctx.fillStyle = '#666'; ctx.textBaseline = 'top'
      ctx.textAlign = 'left';  ctx.fillText('0', ML, MT + plotH + 3)
      ctx.textAlign = 'right'; ctx.fillText(cmax, W - MR, MT + plotH + 3)
      //--- noms des axes : z (altitude, vertical) et N (comptage, horizontal)
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText('N', ML + plotW / 2, MT + plotH + 15)      // sous les bornes 0/cmax
      ctx.save()                                              // « z » écrit verticalement le long de l'axe des altitudes
      ctx.translate(9, MT + plotH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('z', 0, 0)
      ctx.restore()

}

//===================================================================== Trajectoires + MSD

var TRAJ_MAX = 200000                                       // échantillons max par trajectoire (borne mémoire, ~1h @60fps)
var TRAJ_DRAW_MAX = 2000                                    // points max tracés par courbe (décimation -> rendu rapide)
function traj_color(obj){ return obj_hex(obj) }             // couleur RÉELLE de la boule (currentHex = teinte hors surbrillance)

function tracked_objects(){                                 // objets dont la trajectoire est suivie
      var a = []
      for (var k in objects){ if (objects[k] && objects[k].track_trajectory){ a.push(objects[k]) } }
      return a
}

function traj_candidate_objects(){

      /*
      Objets qu'on peut proposer au suivi : les objets mobiles (mêmes exclusions que l'altitude)
      + tout objet DÉJÀ suivi via le menu contextuel, même s'il n'est pas mobile (cube, paroi...),
      pour que sa couleur apparaisse quand même dans la liste et reste décochable.
      */

      var a = altitude_objects()
      var t = tracked_objects()
      for (var i=0;i<t.length;i++){ if (a.indexOf(t[i]) < 0){ a.push(t[i]) } }
      return a

}

function color_is_tracked(hex){                             // au moins un objet de cette couleur est-il suivi ?
      var a = traj_candidate_objects()
      for (var i=0;i<a.length;i++){
            if (obj_hex(a[i]) === hex && a[i].track_trajectory){ return true }
      }
      return false
}

function set_track_by_color(hex, on){

      /*
      Active/coupe le suivi de TOUS les objets d'une couleur — c'est l'action des cases à cocher
      de la fenêtre Trajectories : on choisit les objets à suivre par leur couleur.
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

function traj_mass_label(lo, hi){                           // « masse 1.0 », ou « masse 1.0…5.0 » si la couleur mélange des masses
      if (lo === undefined){ return 'masse inconnue' }
      var a = fmt_energy(lo), b = fmt_energy(hi)
      return 'masse ' + (a === b ? a : a + '…' + b)
}

var _traj_colors_sig = null                                 // signature (couleurs + état coché + masses) -> ne reconstruit les cases que si elle change

function refresh_traj_color_filters(){

      /*
      Une case à cocher par couleur présente dans la scène : cocher = suivre les objets de cette
      couleur. On compare une signature avant de toucher au DOM (ce code tourne à chaque frame :
      recréer les cases en continu les rendrait impossibles à cliquer).
      La signature inclut l'état coché -> la case reste synchro si le suivi est changé ailleurs
      (case « trajectory » du menu clic droit).
      */

      var box = document.getElementById('traj_color_filters')
      if (!box){ return }
      var a = traj_candidate_objects()
      var cols = distinct_colors(a)
      var counts = {}, tracked = {}, mmin = {}, mmax = {}
      for (var i=0;i<a.length;i++){
            var h = obj_hex(a[i])
            counts[h] = (counts[h] || 0) + 1
            var m = a[i].mass                             // masses min/max de la couleur (une couleur peut mélanger des masses)
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
                        this.blur()                                     // rend le focus clavier à la scène (le raccourci 'x' reste actif)
                        _traj_colors_sig = null                         // l'état coché a changé -> laisser les cases se resynchroniser
                        draw_trajectories()
                  })
                  // (l'isolation vis-à-vis de TrackballControls est posée une fois pour toutes
                  //  sur #traj_colors_wrap, cf. panel_interaction.html — inutile de la répéter ici)
                  var $sw = $('<span style="display:inline-block; width:9px; height:9px; border:1px solid #999; vertical-align:middle; margin:0 2px">')
                              .css('background', hex)
                  $(box).append($('<label style="cursor:pointer; white-space:nowrap; display:flex; align-items:center">')
                        .append($cb).append($sw)
                        .append($('<span style="color:#888">').text(counts[hex]))
                        .attr('title', hex + ' — ' + counts[hex] + ' objet(s) — ' + traj_mass_label(mmin[hex], mmax[hex])))
            })(cols[i])
      }

}

function fmt_hms(sec){                                      // secondes -> H:MM:SS (heures omises si nulles)
      var s = Math.floor(sec % 60), m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600)
      var mm = (m < 10 && h > 0 ? '0' : '') + m
      return (h > 0 ? h + ':' : '') + mm + ':' + (s < 10 ? '0' : '') + s
}

function update_traj_time(){                                // temps de simulation écoulé depuis le dernier reset / début du suivi
      var el = document.getElementById('traj_time')
      if (el){ el.textContent = 't = ' + sim_time.toFixed(1) + ' u.a. (' + fmt_hms(sim_time / 10) + ')' }
}                                                          // 1 u.a. = 100 ms de temps réel (cf. animate_physics)

// traj_show = { xy, z, msd } (bascules indépendantes) est déclaré dans scene_params.js (réglages Monitoring)

function apply_traj_mode(){                                 // montre/masque chaque tracé selon traj_show
      var wxy = document.getElementById('traj_xy_wrap');  if (wxy){ wxy.style.display = traj_show.xy  ? '' : 'none' }
      var wz  = document.getElementById('traj_z_wrap');   if (wz){  wz.style.display  = traj_show.z   ? '' : 'none' }
      var wm  = document.getElementById('traj_msd_wrap'); if (wm){  wm.style.display  = traj_show.msd ? '' : 'none' }
}

function reset_trajectory(obj){                             // (re)démarre l'enregistrement à partir de la position courante
      obj.traj = { x:[], y:[], z:[], msd:[], x0:null, y0:null, z0:null, zsum:0, zcount:0 }  // zsum/zcount : ⟨z⟩ depuis le reset (indépendant de la fenêtre glissante)
}

function reset_all_trajectories(){
      if (typeof clear_traj_zoom === 'function'){ clear_traj_zoom() }   // repartir sur une vue auto-fit
      sim_time = 0                                                      // le chrono repart avec les tracés (« depuis le dernier Reset »)
      var t = tracked_objects(); for (var i=0;i<t.length;i++){ reset_trajectory(t[i]) }
}

function record_trajectories(){                             // appelé chaque frame d'animation

      if (!show_trajectories){ return }
      var t = tracked_objects()
      for (var i=0;i<t.length;i++){
            var o = t[i]; if (!o.traj){ reset_trajectory(o) }
            var tr = o.traj
            if (tr.x0 === null){ tr.x0 = o.position.x; tr.y0 = o.position.y; tr.z0 = o.position.z }  // origine r0
            var dx = o.position.x-tr.x0, dy = o.position.y-tr.y0, dz = o.position.z-tr.z0
            tr.x.push(o.position.x); tr.y.push(o.position.y); tr.z.push(o.position.z); tr.msd.push(dx*dx+dy*dy+dz*dz)  // |r-r0|²
            tr.zsum += o.position.z; tr.zcount++            // moyenne z cumulée depuis le reset (tous les points, pas seulement la fenêtre)
            if (tr.x.length > TRAJ_MAX){ tr.x.shift(); tr.y.shift(); tr.z.shift(); tr.msd.shift() }
      }
      draw_trajectories()

}

function traj_stride(n){ return Math.max(1, Math.ceil(n / TRAJ_DRAW_MAX)) }  // décimation : au plus TRAJ_DRAW_MAX points

/*
Zoom "rubber-band" sur les graphes trajectoires. Chaque canvas a :
  - traj_zoom[key] : null (auto-fit) ou {a0,a1,b0,b1} = domaine imposé en coordonnées DONNÉES
                     (a = abscisse, b = ordonnée ; pour z(t)/MSD l'abscisse est l'index d'échantillon)
  - traj_view[key] : dernière transfo affichée {L,T,W,H (rect de tracé en px), a0,a1,b0,b1 (domaine)}
                     -> permet d'inverser pixel -> donnée au relâchement du rectangle.
Glisser = zoomer sur le rectangle ; double-clic = revenir à l'auto-fit.
*/
var traj_zoom = { xy:null, z:null, msd:null }
var traj_view = { xy:null, z:null, msd:null }
var traj_drag = null                                        // rectangle en cours : {canvasId, key, x0,y0,x1,y1} (un seul glisser à la fois)
var traj_z_means = []                                       // lignes ⟨z⟩ du dernier dessin : {y (px canvas), value, mass, color} -> infobulle de survol
var _traj_zoom_setup = false

function clear_traj_zoom(){ traj_zoom = { xy:null, z:null, msd:null } }

function hide_traj_tooltip(){ var el=document.getElementById('traj_tooltip'); if(el){ el.style.display='none' } }

function show_traj_tooltip(clientX, clientY, groups){

      /*
      Infobulle au survol d'une ligne de moyenne ⟨z⟩ : une entrée par (couleur, masse) survolée
      — plusieurs particules d'une même couleur/masse partagent alors une seule ligne récapitulative
      (moyenne des ⟨z⟩, avec ×N), sinon 2000 boules d'une couleur donneraient 2000 lignes.
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
      // positionne près du curseur, en restant dans la fenêtre (bascule à gauche/au-dessus si ça déborde)
      var pad = 12, w = el.offsetWidth, h = el.offsetHeight
      var x = clientX + pad; if (x + w > window.innerWidth - 4){ x = clientX - pad - w }
      var y = clientY + pad; if (y + h > window.innerHeight - 4){ y = clientY - pad - h }
      el.style.left = Math.max(4, x) + 'px'
      el.style.top  = Math.max(4, y) + 'px'
}

function draw_traj_drag_rect(){

      /*
      Rectangle de sélection, dessiné À LA FIN de draw_trajectories() et pas dans le handler
      mousemove : l'animation appelle draw_trajectories() à chaque frame, ce qui efface le canvas.
      Peint depuis le handler, le rectangle disparaissait à la frame suivante — donc invisible.
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
            // stopPropagation : TrackballControls est branché sur document et ferait pivoter la caméra
            // pendant le tracé du rectangle (l'isolation posée sur #trajectories_box couvre déjà ce cas,
            // on la répète ici pour que le canvas reste sûr même hors de ce conteneur).
            e.stopPropagation()
            var v = traj_view[key]; if (!v){ return }
            var p = pos(e)
            if (p.x<v.L || p.x>v.L+v.W || p.y<v.T || p.y>v.T+v.H){ return }   // hors zone de tracé
            traj_drag = { canvasId:canvasId, key:key, x0:p.x, y0:p.y, x1:p.x, y1:p.y }
            e.preventDefault()
      })
      cv.addEventListener('mousemove', function(e){
            if (!traj_drag || traj_drag.key !== key){ return }
            e.stopPropagation()
            var v = traj_view[key], p = pos(e)
            traj_drag.x1 = Math.max(v.L, Math.min(v.L+v.W, p.x))
            traj_drag.y1 = Math.max(v.T, Math.min(v.T+v.H, p.y))
            draw_trajectories()                              // redessine le graphe + le rectangle par-dessus
      })
      function finish(){
            if (!traj_drag || traj_drag.key !== key){ return }
            var v = traj_view[key]
            var x0=Math.min(traj_drag.x0,traj_drag.x1), x1=Math.max(traj_drag.x0,traj_drag.x1)
            var y0=Math.min(traj_drag.y0,traj_drag.y1), y1=Math.max(traj_drag.y0,traj_drag.y1)
            traj_drag = null
            if (v && (x1-x0)>4 && (y1-y0)>4){                 // ignore les clics/micro-rectangles
                  var a0 = v.a0 + (x0-v.L)/v.W*(v.a1-v.a0)
                  var a1 = v.a0 + (x1-v.L)/v.W*(v.a1-v.a0)
                  var b1 = v.b0 + (1-(y0-v.T)/v.H)*(v.b1-v.b0)   // haut de l'écran -> grande valeur
                  var b0 = v.b0 + (1-(y1-v.T)/v.H)*(v.b1-v.b0)
                  traj_zoom[key] = { a0:a0, a1:a1, b0:b0, b1:b1 }
            }
            draw_trajectories()
      }
      cv.addEventListener('mouseup', finish)
      cv.addEventListener('mouseleave', finish)
      cv.addEventListener('dblclick', function(){ traj_zoom[key]=null; draw_trajectories() })   // reset zoom de ce graphe
}

function _bind_traj_z_means_hover(){

      /*
      Survol des lignes ⟨z⟩ du graphe z(t) : infobulle couleur + masse + moyenne actuelle.
      Séparé du handler de zoom (même canvas) : le zoom n'agit que pendant un glisser (traj_drag),
      le survol que hors glisser. Regroupe les lignes proches par (couleur, masse) — cf. show_traj_tooltip.
      */

      var cv = document.getElementById('z_canvas'); if (!cv){ return }
      var THRESH = 5                                          // distance verticale de capture (px canvas)
      function pos(e){ var r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height } }
      cv.addEventListener('mousemove', function(e){
            if (traj_drag){ hide_traj_tooltip(); return }     // en plein zoom -> pas d'infobulle
            var v = traj_view.z, p = pos(e)
            if (!v || p.x<v.L || p.x>v.L+v.W){ hide_traj_tooltip(); cv.style.cursor='crosshair'; return }
            var groups = {}, order = []                       // regroupe les moyennes à portée par (couleur+masse)
            for (var i=0;i<traj_z_means.length;i++){
                  var m = traj_z_means[i]
                  if (Math.abs(m.y - p.y) > THRESH){ continue }
                  var key = m.color + '|' + m.mass
                  if (!groups[key]){ groups[key] = { color:m.color, mass:m.mass, sum:0, count:0 }; order.push(key) }
                  groups[key].sum += m.value; groups[key].count++
            }
            if (!order.length){ hide_traj_tooltip(); cv.style.cursor='crosshair'; return }
            order.sort()                                       // ordre stable d'un survol à l'autre
            show_traj_tooltip(e.clientX, e.clientY, order.slice(0,6).map(function(k){ return groups[k] }))
            cv.style.cursor='pointer'
      })
      cv.addEventListener('mouseleave', hide_traj_tooltip)
}

function setup_traj_zoom(){                                 // idempotent : attache les handlers une seule fois
      if (_traj_zoom_setup){ return }
      _traj_zoom_setup = true
      _bind_traj_zoom('traj_canvas','xy'); _bind_traj_zoom('z_canvas','z'); _bind_traj_zoom('msd_canvas','msd')
      _bind_traj_z_means_hover()
}

function draw_trajectories(){

      setup_traj_zoom()
      refresh_traj_color_filters()                              // cases à cocher : couleurs à suivre
      update_traj_time()
      var t = tracked_objects()

      //---- fenêtre 1 : trajectoires (projection x-y, échelle isotrope si pas de zoom) ----
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
                  var lx=tr.x[n-1], ly=tr.y[n-1]                 // toujours inclure le dernier point
                  if(lx<xmin)xmin=lx; if(lx>xmax)xmax=lx; if(ly<ymin)ymin=ly; if(ly>ymax)ymax=ly }
            if (npts>0){
                  var dom
                  if (traj_zoom.xy){ dom = traj_zoom.xy }
                  else { var cxx=(xmin+xmax)/2, cyy=(ymin+ymax)/2, half=Math.max((xmax-xmin)||1,(ymax-ymin)||1)*0.55
                        dom = { a0:cxx-half, a1:cxx+half, b0:cyy-half, b1:cyy+half } }   // domaine carré -> isotrope
                  var pad=10, side=Math.min(W,H)-2*pad, L=(W-side)/2, T=(H-side)/2, PW=side, PH=side
                  traj_view.xy = { L:L, T:T, W:PW, H:PH, a0:dom.a0, a1:dom.a1, b0:dom.b0, b1:dom.b1 }
                  var PX=function(x){ return L + (x-dom.a0)/((dom.a1-dom.a0)||1)*PW }
                  var PY=function(y){ return T + (1-(y-dom.b0)/((dom.b1-dom.b0)||1))*PH }
                  ctx.strokeStyle='#ddd'; ctx.lineWidth=1; ctx.strokeRect(L,T,PW,PH)   // cadre de la zone de tracé
                  ctx.save(); ctx.beginPath(); ctx.rect(L,T,PW,PH); ctx.clip()          // n'affiche que l'intérieur (utile en zoom)
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||tr.x.length<2)continue
                        var n=tr.x.length, st=traj_stride(n), col=traj_color(t[i])
                        ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=PX(tr.x[k]),Y=PY(tr.y[k]); if(first){ctx.moveTo(X,Y);first=false}else ctx.lineTo(X,Y) }
                        ctx.lineTo(PX(tr.x[n-1]),PY(tr.y[n-1]))   // dernier point
                        ctx.stroke()
                        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(tr.x[n-1]),PY(tr.y[n-1]),3,0,2*Math.PI); ctx.fill()
                  }
                  ctx.restore()
            } else { traj_view.xy = null }
      }

      //---- fenêtre z(t) : altitude z vs temps (index d'échantillon) ----
      var cvz = document.getElementById('z_canvas')
      if (cvz){
            var cz = cvz.getContext('2d'), Wz=cvz.width, Hz=cvz.height
            cz.clearRect(0,0,Wz,Hz)
            traj_z_means = []                                // lignes ⟨z⟩ survolables (repeuplées à chaque dessin)
            var nz=0, zmax=0                                 // axe y calé sur 0 (zmin = 0)
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
                        //--- z(t) : courbe (masquée en mode "moyennes seules")
                        if (!means_only){
                              cz.strokeStyle=col; cz.lineWidth=1.5; cz.beginPath()
                              var first=true
                              for (var k=0;k<n;k+=st){ var X=ZX(k),Y=ZY(tr.z[k]); if(first){cz.moveTo(X,Y);first=false}else cz.lineTo(X,Y) }
                              cz.lineTo(ZX(n-1),ZY(tr.z[n-1]))         // dernier point
                              cz.stroke()
                        }
                        //--- moyenne ⟨z⟩ depuis le reset : pointillé avec la courbe, trait plein si seule affichée
                        if (tr.zcount > 0){
                              var zmean=tr.zsum/tr.zcount, yzmean=ZY(zmean)
                              traj_z_means.push({ y:yzmean, value:zmean, mass:t[i].mass, color:col })   // pour l'infobulle de survol
                              cz.strokeStyle=col; cz.lineWidth=1.5
                              if (!means_only){ cz.lineWidth=1; cz.setLineDash([4,3]) }
                              cz.beginPath(); cz.moveTo(L,yzmean); cz.lineTo(L+PW,yzmean); cz.stroke()
                              cz.setLineDash([])
                        }
                  }
                  cz.restore()
            } else { traj_view.z = null }
      }

      //---- fenêtre 2 : MSD |r-r0|² vs temps (index d'échantillon) ----
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
                        c2.lineTo(MX(n-1),MY(tr.msd[n-1]))        // dernier point
                        c2.stroke()
                  }
                  c2.restore()
            } else { traj_view.msd = null }
      }

      draw_traj_drag_rect()                                     // rectangle de zoom en cours, par-dessus le tracé fraîchement redessiné

}

//===================================================================== Velocity Verlet

/*
Intégrateur symplectique Velocity Verlet pour les forces lisses (conservatives) :
gravité, ressorts harmoniques, attraction. Schéma (par objet, masse m) :

      x_{n+1} = x_n + v_n·dt + ½·a_n·dt²
      v_{n+1} = v_n + ½·(a_n + a_{n+1})·dt

avec a = F/m calculé à partir des positions (forces indépendantes de la vitesse).
Les collisions/rebonds (mur, sol, choc centre-centre) sont des impulsions appliquées
après le pas Verlet : elles ne dérivent pas d'un potentiel lisse.
*/

function accel_attraction(i,j){

      /*
      Gravité newtonienne ADOUCIE (softening de Plummer) :
            F = G·m_i·m_j · r_vec / (r² + ε²)^{3/2}     (ε = attract_softening)
      Pour ε = 0 on retrouve le 1/r² pur. Le softening supprime la singularité à r→0
      (accélérations bornées) : le pas Verlet reste précis même en rencontre proche,
      donc l'énergie se conserve. r_vec (non normalisé) porte déjà la direction.
      */

      if (!one_over_r2){ return }
      var [obji, objj] = objj_obji(i,j)
      var rvec = new THREE.Vector3().subVectors(obji.position, objj.position)   // j -> i (longueur = r)
      var soft2 = rvec.lengthSq() + attract_softening*attract_softening         // r² + ε²
      var g = attract_strength_one_over_r2 / (soft2 * Math.sqrt(soft2))         // G / (r²+ε²)^{3/2}
      objj.acc.addScaledVector(rvec,  g*obji.mass)             // a_j vers i
      obji.acc.addScaledVector(rvec, -g*objj.mass)             // a_i vers j

}

function accel_spring(k){

      /*
      Force de rappel harmonique (ressort) d'une paire, ajoutée à l'accélération.
      F = -harmonic_const·(longueur - longueur_au_repos) le long du ressort.
      */

      var p0 = list_paired_harmonic[k][0]
      var p1 = list_paired_harmonic[k][1]
      var kc = (list_paired_harmonic[k].k_spring !== undefined) ? list_paired_harmonic[k].k_spring : harmonic_const  // raideur propre à la paire (repli global)
      var vec = new THREE.Vector3().subVectors(p1.position, p0.position)
      var diff_length = vec.length() - lenght_spring
      vec.normalize().multiplyScalar(diff_length)
      p0.acc.addScaledVector(vec,  kc/p0.mass)
      p1.acc.addScaledVector(vec, -kc/p1.mass)

}

// ===================================================================== Barnes-Hut
// Attraction newtonienne 1/r² approchée en O(n log n) : un amas lointain est traité
// comme UNE seule masse à son centre de masse (critère d'ouverture s/d < θ). Derrière
// la case "Fast attraction". C'est une APPROXIMATION (θ règle précision/vitesse) : les
// forces ne sont plus exactement antisymétriques -> légère dérive du graphe d'énergie.

var BH_MIN_N     = 64    // en dessous, la double boucle exacte est plus rapide ET exacte -> repli
var BH_MAX_DEPTH = 24    // garde-fou anti-subdivision infinie (billes quasi superposées)

function bh_new_node(cx, cy, cz, half){
      return { cx:cx, cy:cy, cz:cz, half:half,        // centre + demi-côté du cube
               mass:0, comx:0, comy:0, comz:0,         // masse totale + centre de masse (agrégés)
               body:-1, bucket:null, children:null }   // feuille (1 corps) / feuille saturée / noeud interne
}

function bh_child_index(node, x, y, z){                // dans quel octant tombe (x,y,z) ?
      var idx = 0
      if (x >= node.cx){ idx |= 1 }
      if (y >= node.cy){ idx |= 2 }
      if (z >= node.cz){ idx |= 4 }
      return idx
}

function bh_ensure_children(node){                     // découpe le cube en 8 sous-cubes
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
      if (node.children){                              // noeud interne -> descendre
            bh_insert(node.children[bh_child_index(node, x,y,z)], idx, x,y,z, depth+1)
            return
      }
      if (node.bucket){ node.bucket.push(idx); return } // feuille saturée (profondeur max) -> empiler
      if (node.body === -1){ node.body = idx; return }  // feuille vide -> y poser le corps
      // feuille déjà occupée : subdiviser (ou bucketiser si trop profond = positions ~identiques)
      if (depth >= BH_MAX_DEPTH){ node.bucket = [node.body, idx]; node.body = -1; return }
      var old = node.body, oo = list_moving_objects[old]
      node.body = -1
      bh_ensure_children(node)
      bh_insert(node.children[bh_child_index(node, oo.position.x,oo.position.y,oo.position.z)], old, oo.position.x,oo.position.y,oo.position.z, depth+1)
      bh_insert(node.children[bh_child_index(node, x,y,z)], idx, x,y,z, depth+1)
}

function bh_compute_mass(node){                        // post-ordre : masse + centre de masse
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
      if (node.body !== -1){                           // feuille à 1 corps
            var o = list_moving_objects[node.body]
            node.mass = o.mass
            node.comx = o.position.x; node.comy = o.position.y; node.comz = o.position.z
      }
      // feuille vide : mass reste 0
}

function bh_add_direct(o, src, eps2, G){               // force exacte (softened) d'un corps source sur o
      var dx = src.position.x - o.position.x
      var dy = src.position.y - o.position.y
      var dz = src.position.z - o.position.z
      var soft2 = dx*dx + dy*dy + dz*dz + eps2          // r² + ε²
      var f = G * src.mass / (soft2 * Math.sqrt(soft2)) // G·m / (r²+ε²)^{3/2}
      o.acc.x += f*dx; o.acc.y += f*dy; o.acc.z += f*dz
}

function bh_accel_on(node, o, ti, theta2, eps2, G){
      if (node.mass <= 0){ return }                    // sous-arbre vide
      if (node.children === null && node.bucket === null){  // feuille à 1 corps
            if (node.body !== -1 && node.body !== ti){ bh_add_direct(o, list_moving_objects[node.body], eps2, G) }  // jamais sur soi-même
            return
      }
      if (node.bucket){                                // feuille saturée : corps un à un
            for (var b=0; b<node.bucket.length; b++){
                  if (node.bucket[b] !== ti){ bh_add_direct(o, list_moving_objects[node.bucket[b]], eps2, G) }
            }
            return
      }
      var dx = node.comx - o.position.x                // noeud interne : test d'ouverture s/d < θ
      var dy = node.comy - o.position.y
      var dz = node.comz - o.position.z
      var d2 = dx*dx + dy*dy + dz*dz
      var s  = 2*node.half                             // côté du cube
      if (s*s < theta2 * d2){                          // assez loin -> approxime par le centre de masse
            var soft2 = d2 + eps2
            var f = G * node.mass / (soft2 * Math.sqrt(soft2))
            o.acc.x += f*dx; o.acc.y += f*dy; o.acc.z += f*dz
            return
      }
      for (var i=0; i<8; i++){ bh_accel_on(node.children[i], o, ti, theta2, eps2, G) }  // trop proche -> descendre
}

function bh_eligible_indices(){
      // Mêmes exclusions que la double boucle exacte, restreintes au groupe "toutes paires"
      // propre : objets NON-murs et NON-interdits (spring/elastic/pawn). Les murs n'attirent
      // que d'autres murs dans l'exact (cas négligeable, bloqués) : on les écarte de la gravité.
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
      // 1) cube englobant de tous les corps éligibles
      var minx=Infinity,miny=Infinity,minz=Infinity,maxx=-Infinity,maxy=-Infinity,maxz=-Infinity
      for (var k=0;k<n;k++){
            var p = list_moving_objects[eligible[k]].position
            if (p.x<minx)minx=p.x; if (p.x>maxx)maxx=p.x
            if (p.y<miny)miny=p.y; if (p.y>maxy)maxy=p.y
            if (p.z<minz)minz=p.z; if (p.z>maxz)maxz=p.z
      }
      var cx=(minx+maxx)/2, cy=(miny+maxy)/2, cz=(minz+maxz)/2
      var half = Math.max(maxx-minx, maxy-miny, maxz-minz)/2
      if (!(half > 0)){ half = 1 }                     // tous au même point / n=1
      half *= 1.0001                                   // marge pour inclure les bornes
      var root = bh_new_node(cx,cy,cz,half)
      // 2) insertion + agrégation masse/centre de masse
      for (var k=0;k<n;k++){
            var p = list_moving_objects[eligible[k]].position
            bh_insert(root, eligible[k], p.x,p.y,p.z, 0)
      }
      bh_compute_mass(root)
      // 3) force sur chaque corps par parcours de l'arbre
      var theta2 = barnes_hut_theta*barnes_hut_theta
      var eps2   = attract_softening*attract_softening
      var G      = attract_strength_one_over_r2
      for (var k=0;k<n;k++){
            var ti = eligible[k]
            bh_accel_on(root, list_moving_objects[ti], ti, theta2, eps2, G)
      }
}

function accel_attraction_bruteforce(){                // double boucle O(n²) exacte (référence)
      for (var i=0; i< list_moving_objects.length; i++){
            for (var j=i+1; j< list_moving_objects.length; j++){
                  if ( allow_interaction_ij(i,j) ){
                        var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                        if ( !(cnd1 & cnd2 & cnd3) ){ accel_attraction(i,j) } // pas une paire mur-objet
                  }
            }
      }
}

function compute_accelerations(){

      /*
      Accélération a(x) de chaque objet mobile à partir des forces lisses :
      gravité (constante en z) + attraction (centre-centre) + ressorts.
      */

      for (var i in list_moving_objects){                      // reset + gravité
            var o = list_moving_objects[i]
            if (!o.acc){ o.acc = new THREE.Vector3() }
            if (o.blocked || !gravity_ok){ o.acc.set(0, 0, 0) }  // statique/ancre ou gravité coupée
            else { o.acc.set(0, 0, -9.81*0.1) }
      }
      if (one_over_r2){                                        // sinon inutile de parcourir les paires
            if (use_barnes_hut){
                  var eligible = bh_eligible_indices()
                  if (eligible.length >= BH_MIN_N){ barnes_hut_attraction(eligible) }  // O(n log n) approché
                  else { accel_attraction_bruteforce() }         // trop peu de corps -> exact (et plus rapide)
            } else {
                  accel_attraction_bruteforce()                  // O(n²) exact (référence)
            }
      }
      if (springs_ok){ for (var k in list_paired_harmonic){ accel_spring(k) } }   // ressorts

}

function verlet_positions(delta){

      /*
      x_{n+1} = x_n + v_n·dt + ½·a_n·dt²  puis premier demi-coup de vitesse (½·a_n·dt).
      obj.acc contient a_n (calculé à la frame précédente).
      */

      var hdt2 = 0.5*delta*delta
      var hdt  = 0.5*delta
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (!o.acc){ o.acc = new THREE.Vector3() }
            if (o.blocked){ continue }                         // objet statique/ancre : ne bouge pas
            if (!o._ppos){ o._ppos = new THREE.Vector3() }
            o._ppos.copy(o.position)                           // position AVANT le pas (détection continue mur)
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
      Second demi-coup de vitesse avec a_{n+1} : v_{n+1} = v_half + ½·a_{n+1}·dt.
      */

      var hdt = 0.5*delta
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.blocked){ continue }                         // objet statique/ancre : vitesse figée
            o.speed.x += o.acc.x*hdt
            o.speed.y += o.acc.y*hdt
            o.speed.z += o.acc.z*hdt
      }

}

function ground_bounce(){

      /*
      Contrainte du sol : rebond élastique quand le centre passe sous height/2.
      */

      if (!gravity_ok){ return }                               // pas de gravité -> pas de "bas" -> pas de sol (tout est 3D libre)
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.blocked){ continue }                         // objet statique : pas de rebond sol
            var hz = (o.radius !== undefined) ? o.radius : o.height/2   // sphère : repose pile sur le sol (bas = centre - rayon) ; autres : height/2
            if (o.position.z < hz){
                  o.position.z = hz                            // remonte TOUJOURS la bille au niveau du sol (dé-pénétration)
                  if (o.speed.z < 0){ o.speed.z = -o.speed.z } // ne réfléchit QUE si elle descend, sinon on la piégeait sous le sol
            }
      }

}

function lid_bounce(){

      /*
      Contrainte de couvercle (plafond) : les boules dans l'emprise x-y d'une boîte munie
      d'un couvercle ne peuvent pas dépasser le haut. Réflexion élastique (seulement si
      la boule monte), symétrique du rebond au sol.
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
                        if (o.speed.z > 0){ o.speed.z = -o.speed.z }   // ne réfléchit que si elle monte
                  }
            }
      }
}

function interactions_and_movement(delta){

      /*
      Un pas de Velocity Verlet + interactions impulsives.
      */

      verlet_positions(delta)            // x_{n+1} (+ ½ coup de vitesse, avec a_n)
      compute_accelerations()            // a_{n+1} aux nouvelles positions
      verlet_velocities(delta)           // ½ coup de vitesse restant (avec a_{n+1})
      interactions_between_objects()     // collisions + rebonds murs (impulsions) + couleurs
      bounce_balls_on_cubes()            // rebond des billes sur les cubes/pavés pleins (6 faces)
      ground_bounce()                    // rebond sur le sol
      lid_bounce()                       // rebond sur les couvercles (plafonds de boîte)
      calculate_total_energy()

}

var MAX_PHYS_DELTA = 0.5    // pas de temps max : évite un pas géant après une pause (onglet en arrière-plan)

function animate_physics(){

      /*
      Animation of the scene or empty loop ..
      */

      if (scene_animation_ok){
            var time = performance.now();
            var delta = ( time - prevTime ) / 100;
            if (delta > MAX_PHYS_DELTA){ delta = MAX_PHYS_DELTA }  // requestAnimationFrame est gelé en arrière-plan
            interactions_and_movement(delta)                       //  -> au retour, on borne le pas au lieu d'exploser
            sim_time += delta                                      // temps de simulation (u.a.) : c'est le pas physique qu'on cumule,
            prevTime = time;                                       // donc il se fige à la pause — cohérent avec z(t) et le MSD
        }
        else{ prevTime = performance.now() }
}

// Quand l'onglet redevient visible, repartir d'un delta ~0 (pas de saut au retour d'arrière-plan)
if (typeof document !== 'undefined'){
      document.addEventListener('visibilitychange', function(){
            if (!document.hidden){ prevTime = performance.now() }
      })
}
