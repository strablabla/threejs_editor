

function picking_action(){

      /*
      Picking
      */

      list_obj_inside.push(SELECTED)
      INTERSECTED.material.color.setHex( orange_medium ); //

}

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
