/*

Copy / paste objects (Ctrl+C / Ctrl+V).

Choice of the target to COPY (by priority):
  1. Mouse INSIDE the selection area -> all selected objects (list_obj_inside).
  2. Otherwise, hovered object (INTERSECTED):
       - if it belongs to a persistent group -> the whole group (group_members);
       - otherwise -> the object alone.

Pasting (Ctrl+V) recreates the objects at the mouse position (barycenter re-anchored
under the cursor, relative layout preserved), with new names. If the copied ones
formed a persistent group, the copy forms a NEW independent group.

Recreates via load_object() (init_scene.js): handles spheres, cubes, pavements, walls, boxes,
color, radius, mass, velocity, etc. Springs/elastics/pawns/lids are
not copied (recreated otherwise).
*/

var copy_clipboard = null                  // { items:[{data,dx,dy,dz}], groupPaste, cx0,cy0,cz0 }

var COPY_LOADABLE_TYPES = ['sphere', 'simple_cube', 'pavement', 'wall', 'cube_mult_tex', 'wall_box']

// World position of the mouse on the z=0 plane, from the LAST known position
// (the global `mouse` is updated on every mousemove) -> usable in a keydown.
function mouse_world_pos(){
      if (typeof mouse === 'undefined' || !isFinite(mouse.x) || !isFinite(mouse.y)){ return null }
      var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
      vector.unproject(camera)
      var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
      var hits = ray.intersectObject(plane)
      return hits.length ? hits[0].point.clone() : null
}

function copy_is_loadable(o){              // "real" recreatable object (not corner/dotted/spring…)
      if (!o || !o.type || o.del){ return false }
      if (list_sel_corners.indexOf(o) >= 0){ return false }
      if (list_dotted_area.indexOf(o) >= 0){ return false }
      return COPY_LOADABLE_TYPES.indexOf(o.type) >= 0
}

function mouse_in_selection_area(){        // is the mouse inside the selection rectangle?
      if (list_sel_corners.length !== 2){ return false }
      var p = mouse_world_pos()
      if (!p){ return false }
      var a = list_sel_corners[0].position, b = list_sel_corners[1].position
      var minx = Math.min(a.x, b.x), maxx = Math.max(a.x, b.x)
      var miny = Math.min(a.y, b.y), maxy = Math.max(a.y, b.y)
      return (p.x > minx && p.x < maxx && p.y > miny && p.y < maxy)
}

function copy_targets(){                   // list of objects to copy according to the rules above
      // 1) mouse in the area -> the whole selection
      if (list_obj_inside.length > 0 && mouse_in_selection_area()){
            return list_obj_inside.filter(copy_is_loadable)
      }
      // 2) hovered object (+ its group if any)
      if (INTERSECTED && copy_is_loadable(INTERSECTED)){
            if (INTERSECTED.group_id !== undefined && typeof group_members === 'function'){
                  return group_members(INTERSECTED.group_id).filter(copy_is_loadable)
            }
            return [INTERSECTED]
      }
      return []
}

function do_copy(){
      var targets = copy_targets()
      if (!targets.length){ copy_clipboard = null; $('#curr_func').text('nothing to copy'); return }

      // barycenter of the targets = anchor (to re-anchor under the mouse) + z preserved
      var cx=0, cy=0, cz=0
      for (var i=0;i<targets.length;i++){ cx+=targets[i].position.x; cy+=targets[i].position.y; cz+=targets[i].position.z }
      cx/=targets.length; cy/=targets.length; cz/=targets.length

      // persistent group if ALL targets share the same defined group_id
      var gid0 = targets[0].group_id
      var groupPaste = (gid0 !== undefined) && targets.every(function(t){ return t.group_id === gid0 })

      var items = []
      for (var i=0;i<targets.length;i++){
            var o = targets[i]
            // deep copy detached from live references (Vector3 -> {x,y,z})
            var data = JSON.parse(JSON.stringify(make_infos_obj_of(o)))
            items.push({ data: data,
                         dx: o.position.x - cx, dy: o.position.y - cy, dz: o.position.z - cz })
      }
      copy_clipboard = { items: items, groupPaste: groupPaste, cx0: cx, cy0: cy, cz0: cz }
      $('#curr_func').text(items.length + ' object(s) copied')
}

function do_paste(){
      if (!copy_clipboard || !copy_clipboard.items.length){ $('#curr_func').text('clipboard empty'); return }

      // paste base: under the mouse (z preserved); fallback = fixed offset if no mouse
      var anchor = mouse_world_pos()
      var base = anchor ? { x: anchor.x, y: anchor.y, z: copy_clipboard.cz0 }
                        : { x: copy_clipboard.cx0 + 120, y: copy_clipboard.cy0 + 120, z: copy_clipboard.cz0 }

      var newgid = copy_clipboard.groupPaste ? (++group_id_counter) : undefined  // new independent group
      if (newgid !== undefined){ group_highlighted[newgid] = false }

      // Remap the box_id: each copied box becomes a NEW and independent box.
      // Old->new table: all the walls of the same box receive the same new id.
      var box_id_map = {}

      for (var i=0;i<copy_clipboard.items.length;i++){
            var it = copy_clipboard.items[i]
            var name = random_name()
            var data = JSON.parse(JSON.stringify(it.data))          // fresh copy per paste
            data.pos = { x: base.x + it.dx, y: base.y + it.dy, z: base.z + it.dz }
            if (newgid !== undefined){ data.group_id = newgid } else { delete data.group_id }
            if (data.box_id !== undefined){                         // box wall -> new box id
                  if (box_id_map[data.box_id] === undefined){ box_id_map[data.box_id] = ++box_id_counter }
                  data.box_id = box_id_map[data.box_id]
            }
            var msg = {}; msg[name] = data
            load_object(name, msg)                                  // recreates the object (scene + objects + physics)
      }
      $('#curr_func').text(copy_clipboard.items.length + ' object(s) pasted')
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }   // persists the scene
}
