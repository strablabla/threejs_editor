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
// Camera positioning by DRAGGING (key k)
//   mousedown: sets A (future camera position)
//   drag: arrow pointing from A toward the mouse + dashed line
//   mouseup: places the camera at A looking toward B (the release point), then clears the markers
//======================================================================

var POSCAM_Z = 8                                   // slight height of the markers to avoid z-fighting with the ground
var POSCAM_COLOR = 0xff6600                         // orange (arrow, marker, dashes)
var POSCAM_MIN_DRAG = 20                            // minimal drag (scene units) to validate a view (avoids A=B -> frozen view)

function poscam_plane_point(event){                // intersection of the cursor with the ground plane (z ≈ 0)
      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObject(plane)
      return hits.length ? hits[0].point.clone() : null
}

function poscam_clear(){                            // removes marker A, arrow and dashed line
      if (poscam_marker){ scene.remove(poscam_marker); poscam_marker = null }
      if (poscam_arrow){ scene.remove(poscam_arrow); poscam_arrow = null }
      if (poscam_line){ scene.remove(poscam_line);  poscam_line  = null }
}

function poscam_draw(B){                            // (re)draws arrow A->B + dashes (markers NOT added to objects[])
      var from = new THREE.Vector3(poscam_A.x, poscam_A.y, POSCAM_Z)
      var to   = new THREE.Vector3(B.x, B.y, POSCAM_Z)
      var d = to.clone().sub(from)
      var len = d.length()
      //--- arrow (recreated on each move)
      if (poscam_arrow){ scene.remove(poscam_arrow); poscam_arrow = null }
      if (len > 1e-3){
            var head = Math.min(60, len * 0.3)
            poscam_arrow = new THREE.ArrowHelper(d.clone().normalize(), from, len, POSCAM_COLOR, head, head * 0.6)
            scene.add(poscam_arrow)
      }
      //--- dashed line
      if (poscam_line){ scene.remove(poscam_line); poscam_line = null }
      var geom = new THREE.Geometry()
      geom.vertices.push(from.clone(), to.clone())
      geom.computeLineDistances()                  // required for LineDashedMaterial
      poscam_line = new THREE.Line(geom, new THREE.LineDashedMaterial({ color: POSCAM_COLOR, dashSize: 18, gapSize: 12 }))
      scene.add(poscam_line)
}

function poscam_begin(event){                      // click: sets A and starts the drag
      var P = poscam_plane_point(event)
      if (!P){ return }
      poscam_clear()
      poscam_A = P
      poscam_dragging = true
      controls.enabled = false                     // no trackball rotation during the drag
      poscam_marker = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 12),
                                     new THREE.MeshBasicMaterial({ color: POSCAM_COLOR }))
      poscam_marker.position.set(poscam_A.x, poscam_A.y, POSCAM_Z)
      scene.add(poscam_marker)
      poscam_draw(poscam_A)                         // zero-length arrow at the start
}

function poscam_update(event){                     // drag: arrow/dashes follow the mouse
      if (!poscam_dragging){ return }
      var B = poscam_plane_point(event)
      if (B){ poscam_draw(B) }
}

function poscam_end(event){                         // release: applies the view then clears the markers
      if (!poscam_dragging){ return }
      var A = poscam_A
      var B = poscam_plane_point(event)
      //--- we ALWAYS restore the state (markers, controls, flags), whatever happens
      poscam_clear()
      poscam_dragging = false
      select_poscam = false
      controls.enabled = true
      $('#curr_func').css('background-color','blue')
      poscam_A = null
      //--- we apply the view ONLY if the drag has a usable direction
      //    (a click without dragging would give A=B -> camera = target -> TrackballControls frozen)
      if (A && B){
            var dx = B.x - A.x, dy = B.y - A.y
            if (dx*dx + dy*dy >= POSCAM_MIN_DRAG * POSCAM_MIN_DRAG){
                  camera_pos_orient(A, B, 250)       // camera at A, looks toward B (altitude 250, as before)
            }
      }
}
