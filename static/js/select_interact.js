/*

Selection

*/

function color_pairs_in_blue(){

      /*
      Color all the pairs in blue..
      */

      for (var i in list_paired_harmonic){
          for (var j in list_paired_harmonic[i]){
              list_paired_harmonic[i][j].material.color.setHex(color_harmonic_pairs_pale_blue)
          }
      }

}

function reinit_two_obj_action(){

      /*
      Reinitialize the intermediate list and values..
      */

      list_interm_pair = []
      paire_harmonic = false

}

function select_two_obj_and_action(){

      /*
      Create pairs
      */

      if (list_interm_pair.length < 2){ list_interm_pair.push(SELECTED) }
      if (list_interm_pair.length == 2){
          list_paired_harmonic.push(list_interm_pair)
          reinit_two_obj_action()
          color_pairs_in_blue()
       }

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

function limits_and_action_reinit_var(){

      /*
      Reinitialize singleton variables
      */

      selpos = []                     // positions of the corners
      select_obj = false;
      make_plane = false;
      SELECTED = null;

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

function picking_action(){

      /*
      Picking
      */

      list_obj_inside.push(SELECTED)
      INTERSECTED.material.color.setHex( orange_medium ); //

}

function delete_area(){

        /*
        Delete area
        */

        for (i in list_dotted_area){ scene.remove(list_dotted_area[i]) }
        list_dotted_area = []
        reinit_selection()

} // end delete_area

function dotted_area(nbelem,elem, limits_minmax, size_elem_dotted_line){

        /*
        Dotted area
        */

        var [minx, maxx, miny, maxy] = limits_minmax
        var [nbelem1,nbelem2] = nbelem

        dotted_line(nbelem2,elem,'x',minx,miny,size_elem_dotted_line)
        dotted_line(nbelem1,elem,'y',minx,miny,size_elem_dotted_line)
        dotted_line(nbelem2,elem,'x',maxx,miny,size_elem_dotted_line)
        dotted_line(nbelem1,elem,'y',minx,maxy,size_elem_dotted_line)

}

function dotted_line(nbelem,elem,kind,posx,posy,size_elem_dotted_line){

        /*
        Dotted lines
        */

        for (var i=0; i < nbelem+1; i++){
              var elem_clone = elem.clone()
              if (kind == "x"){
                  elem_clone.position.x = posx;
                  elem_clone.position.y = posy+2*i*size_elem_dotted_line;
              }
              else if (kind == 'y'){
                  elem_clone.position.x = posx+2*i*size_elem_dotted_line;
                  elem_clone.position.y = posy
              }
              elem_clone.position.z = 25;
              scene.add(elem_clone)
              list_dotted_area.push(elem_clone)

          } // end for
}


function limit_area(){

        /*
        limits selection area
        */

        var minx = Math.min(selpos[0].position.x,selpos[1].position.x)
        var miny = Math.min(selpos[0].position.y,selpos[1].position.y)
        var maxx = Math.max(selpos[0].position.x,selpos[1].position.x)
        var maxy = Math.max(selpos[0].position.y,selpos[1].position.y)

        return [minx, maxx, miny, maxy]

}

function area_side1_side2(){


        /*
        Calculate side1 and side2
        */

        var side1 = Math.abs(selpos[0].position.x - selpos[1].position.x) // length side1
        var side2 = Math.abs(selpos[0].position.y - selpos[1].position.y) // length side2
        //alert(side1 + '__' + side2)
        $('#curr_func').css('background-color','grey')

        return [side1, side2]

}

function make_dotted_area(selpos){

        /*
        Area for selecting the pieces
        */

        var [side1, side2] = area_side1_side2()
        //-----------------
        var geometry = new THREE.CubeGeometry( size_elem_dotted_line, size_elem_dotted_line, 3 );
        var elem = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: color_dotted_line_black } ) );
        //----------------- number of elements
        nbelem1 = Math.round(side1/(2*size_elem_dotted_line))
        nbelem2 = Math.round(side2/(2*size_elem_dotted_line))
        //----------------- limits
        var limits_minmax = limit_area()
        var nbelem = [nbelem1,nbelem2]
        dotted_area(nbelem, elem, limits_minmax, size_elem_dotted_line)

} // end function make area

function refresh_dotted_area(){

      /*
      Dotted area refreshed
      */

      var selpos_interm = [selpos[0],SELECTED]
      make_dotted_area(selpos_interm)
      delete_area()
      make_dotted_area(selpos_interm)

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
                  objects[i].material.color.setHex(color_object_inside_pink)  // light pink color
              } // end if
      } // end for

} // end objects in area..
