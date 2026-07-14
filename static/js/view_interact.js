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

//======================================================================
// Positionnement caméra par GLISSER (touche k)
//   mousedown : fixe A (future position caméra)
//   déplacement : flèche orientée de A vers la souris + ligne pointillée
//   mouseup : place la caméra en A regardant vers B (le relâcher), puis efface les repères
//======================================================================

var POSCAM_Z = 8                                   // légère hauteur des repères pour ne pas z-fighter avec le sol
var POSCAM_COLOR = 0xff6600                         // orange (flèche, marqueur, pointillés)
var POSCAM_MIN_DRAG = 20                            // glisser minimal (unités scène) pour valider une vue (évite A=B -> vue figée)

function poscam_plane_point(event){                // intersection du curseur avec le plan du sol (z ≈ 0)
      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObject(plane)
      return hits.length ? hits[0].point.clone() : null
}

function poscam_clear(){                            // retire marqueur A, flèche et ligne pointillée
      if (poscam_marker){ scene.remove(poscam_marker); poscam_marker = null }
      if (poscam_arrow){ scene.remove(poscam_arrow); poscam_arrow = null }
      if (poscam_line){ scene.remove(poscam_line);  poscam_line  = null }
}

function poscam_draw(B){                            // (re)dessine flèche A->B + pointillés (repères NON ajoutés à objects[])
      var from = new THREE.Vector3(poscam_A.x, poscam_A.y, POSCAM_Z)
      var to   = new THREE.Vector3(B.x, B.y, POSCAM_Z)
      var d = to.clone().sub(from)
      var len = d.length()
      //--- flèche (recréée à chaque déplacement)
      if (poscam_arrow){ scene.remove(poscam_arrow); poscam_arrow = null }
      if (len > 1e-3){
            var head = Math.min(60, len * 0.3)
            poscam_arrow = new THREE.ArrowHelper(d.clone().normalize(), from, len, POSCAM_COLOR, head, head * 0.6)
            scene.add(poscam_arrow)
      }
      //--- ligne pointillée
      if (poscam_line){ scene.remove(poscam_line); poscam_line = null }
      var geom = new THREE.Geometry()
      geom.vertices.push(from.clone(), to.clone())
      geom.computeLineDistances()                  // requis pour LineDashedMaterial
      poscam_line = new THREE.Line(geom, new THREE.LineDashedMaterial({ color: POSCAM_COLOR, dashSize: 18, gapSize: 12 }))
      scene.add(poscam_line)
}

function poscam_begin(event){                      // clic : fixe A et amorce le glisser
      var P = poscam_plane_point(event)
      if (!P){ return }
      poscam_clear()
      poscam_A = P
      poscam_dragging = true
      controls.enabled = false                     // pas de rotation trackball pendant le glisser
      poscam_marker = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 12),
                                     new THREE.MeshBasicMaterial({ color: POSCAM_COLOR }))
      poscam_marker.position.set(poscam_A.x, poscam_A.y, POSCAM_Z)
      scene.add(poscam_marker)
      poscam_draw(poscam_A)                         // flèche de longueur nulle au départ
}

function poscam_update(event){                     // déplacement : flèche/pointillés suivent la souris
      if (!poscam_dragging){ return }
      var B = poscam_plane_point(event)
      if (B){ poscam_draw(B) }
}

function poscam_end(event){                         // relâcher : applique la vue puis efface les repères
      if (!poscam_dragging){ return }
      var A = poscam_A
      var B = poscam_plane_point(event)
      //--- on restaure TOUJOURS l'état (repères, contrôles, drapeaux), quoi qu'il arrive
      poscam_clear()
      poscam_dragging = false
      select_poscam = false
      controls.enabled = true
      $('#curr_func').css('background-color','blue')
      poscam_A = null
      //--- on n'applique la vue QUE si le glisser a une direction exploitable
      //    (un clic sans glisser donnerait A=B -> caméra = cible -> TrackballControls figé)
      if (A && B){
            var dx = B.x - A.x, dy = B.y - A.y
            if (dx*dx + dy*dy >= POSCAM_MIN_DRAG * POSCAM_MIN_DRAG){
                  camera_pos_orient(A, B, 250)       // caméra en A, regarde vers B (altitude 250, comme avant)
            }
      }
}
