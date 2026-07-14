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

      if (!random_initial_speed){ return 0 }                  // mode « vitesse de départ à 0 »
      return random_speed_module * (gaussianRand() - 0.5) * 2 // aléatoire SYMÉTRIQUE, centré sur 0, dans [-module, +module]
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
      Réattribue la vitesse de TOUTES les boules mobiles selon les paramètres courants
      d'Initial speeds (Random, Strength, z component). Permet de relancer une simulation
      « de zéro » à tout moment sans recréer la scène. Si « Random » est décoché (ou
      Strength = 0), toutes les boules repartent à l'arrêt.
      */

      var coords = random_speed_z ? ['x','y','z'] : ['x','y']
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]
            if (o.type !== 'sphere' || o.blocked){ continue }   // boules dynamiques uniquement
            o.speed.set(0, 0, 0)                                 // remise à zéro (z inclus si non tiré)
            random_speed_chose_xyz(o, coords)                   // vitesse selon les params courants
      }

}

function flatten_z(){

      /*
      Projette toutes les boules sur le plan z = 0 et annule leur vitesse en z.
      Nettoie une scène dont les positions z ont dérivé : en 3D pur, un nuage
      coplanaire reste coplanaire (normale de choc sans composante z), donc le gaz
      redevient parfaitement plan sans aucun « mode » spécial.
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
      random_speed_chose_xyz(sph, random_speed_z ? ['x','y','z'] : ['x','y'])   // add random speed (z optionnel)
      sph.magnet = false        // remove magnet
      list_moving_objects.push(sph)                  // rend la boule dynamique (gravité, ressorts, collisions)

}

function make_new_string(){

      /*
      String with random speed
      */

      var [newname, interptsub] = random_name_mousepos()
      var sph = basic_sphere(newname,interptsub,{"x":0, "y":0, "z":0},color_sphere_default)
      random_speed_chose_xyz(sph, random_speed_z ? ['x','y','z'] : ['x','y'])   // add random speed (z optionnel)
      sph.magnet = false        // remove magnet
      list_moving_objects.push(sph)                  // rend la boule dynamique (gravité, ressorts, collisions)
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

      link(new_wall_ok, dictp.make_wall, null)
      link(new_cube_ok, dictp.make_simple_cube, null)
      link(new_sphere_ok, make_new_sphere, null)
      link(new_string_ok, make_new_string, null)
      link(new_pavement_ok, dictp.make_pavement, null)
      link(new_cube_texture_ok, make_new_cube_texture, null)
      link(new_select_ok, limits_and_action, null)
      link(new_track_ok, make_marks_and_track, null)
      link(new_plane_ok, limits_and_action, make_horizontal_area)
      // select_poscam (touche k) : désormais géré par glisser (poscam_begin/update/end dans mouse_interact.js)
      link(new_box_ok, limits_and_action, make_new_box)
      link(paire_harmonic, select_two_obj_and_action, null)

} // end mouse_create_object_or_action
