/*

Basics for interaction

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

function make_raycaster(event){

      /*
      raycaster
      */

      event.preventDefault();
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
      //projector.unprojectVector( vector, camera );
      vector.unproject(camera); // https://stackoverflow.com/questions/29366109/three-js-three-projector-has-been-moved-to
      var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

      return raycaster

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

function getDistanceToPLane(particule, plane) {

      /*

      */

      var vec_up = new THREE.Vector3(0,0,1)
      var vec_lat = new THREE.Vector3()

      var pap = particule.position
      var plp = plane.position
      var plo = plane.orientation
      vec_lat.crossVectors(vec_up, plo).normalize()
      var dist_to_plane = Math.abs(pap.dot(plo)-plp.dot(plo))
      var dist_lat_in_plane = Math.abs(pap.dot(vec_lat)-plp.dot(vec_lat))
      // var dist_to_center = getDistance(particule, plane)
      // var dist_in_plane = Math.sqrt(dist_to_center**2-dist_to_plane**2)

      return [dist_to_plane, dist_lat_in_plane]

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

function restore_yellow(){

      /*
      Rend au dernier objet colorié en jaune (surbrillance "plus proche") sa VRAIE couleur.
      */

      if (yellow_obj){
            yellow_obj.material.color.setHex(yellow_obj.currentHex)
            yellow_obj = null
      }

}

function nearest_object(currobj){

      /*
      Trouve l'objet le plus proche et le colorie en jaune (surbrillance de magnétisme).
      NE colorie QUE cet objet et restaure le précédent — ne repeint pas tous les objets
      (l'ancienne version forçait la couleur de TOUS les objets à INTERSECTED.currentHex).
      */

      var mindist = 200, mini = -1
      for ( var i in objects ){
          if (objects[i] === currobj){ continue }
          if (list_obj_inside.indexOf(objects[i]) >= 0){ continue }   // ignore les membres de la sélection/groupe (évite de corrompre leur couleur)
          var dist = getDistance(currobj, objects[i])
          if ( dist < mindist ){ mindist = dist; mini = i }
      }
      var target = (mini != -1) ? objects[mini] : null
      if (yellow_obj !== target){                                    // le plus proche a changé
            restore_yellow()                                         // restaure l'ancien
            if (target){
                  target.currentHex = target.material.color.getHex() // mémorise sa vraie couleur
                  target.material.color.setHex(color_near_object_yellow)
                  yellow_obj = target
            }
      }
      return target

} // end nearest_object

function corner(col){

      /*
      Make a corner for area delimitation (selpos list)
      */

      var [newname, interptsub] = random_name_mousepos()
      var creobj = make_mark( newname, interptsub, {"x":0, "y":0, "z":0}, col )
      var s = size_elem_dotted_line / 30                 // make_mark fait un cube de 30 -> ramené à la taille d'un pointillé
      creobj.scale.set(s, s, s)
      selpos.push(creobj)
      list_sel_corners.push(creobj)                      // suivi pour le nettoyage (Ctrl+S)

      return creobj

}

function color_corner(){

      /*
      Color of the marks
      */

      col = color_dotted_line_black                       // coins = marques noires (comme les pointillés)

      return col

}

function random_name_mousepos(){

    return [random_name(), mousepos()]

}
