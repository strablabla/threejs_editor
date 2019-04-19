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
      for (var i = 0; i < 6; i += 1) {
        rand += Math.random();
      }

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

      return Math.round(random_speed_module*gaussianRandom(-1,1),1)
}

function select_coord_random_speed(obj,coord){
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
      //alert(obj.speed.x + '__' + obj.speed.y)
}

function make_new_sphere(){

      /*
      Sphere with random speed
      */

      var [newname, interptsub] = random_name_mousepos()
      var sph = basic_sphere(newname,interptsub,{"x":0, "y":0, "z":0},0x000000)
      random_speed_chose_xyz(sph, ['x','y'])         // add random speed
      sph.magnet = false        // remove magnet

}

function link(condition, action, arg){

      /*
      Linking a conditon with an action (function) with optionnal argument..
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

      link(new_wall_ok, dictp.make_wall, null)                     // N key
      link(new_simple_cube_ok, dictp.make_simple_cube, null)       // L key
      link(new_sphere_ok, make_new_sphere, null)                   // O key
      link(new_pavement_ok, dictp.make_pavement, null)             // P key
      link(new_cube_texture_ok, make_new_cube_texture, null)       // M key
      link(select_obj, limits_and_action, null)                    // S key.. make_dotted_area
      link(select_make_track, make_marks_and_track, null)          // T key..
      link(make_plane, limits_and_action, make_horizontal_area)    // H key
      link(select_poscam, limits_and_action, newview)              // K key
      link(new_box_ok, limits_and_action, make_new_box)            // B key
      link(paire_harmonic, select_two_obj_and_action, null)        // U key

} // end mouse_create_object_or_action
