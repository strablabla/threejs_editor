/*

Undo / redo per scene, persistent in localStorage.

A "snapshot" = serialized get_scene_data() (full state of the scene).
The history is a stack of snapshots + a pointer, stored under a key
specific to each scene (scene name). Ctrl+Z = undo, Ctrl+Y or Ctrl+Shift+Z = redo.

Hooked into the auto-save (emit_infos_scene): each committed change records
a state. An undo/redo restores via clear_scene_local() + load_scene() WITHOUT
re-recording (keeps history_restoring).

*/

var history_restoring = false;          // true during an undo/redo: don't record a new state
var HISTORY_MAX = 30;                    // max depth (localStorage ~5 MB)

function history_key(){
      return 'scene_history::' + ((typeof scene !== 'undefined' && scene && scene.name) ? scene.name : '__working__');
}

function history_get(){
      try { return JSON.parse(localStorage.getItem(history_key())) || {stack:[], ptr:-1}; }
      catch(e){ return {stack:[], ptr:-1}; }
}

function history_set(h){
      try { localStorage.setItem(history_key(), JSON.stringify(h)); }
      catch(e){                                        // quota exceeded -> keep only the recent half
            h.stack = h.stack.slice(-Math.ceil(HISTORY_MAX/2));
            h.ptr = h.stack.length - 1;
            try { localStorage.setItem(history_key(), JSON.stringify(h)); } catch(e2){}
      }
}

function history_snapshot(data){                       // JSON string of the state (without the _archive directive)
      var d = data || get_scene_data();
      var clean = {};
      for (var k in d){ if (k !== '_archive'){ clean[k] = d[k]; } }
      return JSON.stringify(clean);
}

function history_record(data){                         // records a state AFTER a change
      if (history_restoring){ return; }
      if (typeof get_scene_data !== 'function'){ return; }
      var snap = history_snapshot(data);
      var h = history_get();
      if (h.stack.length && h.stack[h.ptr] === snap){ return; }   // no duplicate (e.g. plain camera rotation)
      h.stack = h.stack.slice(0, h.ptr + 1);           // erase the "future" if some undo had been done
      h.stack.push(snap);
      if (h.stack.length > HISTORY_MAX){ h.stack = h.stack.slice(h.stack.length - HISTORY_MAX); }
      h.ptr = h.stack.length - 1;
      history_set(h);
      update_undo_redo_ui();
}

function history_seed(){                               // baseline: if the scene has no history, record the current state
      var h = history_get();
      if (!h.stack.length){ history_record(); }
      else { update_undo_redo_ui(); }
}

function history_apply(snap){
      history_restoring = true;
      try {
            if (typeof clear_scene_local === 'function'){ clear_scene_local(); }   // load_scene doesn't clear -> clean up first
            load_scene(JSON.parse(snap));
            if (typeof emit_infos_scene === 'function'){ emit_infos_scene(); }      // updates pos.json (consistent refresh), without re-recording
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

function update_undo_redo_ui(){                        // (optional) grey out undo/redo buttons if they exist
      var h = history_get();
      var u = document.getElementById('undo_btn'), r = document.getElementById('redo_btn');
      if (u){ u.style.opacity = (h.ptr > 0) ? '1' : '0.3'; }
      if (r){ r.style.opacity = (h.ptr < h.stack.length - 1) ? '1' : '0.3'; }
}

document.addEventListener('keydown', function(e){
      var t = e.target || e.srcElement;                // don't capture when typing in a field
      if (t){ var tag = (t.tagName || '').toLowerCase();
              if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable){ return; } }
      var ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl){ return; }
      var z = (e.keyCode === 90 || e.key === 'z' || e.key === 'Z');
      var y = (e.keyCode === 89 || e.key === 'y' || e.key === 'Y');
      if (z && !e.shiftKey){ e.preventDefault(); history_undo(); }
      else if (y || (z && e.shiftKey)){ e.preventDefault(); history_redo(); }   // Ctrl+Y or Ctrl+Shift+Z = redo
});
