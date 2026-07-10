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
      Move the whole group (objets + pointillés de la zone) avec SELECTED.
      */

      for (i in list_obj_inside){
          var name_i = list_obj_inside[i].name
          addpos(list_obj_inside[i].position, SELECTED.position, dict_pos_relat[name_i])
      }
      for (i in list_dotted_area){                       // les pointillés suivent aussi
          if (dotted_relat[i]){ addpos(list_dotted_area[i].position, SELECTED.position, dotted_relat[i]) }
      }
      for (i in list_sel_corners){                       // les coins noirs suivent aussi
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
      dotted_relat = []                                  // offsets des pointillés (pour qu'ils suivent le groupe)
      for (i in list_dotted_area){
          dotted_relat[i] = {'x':0, 'y':0, 'z':0}
          removepos(dotted_relat[i], list_dotted_area[i].position, SELECTED.position)
      }
      corners_relat = []                                 // offsets des coins noirs
      for (i in list_sel_corners){
          corners_relat[i] = {'x':0, 'y':0, 'z':0}
          removepos(corners_relat[i], list_sel_corners[i].position, SELECTED.position)
      }
}

//--------------------- Toggles Ctrl+S / Ctrl+G / Ctrl+Maj+G

function clear_area_selection(){

      /*
      Efface la sélection de zone : pointillés + couleur rose des objets + listes.
      */

      for (var i in list_dotted_area){ scene.remove(list_dotted_area[i]) }
      list_dotted_area = []
      for (var i in list_sel_corners){                   // retire aussi les marques noires des coins
          var c = list_sel_corners[i]
          scene.remove(c)
          var oi = objects.indexOf(c); if (oi >= 0){ objects.splice(oi, 1) }
      }
      list_sel_corners = []
      for (var i in list_obj_inside){                    // restaure la vraie couleur (rose -> currentHex)
          var o = list_obj_inside[i]
          if (o.group_id !== undefined){ continue }      // membre d'un groupe persistant -> reste bleu
          if (o.material && o.material.color && o.currentHex !== undefined){ o.material.color.setHex(o.currentHex) }
      }
      list_obj_inside = []
      selpos = []
      new_select_ok = false
      select_move_group = false
      if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
}

function toggle_area_selection(){

      /*
      Ctrl+S : s'il y a une sélection -> l'efface ; sinon -> active le tracé d'une zone.
      */

      if (list_obj_inside.length > 0 || list_dotted_area.length > 0 || list_sel_corners.length > 0 || new_select_ok){
            clear_area_selection()
      } else {
            if (typeof reinit_params_ok === 'function'){ reinit_params_ok() }   // couper les outils de création (sphère, mur…)
            if (typeof list_string !== 'undefined'){ list_string = [] }
            $('#curr_tool').text('sélection'); $('#active_obj_navbar').text('')
            new_select_ok = true
            if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
      }
}

function toggle_group_move(){

      /*
      Ctrl+G : (dés)active le déplacement de groupe (ré-appui = dégroupe le déplacement).
      Retour visuel : la sélection passe en BLEU (groupée) ou ROSE (dégroupée).
      */

      select_move_group = !select_move_group
      if (typeof color_group === 'function'){ color_group() }   // bleu si groupé, rose sinon
      if (typeof toggle_cases_ending === 'function'){ toggle_cases_ending() }
}

function group_members(gid){

      /*
      Objets appartenant au groupe persistant gid.
      */

      var m = []
      for (var i in objects){ if (objects[i] && objects[i].group_id === gid){ m.push(objects[i]) } }
      return m
}

function toggle_persistent_group(){

      /*
      Ctrl+Maj+G : forme un GROUPE PERSISTANT avec les objets sélectionnés (déplacement
      souris en bloc, mais INDÉPENDANTS dans la physique). Ré-appui sur un groupe = dégroupe.
      */

      var sel = list_obj_inside
      if (sel.length < 2){ return }                      // il faut au moins 2 objets sélectionnés
      var gid = sel[0].group_id
      var allSame = (gid !== undefined)
      for (var i in sel){ if (sel[i].group_id !== gid){ allSame = false } }
      if (allSame){                                      // déjà groupés -> DÉGROUPER (restaure la couleur)
            for (var i in sel){
                  var o = sel[i]
                  delete o.group_id
                  if (o.material && o.material.color && o.currentHex !== undefined){ o.material.color.setHex(o.currentHex) }
            }
      } else {                                           // GROUPER -> marquer en bleu
            var ng = ++group_id_counter
            for (var i in sel){
                  var o = sel[i]
                  o.group_id = ng
                  if (o.material && o.material.color){
                        if (o.currentHex === undefined){ o.currentHex = o.material.color.getHex() }  // mémorise la vraie couleur
                        o.material.color.setHex(color_group_persistent_violet)                      // violet = groupe persistant
                  }
            }
      }
      if (typeof emit_infos_scene === 'function'){ emit_infos_scene() }
}
