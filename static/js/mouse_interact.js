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
    plane = new THREE.Mesh( new THREE.PlaneGeometry( size_plane, size_plane, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
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

function action_on_selected_when_moving(raycaster){

      /*
      Action when selected and moving
      */

      var intersects = raycaster.intersectObject( plane );
      var interptsub = intersects[ 0 ].point.sub( offset )
      interptsub.z = SELECTED.position.z
      if ( !SELECTED.blocked ){ SELECTED.position.copy( interptsub ) } // move the object selected..
      nearest_elem = nearest_object(SELECTED)      // change the color of the nearest objects in yellow..
      if (select_move_group){
          move_group()  // move the whole group, obj in list_obj_inside
      }
}

function onDocumentMouseMove( event ) {

    /*
    Mouse moving
    */

    var raycaster = make_raycaster(event)

    if ( SELECTED ) {
        action_on_selected_when_moving(raycaster)
        return;
    } // end if SELECTED
    var intersects = raycaster.intersectObjects( objects );
    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex); //
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
        }
        container.style.cursor = 'pointer';
    } else {
        if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
        container.style.cursor = 'auto';
    }

    color_pick()

} // end mouse move

function picking_action(){

  /*
  Picking
  */

  list_obj_inside.push(SELECTED)
  INTERSECTED.material.color.setHex( orange_medium ); //

}

function onDocumentMouseDown( event ) {

    /*
    Mouse down
    */

    var raycaster = make_raycaster(event)
    var intersects = raycaster.intersectObjects( objects );
    if ( intersects.length > 0 ) {
        controls.enabled = false;
        SELECTED = intersects[ 0 ].object;
        var intersects = raycaster.intersectObject( plane );
        container.style.cursor = 'move';
    }
    else{ $('.panel').css({'top':"10px","left":"-300px"}) } // hide panel when mouse leaves..
    if ( INTERSECTED ) INTERSECTED.material.color.setHex( 0x66ff33 );       // changing color in green when selected
    if (select_picking){ picking_action() }                // adding the object to the list of the picked elements..
    if (select_move_group){ keep_relative_positions() } // save the relative positions inside the group

}

function magnet_parallel_walls(rot_abs, signx, signy){

      /*
      Magnet for parallel walls
      */

      if (rot_abs != 0){ SELECTED.position.x += signx*SELECTED.width }
      else{ SELECTED.position.y += signy*SELECTED.width }
      $('#curr_func').css('background-color','yellow')

}

function magnet_perpendicular_walls(signx, signy){

      /*
      Magnet for perpendicular walls
      */

      SELECTED.position.x += signx*SELECTED.width/2; //
      SELECTED.position.y += signy*SELECTED.width/2;
      $('#curr_func').css('background-color','grey')

}

function signxy(SELECTED, nearest_elem){

      /*
      Signs: signx and signy according to the position
      */

      var signx = Math.sign(SELECTED.position.x - nearest_elem.position.x)
      var signy = Math.sign(SELECTED.position.y - nearest_elem.position.y)

      return [signx, signy]

}

function rotation_relative_absolute(SELECTED, nearest_elem){

      var rot_relat = Math.round((SELECTED.rotation.z - nearest_elem.rotation.z) % Math.PI)
      var rot_abs = Math.round(SELECTED.rotation.z % Math.PI)

      return [rot_relat, rot_abs]
}

function magnet_wall(nearest_elem){

      /*
      Wall attracted by the nearest wall..
      */

      [signx, signy] = signxy(SELECTED, nearest_elem)
      copypos(SELECTED, nearest_elem)
      var [rot_relat, rot_abs] = rotation_relative_absolute(SELECTED, nearest_elem)
      if ( (rot_relat == 0) ){ magnet_parallel_walls(rot_abs, signx, signy) }
      else{ magnet_perpendicular_walls(signx, signy) }

} // end magnet_wall

function onDocumentMouseUp( event ) {

      /*
      Mouse up
      */

      event.preventDefault();
      controls.enabled = true;
      if (nearest_elem){ magnet_wall(nearest_elem) }  // attraction between walls.. by the sides..
      if ( INTERSECTED ) {
          LAST_SELECTED = SELECTED;
          SELECTED = null;
      }
      container.style.cursor = 'auto';
      color_pick()
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

function minimaxi(selpos){

      /*
      Find the objects in the selected area..
      */

      minx = Math.min(selpos[0].position.x, selpos[1].position.x)
      maxx = Math.max(selpos[0].position.x, selpos[1].position.x)
      miny = Math.min(selpos[0].position.y, selpos[1].position.y)
      maxy = Math.max(selpos[0].position.y, selpos[1].position.y)

      return [minx, maxx, miny, maxy]

}

function is_inside(obj, list_mm){

  /*
  Check if it is inside, true = inside, false = outside
  */

  return  obj.position.x > list_mm[0] &
          obj.position.x < list_mm[1] &
          obj.position.y > list_mm[2] &
          obj.position.y < list_mm[3]
}

function find_objects_in_area(){

    /*
    Find the objects in the selected area..
    */

    list_mm = minimaxi(selpos)

    for (i in objects){     // if object is inside the area..
        if ( is_inside(objects[i], list_mm) ){
                list_obj_inside.push(objects[i])            // put the object in the list list_obj_inside
                objects[i].material.color.setHex(0xffcccc)  // light pink color
            } // end if
    } // end for
} // end objects in area..

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
function nearest_object(currobj){

    /*
    Find the nearest object and change its color in yellow..
    */

    var mindist = 200;
    mini = -1;
    for ( i in objects ){
        if (objects[i] != currobj){
              var dist = getDistance(currobj, objects[i])
              if ( dist < mindist ){        // smaller distance
                      mini = i
                      mindist = dist       // change mini distance..
                  }
              else {
                      objects[i].material.color.setHex(INTERSECTED.currentHex) // initial color
                  }
        } // end if objects[i]
    } // end for

    if ( mini != -1 ){
         objects[mini].material.color.setHex(0xffff66)      // change the color to yellow
    }
    return objects[mini]

} // end nearest_object

function reinit_glob_var_and_actions(){

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

      if ( selpos.length < 2 ){
          make_limits_mouse()             // find the corners and make the area..
      }
      else{
          if (selpos.length == 2){
              act_directly(selpos)      // execute the action with the information of the position of the corners
              if (select_obj){
                  find_objects_in_area()
              }
              reinit_glob_var_and_actions()
          }
      } // end else
}

function corner(){

    /*
    Make a corner
    */

    interptsub = mousepos()
    var creobj = make_mark( random_name(), interptsub, {"x":0, "y":0, "z":0}, 0xffcccc )
    selpos.push(creobj)
    list_obj_inside.push(creobj)      // adding the limits in the list
    return creobj

}

function make_limits_mouse(){

    /*
    Graphical limits moved with the mouse..
    */

    var corner0 = corner()
    var corner1 = corner()
    SELECTED = corner1

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

function newview(selpos){

    /*
    put the camera at positon selpos[0] and look at selpos[1]
    */

    var [altit, s0, s1] = params_newview(selpos)
    camera.position.set(s0.x, s0.y, s0.z + altit); // Set position like this
    camera.up = new THREE.Vector3(0,0,1);
    controls.target = new THREE.Vector3(s1.x, s1.y, s1.z + altit);
    select_poscam = false;
    selpos = []
    $('#curr_func').css('background-color','blue')

}

function make_new_wall(){

    /*
    Make a new wall
    */

    newname = random_name()
    interptsub = mousepos()
    basic_tex = new THREE.ImageUtils.loadTexture( basic_tex_addr ) // Default white texture
    listmat[newname] = new THREE.MeshBasicMaterial({ map : basic_tex, color : basic_color})
    listorig[newname] = make_wall( newname, interptsub, {"x":0, "y":0, "z":0}, listmat[newname] )
}

function make_new_cube_texture(){

    /*
    Make a new cube with texture
    */

    $('#curr_func').css('background-color','red')
    newname = random_name()
    interptsub = mousepos()
    curr_tex_addr = basic_multiple_tex_addr;
    $('#curr_func').css('background-color','blue')
    var meshFaceMaterial = make_meshFaceMaterial('face_color')
    listorig[newname] = make_cube_texture( newname, interptsub, {"x":0, "y":0, "z":0}, meshFaceMaterial )   // make the wall object
    listorig[newname]['tex_addr'] =  curr_tex_addr               									// texture address
    listorig[newname]['tex'] =  curr_tex_addr.split('/').pop(-1)               	  // texture name
    $('#curr_func').css('background-color','green')
    // basic_tex = new THREE.ImageUtils.loadTexture( basic_tex_addr ) // Default white texture
    // listmat[newname] = new THREE.MeshBasicMaterial({ map : basic_tex, color : basic_color})
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

    link(new_wall_ok, make_new_wall, null)                     // N key
    link(new_cube_texture_ok, make_new_cube_texture, null)     // M key
    link(select_obj, limits_and_action, make_dotted_area)      // S key
    link(make_plane, limits_and_action, make_horizontal_area)  // H key
    link(select_poscam, limits_and_action, newview)            // K key

} // end mouse_create_object_or_action

function show_block_unblock(){

    /*
    Value button block, unblock
    */

    if (LAST_SELECTED.blocked){ $('#block_pos').text('unblock') }
    else{ $('#block_pos').text('block') }

}

function modify_values(INTERSECTED){

    /*
    Change the vaues in the panel for infos about the object selected..
    */

    $('#name_panel').text(INTERSECTED.name);                              // name of the element in the parameter panel..
    $('#width_panel').val(INTERSECTED.width);                             // width  of the element in the parameter panel..
    $('#height_panel').val(INTERSECTED.height);                           // height of the element in the parameter panel..
    $('#angle_panel').val(INTERSECTED.rotation.z);                        // angle of the element in the parameter panel..
    $('#color_panel').val(INTERSECTED.material.color.getHex());           // color of the element in the parameter panel..
    //$('#texture_panel').val(INTERSECTED.tex);                           // texture of the element in the parameter panel..
    $('.dz-message').css('top','2px')
    $('.dz-message').text(INTERSECTED.tex)    // text in Dropzone..
    show_block_unblock()

}

function show_infos_at_mouse_pos(x,i){

    x[i].style.left = event.pageX + "px";  				// using mouse x
    x[i].style.top = event.pageY + "px";   				// using mouse y

}

function show_infos_upper_left(x,i){

  x[i].style.left = "0px";  				  //  pos x
  x[i].style.top =  "50px";   				//  pos y

}

function show_infos(){

      /*
      Show or hide the informations about the object..
      */

      var x = document.getElementsByClassName("panel");
      for (var i = 0; i < x.length; i++) {
        x[i].style.visibility = "visible";    // make the panel visible
        x[i].style.backgroundColor = "white";
        if (infos_in_place){
              show_infos_at_mouse_pos(x,i)
          }
          else{                         // upper left, hidden..
              show_infos_upper_left(x,i)
          }
      } // end for
} // end show_hide_infos

//
function give_infos(){

      /*
      Give infos about the selected object.
      The information appears close to the object selected..
      Infos are :
          * the name
          * the orientation..
      play with .panel
      */

      if (select_obj_infos){       //  select_obj_infos must be activated for accessing to the infos..
          if ( INTERSECTED ){
                show_infos()
                }
          modify_values(INTERSECTED) // give the current values

        } // end if select_obj_infos
} // end give infos
