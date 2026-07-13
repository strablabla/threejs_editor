/*

Copier / coller d'objets (Ctrl+C / Ctrl+V).

Choix de la cible à COPIER (par priorité) :
  1. Souris DANS la zone de sélection -> tous les objets sélectionnés (list_obj_inside).
  2. Sinon, objet survolé (INTERSECTED) :
       - s'il appartient à un groupe persistant -> tout le groupe (group_members) ;
       - sinon -> l'objet seul.

Le collage (Ctrl+V) recrée les objets à la position de la souris (barycentre recollé
sous le curseur, disposition relative conservée), avec de nouveaux noms. Si les copiés
formaient un groupe persistant, la copie forme un NOUVEAU groupe indépendant.

Recrée via load_object() (init_scene.js) : gère sphères, cubes, pavés, murs, boîtes,
couleur, rayon, masse, vitesse, etc. Les ressorts/élastiques/pions/couvercles ne sont
pas copiés (recréés autrement).
*/

var copy_clipboard = null                  // { items:[{data,dx,dy,dz}], groupPaste, cx0,cy0,cz0 }

var COPY_LOADABLE_TYPES = ['sphere', 'simple_cube', 'pavement', 'wall', 'cube_mult_tex', 'wall_box']

// Position monde de la souris sur le plan z=0, à partir de la DERNIÈRE position connue
// (le global `mouse` est mis à jour à chaque mousemove) -> utilisable dans un keydown.
function mouse_world_pos(){
      if (typeof mouse === 'undefined' || !isFinite(mouse.x) || !isFinite(mouse.y)){ return null }
      var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
      vector.unproject(camera)
      var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
      var hits = ray.intersectObject(plane)
      return hits.length ? hits[0].point.clone() : null
}

function copy_is_loadable(o){              // objet "réel" recréable (pas coin/pointillé/ressort…)
      if (!o || !o.type || o.del){ return false }
      if (list_sel_corners.indexOf(o) >= 0){ return false }
      if (list_dotted_area.indexOf(o) >= 0){ return false }
      return COPY_LOADABLE_TYPES.indexOf(o.type) >= 0
}

function mouse_in_selection_area(){        // la souris est-elle dans le rectangle de sélection ?
      if (list_sel_corners.length !== 2){ return false }
      var p = mouse_world_pos()
      if (!p){ return false }
      var a = list_sel_corners[0].position, b = list_sel_corners[1].position
      var minx = Math.min(a.x, b.x), maxx = Math.max(a.x, b.x)
      var miny = Math.min(a.y, b.y), maxy = Math.max(a.y, b.y)
      return (p.x > minx && p.x < maxx && p.y > miny && p.y < maxy)
}

function copy_targets(){                   // liste des objets à copier selon les règles ci-dessus
      // 1) souris dans la zone -> toute la sélection
      if (list_obj_inside.length > 0 && mouse_in_selection_area()){
            return list_obj_inside.filter(copy_is_loadable)
      }
      // 2) objet survolé (+ son groupe éventuel)
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

      // barycentre des cibles = ancre (pour recoller sous la souris) + z conservé
      var cx=0, cy=0, cz=0
      for (var i=0;i<targets.length;i++){ cx+=targets[i].position.x; cy+=targets[i].position.y; cz+=targets[i].position.z }
      cx/=targets.length; cy/=targets.length; cz/=targets.length

      // groupe persistant si TOUTES les cibles partagent un même group_id défini
      var gid0 = targets[0].group_id
      var groupPaste = (gid0 !== undefined) && targets.every(function(t){ return t.group_id === gid0 })

      var items = []
      for (var i=0;i<targets.length;i++){
            var o = targets[i]
            // deep copy détachée des références vives (Vector3 -> {x,y,z})
            var data = JSON.parse(JSON.stringify(make_infos_obj_of(o)))
            items.push({ data: data,
                         dx: o.position.x - cx, dy: o.position.y - cy, dz: o.position.z - cz })
      }
      copy_clipboard = { items: items, groupPaste: groupPaste, cx0: cx, cy0: cy, cz0: cz }
      $('#curr_func').text(items.length + ' object(s) copied')
}

function do_paste(){
      if (!copy_clipboard || !copy_clipboard.items.length){ $('#curr_func').text('clipboard empty'); return }

      // base de collage : sous la souris (z conservé) ; repli = décalage fixe si pas de souris
      var anchor = mouse_world_pos()
      var base = anchor ? { x: anchor.x, y: anchor.y, z: copy_clipboard.cz0 }
                        : { x: copy_clipboard.cx0 + 120, y: copy_clipboard.cy0 + 120, z: copy_clipboard.cz0 }

      var newgid = copy_clipboard.groupPaste ? (++group_id_counter) : undefined  // nouveau groupe indépendant
      if (newgid !== undefined){ group_highlighted[newgid] = false }

      // Remappe les box_id : chaque boîte copiée devient une boîte NEUVE et indépendante.
      // Table ancien->nouveau : toutes les parois d'une même boîte reçoivent le même nouvel id.
      var box_id_map = {}

      for (var i=0;i<copy_clipboard.items.length;i++){
            var it = copy_clipboard.items[i]
            var name = random_name()
            var data = JSON.parse(JSON.stringify(it.data))          // recopie fraîche par collage
            data.pos = { x: base.x + it.dx, y: base.y + it.dy, z: base.z + it.dz }
            if (newgid !== undefined){ data.group_id = newgid } else { delete data.group_id }
            if (data.box_id !== undefined){                         // paroi de boîte -> nouvel id de boîte
                  if (box_id_map[data.box_id] === undefined){ box_id_map[data.box_id] = ++box_id_counter }
                  data.box_id = box_id_map[data.box_id]
            }
            var msg = {}; msg[name] = data
            load_object(name, msg)                                  // recrée l'objet (scène + objects + physique)
      }
      $('#curr_func').text(copy_clipboard.items.length + ' object(s) pasted')
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }   // persiste la scène
}
