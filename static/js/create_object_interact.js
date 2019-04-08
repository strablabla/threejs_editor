/*

Create object

*/

//--------------------------  Parallelepipedic shapes

var dict_parall = {}

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
list_func_par = ['make_wall', 'make_simple_cube', 'make_pavement']
function one_element_dictp(name_func){
    dictp[name_func] = function(){ make_new_parallelepiped(window[name_func]) }}
for (var i in list_func_par){ one_element_dictp(list_func_par[i]) } // make_dictp

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
      link(new_pavement_ok, dictp.make_pavement, null)             // P key
      link(new_cube_texture_ok, make_new_cube_texture, null)       // M key
      link(select_obj, limits_and_action, null)                    // S key.. make_dotted_area
      link(select_make_track, make_marks_and_track, null)          // T key..
      link(make_plane, limits_and_action, make_horizontal_area)    // H key
      link(select_poscam, limits_and_action, newview)              // K key

} // end mouse_create_object_or_action
