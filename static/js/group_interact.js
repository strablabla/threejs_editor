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
