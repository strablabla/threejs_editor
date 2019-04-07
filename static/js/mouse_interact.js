/*

Mouse interactions with the scene.

*/

function copypos(a,b){

      /*
      Copy the positions from b to a
      */

      a.position.x = b.position.x;
      a.position.y = b.position.y;
      a.position.z = b.position.z;

}

function random_name(){

      /*
      Return a random name
      */

      return Math.random().toString(36).substring(2, 15) ; // + Math.random().toString(36).substring(2, 15)
}

function init_drag(){

      /*
      Init the dragging function..
      */

      projector = new THREE.Projector();
      var size_plane = 10000
      var geom = new THREE.PlaneGeometry( size_plane, size_plane, 8, 8 )
      var mat = new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } )
      plane = new THREE.Mesh( geom, mat );
      plane.visible = true;
      scene.add( plane );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function addpos(a,b,c){

      /*
      Sum positions
      */

      a.x = b.x + c.x
      a.y = b.y + c.y
      a.z = b.z + c.z

      return a

}

function removepos(a,b,c){

      /*
      Sum positions
      */

      a.x = b.x - c.x
      a.y = b.y - c.y
      a.z = b.z - c.z

      return a

}

function move_group(){

      /*
      Move the whole group
      */

      for (i in list_obj_inside){
          var name_i = list_obj_inside[i].name
          addpos(list_obj_inside[i].position, SELECTED.position, dict_pos_relat[name_i])
      }
}

function keep_relative_positions(){

      /*
      Save the relative positions for moving
       the whole group with the selected object..
      */

      for (i in list_obj_inside){
          var name_i = list_obj_inside[i].name
          dict_pos_relat[name_i] = {'x':0, 'y':0, 'z':0}
          removepos(dict_pos_relat[name_i], list_obj_inside[i].position, SELECTED.position)
      }
}

function color_pick(){

      /*
      Color the picked objects..
      */

      if (select_picking){                   // adding the object to the list of the picked elements..
            for (i in list_obj_inside){
              list_obj_inside[i].material.color.setHex( orange_medium );
            }
      }
}

function make_raycaster(event){

      /*
      raycaster
      */

      event.preventDefault();
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
      projector.unprojectVector( vector, camera );
      var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

      return raycaster

}

function find_orientation_firstmark_mouse() {

      /*
      Main orientation
      */

      var beg = list_marks_track.slice(-2,-1)[0]
      var mouse = mousepos()
      //--------------
      var dx = Math.abs(beg.position.x - mouse.x);
      var dy = Math.abs(beg.position.y - mouse.y);
      var dz = Math.abs(beg.position.z - mouse.z);
      dic_dist = { 'x' : dx, 'y' : dy, 'z' : dz }
      var max_val = Math.max(dx, dy, dz)

      var key = Object.keys(dic_dist).filter(function(key) {return dic_dist[key] === max_val})[0];

      return key

}

function dir_coord_blocked_track(){

      /*
      dir coord..
      */

      var end = list_marks_track.slice(-2,-1)[0]
      dir_track_blocked = anti_dic[find_orientation_firstmark_mouse()]
      coord_track_blocked = end.position[dir_track_blocked]  // blocked the position

      return [dir_track_blocked, coord_track_blocked]

}

function action_on_selected_when_moving(raycaster){

      /*
      Action when selected and moving
      */

      var intersects = raycaster.intersectObject( plane );
      var interptsub = intersects[ 0 ].point.sub( offset )
      interptsub.z = SELECTED.position.z
      if ( !SELECTED.blocked ){
              SELECTED.position.copy( interptsub )  // move SELECTED at mouse position..
              if (select_make_track & perpendicular_track){
                  var [dir_track_blocked, coord_track_blocked] = dir_coord_blocked_track()
                  SELECTED.position[dir_track_blocked] = coord_track_blocked; //coord_track_blocked
              }
         }  // move the object selected if not blocked..
      nearest_elem = nearest_object(SELECTED)                           // change the color of the nearest objects in yellow..
      if (select_move_group){ move_group() }                            // move the whole group, obj in list_obj_inside

}



function mouse_move_case_intersections(intersects){

      /*
      One intersection or more detected
      */

      if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex ); //
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      }
      container.style.cursor = 'pointer';
}

function mouse_move_case_no_intersection(){

      /*
      No intersection detected
      */

      if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
      INTERSECTED = null;
      container.style.cursor = 'auto';

}

function onDocumentMouseMove( event ) {

      /*
      Mouse moving
      */

      var raycaster = make_raycaster(event)
      if (select_obj){ refresh_dotted_area() } // refresh the dotted line
      if ( SELECTED ) {
          action_on_selected_when_moving(raycaster)
          return;
      } // end if SELECTED
      var intersects = raycaster.intersectObjects( objects );
      if ( intersects.length > 0 ) { mouse_move_case_intersections(intersects) }
      else { mouse_move_case_no_intersection() }
      color_pick() // Color the picked objects..

} // end mouse move



function width_length_with_orientation(beg,end){

      /*
      width and length according to the orientation
      */

      var orientation_track = find_orientation_marks(beg,end)
      // dir_track_blocked = orientation_track
      // coord_track_blocked = end.position[dir_track_blocked]  // blocked the position

      //----------- dimensions

      var track_length = getDistance(beg,end)
      if ( orientation_track == 'x' ){
          var width = track_width
          var thickness = track_length
      }else{
          var width = track_length
          var thickness = track_width
      }

      return [width,thickness]
}

function params_for_track(){

      /*
      Oriented track
      */

      var [beg,end] = list_marks_track.slice(-2)
      //--------- dim
      var [width,thickness] = width_length_with_orientation(beg,end)
      var dim = { width : width, height : 5, thickness : thickness}
      //--------- r
      var r = {'x': 0, 'y':0, 'z':0}
      //--------- p
      var [mx,my,mz] = getMiddle(beg,end)
      var p = {'x': mx, 'y':my, 'z':mz}

      return [p,r,dim]

}

function make_oriented_track(){

      /*
      Oriented track
      */

      var [p,r,dim] = params_for_track()
      mat_track = new THREE.MeshBasicMaterial( { color : color_track_blue } )
      var [newname, interptsub] = random_name_mousepos()
      var track = simple_parallelepiped(newname, p, r, mat_track, dim, "track")

}

function mouse_down_case_intersections(intersects,raycaster){

      /*
      One intersection or more detected
      */

      controls.enabled = false;
      SELECTED = intersects[ 0 ].object;
      intersects = raycaster.intersectObject( plane );
      container.style.cursor = 'move';

      return intersects
}

function onDocumentMouseDown( event ) {

      /*
      Mouse down
      */

      var raycaster = make_raycaster(event)
      var intersects = raycaster.intersectObjects( objects );
      if ( intersects.length > 0 ) { intersects = mouse_down_case_intersections(intersects,raycaster) }
      else{ $('.panel').css({'top':"10px","left":"-300px"}) }             // hide panel when mouse leaves..
      if ( INTERSECTED ) INTERSECTED.material.color.setHex( color_intersected_green );   // changing color in green when selected
      if (select_picking){ picking_action() }                             // adding the object to the list of the picked elements..
      if (select_move_group){ keep_relative_positions() }                 // save the relative positions inside the group
      if (select_make_track){
          if (list_marks_track.length > 1){ make_oriented_track() }  // Draw the track
      }

}



function onDocumentMouseUp( event ) {

      /*
      Mouse up
      */

      event.preventDefault();
      controls.enabled = true;
      if (nearest_elem){ magnet_between_objects(nearest_elem) }  // attraction between walls.. by the sides..
      if ( INTERSECTED ) {
          LAST_SELECTED = SELECTED;
          SELECTED = null;
      }
      container.style.cursor = 'auto';
      color_pick()                          // Color the picked objects..

}

function mousepos(){

      /*
      Return the mouse coordinates in the horizontal plane
      */

      var raycaster = make_raycaster(event)
      var intersects = raycaster.intersectObject( plane );
      var interptsub = intersects[ 0 ].point.sub( offset )

      return interptsub

}


function find_orientation_marks(mesh1, mesh2) {

      /*
      Main orientation
      */

      var dx = Math.abs(mesh1.position.x - mesh2.position.x);
      var dy = Math.abs(mesh1.position.y - mesh2.position.y);
      var dz = Math.abs(mesh1.position.z - mesh2.position.z);
      dic_dist = { 'x' : dx, 'y' : dy, 'z' : dz }
      var max_val = Math.max(dx, dy, dz)
      var key = Object.keys(dic_dist).filter(function(key) {return dic_dist[key] === max_val})[0];

      return key

}


function getMiddle(mesh1, mesh2) {

      /*
      Distance from mesh1 to mesh2
      */

      var mx = (mesh1.position.x + mesh2.position.x)/2;
      var my = (mesh1.position.y + mesh2.position.y)/2;
      var mz = (mesh1.position.z + mesh2.position.z)/2;

      return [mx, my, mz]

}

function getDistance(mesh1, mesh2) {

      /*
      Distance from mesh1 to mesh2
      */

      var dx = mesh1.position.x - mesh2.position.x;
      var dy = mesh1.position.y - mesh2.position.y;
      var dz = mesh1.position.z - mesh2.position.z;
      return Math.sqrt(dx*dx+dy*dy+dz*dz);

}

//$('#curr_func').css('background-color','blue')

function near_mindist_mini(currobj,i,mindist,mini){

      /*
      Change mindist and mini
      */

      var dist = getDistance(currobj, objects[i])
      if ( dist < mindist ){        // smaller distance
              mini = i
              mindist = dist       // change mini distance..
      } else { objects[i].material.color.setHex(INTERSECTED.currentHex) } // initial color

      return [mindist,mini]

}

function nearest_object(currobj){

      /*
      Find the nearest object and change its color in yellow..
      */

      var mindist = 200;
      mini = -1;
      for ( i in objects ){
          if (objects[i] != currobj){
                [mindist,mini] = near_mindist_mini(currobj,i,mindist,mini)  // find mindist and mini
            } // end if objects[i]
        } // end for
      if ( mini != -1 ){ objects[mini].material.color.setHex(color_near_object_yellow) }    // change the color to yellow

      return objects[mini]  // return the nearest object..

} // end nearest_object

function limits_and_action_reinit_var(){

      /*
      Reinitialize singleton variables
      */

      selpos = []                     // positions of the corners
      select_obj = false;
      make_plane = false;
      SELECTED = null;

}

function limits_and_action(act_directly){

      /*
      Select a region and make action
      */

      if ( selpos.length < 2 ){ make_limits_mouse() }   // find the corners and make the area..
      else if (selpos.length == 2){
              if (act_directly){ act_directly(selpos) } // execute the action with the information of the position of the corners
              if (select_obj){ find_objects_in_area() }
              limits_and_action_reinit_var()
      } // end else if

} //  end limits_and_action

function corner(col){

      /*
      Make a corner for area delimitation (selpos list)
      */

      var [newname, interptsub] = random_name_mousepos()
      var creobj = make_mark( newname, interptsub, {"x":0, "y":0, "z":0}, col )
      selpos.push(creobj)

      return creobj

}

function color_corner(){

      /*
      Color of the marks
      */

      if (select_obj){ col = color_mark_quite_grey }
      else{ col = color_mark_pale_rose }

      return col

}

function save_plot_track(corner0,corner1){

      /*
      Save the plots used for the track..
      */

      if ( list_marks_track.length == 0 ){
          list_marks_track.push(corner0)
          list_marks_track.push(corner1)
      }else{ list_marks_track.push(corner1) }

}

function make_marks_and_track(){

      /*
      Graphical limits moved with the mouse..
      */

      col = color_corner()
      var corner0 = corner(color_mark_quite_red)
      if (list_marks_track.length > 1){scene.remove(corner0)}

      var corner1 = corner(color_track_green)
      save_plot_track(corner0,corner1)
      SELECTED = corner1
      controls.enabled = false
      last_mark_track = corner1

}


function make_limits_mouse(){

      /*
      Graphical limits moved with the mouse..
      */

      col = color_corner()
      var corner0 = corner(col)
      var corner1 = corner(col)
      SELECTED = corner1
      controls.enabled = false

}

function params_newview(selpos){

      /*
      newview parameters
      */

      var altit = 250;
      var s0 = selpos[0].position
      var s1 = selpos[1].position

      return [altit, s0, s1]

}

function reinit_params_newview(){

      /*
      Reinitialize some params after newview
      */

      select_poscam = false;
      selpos = []
      $('#curr_func').css('background-color','blue')

}

function newview(selpos){

      /*
      put the camera at positon selpos[0] and look at selpos[1]
      */

      var [altit, s0, s1] = params_newview(selpos)
      camera.position.set(s0.x, s0.y, s0.z + altit); // Set position like this
      camera.up = new THREE.Vector3(0,0,1);
      controls.target = new THREE.Vector3(s1.x, s1.y, s1.z + altit);
      reinit_params_newview()

}

function random_name_mousepos(){

      /*
      Return a random name and the position of the mouse
      */

      return [random_name(), mousepos()]

}

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

function show_block_unblock(){

      /*
      Value button block, unblock
      */

      if (LAST_SELECTED.blocked){ $('#block_pos').text('unblock') }
      else{ $('#block_pos').text('block') }

}

function link_panel_text(name){ $('#'+name+'_panel').text(INTERSECTED[name]); }
function link_panel0(name){ $('#'+name+'_panel').val(INTERSECTED[name]); }
function link_panel1(name, attr0, attr1){ $('#'+name+'_panel').val(INTERSECTED[attr0][attr1]); }
function link_panel2(name, attr0, attr1, arg){ $('#'+name+'_panel').val(INTERSECTED[attr0][attr1](arg)); }

function modify_values(INTERSECTED){

      /*
      Change the vaues in the panel for infos about the object selected..
      */

      link_panel_text('name')
      link_panel0('width')
      link_panel0('height')
      link_panel1('angle', 'rotation', 'z')
      link_panel2('color', 'currentHex', 'toString',16)
      link_panel1('alpha', 'material', 'opacity')
      $('.dz-message').css('top','2px')
      $('.dz-message').text(INTERSECTED.tex)    // text in Dropzone..
      show_block_unblock()  // show if the object position is blocked or not with the message on the button ..

}
