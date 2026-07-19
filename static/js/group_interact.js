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
      Move the whole group (objects + dotted lines of the area) with SELECTED.
      */

      for (i in list_obj_inside){
          var name_i = list_obj_inside[i].name
          addpos(list_obj_inside[i].position, SELECTED.position, dict_pos_relat[name_i])
      }
      for (i in list_dotted_area){                       // the dotted lines follow too
          if (dotted_relat[i]){ addpos(list_dotted_area[i].position, SELECTED.position, dotted_relat[i]) }
      }
      for (i in list_sel_corners){                       // the black corners follow too
          if (corners_relat[i]){ addpos(list_sel_corners[i].position, SELECTED.position, corners_relat[i]) }
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
      dotted_relat = []                                  // offsets of the dotted lines (so they follow the group)
      for (i in list_dotted_area){
          dotted_relat[i] = {'x':0, 'y':0, 'z':0}
          removepos(dotted_relat[i], list_dotted_area[i].position, SELECTED.position)
      }
      corners_relat = []                                 // offsets of the black corners
      for (i in list_sel_corners){
          corners_relat[i] = {'x':0, 'y':0, 'z':0}
          removepos(corners_relat[i], list_sel_corners[i].position, SELECTED.position)
      }
}

//--------------------- Toggles Ctrl+S / Ctrl+G / Ctrl+Shift+G

function clear_area_selection(){

      /*
      Clears the area selection: dotted lines + pink color of the objects + lists.
      */

      for (var i in list_dotted_area){ scene.remove(list_dotted_area[i]) }
      list_dotted_area = []
      for (var i in list_sel_corners){                   // also removes the black corner marks
          var c = list_sel_corners[i]
          scene.remove(c)
          var oi = objects.indexOf(c); if (oi >= 0){ objects.splice(oi, 1) }
      }
      list_sel_corners = []
      for (var i in list_obj_inside){                    // restores the color (pink/violet -> original color)
          var o = list_obj_inside[i]
          if (!o.material || !o.material.color){ continue }
          if (o.group_id !== undefined && group_highlighted[o.group_id]){
                o.material.color.setHex(color_group_persistent_violet)   // highlighted group (context menu) -> stays violet
          } else if (o.currentHex !== undefined){
                o.material.color.setHex(o.currentHex)                    // otherwise -> original color
          }
      }
      list_obj_inside = []
      selpos = []
      new_select_ok = false
      select_move_group = false
      if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
}

function toggle_area_selection(){

      /*
      Ctrl+S: if there is a selection -> clears it; otherwise -> enables drawing an area.
      */

      if (list_obj_inside.length > 0 || list_dotted_area.length > 0 || list_sel_corners.length > 0 || new_select_ok){
            clear_area_selection()
      } else {
            if (typeof reinit_params_ok === 'function'){ reinit_params_ok() }   // turn off the creation tools (sphere, wall…)
            if (typeof list_string !== 'undefined'){ list_string = [] }
            $('#curr_tool').text('sélection'); $('#active_obj_navbar').text('')
            new_select_ok = true
            if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
      }
}

function toggle_group_move(){

      /*
      Ctrl+G: toggles group move (pressing again = ungroups the move).
      Visual feedback: the selection turns BLUE (grouped) or PINK (ungrouped).
      */

      select_move_group = !select_move_group
      if (typeof color_group === 'function'){ color_group() }   // blue if grouped, pink otherwise
      if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
}

function group_members(gid){

      /*
      Objects belonging to the persistent group gid.
      */

      var m = []
      for (var i in objects){ if (objects[i] && objects[i].group_id === gid){ m.push(objects[i]) } }
      return m
}

function toggle_persistent_group(){

      /*
      Ctrl+Shift+G: forms a PERSISTENT GROUP with the selected objects (mouse move
      as a block, but INDEPENDENT in the physics). Pressing again on a group = ungroups.
      */

      var sel = list_obj_inside
      if (sel.length < 2){ return }                      // at least 2 objects must be selected
      var gid = sel[0].group_id
      var allSame = (gid !== undefined)
      for (var i in sel){ if (sel[i].group_id !== gid){ allSame = false } }
      if (allSame){                                      // already grouped -> UNGROUP (restores the color)
            delete group_highlighted[gid]                // end the highlight of this group
            for (var i in sel){
                  var o = sel[i]
                  delete o.group_id
                  if (o.material && o.material.color && o.currentHex !== undefined){ o.material.color.setHex(o.currentHex) }
            }
      } else {                                           // GROUP -> violet (visual feedback, not highlighted by default)
            var ng = ++group_id_counter
            group_highlighted[ng] = false                // on deselection: back to the original colors
            for (var i in sel){
                  var o = sel[i]
                  o.group_id = ng
                  if (o.material && o.material.color){
                        if (o.currentHex === undefined){ o.currentHex = o.material.color.getHex() }  // stores the real color
                        o.material.color.setHex(color_group_persistent_violet)                      // violet = persistent group
                  }
            }
      }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}

function highlight_group(gid, on){

      /*
      Enables/disables the violet coloring of a persistent group (context menu)
      to see at a glance who belongs to the group and who does not.
      */

      group_highlighted[gid] = on
      var m = group_members(gid)
      for (var i = 0; i < m.length; i++){
            var o = m[i]
            if (!o.material || !o.material.color){ continue }
            if (on){
                  if (o.currentHex === undefined){ o.currentHex = o.material.color.getHex() }  // stores the real color
                  o.material.color.setHex(color_group_persistent_violet)
            } else if (o.currentHex !== undefined){
                  o.material.color.setHex(o.currentHex)                                        // original color
            }
      }
}
