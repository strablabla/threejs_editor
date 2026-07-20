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

}

function reinitialize_speeds(){

      /*
      Reassigns the velocity of ALL moving balls according to the current Initial speeds
      parameters (Random, Strength, z component). Lets a simulation be restarted
      « from scratch » at any time without recreating the scene. If « Random » is unchecked (or
      Strength = 0), all balls start again at rest.
      */

      var coords = random_speed_z ? ['x','y','z'] : ['x','y']
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.type !== 'sphere' || o.blocked){ continue }   // dynamic balls only
            o.speed.set(0, 0, 0)                                 // reset to zero (z included if not drawn)
            random_speed_chose_xyz(o, coords)                   // velocity according to the current params
      }

}

function flatten_z(){

      /*
      Projects all balls onto the z = 0 plane and cancels their z velocity.
      Cleans up a scene whose z positions have drifted: in pure 3D, a coplanar
      cloud stays coplanar (collision normal with no z component), so the gas
      becomes perfectly planar again without any special « mode ».
      */

      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.type !== 'sphere' || o.blocked){ continue }
            o.position.z = 0
            o.speed.z = 0
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

function link(condition, action, arg){

      /*
      Linking a conditon with an action (function) with optional argument..
      */

      if (condition){
            if (arg){action(arg)}
            else {action()}
      }
}

function mouse_create_object_or_action(){

      /*
      Create an object (new_wall_ok) or an action
       where the mouse is located in the plane.
      */

      link(new_wall_ok, limits_and_action, make_new_wall)   // wall drawn between 2 clicks (like the box)
      link(new_cube_ok, dictp.make_simple_cube, null)
      link(new_sphere_ok, make_new_sphere, null)
      link(new_string_ok, make_new_string, null)
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

function remove_single_object(o){                     // clean removal of an object: scene + all lists + selection
      scene.remove(o)
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
                  if (pr[0]===o || pr[1]===o){ if (pr[2]){ scene.remove(pr[2]) } list_paired_harmonic.splice(k,1) }
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
