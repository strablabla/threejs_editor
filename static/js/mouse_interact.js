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

function onDocumentMouseDown( event ) {

      /*
      Mouse down
      */

      var raycaster = make_raycaster(event)
      var intersects = raycaster.intersectObjects( objects );
      if ( intersects.length > 0 ) { intersects = mouse_down_case_intersections(intersects,raycaster) }
      else{ $('.panel').css({'top':"10px","left":"-300px"}) }             // hide panel when mouse leaves..
      MouseDown_actions()

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

function getMiddle(mesh1, mesh2) {

      /*
      Return the middle position between the 2 objects..
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

function random_name_mousepos(){

      /*
      Return a random name and the position of the mouse
      */

      return [random_name(), mousepos()]

}
