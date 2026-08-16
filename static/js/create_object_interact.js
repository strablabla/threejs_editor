/*

Create object

*/

//--------------------------  Parallelepipedic shapes

var dict_parall = {}

function gaussianRand() {

      /*
      Gaussian random output
      */

      var rand = 0;
      for (var i = 0; i < 6; i += 1) { rand += Math.random() }
      
      return rand / 6;
}

function gaussianRandom(start, end) {

      /*
      Gaussian random output with limits
      */

      return start + gaussianRand() * (end - start + 1);
}

function make_new_parallelepiped(make_type){

      /*
      Make a new parallelepiped
      */

      var [newname, interptsub] = random_name_mousepos()
      basic_tex = new THREE.ImageUtils.loadTexture( basic_tex_addr ) // Default white texture
      listmat[newname] = new THREE.MeshBasicMaterial({ map : basic_tex, color : color_basic_default_pale_grey})
      listorig[newname] = make_type( newname, interptsub, {"x":0, "y":0, "z":0}, listmat[newname] )

}

//------------------------ dictp, parallelepipedic shapes..

dictp = {}
function one_element_dictp(name_func){

      /*
      New parallelepiped in dictionary dictp
      */

      dictp[name_func] = function(){ make_new_parallelepiped(window[name_func]) }
  }

function make_dict_paralellepipeds(){

      /*
      Put all the parallelepiped shapes in the dict dictp
      */

      list_func_par = ['make_wall', 'make_simple_cube', 'make_pavement']
      for (var i in list_func_par){ one_element_dictp(list_func_par[i]) } // make_dictp
}

make_dict_paralellepipeds()

//------------------------ Multiple texture

function make_new_cube_texture(){

      /*
      Make a new cube with texture
      */

      $('#curr_func').css('background-color','red')
      var [newname, interptsub] = random_name_mousepos()
      curr_tex_addr = basic_multiple_tex_addr;
      $('#curr_func').css('background-color','blue')
      var meshFaceMaterial = make_meshFaceMaterial(default_texture)
      listorig[newname] = make_cube_texture( newname, interptsub, {"x":0, "y":0, "z":0}, meshFaceMaterial )   // make the wall object
      listorig[newname]['tex_addr'] =  curr_tex_addr               									// texture address
      listorig[newname]['tex'] =  curr_tex_addr.split('/').pop(-1)               	  // texture name
      $('#curr_func').css('background-color','green')
      // basic_tex = new THREE.ImageUtils.loadTexture( basic_tex_addr ) // Default white texture
      // listmat[newname] = new THREE.MeshBasicMaterial({ map : basic_tex, color : color_basic_default_pale_grey})
      // listorig[newname] = make_cube( newname, interptsub, {"x":0, "y":0, "z":0}, listmat[newname] )
}

function random_coord_speed(){

      /*
      Random speed coordinate
      */

      if (!random_initial_speed){ return 0 }                  // « initial speed at 0 » mode
      return random_speed_module * (gaussianRand() - 0.5) * 2 // SYMMETRIC random, centered on 0, in [-module, +module]
}

function select_coord_random_speed(obj,coord){

      /*
      Adding random speed to coordinate coord
      */

      obj.speed[coord] = random_coord_speed()
}

function random_speed_chose_xyz(obj, list_coord){

      /*
      Adding random speed in x and y
      */

      var all_coord = ['x','y','z']
      for (i in all_coord){
            var coord = all_coord[i]
            if (list_coord.indexOf(coord) != -1){
                  select_coord_random_speed(obj,coord)
              }
      }
      // |v| AT INITIALIZATION, kept aside: the Trajectories window lists the colors by initial
      // speed, and obj.speed itself keeps changing as soon as the simulation runs.
      obj.v0 = Math.sqrt(obj.speed.x*obj.speed.x + obj.speed.y*obj.speed.y + obj.speed.z*obj.speed.z)

}

function speed_target_objects(filter){

      /*
      Balls the « Initial speeds » tab acts on: the dynamic balls, restricted to the
      color chosen in the tab (speed_color_filter = 'all' -> all of them).
      Lets each population be given its own velocity distribution (e.g. a hot red gas
      inside a cold blue one) instead of re-drawing the whole scene every time.
      filter: color to force ('all' to list every ball, whatever the current selection).
      */

      if (filter === undefined){ filter = speed_color_filter }
      var a = []
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.type !== 'sphere' || o.blocked){ continue }   // dynamic balls only
            if (filter !== 'all' && obj_hex(o) !== filter){ continue }
            a.push(o)
      }
      return a

}

function reinitialize_speeds(){

      /*
      Reassigns the velocity of the TARGETED balls (see speed_target_objects: all, or one
      color) according to the current Initial speeds parameters (Random, Strength, z
      component). Lets a simulation be restarted « from scratch » at any time without
      recreating the scene. If « Random » is unchecked (or Strength = 0), they start again at rest.
      */

      var coords = random_speed_z ? ['x','y','z'] : ['x','y']
      var a = speed_target_objects()
      for (var i=0;i<a.length;i++){
            a[i].speed.set(0, 0, 0)                              // reset to zero (z included if not drawn)
            random_speed_chose_xyz(a[i], coords)                // velocity according to the current params
      }

}

function flatten_z(){

      /*
      Projects the TARGETED balls (see speed_target_objects) onto the horizontal plane
      z = flatten_z_level (set in the Initial speeds tab, 0 by default) and cancels their
      z velocity. Cleans up a scene whose z positions have drifted: in pure 3D,
      a coplanar cloud stays coplanar (collision normal with no z component), so the gas
      becomes perfectly planar again without any special « mode ».
      Choosing the altitude lets several populations be stacked on distinct planes
      (e.g. one flat gas per color) instead of collapsing them all onto the ground.
      */

      var z = (typeof flatten_z_level === 'number' && isFinite(flatten_z_level)) ? flatten_z_level : 0
      var a = speed_target_objects()
      for (var i=0;i<a.length;i++){
            a[i].position.z = z
            a[i].speed.z = 0
      }

}

function make_new_sphere(){

      /*
      Sphere with random speed
      */

      var [newname, interptsub] = random_name_mousepos()
      var sph = basic_sphere(newname,interptsub,{"x":0, "y":0, "z":0},color_sphere_default)
      random_speed_chose_xyz(sph, random_speed_z ? ['x','y','z'] : ['x','y'])   // add random speed (z optional)
      sph.magnet = false        // remove magnet
      list_moving_objects.push(sph)                  // makes the ball dynamic (gravity, springs, collisions)

}

function make_new_string(){

      /*
      String with random speed
      */

      var [newname, interptsub] = random_name_mousepos()
      var sph = basic_sphere(newname,interptsub,{"x":0, "y":0, "z":0},color_sphere_default)
      random_speed_chose_xyz(sph, random_speed_z ? ['x','y','z'] : ['x','y'])   // add random speed (z optional)
      sph.magnet = false        // remove magnet
      list_moving_objects.push(sph)                  // makes the ball dynamic (gravity, springs, collisions)
      list_string.push(sph)
      if ( list_string.length > 1 ){
          var list_interm_pair = list_string.slice(-2) //[list_string.slice(-1),list_string.slice(-2,-1)]
          var new_elastic = create_elastic(list_interm_pair)
          list_interm_pair.push(new_elastic) // add spring to pair
          list_paired_harmonic.push(list_interm_pair) // list of all triplets
          color_pairs_in_blue()
      }

}

//===================================================================== Tissue (complex object)

/*
A cloth needs three families of springs (Provot). Structural ones alone leave every cell a
free hinge: the mesh resists stretching but not shear, and not folding at all -- it collapses
at the first contact.
      structural  neighbour right / below            rest length l0
      shear       both diagonals of a cell           rest length l0·√2   -> in-plane rigidity
      bending     skip one ball, both directions     rest length 2·l0    -> out-of-plane rigidity
Bending MUST be much softer than the rest: that ratio is what separates a cloth from a plate.
*/
var TISSUE_SHEAR_RATIO = 0.5        // shear stiffness, relative to the structural one
var TISSUE_BEND_RATIO  = 1/6        // bending stiffness, idem -- deliberately soft

function tissue_link(a, b, k, l0, kind){

      /*
      One spring of the mesh. Stiffness AND rest length are stored on the pair: the globals
      harmonic_const / lenght_spring stay the fallback for everything else (see accel_spring),
      so a tissue can be soft or tight without touching the rest of the scene.
      Only the structural springs get a visible elastic: drawing the diagonals and the
      skip-one springs would bury the mesh under a web of tubes, and triple the geometry.
      */

      var pair = [a, b]
      pair.push((kind === 'struct') ? create_elastic(pair) : null)
      pair.k_spring = k
      pair.rest_length = l0
      pair.tissue_id = a.tissue.id
      pair.tissue_kind = kind
      list_paired_harmonic.push(pair)

}

function make_tissue_at(pos, id, nw, nl, k, l0, ks, kb){

      /*
      Rectangular grid of balls laid flat on the x-y plane, centred on pos, woven with the
      three families of springs described above.
      All the balls share the same descriptor object, so clicking any one of them gives access
      to the whole mesh (Tissue tab of the right-click menu).
      */

      nw = Math.max(2, Math.round(nw)); nl = Math.max(2, Math.round(nl))
      if (ks === undefined){ ks = k*TISSUE_SHEAR_RATIO }
      if (kb === undefined){ kb = k*TISSUE_BEND_RATIO }
      var descr = { id:id, nw:nw, nl:nl, k:k, l0:l0, ks:ks, kb:kb }
      var grid = [], x0 = pos.x - (nw-1)*l0/2, y0 = pos.y - (nl-1)*l0/2
      for (var j=0;j<nl;j++){
            grid[j] = []
            for (var i=0;i<nw;i++){
                  var sph = basic_sphere(random_name(), { x:x0+i*l0, y:y0+j*l0, z:pos.z },
                                         {"x":0,"y":0,"z":0}, color_sphere_default)
                  sph.magnet = false
                  sph.tissue = descr                     // same object on every ball of the mesh
                  sph.tissue_idx = j*nw + i              // rank in the mesh: survives save/load, unlike
                                                         // the order of list_moving_objects
                  list_moving_objects.push(sph)          // dynamic: gravity, springs, collisions
                  grid[j][i] = sph
            }
      }
      var ld = l0*Math.SQRT2                             // diagonal of a cell
      for (var j=0;j<nl;j++){ for (var i=0;i<nw;i++){
            if (i+1 < nw){ tissue_link(grid[j][i], grid[j][i+1], k, l0, 'struct') }
            if (j+1 < nl){ tissue_link(grid[j][i], grid[j+1][i], k, l0, 'struct') }
            if (i+1 < nw && j+1 < nl){                   // shear: the two diagonals of the cell
                  tissue_link(grid[j][i],   grid[j+1][i+1], ks, ld, 'shear')
                  tissue_link(grid[j][i+1], grid[j+1][i],   ks, ld, 'shear')
            }
            if (i+2 < nw){ tissue_link(grid[j][i], grid[j][i+2], kb, 2*l0, 'bend') }   // bending
            if (j+2 < nl){ tissue_link(grid[j][i], grid[j+2][i], kb, 2*l0, 'bend') }
      } }
      color_pairs_in_blue()
      return descr

}

function make_new_tissue(){

      /*
      Drops a tissue where the mouse is, using the creation values of the Object panel.
      */

      make_tissue_at(mousepos(), tissue_next_id++, tissue_nw, tissue_nl, tissue_k, tissue_l0)

}

function tissue_balls(id){                                   // every ball belonging to one mesh
      var a = []
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o && o.tissue && o.tissue.id === id){ a.push(o) }
      }
      return a
}

function tissue_center(balls){
      var c = new THREE.Vector3()
      for (var i=0;i<balls.length;i++){ c.add(balls[i].position) }
      if (balls.length){ c.divideScalar(balls.length) }
      return c
}

function tissue_apply(id, k, l0, ks, kb){

      /*
      Stiffness / rest length of an EXISTING tissue: applied to its springs in place, so the
      current deformation and the velocities are preserved.
      Each family keeps its own stiffness and its own rest length, derived from l0: a cell
      diagonal is l0·√2 and a skip-one span is 2·l0, so changing l0 rescales the whole mesh
      consistently. ks/kb may be omitted -- the current values are then kept.
      */

      var balls = tissue_balls(id); if (!balls.length){ return null }
      var d0 = balls[0].tissue
      if (ks === undefined){ ks = (d0.ks !== undefined) ? d0.ks : k*TISSUE_SHEAR_RATIO }
      if (kb === undefined){ kb = (d0.kb !== undefined) ? d0.kb : k*TISSUE_BEND_RATIO }
      // Written on EVERY ball rather than relying on the shared reference: a reloaded scene
      // re-shares them, but this stays correct even if that ever fails.
      for (var b=0;b<balls.length;b++){
            var d = balls[b].tissue
            d.k = k; d.l0 = l0; d.ks = ks; d.kb = kb
      }
      var ld = l0*Math.SQRT2
      for (var i in list_paired_harmonic){
            var p = list_paired_harmonic[i]
            if (p.tissue_id !== id){ continue }
            if (p.tissue_kind === 'shear'){ p.k_spring = ks; p.rest_length = ld }
            else if (p.tissue_kind === 'bend'){ p.k_spring = kb; p.rest_length = 2*l0 }
            else { p.k_spring = k; p.rest_length = l0 }      // structural (and scenes saved before the families)
      }
      return d0

}

function tissue_corner_balls(id){

      /*
      The four corners of the mesh, found by rank rather than by position: a deformed or
      folded tissue no longer has its corners at the extremities in space.
      */

      var balls = tissue_balls(id); if (!balls.length){ return [] }
      var d = balls[0].tissue, nw = d.nw, nl = d.nl
      var want = [0, nw-1, (nl-1)*nw, nl*nw-1]
      var out = []
      for (var i=0;i<balls.length;i++){
            if (want.indexOf(balls[i].tissue_idx) >= 0){ out.push(balls[i]) }
      }
      return out

}

function tissue_toggle_corners(id){

      /*
      Anchors the four corners, or releases them if they are already anchored: a blocked ball
      is skipped by the Verlet integrator, so the mesh hangs from them instead of falling.
      Returns the state applied, or null if the tissue is gone.
      */

      var corners = tissue_corner_balls(id); if (!corners.length){ return null }
      var all_blocked = true
      for (var i=0;i<corners.length;i++){ if (!corners[i].blocked){ all_blocked = false } }
      var state = !all_blocked                             // all anchored -> release, otherwise anchor
      for (var i=0;i<corners.length;i++){
            corners[i].blocked = state
            if (state){ corners[i].speed.set(0,0,0) }       // an anchor keeps no leftover velocity
            if (typeof refresh_blocked_color === 'function'){ refresh_blocked_color(corners[i]) }
      }
      return state

}

function tissue_rebuild(id, nw, nl, k, l0, ks, kb){

      /*
      New dimensions: the mesh is rebuilt from scratch, flat, centred where the old one was.
      The current deformation and the velocities are lost -- that is the price of changing the
      number of balls, and the reason dimensions are applied by an explicit button.
      */

      var balls = tissue_balls(id); if (!balls.length){ return null }
      var d0 = balls[0].tissue
      if (ks === undefined){ ks = d0.ks }
      if (kb === undefined){ kb = d0.kb }
      var center = tissue_center(balls)
      for (var i=0;i<balls.length;i++){ remove_single_object(balls[i]) }   // also drops the springs attached
      return make_tissue_at(center, id, nw, nl, k, l0, ks, kb)

}

//===================================================================== Bubble (complex object)

/*
A bubble is the tissue closed on itself: same balls, same springs, but on a sphere and with
gas pushing from the inside.

Why an icosphere and not a latitude/longitude grid: a lat/long grid crowds its balls at the
poles, so the springs would have wildly different lengths and a single rest length would mean
nothing. A subdivided icosahedron keeps every edge within a few percent of the others.

Why no shear springs, unlike the tissue: the mesh is TRIANGULAR, and a triangle cannot shear
without changing the length of a side. The structural springs already provide it, for free.
*/

function icosphere(level){

      /*
      Subdivided icosahedron on the unit sphere.
      Returns { verts:[[x,y,z]…], faces:[[a,b,c]…], edges:[[a,b]…], bends:[[p,q]…] } where
      bends joins the two vertices FACING each edge -- the skip-one of a flat mesh, the thing
      that resists folding along that edge.
      */

      var t = (1 + Math.sqrt(5)) / 2
      var verts = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],
                   [0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
                   [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
      for (var i=0;i<verts.length;i++){ verts[i] = ico_norm(verts[i]) }
      var faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
                   [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
                   [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
                   [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]

      for (var s=0; s<level; s++){
            var cache = {}, nf = []
            function mid(a, b){                              // midpoint pushed back onto the sphere
                  var key = (a<b) ? a+'_'+b : b+'_'+a
                  if (cache[key] === undefined){
                        var A = verts[a], B = verts[b]
                        verts.push(ico_norm([A[0]+B[0], A[1]+B[1], A[2]+B[2]]))
                        cache[key] = verts.length - 1
                  }
                  return cache[key]
            }
            for (var f=0; f<faces.length; f++){
                  var a = faces[f][0], b = faces[f][1], c = faces[f][2]
                  var ab = mid(a,b), bc = mid(b,c), ca = mid(c,a)
                  nf.push([a,ab,ca], [b,bc,ab], [c,ca,bc], [ab,bc,ca])
            }
            faces = nf
      }

      // Edges, plus the vertex facing each of them in every adjacent face.
      var emap = {}
      for (var f=0; f<faces.length; f++){
            var v = faces[f]
            for (var e=0;e<3;e++){
                  var a = v[e], b = v[(e+1)%3], opp = v[(e+2)%3]
                  var key = (a<b) ? a+'_'+b : b+'_'+a
                  if (!emap[key]){ emap[key] = { a:Math.min(a,b), b:Math.max(a,b), opp:[] } }
                  emap[key].opp.push(opp)
            }
      }
      var edges = [], bends = []
      for (var key in emap){
            var e = emap[key]
            edges.push([e.a, e.b])
            if (e.opp.length === 2){ bends.push([e.opp[0], e.opp[1]]) }   // closed surface: always 2
      }
      return { verts:verts, faces:faces, edges:edges, bends:bends }

}

function ico_norm(v){
      var n = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) || 1
      return [v[0]/n, v[1]/n, v[2]/n]
}

/*
The mesh is entirely determined by the subdivision level, so it is computed once per level and
never stored on a bubble. Keeping the face list in the descriptor would be a real cost: the
descriptor is saved on EVERY ball, which meant 3.8 kB x 162 balls = 0.6 MB of scene file for a
level-2 bubble, and about 10 MB at level 3 -- for data that regenerates in a millisecond.
*/
var _ico_cache = {}
function ico_geometry(level){
      level = Math.max(0, Math.min(3, Math.round(level || 0)))
      if (!_ico_cache[level]){ _ico_cache[level] = icosphere(level) }
      return _ico_cache[level]
}

function bubble_link(a, b, k, l0, kind){

      /*
      One spring of the shell. Rest length is the length AT CREATION, per pair: the edges of
      an icosphere differ by up to 19%, so a single global length would leave the mesh under
      permanent stress. Only the structural springs get a visible elastic.
      */

      var pair = [a, b]
      pair.push((kind === 'struct') ? create_elastic(pair) : null)
      pair.k_spring = k
      pair.rest_length = l0
      pair.bubble_id = a.bubble.id
      pair.tissue_kind = kind                  // reused as-is: same meaning, same handling
      list_paired_harmonic.push(pair)

}

function make_bubble_at(pos, id, level, R, k, kb, P){

      /*
      Closed spherical shell of balls, centred on pos. Springs along every edge, plus one
      bending spring across each edge, joining the two vertices that face it -- the exact
      analogue of the tissue's skip-one spring, and what keeps the surface from creasing.
      The reference volume V0 is measured once the balls are in place: the gas law then works
      from the shape actually built, not from the theoretical sphere.
      */

      level = Math.max(0, Math.min(3, Math.round(level)))
      var g = ico_geometry(level)
      var descr = { id:id, level:level, R:R, k:k, kb:kb, P:P, V0:0 }
      // NOTE: the descriptor holds plain NUMBERS only -- no ball reference (the scene JSON
      // would become circular) and no face list (see ico_geometry: it is rebuilt from level).
      var balls = []
      for (var i=0;i<g.verts.length;i++){
            var v = g.verts[i]
            var sph = basic_sphere(random_name(),
                                   { x:pos.x + v[0]*R, y:pos.y + v[1]*R, z:pos.z + v[2]*R },
                                   {"x":0,"y":0,"z":0}, color_sphere_default)
            sph.magnet = false
            sph.bubble = descr                 // same object on every ball of the shell
            sph.bubble_idx = i                 // rank: the faces refer to it
            list_moving_objects.push(sph)
            balls.push(sph)
      }
      for (var e=0;e<g.edges.length;e++){
            var a = balls[g.edges[e][0]], b = balls[g.edges[e][1]]
            bubble_link(a, b, k, a.position.distanceTo(b.position), 'struct')
      }
      for (var e=0;e<g.bends.length;e++){
            var a = balls[g.bends[e][0]], b = balls[g.bends[e][1]]
            bubble_link(a, b, kb, a.position.distanceTo(b.position), 'bend')
      }
      descr.V0 = bubble_volume(descr, balls)
      color_pairs_in_blue()
      return descr

}

function bubble_volume(descr, byIdx){

      /*
      Signed volume of the closed surface: V = (1/6)·Σ A·(B×C) over the faces.
      Valid because every face of the icosphere is oriented outwards. A missing ball (deleted
      by hand) makes its faces be skipped -- the bubble leaks, which is the honest outcome.
      */

      var f = ico_geometry(descr.level).faces, V = 0
      for (var i=0;i<f.length;i++){
            var A = byIdx[f[i][0]], B = byIdx[f[i][1]], C = byIdx[f[i][2]]
            if (!A || !B || !C){ continue }
            var a = A.position, b = B.position, c = C.position
            V += (a.x*(b.y*c.z - b.z*c.y) + a.y*(b.z*c.x - b.x*c.z) + a.z*(b.x*c.y - b.y*c.x)) / 6
      }
      return V

}

function make_new_bubble(){

      /*
      Drops a bubble where the mouse is, using the creation values of the Object panel.
      */

      make_bubble_at(mousepos(), bubble_next_id++, bubble_level, bubble_R, bubble_k, bubble_kb, bubble_P)

}

function bubble_balls(id){                                   // every ball of one shell
      var a = []
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o && o.bubble && o.bubble.id === id){ a.push(o) }
      }
      return a
}

function bubble_apply(id, k, kb, P){

      /*
      Stiffness and pressure of an EXISTING bubble, applied in place: the current shape and
      the velocities are preserved. V0 is NOT recomputed -- it is the reference the gas law
      measures against, and resetting it would make the bubble forget it is compressed.
      */

      var balls = bubble_balls(id); if (!balls.length){ return null }
      for (var b=0;b<balls.length;b++){
            var d = balls[b].bubble
            d.k = k; d.kb = kb; d.P = P
      }
      for (var i in list_paired_harmonic){
            var p = list_paired_harmonic[i]
            if (p.bubble_id !== id){ continue }
            p.k_spring = (p.tissue_kind === 'bend') ? kb : k     // rest lengths stay: they are the built shape
      }
      return balls[0].bubble

}

function bubble_rebuild(id, level, R, k, kb, P){

      /*
      New mesh level or radius: rebuilt from scratch, centred where the old one was.
      */

      var balls = bubble_balls(id); if (!balls.length){ return null }
      var center = tissue_center(balls)                       // same barycentre helper
      for (var i=0;i<balls.length;i++){ remove_single_object(balls[i]) }
      return make_bubble_at(center, id, level, R, k, kb, P)

}

function link(condition, action, arg){

      /*
      Linking a conditon with an action (function) with optional argument..
      */

      if (condition){
            if (arg){action(arg)}
            else {action()}
      }
}

function mouse_create_object_or_action(event){

      /*
      Create an object (new_wall_ok) or an action
       where the mouse is located in the plane.

      LEFT BUTTON ONLY. This runs on 'mousedown', which fires for EVERY button — and the
      'contextmenu' event only comes afterwards. A right-click therefore created one last
      unwanted object (a ball, a cube, a chain link, a track mark…) before the menu had any
      chance to open or to switch back to « no tool ». onDocumentMouseDown already guards
      itself the same way.
      */

      if (event && event.button !== undefined && event.button !== 0){ return }

      link(new_wall_ok, limits_and_action, make_new_wall)   // wall drawn between 2 clicks (like the box)
      link(new_cube_ok, dictp.make_simple_cube, null)
      link(new_sphere_ok, make_new_sphere, null)
      link(new_string_ok, make_new_string, null)
      link(new_tissue_ok, make_new_tissue, null)
      link(new_bubble_ok, make_new_bubble, null)
      link(new_pavement_ok, dictp.make_pavement, null)
      link(new_cube_texture_ok, make_new_cube_texture, null)
      link(new_select_ok, limits_and_action, null)
      link(new_track_ok, make_marks_and_track, null)
      link(new_plane_ok, limits_and_action, make_horizontal_area)
      // select_poscam (key k): now handled by dragging (poscam_begin/update/end in mouse_interact.js)
      link(new_box_ok, limits_and_action, make_new_box)
      link(paire_harmonic, select_two_obj_and_action, null)

} // end mouse_create_object_or_action


/* ============================================================================
   Population by color (spheres) — set the NUMBER of objects of the same type and
   same color as a clicked sphere.
   - decrease : removes members drawn at random (never the clicked sphere, unless
                the target is 0), so the context menu stays valid;
   - increase : adds cloned spheres (same attributes + same color), at random
                positions INSIDE the bounding volume of the population — so
                without reference to a box: we align on the already occupied space.
   A « flat » axis (zero span, e.g. z=0 for a planar gas) stays flat: the new
   spheres take the same value there.
   ============================================================================ */

function color_population(obj){                       // spheres of the SAME type + SAME color as obj (obj included)
      var hex = obj_hex(obj), a = []
      for (var k in objects){
            var t = objects[k]
            if (!t || t.type !== obj.type){ continue }
            if (!t.material || !t.material.color){ continue }
            if (obj_hex(t) === hex){ a.push(t) }
      }
      return a
}

function population_bounds(list){                     // bounding box (min/max on x,y,z) of the positions
      var b = { xmin:Infinity, xmax:-Infinity, ymin:Infinity, ymax:-Infinity, zmin:Infinity, zmax:-Infinity }
      for (var i=0;i<list.length;i++){
            var p = list[i].position
            if (p.x < b.xmin){ b.xmin = p.x }; if (p.x > b.xmax){ b.xmax = p.x }
            if (p.y < b.ymin){ b.ymin = p.y }; if (p.y > b.ymax){ b.ymax = p.y }
            if (p.z < b.zmin){ b.zmin = p.z }; if (p.z > b.zmax){ b.zmax = p.z }
      }
      return b
}

function free_gpu(o){                                 // frees the GPU memory of a mesh (geometry + material + texture)
      if (o && o.geometry && o.geometry.dispose && !o.geometry._shared){ o.geometry.dispose() }  // never dispose a shared ball geometry
      var mats = (o && o.material) ? (o.material.length ? o.material : [o.material]) : []
      for (var m=0;m<mats.length;m++){
            if (mats[m] && mats[m].map && mats[m].map.dispose){ mats[m].map.dispose() }
            if (mats[m] && mats[m].dispose){ mats[m].dispose() }
      }
}

function remove_single_object(o){                     // clean removal of an object: scene + all lists + selection
      scene.remove(o)
      free_gpu(o)                                    // without dispose(), scene.remove leaks VRAM (matters when shrinking a big population)
      var i = objects.indexOf(o);            if (i>=0){ objects.splice(i,1) }
      i = list_moving_objects.indexOf(o);    if (i>=0){ list_moving_objects.splice(i,1) }
      if (typeof list_interact !== 'undefined'){ i = list_interact.indexOf(o); if (i>=0){ list_interact.splice(i,1) } }
      if (typeof list_string !== 'undefined'){ i = list_string.indexOf(o); if (i>=0){ list_string.splice(i,1) } }
      if (typeof list_obj_inside !== 'undefined'){ i = list_obj_inside.indexOf(o); if (i>=0){ list_obj_inside.splice(i,1) } }
      if (o.name && typeof listorig !== 'undefined'){ delete listorig[o.name] }
      // removes the springs that reference o (otherwise the harmonic loop would crash)
      if (typeof list_paired_harmonic !== 'undefined'){
            for (var k=list_paired_harmonic.length-1;k>=0;k--){
                  var pr = list_paired_harmonic[k]
                  if (pr[0]===o || pr[1]===o){ if (pr[2]){ scene.remove(pr[2]); free_gpu(pr[2]) } list_paired_harmonic.splice(k,1) }
            }
      }
      if (typeof SELECTED    !== 'undefined' && SELECTED    === o){ SELECTED = null }
      if (typeof INTERSECTED !== 'undefined' && INTERSECTED === o){ INTERSECTED = null }
      if (typeof nearest_elem!== 'undefined' && nearest_elem=== o){ nearest_elem = null }
      o.traj = null
}

function set_color_population(template, targetN){
      /*
      Adjusts to targetN the number of spheres of the same type+color as 'template'.
      Returns the resulting count. Does nothing for a non-sphere object.
      */
      if (template.type !== 'sphere'){ return 0 }
      var pop = color_population(template)
      var cur = pop.length
      targetN = Math.max(0, Math.round(targetN))
      if (targetN === cur){ return cur }

      if (targetN < cur){
            // removes at random, preserving the clicked sphere (unless target = 0)
            var pool = []
            for (var pi=0; pi<pop.length; pi++){ if (pop[pi] !== template){ pool.push(pop[pi]) } }
            var toRemove = cur - targetN
            var n = Math.min(toRemove, pool.length)
            for (var r=0;r<n;r++){
                  var j = Math.floor(Math.random()*pool.length)
                  remove_single_object(pool[j]); pool.splice(j,1)
            }
            if (toRemove > n){ remove_single_object(template) }   // target = 0: the clicked one is removed too
      } else {
            var b = population_bounds(pop)
            var hexNum = (template.currentHex !== undefined) ? template.currentHex : template.material.color.getHex()
            var R = template.radius || radius_spring
            var flat_xy = (b.xmax <= b.xmin && b.ymax <= b.ymin)      // point-like population (1 sphere) -> small spread
            var jit = flat_xy ? R*4 : 0
            var coords = random_speed_z ? ['x','y','z'] : ['x','y']
            var add = targetN - cur
            for (var a2=0;a2<add;a2++){
                  var x = b.xmin + Math.random()*(b.xmax-b.xmin) + (jit ? (Math.random()-0.5)*jit : 0)
                  var y = b.ymin + Math.random()*(b.ymax-b.ymin) + (jit ? (Math.random()-0.5)*jit : 0)
                  var z = b.zmin + Math.random()*(b.zmax-b.zmin)     // span z = 0 -> the new ones stay in the plane
                  var sph = basic_sphere(random_name(), {x:x, y:y, z:z}, {x:0, y:0, z:0}, hexNum)
                  sph.currentHex = hexNum                            // "real" color -> counted in the right group
                  set_sphere_radius(sph, R)                          // same size as the population
                  sph.mass = template.mass
                  sph.friction = template.friction
                  sph.radius_interact = template.radius_interact
                  sph.magnet = false
                  if (template.material){
                        sph.material.transparent = template.material.transparent
                        sph.material.opacity = template.material.opacity
                        sph.material.needsUpdate = true
                  }
                  if (template.blocked){ sph.blocked = true }        // blocked clone: stays static
                  else { random_speed_chose_xyz(sph, coords); list_moving_objects.push(sph) }
            }
      }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
      return color_population(template).length
}
