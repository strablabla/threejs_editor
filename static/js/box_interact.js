/*

Box features (right-click on a wall):
 - grouping of the 4 walls of the same box (box_id)
 - adding balls inside
 - lid (ceiling) that prevents balls from going past the top
 - adjusting the height of the box

*/

function get_box_walls(wall){

      /*
      Returns all the walls sharing the box_id of 'wall' (otherwise the wall alone).
      */

      if (wall.box_id === undefined){ return [wall] }
      var res = []
      for (var i in objects){
            if (objects[i].type === 'wall_box' && objects[i].box_id === wall.box_id){ res.push(objects[i]) }
      }
      return res
}

function get_box_bounds(walls){

      /*
      Inner x-y footprint + height of the box, deduced from the wall positions.
      Walls with x normal give the x bounds; those with y normal, the y bounds.
      */

      var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity, h = 150
      for (var i=0;i<walls.length;i++){
            var w = walls[i]
            h = w.height
            if (Math.abs(w.orientation.x) > 0.5){           // x normal -> x bound
                  if (w.position.x < xmin) xmin = w.position.x
                  if (w.position.x > xmax) xmax = w.position.x
            } else {                                        // y normal -> y bound
                  if (w.position.y < ymin) ymin = w.position.y
                  if (w.position.y > ymax) ymax = w.position.y
            }
      }
      return { xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax, height:h }
}

function add_balls_in_box(wall, count){

      /*
      Adds 'count' balls at random positions INSIDE the box (z = 0 plane),
      with the current initial velocity (Initial speeds).
      */

      var walls = get_box_walls(wall)
      var b = get_box_bounds(walls)
      if (!(b.xmax > b.xmin && b.ymax > b.ymin)){ return }  // invalid footprint
      var m = radius_spring + 5                              // margin to the walls
      var xspan = (b.xmax - b.xmin) - 2*m, yspan = (b.ymax - b.ymin) - 2*m
      if (xspan <= 0 || yspan <= 0){ return }
      var coords = random_speed_z ? ['x','y','z'] : ['x','y']
      for (var k=0;k<count;k++){
            var x = b.xmin + m + Math.random()*xspan
            var y = b.ymin + m + Math.random()*yspan
            var sph = basic_sphere(random_name(), {"x":x, "y":y, "z":0}, {"x":0,"y":0,"z":0}, color_sphere_default)
            random_speed_chose_xyz(sph, coords)
            sph.magnet = false
            list_moving_objects.push(sph)
      }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}

function set_box_height(wall, H){

      /*
      Changes the height (z) of the box walls and repositions the lid if any.
      */

      if (H <= 0){ return }
      var walls = get_box_walls(wall)
      for (var i=0;i<walls.length;i++){
            var w = walls[i]
            if (w.geometry && w.geometry.dispose){ w.geometry.dispose() }
            w.geometry = new THREE.CubeGeometry(w.thickness, w.width, H)
            w.position.z = H/2
            w.height = H
      }
      var li = box_lid_index(wall.box_id)                   // follows the lid
      if (li >= 0){ list_lids[li].z = H; list_lids[li].mesh.position.z = H }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}

function box_lid_index(box_id){
      for (var i=0;i<list_lids.length;i++){ if (list_lids[i].box_id === box_id){ return i } }
      return -1
}

function add_lid(wall){

      /*
      Creates a lid: semi-transparent horizontal panel at the top of the box
      + ceiling constraint (see lid_bounce in objects_animation.js).
      */

      if (wall.box_id === undefined || box_lid_index(wall.box_id) >= 0){ return }
      var walls = get_box_walls(wall)
      var b = get_box_bounds(walls)
      var sx = b.xmax - b.xmin, sy = b.ymax - b.ymin
      var geom = new THREE.BoxGeometry(sx, sy, 4)
      var mat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.3 })
      var mesh = new THREE.Mesh(geom, mat)
      mesh.position.set((b.xmin+b.xmax)/2, (b.ymin+b.ymax)/2, b.height)
      mesh.type = 'lid'
      mesh.box_id = wall.box_id
      scene.add(mesh)
      objects.push(mesh)
      list_lids.push({ box_id: wall.box_id, mesh: mesh, bounds: b, z: b.height })
}

function remove_lid(box_id){

      var idx = box_lid_index(box_id)
      if (idx < 0){ return }
      var lid = list_lids[idx]
      scene.remove(lid.mesh)
      var oi = objects.indexOf(lid.mesh)
      if (oi >= 0){ objects.splice(oi, 1) }
      list_lids.splice(idx, 1)
}

function set_box_movable(wall, val){

      /*
      Allows (or blocks) moving a box: marks all its walls.
      */

      var walls = get_box_walls(wall)
      for (var i=0;i<walls.length;i++){ walls[i].movable = val }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}

function box_parts(wall){

      /*
      Elements moved as a block: the box walls + its lid if any.
      */

      var parts = get_box_walls(wall).slice()
      var li = box_lid_index(wall.box_id)
      if (li >= 0){ parts.push(list_lids[li].mesh) }
      return parts
}

function box_drag_begin(planePoint){

      /*
      Starts moving a box if the grabbed wall (SELECTED) is "movable".
      Stores the original positions and the grab point (relative move -> no jump).
      */

      dragging_box = false
      var parts = null
      if (SELECTED && SELECTED.type === 'wall_box' && SELECTED.movable){
            parts = box_parts(SELECTED)                                // movable box: walls + lid
      } else if (SELECTED && SELECTED.group_id !== undefined && typeof group_members === 'function'){
            parts = group_members(SELECTED.group_id)                   // persistent group (Ctrl+Shift+G)
      }
      if (parts && parts.length > 1){
            box_drag_parts = parts
            box_drag_orig = []
            for (var i=0;i<box_drag_parts.length;i++){
                  var p = box_drag_parts[i].position
                  box_drag_orig.push({ x:p.x, y:p.y, z:p.z })
            }
            box_drag_anchor = { x: planePoint.x, y: planePoint.y }
            box_drag_sel = (SELECTED.group_id !== undefined)           // persistent group: the selection area follows
            box_drag_dotted_orig = []
            box_drag_corners_orig = []
            if (box_drag_sel){
                  for (var i=0;i<list_dotted_area.length;i++){ var pd = list_dotted_area[i].position; box_drag_dotted_orig.push({ x:pd.x, y:pd.y }) }
                  for (var i=0;i<list_sel_corners.length;i++){ var pc = list_sel_corners[i].position; box_drag_corners_orig.push({ x:pc.x, y:pc.y }) }
            }
            nearest_elem = null
            dragging_box = true
      }
}

function box_drag_move(planePoint){

      /*
      Moves all parts of the box by the same vector (mouse − grab).
      */

      var dx = planePoint.x - box_drag_anchor.x, dy = planePoint.y - box_drag_anchor.y
      for (var i=0;i<box_drag_parts.length;i++){
            box_drag_parts[i].position.x = box_drag_orig[i].x + dx
            box_drag_parts[i].position.y = box_drag_orig[i].y + dy   // z unchanged (move in the plane)
      }
      if (box_drag_sel){                                              // the selection area follows the persistent group
            for (var i=0;i<list_dotted_area.length;i++){
                  if (box_drag_dotted_orig[i]){ list_dotted_area[i].position.x = box_drag_dotted_orig[i].x + dx; list_dotted_area[i].position.y = box_drag_dotted_orig[i].y + dy }
            }
            for (var i=0;i<list_sel_corners.length;i++){
                  if (box_drag_corners_orig[i]){ list_sel_corners[i].position.x = box_drag_corners_orig[i].x + dx; list_sel_corners[i].position.y = box_drag_corners_orig[i].y + dy }
            }
      }
      if (SELECTED && SELECTED.box_id !== undefined){                 // update the lid footprint after the move
            var li = box_lid_index(SELECTED.box_id)
            if (li >= 0){ list_lids[li].bounds = get_box_bounds(get_box_walls(SELECTED)) }
      }
}

function box_drag_end(){

      if (dragging_box){
            dragging_box = false
            box_drag_sel = false
            box_drag_parts = []
            if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }   // persists the new positions
      }
}

function restore_lids(msg){

      /*
      Recreates the saved lids (key _lids): for each box_id, we find a
      wall of the box (already loaded) and call add_lid again, then restore the opacity.
      */

      if (!msg['_lids']){ return }
      for (var k in msg['_lids']){
            var info = msg['_lids'][k]
            var wall = null
            for (var i in objects){
                  if (objects[i].type === 'wall_box' && objects[i].box_id === info.box_id){ wall = objects[i]; break }
            }
            if (!wall){ continue }
            add_lid(wall)
            var idx = box_lid_index(info.box_id)
            if (idx >= 0 && info.opacity !== undefined){
                  list_lids[idx].mesh.material.opacity = info.opacity
                  list_lids[idx].mesh.material.transparent = true
                  list_lids[idx].mesh.material.needsUpdate = true
            }
      }
}
