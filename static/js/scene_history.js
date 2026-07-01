/*

Undo / redo par scène, persistant en localStorage.

Un "snapshot" = get_scene_data() sérialisé (état complet de la scène).
L'historique est une pile de snapshots + un pointeur, stockée sous une clé
propre à chaque scène (nom de scène). Ctrl+Z = undo, Ctrl+Y ou Ctrl+Maj+Z = redo.

Branché sur l'auto-save (emit_infos_scene) : chaque changement validé enregistre
un état. Un undo/redo restaure via clear_scene_local() + load_scene() SANS
réenregistrer (garde history_restoring).

*/

var history_restoring = false;          // vrai pendant un undo/redo : ne pas enregistrer de nouvel état
var HISTORY_MAX = 30;                    // profondeur max (localStorage ~5 Mo)

function history_key(){
      return 'scene_history::' + ((typeof scene !== 'undefined' && scene && scene.name) ? scene.name : '__working__');
}

function history_get(){
      try { return JSON.parse(localStorage.getItem(history_key())) || {stack:[], ptr:-1}; }
      catch(e){ return {stack:[], ptr:-1}; }
}

function history_set(h){
      try { localStorage.setItem(history_key(), JSON.stringify(h)); }
      catch(e){                                        // quota dépassé -> on ne garde que la moitié récente
            h.stack = h.stack.slice(-Math.ceil(HISTORY_MAX/2));
            h.ptr = h.stack.length - 1;
            try { localStorage.setItem(history_key(), JSON.stringify(h)); } catch(e2){}
      }
}

function history_snapshot(data){                       // chaîne JSON de l'état (sans la directive _archive)
      var d = data || get_scene_data();
      var clean = {};
      for (var k in d){ if (k !== '_archive'){ clean[k] = d[k]; } }
      return JSON.stringify(clean);
}

function history_record(data){                         // enregistre un état APRÈS un changement
      if (history_restoring){ return; }
      if (typeof get_scene_data !== 'function'){ return; }
      var snap = history_snapshot(data);
      var h = history_get();
      if (h.stack.length && h.stack[h.ptr] === snap){ return; }   // pas de doublon (ex. simple rotation caméra)
      h.stack = h.stack.slice(0, h.ptr + 1);           // on efface le "futur" si on avait fait des undo
      h.stack.push(snap);
      if (h.stack.length > HISTORY_MAX){ h.stack = h.stack.slice(h.stack.length - HISTORY_MAX); }
      h.ptr = h.stack.length - 1;
      history_set(h);
      update_undo_redo_ui();
}

function history_seed(){                               // baseline : si la scène n'a pas d'historique, enregistre l'état courant
      var h = history_get();
      if (!h.stack.length){ history_record(); }
      else { update_undo_redo_ui(); }
}

function history_apply(snap){
      history_restoring = true;
      try {
            if (typeof clear_scene_local === 'function'){ clear_scene_local(); }   // load_scene n'efface pas -> nettoyer avant
            load_scene(JSON.parse(snap));
            if (typeof emit_infos_scene === 'function'){ emit_infos_scene(); }      // met pos.json à jour (refresh cohérent), sans réenregistrer
      } finally {
            history_restoring = false;
      }
      update_undo_redo_ui();
}

function history_undo(){
      var h = history_get();
      if (h.ptr > 0){ h.ptr--; history_set(h); history_apply(h.stack[h.ptr]); }
}

function history_redo(){
      var h = history_get();
      if (h.ptr < h.stack.length - 1){ h.ptr++; history_set(h); history_apply(h.stack[h.ptr]); }
}

function update_undo_redo_ui(){                        // (optionnel) griser des boutons undo/redo s'ils existent
      var h = history_get();
      var u = document.getElementById('undo_btn'), r = document.getElementById('redo_btn');
      if (u){ u.style.opacity = (h.ptr > 0) ? '1' : '0.3'; }
      if (r){ r.style.opacity = (h.ptr < h.stack.length - 1) ? '1' : '0.3'; }
}

document.addEventListener('keydown', function(e){
      var t = e.target || e.srcElement;                // ne pas capter quand on tape dans un champ
      if (t){ var tag = (t.tagName || '').toLowerCase();
              if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable){ return; } }
      var ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl){ return; }
      var z = (e.keyCode === 90 || e.key === 'z' || e.key === 'Z');
      var y = (e.keyCode === 89 || e.key === 'y' || e.key === 'Y');
      if (z && !e.shiftKey){ e.preventDefault(); history_undo(); }
      else if (y || (z && e.shiftKey)){ e.preventDefault(); history_redo(); }   // Ctrl+Y ou Ctrl+Maj+Z = redo
});
