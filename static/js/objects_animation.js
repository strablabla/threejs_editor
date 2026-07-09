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
          for (var i=0; i< list_moving_objects.length; i++){
                for (var j=i+1; j <  list_moving_objects.length; j++){
                      if ( allow_interaction_ij(i,j) ) { interaction_between_ij(i,j) } // i j interaction
                  } // end for j
            } // end for i
      } // end if in moving_objects
      // (plus de recoloration rose/rouge : on préserve les couleurs des objets)

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

function collect_altitudes(){                                 // z des objets massifs mobiles (mêmes exclusions que l'énergie cinétique)
      var zs = []
      for (var i in list_moving_objects){
            var obj = list_moving_objects[i]
            if (obj.blocked){ continue }
            if (list_forbid_obj_for_interact.indexOf(obj.type) != -1){ continue }
            zs.push(obj.position.z)
      }
      return zs
}

function draw_altitude_hist(){

      /*
      Nombre de particules en fonction de l'altitude (z).
      Axe VERTICAL = altitude (haut = z max), barres horizontales = comptage par tranche.
      */

      if (!show_altitude_hist){ return }
      var cv = document.getElementById('altitude_hist')
      if (!cv){ return }
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
      var ML = 46, MT = 6, MB = 16, MR = 6
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

}

//===================================================================== Trajectoires + MSD

var TRAJ_MAX = 200000                                       // échantillons max par trajectoire (borne mémoire, ~1h @60fps)
var TRAJ_DRAW_MAX = 2000                                    // points max tracés par courbe (décimation -> rendu rapide)
function traj_color(obj){                                   // couleur RÉELLE de la boule (currentHex = teinte hors surbrillance)
      var hex = (obj.currentHex !== undefined) ? obj.currentHex : obj.material.color.getHex()
      return '#' + ('000000' + hex.toString(16)).slice(-6)
}

function tracked_objects(){                                 // objets dont la trajectoire est suivie
      var a = []
      for (var k in objects){ if (objects[k] && objects[k].track_trajectory){ a.push(objects[k]) } }
      return a
}

function reset_trajectory(obj){                             // (re)démarre l'enregistrement à partir de la position courante
      obj.traj = { x:[], y:[], msd:[], x0:null, y0:null, z0:null }
}

function reset_all_trajectories(){
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
            tr.x.push(o.position.x); tr.y.push(o.position.y); tr.msd.push(dx*dx+dy*dy+dz*dz)          // |r-r0|²
            if (tr.x.length > TRAJ_MAX){ tr.x.shift(); tr.y.shift(); tr.msd.shift() }
      }
      draw_trajectories()

}

function traj_stride(n){ return Math.max(1, Math.ceil(n / TRAJ_DRAW_MAX)) }  // décimation : au plus TRAJ_DRAW_MAX points

function draw_trajectories(){

      var t = tracked_objects()

      //---- fenêtre 1 : trajectoires (projection x-y, échelle isotrope) ----
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
                  var span=Math.max((xmax-xmin)||1,(ymax-ymin)||1)
                  var cxx=(xmin+xmax)/2, cyy=(ymin+ymax)/2, pad=10, S=(Math.min(W,H)-2*pad)/(span*1.1)
                  var PX=function(x){ return W/2 + (x-cxx)*S }
                  var PY=function(y){ return H/2 - (y-cyy)*S }
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||tr.x.length<2)continue
                        var n=tr.x.length, st=traj_stride(n), col=traj_color(t[i])
                        ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=PX(tr.x[k]),Y=PY(tr.y[k]); if(first){ctx.moveTo(X,Y);first=false}else ctx.lineTo(X,Y) }
                        ctx.lineTo(PX(tr.x[n-1]),PY(tr.y[n-1]))   // dernier point
                        ctx.stroke()
                        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(tr.x[n-1]),PY(tr.y[n-1]),3,0,2*Math.PI); ctx.fill()
                  }
            }
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
                  var ML=46, MT=6, MB=6, plotW=W2-ML-4, plotH=H2-MT-MB
                  var MX=function(k){ return ML + k/(nmax-1)*plotW }
                  var MY=function(v){ return MT + (1 - v/vmaxm)*plotH }
                  c2.font='10px sans-serif'; c2.fillStyle='#666'; c2.textAlign='right'; c2.textBaseline='middle'
                  for (var g=0;g<=4;g++){ var v=vmaxm*g/4, y=MY(v); c2.strokeStyle='#eee'; c2.lineWidth=1
                        c2.beginPath(); c2.moveTo(ML,y); c2.lineTo(W2-4,y); c2.stroke(); c2.fillText(fmt_energy(v),ML-4,y) }
                  for (var i=0;i<t.length;i++){ var tr=t[i].traj; if(!tr||tr.msd.length<2)continue
                        var n=tr.msd.length, st=traj_stride(n)
                        c2.strokeStyle=traj_color(t[i]); c2.lineWidth=1.5; c2.beginPath()
                        var first=true
                        for (var k=0;k<n;k+=st){ var X=MX(k),Y=MY(tr.msd[k]); if(first){c2.moveTo(X,Y);first=false}else c2.lineTo(X,Y) }
                        c2.lineTo(MX(n-1),MY(tr.msd[n-1]))        // dernier point
                        c2.stroke()
                  }
            }
      }

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
            prevTime = time;
        }
        else{ prevTime = performance.now() }
}

// Quand l'onglet redevient visible, repartir d'un delta ~0 (pas de saut au retour d'arrière-plan)
if (typeof document !== 'undefined'){
      document.addEventListener('visibilitychange', function(){
            if (!document.hidden){ prevTime = performance.now() }
      })
}
