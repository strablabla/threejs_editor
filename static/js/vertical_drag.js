/*

Moving an object in a VERTICAL PLANE (double-click).

The normal drag projects the mouse onto the ground plane (`plane`, horizontal z=0) and keeps z constant
(see mouse_move_interact.js): impossible to change the altitude. Hence a second projection support,
VERTICAL: `vdrag_plane`, a plane that contains the object and the vertical, oriented facing the camera.

In this plane the movement is FREE (two degrees of freedom): in height (z) and laterally along
the horizontal direction of the plane. The object never leaves the plane.

Life cycle (persistent mode):
      double-click on an object -> the plane appears, the object enters vertical plane mode
      drag on the object        -> it follows the mouse IN the plane; as many times as wanted
      Esc / 2nd double-click /  -> exit the mode, the plane disappears
      click in the void            (+ auto exit if the object is deleted: vdrag_check_alive)

The state (vdrag_obj, vdrag_plane, vdrag_dragging, vdrag_pos0, vdrag_hit0) is declared in scene_params.js.

*/

var VDRAG_SIZE = 2000        // side of the plane: large enough that the mouse NEVER leaves the support during a
                             // drag. The plane is re-oriented on EACH grab (mousedown) but stays FROZEN during the
                             // drag: if it followed the object, moving the object would move the support -> loop.
var VDRAG_SEGS = 10          // 10x10 cells -> readable grid (cells of 200)

function init_vertical_drag(){

      /*
      Creates the vertical plane (hidden) and wires up the mode's inputs.
      Called from init() AFTER the creation of renderer (we need renderer.domElement).
      */

      var geom = new THREE.PlaneGeometry( VDRAG_SIZE, VDRAG_SIZE, VDRAG_SEGS, VDRAG_SEGS )
      var mat = new THREE.MeshBasicMaterial( { color: 0x2e7d32, opacity: 0.35, transparent: true,
                                               wireframe: true, side: THREE.DoubleSide } )   // DoubleSide: clickable from both sides
      vdrag_plane = new THREE.Mesh( geom, mat )
      vdrag_plane.up.set(0, 0, 1)          // « up » = z: lookAt() will align the local Y axis with the world vertical
      vdrag_plane.visible = false
      scene.add( vdrag_plane )
      // NB: vdrag_plane is NOT pushed into `objects` -> intersectObjects(objects) never touches it.

      renderer.domElement.addEventListener( 'dblclick', vdrag_dblclick, false )
      document.addEventListener( 'keydown', function(event){
            if (event.keyCode === 27 && vdrag_obj){ exit_vertical_mode() }      // Esc = exit
      }, false )

}

function vdrag_orient_plane(obj){

      /*
      Places the plane on the object and orients it facing the camera while staying VERTICAL:
      its normal is the object->camera direction stripped of its z component.
      */

      var n = new THREE.Vector3(camera.position.x - obj.position.x,
                                camera.position.y - obj.position.y, 0)
      if (n.lengthSq() < 1e-6){ n.set(1, 0, 0) }        // camera directly above the object: undefined normal -> x axis by default
      n.normalize()
      vdrag_plane.position.copy(obj.position)
      vdrag_plane.lookAt(new THREE.Vector3().addVectors(obj.position, n))   // local +Z -> n ; up=(0,0,1) => local Y = vertical
      vdrag_plane.visible = true
      vdrag_plane.updateMatrixWorld(true)   // ESSENTIAL: Mesh.raycast projects the ray via matrixWorld, which is
                                            // only refreshed at the next render(). Without this, the mousedown raycast (same tick
                                            // as the re-orientation) would use the OLD orientation and miss the plane.

}

function enter_vertical_mode(obj){

      vdrag_obj = obj
      vdrag_orient_plane(obj)
      container.style.cursor = 'move'

}

function exit_vertical_mode(){

      vdrag_obj = null
      vdrag_dragging = false
      if (vdrag_plane){ vdrag_plane.visible = false }
      controls.enabled = true
      container.style.cursor = 'auto'

}

function vdrag_dblclick(event){

      /*
      Double-click: toggles altitude mode on the targeted object.
      On the SAME object -> exit; on another -> we switch to it; in the void -> exit.
      */

      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObjects( objects )
      if (!hits.length){ exit_vertical_mode(); return }
      var obj = hits[0].object
      if (vdrag_obj === obj){ exit_vertical_mode() } else { enter_vertical_mode(obj) }

}

function vdrag_hit_point(raycaster){

      /*
      Point targeted by the mouse ON the vertical plane (Vector3), or null if the mouse is off the plane.
      */

      var hits = raycaster.intersectObject( vdrag_plane )
      return hits.length ? hits[0].point : null

}

function vdrag_mouse_down(event){

      /*
      Returns true if the click is consumed by altitude mode (the caller must then stop there,
      so as NOT to trigger the usual selection/horizontal drag).
      */

      if (!vdrag_obj){ return false }
      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObjects( objects )
      if (!hits.length || hits[0].object !== vdrag_obj){    // click elsewhere -> we leave the mode and let
            exit_vertical_mode()                            // the normal processing (selection, creation...) continue
            return false
      }
      vdrag_orient_plane(vdrag_obj)                         // the camera may have turned since entering the mode: we put
                                                            // the plane facing it BEFORE measuring the anchor point, otherwise
                                                            // a plane seen edge-on makes the drag unusable
      var hit = vdrag_hit_point(raycaster)
      if (!hit){ return false }
      vdrag_dragging = true
      vdrag_pos0 = vdrag_obj.position.clone()               // RELATIVE drag: the object does not jump under the cursor on click
      vdrag_hit0 = hit.clone()
      controls.enabled = false                              // the trackball must not rotate during the drag
      container.style.cursor = 'move'

      return true

}

function vdrag_mouse_move(event){

      /*
      FREE drag in the plane: the object follows the anchor point, in height as well as laterally.

      The applied displacement is (targeted point − anchor point). These two points belong to the
      SAME plane, so their difference is a vector OF the plane: the object slides in the vertical plane
      without ever leaving it — its component along the normal stays rigorously constant.
      */

      var hit = vdrag_hit_point(make_raycaster(event))
      if (!hit){ return }
      vdrag_obj.position.copy(vdrag_pos0).add(hit.clone().sub(vdrag_hit0))   // clone: sub() would modify the intersection point

}

function vdrag_check_alive(){

      /*
      Automatic exit if the tracked object has disappeared (key « d », deletion of an area, loading
      of another scene): without this the plane would stay displayed, attached to an object removed from the scene.
      Called on each frame from render(); the test short-circuits outside altitude mode.
      */

      if (vdrag_obj && (vdrag_obj.del || objects.indexOf(vdrag_obj) < 0)){ exit_vertical_mode() }

}

function vdrag_mouse_up(){

      /*
      End of the drag — we STAY in altitude mode (persistent mode: we can readjust right away).
      Scene persistence is handled by emit_infos_scene (separate 'mouseup' listener).
      */

      vdrag_dragging = false
      if (vdrag_obj){ vdrag_orient_plane(vdrag_obj) }       // the camera may have moved between two drags: we re-orient

}
