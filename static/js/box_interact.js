/*

Fonctionnalités de boîte (clic droit sur une paroi) :
 - regroupement des 4 parois d'une même boîte (box_id)
 - ajout de boules à l'intérieur
 - couvercle (plafond) qui empêche les boules de dépasser le haut
 - réglage de la hauteur de la boîte

*/

function get_box_walls(wall){

      /*
      Renvoie toutes les parois partageant le box_id de 'wall' (sinon la paroi seule).
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
      Emprise x-y intérieure + hauteur de la boîte, déduite des positions des parois.
      Les parois de normale x donnent les bornes en x ; celles de normale y, les bornes en y.
      */

      var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity, h = 150
      for (var i=0;i<walls.length;i++){
            var w = walls[i]
            h = w.height
            if (Math.abs(w.orientation.x) > 0.5){           // normale x -> borne en x
                  if (w.position.x < xmin) xmin = w.position.x
                  if (w.position.x > xmax) xmax = w.position.x
            } else {                                        // normale y -> borne en y
                  if (w.position.y < ymin) ymin = w.position.y
                  if (w.position.y > ymax) ymax = w.position.y
            }
      }
      return { xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax, height:h }
}

function add_balls_in_box(wall, count){

      /*
      Ajoute 'count' boules à des positions aléatoires DANS la boîte (plan z = 0),
      avec la vitesse initiale courante (Initial speeds).
      */

      var walls = get_box_walls(wall)
      var b = get_box_bounds(walls)
      if (!(b.xmax > b.xmin && b.ymax > b.ymin)){ return }  // emprise invalide
      var m = radius_spring + 5                              // marge aux parois
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
      Change la hauteur (z) des parois de la boîte et repositionne le couvercle éventuel.
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
      var li = box_lid_index(wall.box_id)                   // suit le couvercle
      if (li >= 0){ list_lids[li].z = H; list_lids[li].mesh.position.z = H }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}

function box_lid_index(box_id){
      for (var i=0;i<list_lids.length;i++){ if (list_lids[i].box_id === box_id){ return i } }
      return -1
}

function add_lid(wall){

      /*
      Crée un couvercle : panneau horizontal semi-transparent au sommet de la boîte
      + contrainte de plafond (voir lid_bounce dans objects_animation.js).
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

function restore_lids(msg){

      /*
      Recrée les couvercles sauvegardés (clé _lids) : pour chaque box_id, on retrouve une
      paroi de la boîte (déjà chargée) et on rappelle add_lid, puis on remet l'opacité.
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
