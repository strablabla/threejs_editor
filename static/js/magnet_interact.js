/*

Magnet interaction between the objects..

*/


function magnet_parallel_walls(rot_abs, signx, signy){

      /*
      Magnet for parallel walls
      */

      if (rot_abs != 0){ SELECTED.position.x += signx*SELECTED.width }
      else{ SELECTED.position.y += signy*SELECTED.width }
      $('#curr_func').css('background-color','yellow')

}

function magnet_face_to_face(signx,signy,face){

      /*
      Magnet for parallel walls
      */

      if (face == 'facex'){ SELECTED.position.x += signx*SELECTED.width }
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

function signxy_face(SELECTED, nearest_elem){

      /*
      signs: signx and signy according to the position
      face : face to be glued..
      */

      var diffx = SELECTED.position.x - nearest_elem.position.x
      var diffy = SELECTED.position.y - nearest_elem.position.y
      var signx = Math.sign(diffx)
      var signy = Math.sign(diffy)
      if (Math.abs(diffx) < Math.abs(diffy)){ var face = "facey" }
      else{var face = "facex"}

      return [signx, signy, face]

}

function rotation_relative_absolute(SELECTED, nearest_elem){

      /*
      rot_relat : angle difference between SELECTED and nearest_elem..
      rot_abs : absolute angle of SELECTED
      */

      var rot_relat = Math.round((SELECTED.rotation.z - nearest_elem.rotation.z) % Math.PI)
      var rot_abs = Math.round(SELECTED.rotation.z % Math.PI)

      return [rot_relat, rot_abs]
}

function magnet_wall_wall(){
      /*
      Case magnet wall to wall
      */
      return (SELECTED.type == 'wall' &  nearest_elem.type == 'wall')
}

function magnet_cube_cube(){
      /*
      Case magnet cube cube
      */
      return (SELECTED.type == 'simple_cube' &  nearest_elem.type == 'simple_cube')
}

function magnet_pavement_pavement(){
      /*
      Case magnet pavement pavement
      */
      return (SELECTED.type == 'pavement' &  nearest_elem.type == 'pavement')
}

function magnet_diff_cases(signx, signy, face, rot_relat, rot_abs){

      /*
      Take into account the different cases
      */

      if (magnet_wall_wall()){
            if ( (rot_relat == 0) ){ magnet_parallel_walls(rot_abs, signx, signy) }
            else{ magnet_perpendicular_walls(signx, signy)}
      }
      else if (magnet_cube_cube()){ magnet_face_to_face(signx, signy,face) }
      else if (magnet_pavement_pavement()){ magnet_face_to_face(signx, signy,face) }

}

function magnet_between_objects(nearest_elem){

      /*
      Magnetism between objects
      */

      if (nearest_elem.magnet & SELECTED.magnet){
            [signx, signy, face] = signxy_face(SELECTED, nearest_elem)
            copypos(SELECTED, nearest_elem)                 // position on same axe..
            var [rot_relat, rot_abs] = rotation_relative_absolute(SELECTED, nearest_elem)
            magnet_diff_cases(signx, signy, face, rot_relat, rot_abs)
      }

} // end magnet_between_objects
