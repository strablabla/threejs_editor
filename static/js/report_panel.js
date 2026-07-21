/*
  Report (compte rendu) — lightweight editing window with preview and graph snapshots.

  Goal: write an experiment report and embed in it the IMAGES produced in
  the « Trajectories » window (x–y, z(t), MSD graphs). Each snapshot is FROZEN: we capture
  the canvas as it is at the instant of the click (PNG as a data-URL), so that we can keep
  several instants of the same graph over the course of the experiment.

  Stack: vanilla JS + jQuery (like the rest of the project). No external markdown dependency —
  a small in-house renderer is enough for a lab report (headings, bold/italic, lists, figures).

  Persistence: ON DISK, served by Flask — static/reports/<scene>.json, one file per
  experiment (unnamed scene: __unnamed__). It used to be the browser localStorage, capped at
  ~5 MB for the whole site: with PNG figures in base64, a hundred experiments blew the quota
  and the figures were LOST without a word. On disk there is no such limit, the reports follow
  the project (portable, backup-able) and the server can list their descriptions (!descr)
  to fill the tooltips of the scene dropdown — which the browser storage could not do.
  The reports follow renaming / Save as / deletion, wired in panel_scene.html.

  Inspired by the ReportPanel from sam3_exp (!fig / !img directives), adapted to the context: here the
  figures are canvas snapshots referenced by a [[fig:ID|caption]] token.
*/

var REPORT_LS_PREFIX = 'report::'              // OLD browser storage — only read, for the one-time migration
var REPORT_LS_OLD_KEY = 'threejs_report_v1'   // even older single key
var report_state = { md: '', figs: {}, seq: 0 }   // figs: { id -> {kind, url} } ; seq: id counter
var _report_wired = false
var _report_scene = null                      // name of the scene whose report is loaded in the editor
var _report_dirty = false                     // edits not yet written to disk
var _report_save_timer = null

var REPORT_UNNAMED = '__unnamed__'            // scratch report of a scene with no name yet
var REPORT_SAVE_DELAY = 700                   // ms: one write per pause in typing, not one per keystroke

// Name of the report bucket for the current scene.
function report_scene_key(){
      var nm = (typeof scene !== 'undefined' && scene && scene.name) ? scene.name : ''
      return nm || REPORT_UNNAMED
}

// --- Persistence: ON DISK, served by Flask (static/reports/<scene>.json) --------
// The browser storage was capped at ~5 MB for the whole site: a hundred experiments
// with a few PNG figures each blew the quota and the figures were silently lost.

function report_apply(s){                     // adopts a state coming from the server
      report_state = { md: '', figs: {}, seq: 0 }        // blank first: a report must never leak between scenes
      if (s){
            report_state.md   = typeof s.md === 'string' ? s.md : ''
            report_state.figs = (s.figs && typeof s.figs === 'object') ? s.figs : {}
            report_state.seq  = s.seq | 0
      }
}

function report_load(name, done){

      /*
      Loads the report of scene 'name' (asynchronous: it comes from the server).
      'done' is called once the state is in place — the editor is only refreshed there,
      otherwise a slow answer would overwrite a report the user has already started typing.
      */

      $.ajax({ url: '/report/' + encodeURIComponent(name), dataType: 'json', cache: false })
       .done(function(s){
            if (_report_scene !== name){ return }         // scene changed meanwhile: this answer is stale
            report_apply(s)
            _report_dirty = false
            if (typeof done === 'function'){ done() }
       })
       .fail(function(){
            if (_report_scene !== name){ return }
            report_apply(null)                            // server unreachable: blank editor rather than a foreign report
            if (typeof done === 'function'){ done() }
       })
}

function report_save_now(name, state){

      /*
      Immediate write. 'name'/'state' are captured by the caller so that a save in flight
      keeps targeting the RIGHT scene even if the user switches scene in the meantime.
      */

      state.descr = (typeof report_extract_descr === 'function') ? report_extract_descr(state.md) : ''
      return $.ajax({ url: '/report/' + encodeURIComponent(name), method: 'POST',
                      contentType: 'application/json', data: JSON.stringify(state) })
}

function report_save(immediate){

      /*
      Schedules the write (debounced: the textarea fires on every keystroke).
      immediate = true for the actions that must not be lost (figure, clear, closing).
      */

      if (!_report_scene){ return }
      _report_dirty = true
      var name = _report_scene, state = report_state
      if (_report_save_timer){ clearTimeout(_report_save_timer); _report_save_timer = null }
      if (immediate){
            return report_save_now(name, state)
                  .done(function(){ _report_dirty = false })
                  .fail(function(){ alert('Compte rendu : écriture sur le disque impossible.\nVérifie que le serveur tourne.') })
      }
      _report_save_timer = setTimeout(function(){
            _report_save_timer = null
            report_save_now(name, state).done(function(){ _report_dirty = false })
      }, REPORT_SAVE_DELAY)
}

function report_migrate_from_browser(){

      /*
      One-time recovery of the reports still held in this browser. The server only writes
      those it does NOT already have (never overwrites a report edited since), and returns
      what it actually wrote: only those are removed from localStorage — nothing is dropped
      before it is safely on disk.
      */

      var payload = {}, keys = []
      try {
            var old = localStorage.getItem(REPORT_LS_OLD_KEY)   // the very first single-key format
            if (old !== null){
                  try { payload[REPORT_UNNAMED] = JSON.parse(old) } catch(e){}
                  keys.push(REPORT_LS_OLD_KEY)
            }
            for (var i = 0; i < localStorage.length; i++){
                  var k = localStorage.key(i)
                  if (!k || k.indexOf(REPORT_LS_PREFIX) !== 0){ continue }
                  var nm = k.slice(REPORT_LS_PREFIX.length)
                  try { payload[nm] = JSON.parse(localStorage.getItem(k)) } catch(e){ continue }
                  keys.push(k)
            }
      } catch(e){ return }                                       // no localStorage: nothing to migrate
      if (!keys.length){ return }
      $.ajax({ url: '/report_migrate', method: 'POST', contentType: 'application/json',
               data: JSON.stringify(payload) })
       .done(function(res){
            var written = (res && res.written) || []
            for (var j = 0; j < written.length; j++){
                  try { localStorage.removeItem(REPORT_LS_PREFIX + written[j]) } catch(e){}
            }
            try { localStorage.removeItem(REPORT_LS_OLD_KEY) } catch(e){}
            if (written.length){ console.log('Comptes rendus repris sur disque : ' + written.join(', ')) }
       })
}

// Switches the editor to the current scene's report (called when the scene changes:
// load / new / clear / rename, via update_scene_name_display).
function report_bind_scene(){
      if (!_report_wired){ return }                      // not yet initialized: report_init will load the right scene
      var key = report_scene_key()
      if (key === _report_scene){ return }               // same scene: nothing to do
      if (_report_dirty){ report_save(true) }            // flush the pending edits to the OLD scene before switching
      _report_scene = key
      report_load(key, report_show_state)
}

function report_reload(){                                // forces a re-read (after a server-side copy/rename)
      if (!_report_wired || !_report_scene){ return }
      report_load(_report_scene, report_show_state)
}

function report_show_state(){                            // puts the loaded state into the editor
      var ta = document.getElementById('report_md')
      if (ta){ ta.value = report_state.md }
      report_render()
}

// --- Snapshots of the trajectory graphs -------------------------------------

/*
Graphs that can be inserted in the report. For each one: its canvas, the caption label,
the global saying whether its WINDOW is open, its redraw function, and the name of the
window to quote if it is closed.
A closed window is no longer redrawn -> its canvas holds a stale (or blank) image:
we refuse the capture rather than inserting a misleading figure.
*/
var REPORT_GRAPHS = {
      xy:     { canvas:'traj_canvas',   label:'x–y',                       flag:'show_trajectories',  draw:'draw_trajectories',  win:'Trajectories' },
      z:      { canvas:'z_canvas',      label:'z(t)',                      flag:'show_trajectories',  draw:'draw_trajectories',  win:'Trajectories' },
      msd:    { canvas:'msd_canvas',    label:'MSD',                       flag:'show_trajectories',  draw:'draw_trajectories',  win:'Trajectories' },
      v:      { canvas:'v_canvas',      label:'|v|(t)',                    flag:'show_trajectories',  draw:'draw_trajectories',  win:'Trajectories' },
      vhist:  { canvas:'velocity_hist', label:'histogramme des vitesses',  flag:'show_velocity_hist', draw:'draw_velocity_hist', win:'velocity histogram' },
      zhist:  { canvas:'altitude_hist', label:'histogramme des altitudes', flag:'show_altitude_hist', draw:'draw_altitude_hist', win:'altitude histogram' },
      energy: { canvas:'energy_graph',  label:'énergies',                  flag:'show_energy_graph',  draw:'draw_energy_graph',  win:'energy graph' },
}

function report_graph_label(kind){                   // caption / alt text (old reports keep their kind)
      return (REPORT_GRAPHS[kind] && REPORT_GRAPHS[kind].label) || 'figure'
}

// Composes the source canvas on a white background (the graphs are drawn transparent:
// without a background, the PNG would be transparent and unreadable when printed) and returns a data-URL.
function report_capture(kind){
      var g = REPORT_GRAPHS[kind]
      if (!g || !window[g.flag]){ return null }          // unknown graph, or its window is closed
      var src = document.getElementById(g.canvas)
      if (!src || !src.width || !src.height){ return null }
      if (typeof window[g.draw] === 'function'){ window[g.draw]() }   // canvas up to date at the instant of the click
      var off = document.createElement('canvas')
      off.width = src.width; off.height = src.height
      var ctx = off.getContext('2d')
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, off.width, off.height)
      try { ctx.drawImage(src, 0, 0) } catch(e){ return null }
      return off.toDataURL('image/png')
}

// Captures the graph and inserts a figure token in the text, at the cursor position.
function report_snapshot(kind){
      var url = report_capture(kind)
      if (!url){
            var g = REPORT_GRAPHS[kind]
            alert('Graphe « ' + report_graph_label(kind) + ' » indisponible.\n' +
                  'Ouvre la fenêtre « ' + ((g && g.win) || '?') + ' » (panneau Dynamics > Monitoring) et lance l’animation.')
            return
      }
      var id = ++report_state.seq
      report_state.figs[id] = { kind: kind, url: url }
      var t = 'u.a.'
      if (typeof sim_time !== 'undefined'){ t = sim_time.toFixed(1) + ' u.a.' }
      var token = '[[fig:' + id + '|' + report_graph_label(kind) + ' — t = ' + t + ']]'

      var ta = document.getElementById('report_md')
      // Inserts at the cursor if editing, otherwise appends at the end.
      var before = report_state.md, after = ''
      if (ta && $('#report_md').is(':visible')){
            var p = ta.selectionStart != null ? ta.selectionStart : report_state.md.length
            before = report_state.md.slice(0, p)
            after  = report_state.md.slice(p)
      }
      var sep_before = (before && !/\n\s*$/.test(before)) ? '\n\n' : ''
      var sep_after  = (after  && !/^\s*\n/.test(after))  ? '\n\n' : ''
      report_state.md = before + sep_before + token + sep_after + after
      if (ta){ ta.value = report_state.md }
      report_save(true)                                    // a figure is heavy: written at once, not on a timer
      report_render()                                      // immediately reflects the insertion in the preview
}

// --- Experiment description (!descr) ----------------------------------------

/*
« !descr » opens the description of the experiment: it takes every sentence up to the
FIRST heading (line starting with #). It feeds the tooltip of the scene dropdown, so it is
returned as PLAIN text — markup and figure tokens removed, blank lines collapsed.
*/

var REPORT_DESCR_MAX = 400                    // a tooltip must stay readable: beyond that we cut

function report_extract_descr(md){
      var lines = String(md || '').split('\n')
      var started = false, buf = []
      for (var i = 0; i < lines.length; i++){
            if (!started){
                  var m = lines[i].match(/^\s*!descr\b[ \t]*(.*)$/)
                  if (!m){ continue }
                  started = true
                  if (m[1].trim()){ buf.push(m[1].trim()) }   // description started on the directive line itself
                  continue
            }
            if (/^\s*#/.test(lines[i])){ break }              // first « # » = end of the description
            buf.push(lines[i].trim())
      }
      if (!started){ return '' }
      var txt = buf.join('\n')
            .replace(/\[\[fig:\d+(?:\|[^\]]*)?\]\]/g, ' ')    // a figure means nothing in a tooltip
            .replace(/[*`]/g, '')                             // bold / italic / code markers
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{2,}/g, '\n')                         // blank lines collapsed
            .trim()
      if (txt.length > REPORT_DESCR_MAX){ txt = txt.slice(0, REPORT_DESCR_MAX - 1).trim() + '…' }
      return txt
}

// --- Lightweight markdown rendering -----------------------------------------

function report_esc(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Inline formatting: bold, italic, code, on ALREADY escaped text.
function report_inline(s){
      return s
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
            .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0; padding:0 3px; border-radius:3px">$1</code>')
}

// Transforms a figure token into <figure><img><figcaption> ; returns '' if the id is unknown.
function report_fig_html(id, caption){
      var f = report_state.figs[id]
      if (!f){ return '<p style="color:#c00">[figure ' + report_esc(id) + ' manquante]</p>' }
      var cap = caption ? '<figcaption style="text-align:center; color:#666; font-size:0.9em; margin-top:2px">' + report_inline(report_esc(caption)) + '</figcaption>' : ''
      return '<figure style="margin:10px 0; text-align:center">' +
             '<img src="' + f.url + '" alt="' + report_esc(report_graph_label(f.kind)) + '" style="max-width:100%; border:1px solid #ddd; border-radius:4px">' +
             cap + '</figure>'
}

// Replaces the [[fig:ID|caption]] tokens of a line with their HTML (safe captures stay inline).
function report_apply_figs(line){
      return line.replace(/\[\[fig:(\d+)(?:\|([^\]]*))?\]\]/g, function(_m, id, cap){
            return report_fig_html(parseInt(id, 10), cap || '')
      })
}

// Mini markdown: centered title (!tit), headings (#/##/###), lists (-, 1.), separator (---),
// paragraphs, + figures.
function report_to_html(md){
      var lines = md.split('\n')
      var out = [], list = null   // list = 'ul' | 'ol' | null
      var in_descr = false        // inside the !descr block -> nothing is rendered
      function close_list(){ if (list){ out.push('</' + list + '>'); list = null } }

      for (var i = 0; i < lines.length; i++){
            var raw = lines[i]
            var line = raw.trim()

            // !descr block: METADATA (tooltip of the scene list), not report content.
            // Everything up to the first heading is skipped; that heading itself is rendered.
            if (in_descr){
                  if (/^#/.test(line)){ in_descr = false }
                  else { continue }
            }

            // Figure alone on its line -> block (outside paragraph)
            if (/^\[\[fig:\d+(?:\|[^\]]*)?\]\]$/.test(line)){
                  close_list(); out.push(report_apply_figs(line)); continue
            }
            if (line === ''){ close_list(); continue }
            if (line === '---'){ close_list(); out.push('<hr style="border:0; border-top:1px solid #ddd; margin:12px 0">'); continue }

            // « !tit Mon titre » -> title centered across the page width, larger than a « # » heading.
            // Own directive (not markdown): centering is not expressible in markdown, and a report
            // wants a real cover title, distinct from the section headings.
            var tit = line.match(/^!tit\s+(\S.*)$/)
            if (tit){
                  close_list()
                  out.push('<h1 style="margin:18px 0 12px; text-align:center; font-size:1.8em; ' +
                           'font-weight:bold; color:#2e7d32; line-height:1.25">' +
                           report_inline(report_esc(tit[1])) + '</h1>')
                  continue
            }

            // « !descr » : opens the description block — see the skip at the top of the loop.
            if (/^!descr\b/.test(line)){ close_list(); in_descr = true; continue }

            var h = line.match(/^(#{1,3})\s+(.*)$/)
            if (h){
                  close_list()
                  var lvl = h[1].length
                  var sz = lvl === 1 ? '1.4em' : (lvl === 2 ? '1.2em' : '1.05em')
                  out.push('<h' + lvl + ' style="margin:12px 0 6px; font-size:' + sz + '; color:#2e7d32">' + report_inline(report_esc(h[2])) + '</h' + lvl + '>')
                  continue
            }
            var uli = line.match(/^[-*]\s+(.*)$/)
            if (uli){
                  if (list !== 'ul'){ close_list(); out.push('<ul style="margin:4px 0 4px 18px">'); list = 'ul' }
                  out.push('<li>' + report_apply_figs(report_inline(report_esc(uli[1]))) + '</li>'); continue
            }
            var oli = line.match(/^\d+\.\s+(.*)$/)
            if (oli){
                  if (list !== 'ol'){ close_list(); out.push('<ol style="margin:4px 0 4px 18px">'); list = 'ol' }
                  out.push('<li>' + report_apply_figs(report_inline(report_esc(oli[1]))) + '</li>'); continue
            }
            close_list()
            out.push('<p style="margin:6px 0">' + report_apply_figs(report_inline(report_esc(line))) + '</p>')
      }
      close_list()
      return out.join('\n')
}

function report_render(){
      var box = document.getElementById('report_preview')
      if (box){ box.innerHTML = report_to_html(report_state.md) || '<p style="color:#aaa">Compte rendu vide — passe en édition et écris, ou insère un graphe.</p>' }
}

// --- Toggle edit / preview --------------------------------------------------

function report_set_mode(edit){
      var ta = $('#report_md'), pv = $('#report_preview'), btn = $('#report_mode_btn')
      if (edit){
            ta.show(); pv.hide(); btn.text('aperçu')
      } else {
            report_render(); ta.hide(); pv.show(); btn.text('éditer')
      }
}

// --- PDF export (standalone printable window) -------------------------------

function report_print(){
      var w = window.open('', '_blank')
      if (!w){ alert('Le navigateur a bloqué la fenêtre d’impression (autorise les pop-ups pour ce site).'); return }
      var body = report_to_html(report_state.md)
      w.document.write(
            '<!doctype html><html><head><meta charset="utf-8"><title>Compte rendu</title>' +
            '<style>body{font-family:sans-serif; max-width:760px; margin:24px auto; padding:0 16px; color:#222; line-height:1.55}' +
            'img{max-width:100%}</style></head><body>' + body + '</body></html>')
      w.document.close()
      // Lets the images (data-URL) decode before opening the print dialog.
      w.onload = function(){ w.focus(); w.print() }
}

// --- Wiring (idempotent) ----------------------------------------------------

function report_init(){
      if (_report_wired){ return }
      _report_wired = true

      report_migrate_from_browser()                      // one-time recovery of the reports still in the browser

      _report_scene = report_scene_key()
      report_load(_report_scene, report_show_state)      // asynchronous: the editor fills in on the answer

      // Edit -> state + persistence (preview recomputed on toggle)
      $('#report_md').on('input', function(){ report_state.md = this.value; report_save() })

      // Isolate the whole window from the 3D scene: TrackballControls is bound to `document`
      // and preventDefaults every mousedown (which steals the textarea focus AND rotates the
      // scene), while scene shortcuts listen for keydown on document (typing would trigger tools).
      // Stopping mousedown/wheel/keys here fixes focus + typing AND lets a native <select> open.
      // We deliberately DON'T stop mousemove/mouseup so the title-bar drag (document listeners) keeps working.
      $('#report_box').on('mousedown click dblclick wheel keydown keypress keyup', function(e){ e.stopPropagation() })

      $('#report_mode_btn').on('click', function(){ report_set_mode(!$('#report_md').is(':visible')) })
      // Insert a graph snapshot via a single dropdown (instead of one button per graph).
      $('#report_snap_select').on('change', function(){
            var k = this.value
            if (k){ report_snapshot(k) }
            this.value = ''                                  // back to the "insert…" prompt
            this.blur()
      })
      $('#report_pdf_btn').on('click', report_print)
      $('#report_close_btn').on('click', function(){ report_set_visible(false) })
      $('#report_clear_btn').on('click', function(){
            if (!confirm('Effacer tout le compte rendu (texte et figures) ?')){ return }
            report_state.md = ''; report_state.figs = {}; report_state.seq = 0
            var t = document.getElementById('report_md'); if (t){ t.value = '' }
            report_save(true); report_render()
      })

      // Closing the tab during the debounce window: the last keystrokes would be lost.
      // Synchronous request — the only kind a browser still honours in beforeunload.
      $(window).on('beforeunload', function(){
            if (!_report_dirty || !_report_scene){ return }
            if (_report_save_timer){ clearTimeout(_report_save_timer); _report_save_timer = null }
            report_state.descr = (typeof report_extract_descr === 'function') ? report_extract_descr(report_state.md) : ''
            try {
                  $.ajax({ url: '/report/' + encodeURIComponent(_report_scene), method: 'POST',
                           contentType: 'application/json', data: JSON.stringify(report_state), async: false })
            } catch(e){}
      })

      report_make_draggable()
      report_set_mode(false)                               // opens in preview
}

// Makes the window draggable by its title bar (the other windows are fixed;
// a report benefits from being repositionable to clear the graphs).
function report_make_draggable(){
      var box = document.getElementById('report_box')
      var head = document.getElementById('report_header')
      if (!box || !head){ return }
      var dx = 0, dy = 0, dragging = false
      head.addEventListener('mousedown', function(e){
            if (e.target.id === 'report_close_btn' || e.target.tagName === 'BUTTON'){ return }   // don't drag when clicking the close/mode buttons
            dragging = true
            var r = box.getBoundingClientRect()
            dx = e.clientX - r.left; dy = e.clientY - r.top
            box.style.left = r.left + 'px'; box.style.top = r.top + 'px'
            e.preventDefault()
      })
      document.addEventListener('mousemove', function(e){
            if (!dragging){ return }
            box.style.left = Math.max(0, e.clientX - dx) + 'px'
            box.style.top  = Math.max(0, e.clientY - dy) + 'px'
      })
      document.addEventListener('mouseup', function(){ dragging = false })
}

// --- Show/hide, driven by a click on the experiment name -----------------------

function report_set_visible(on){
      show_report = !!on
      if (show_report){ $('#report_box').show(); report_init() }   // report_init is idempotent
      else { $('#report_box').hide() }
}
function report_toggle(){
      report_set_visible(!show_report)
      if (typeof save_monitoring_prefs === 'function'){ save_monitoring_prefs() }   // open/closed saved with the scene
}

// The report opens/closes by clicking the experiment name (navbar), not a Monitoring checkbox.
// Delegated so it works whatever moment the name is (re)populated.
$(function(){
      $('#scene_name_navbar').css('cursor', 'pointer').attr('title', 'compte rendu de cette expérience (clic)')
      $(document).on('click', '#scene_name_navbar', report_toggle)
})
