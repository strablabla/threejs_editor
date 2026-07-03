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

function change_speed_after_center_center_collision(i,j){

      /*
      Collision élastique 3D par impulsion le long de la ligne des centres.
      On n'inverse que la composante NORMALE de la vitesse relative ; les composantes
      tangentielles restent inchangées. C'est indispensable pour la thermalisation :
      un simple échange des vecteurs vitesse complets (masses égales) ne ferait que
      permuter les vitesses -> distribution des |v| figée (pas d'équilibre statistique).

      Impulsion (restitution e = 1) :  J = -2·v_n / (1/m_i + 1/m_j)
            v_i += (J/m_i)·n     v_j -= (J/m_j)·n     avec n = normale unitaire j->i
      */

      var oi = list_moving_objects[i], oj = list_moving_objects[j]
      var n = new THREE.Vector3().subVectors(oi.position, oj.position)
      var d = n.length()
      if (d === 0){ return }                                   // centres confondus : pas de normale définie
      n.divideScalar(d)                                        // normale unitaire j->i
      var vn = new THREE.Vector3().subVectors(oi.speed, oj.speed).dot(n)  // vitesse relative normale
      if (vn >= 0){ return }                                   // objets déjà en éloignement : pas de choc
      var imp = -2 * vn / (1/oi.mass + 1/oj.mass)              // impulsion scalaire (élastique)
      oi.speed.addScaledVector(n,  imp/oi.mass)
      oj.speed.addScaledVector(n, -imp/oj.mass)

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
      Interactions impulsives (non issues d'un potentiel lisse) :
          * rebond objet-mur
          * collision élastique centre-centre
      (les ressorts et l'attraction sont traités en accélérations -> compute_accelerations)
      */

      list_interact = []
      if (list_moving_objects.length > 0){
          for (var i=0; i< list_moving_objects.length; i++){
                for (var j=i+1; j <  list_moving_objects.length; j++){
                      if ( allow_interaction_ij(i,j) ) { interaction_between_ij(i,j) } // i j interaction
                  } // end for j
            } // end for i
      } // end if in moving_objects
      no_interaction_color()  // restitute color if no interaction

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
      Énergie potentielle de gravité newtonienne : U = - Σ G·m_i·m_j / r  (sur les paires centre-centre).
      */

      var U = 0
      if (one_over_r2 && list_moving_objects.length > 1){
            for (var i=0; i< list_moving_objects.length; i++){
                  for (var j=i+1; j< list_moving_objects.length; j++){
                        if ( allow_interaction_ij(i,j) ){
                              var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                              if ( !(cnd1 & cnd2 & cnd3) ){                 // paires centre-centre (comme accel_attraction)
                                    var oi = list_moving_objects[i], oj = list_moving_objects[j]
                                    var dist = getDistance(oi, oj)
                                    if (dist >= 1){ U += - attract_strength_one_over_r2 * oi.mass * oj.mass / dist }
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
      Gravité newtonienne entre deux objets : F = G·m_i·m_j / r²   (G = attract_strength_one_over_r2).
      L'accélération de chaque objet = F/m, donc a_j = G·m_i/r² (vers i), a_i = G·m_j/r² (vers j).
      */

      if (!one_over_r2){ return }
      var [obji, objj] = objj_obji(i,j)
      var dist = getDistance(obji, objj)
      if (dist < 1){ return }                                  // évite la division par ~0
      var dir = new THREE.Vector3().subVectors(obji.position, objj.position).divideScalar(dist) // unitaire j->i
      var g = attract_strength_one_over_r2/(dist*dist)         // G/r²
      objj.acc.addScaledVector(dir,  g*obji.mass)              // a_j = G·m_i/r² vers i
      obji.acc.addScaledVector(dir, -g*objj.mass)              // a_i = G·m_j/r² vers j

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
      for (var i=0; i< list_moving_objects.length; i++){       // attraction de paires (hors murs)
            for (var j=i+1; j< list_moving_objects.length; j++){
                  if ( allow_interaction_ij(i,j) ){
                        var [cnd1, cnd2, cnd3] = conditions_interaction_obj_plane(i,j)
                        if ( !(cnd1 & cnd2 & cnd3) ){ accel_attraction(i,j) } // pas une paire mur-objet
                  }
            }
      }
      if (springs_ok){ for (var k in list_paired_harmonic){ accel_spring(k) } }   // ressorts
      if (!gravity_ok){                                        // mode planaire : aucune accélération en z
            for (var i in list_moving_objects){ list_moving_objects[i].acc.z = 0 }
      }

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
            if (!gravity_ok){ o.speed.z = 0; o.acc.z = 0 }     // mode planaire : pas de vitesse verticale résiduelle
            if (o.blocked){ continue }                         // objet statique/ancre : ne bouge pas
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

      if (!gravity_ok){ return }                               // mode planaire : pas de sol (gravité coupée)
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.blocked){ continue }                         // objet statique : pas de rebond sol
            var hz = o.height/2
            if (o.position.z < hz){
                  o.position.z = hz
                  o.speed.z = -o.speed.z
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
      ground_bounce()                    // rebond sur le sol
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
