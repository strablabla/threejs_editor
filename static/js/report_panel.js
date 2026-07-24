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
var report_state = { md: '', figs: {}, seq: 0, descr: '', library: null }   // figs: { id -> {kind,url} legacy PNG | {plot,series} numeric } ; seq: id counter ; descr: tooltip ; library: auto-captured curves of this scene
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
      report_state = { md: '', figs: {}, seq: 0, descr: '', library: null }   // blank first: a report must never leak between scenes
      if (s){
            report_state.md      = typeof s.md === 'string' ? s.md : ''
            report_state.figs    = (s.figs && typeof s.figs === 'object') ? s.figs : {}
            report_state.seq     = s.seq | 0
            report_state.descr   = typeof s.descr === 'string' ? s.descr : ''
            report_state.library = (s.library && typeof s.library === 'object') ? s.library : null
            // backward compat: old reports carried the description as a !descr block inside the md
            if (!report_state.descr && /^\s*!descr\b/m.test(report_state.md) && typeof report_extract_descr === 'function'){
                  report_state.descr = report_extract_descr(report_state.md)
            }
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

      if (typeof state.descr !== 'string'){ state.descr = '' }   // description edited directly in the Description panel (no more !descr)
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
      var dt = document.getElementById('scene_descr_ta')   // keep the Description panel in sync
      if (dt){ dt.value = report_state.descr || '' }
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

// ============================================================================
//  NUMERIC CURVES — figures stored as data, not PNG.
//
//  A numeric figure is  figs[id] = { plot, series:[ {scene,label,color,data,hid?} ] }
//  rendered LIVE from the numbers into a <canvas> + an editable HTML legend outside it.
//  Curves are captured (decimated) from the live graphs' underlying data (obj.traj,
//  energy_hist, the histograms) and can be OVERLAID across scenes to compare experiments.
//  Each scene auto-saves a compact "library" of its curves on every run (report_state.library),
//  so another scene can be pulled in for comparison without re-running it.
//  Old PNG figs {kind,url} keep rendering read-only (report_fig_html branches on the shape).
// ============================================================================

var REPORT_PLOT_LABELS = { xy:'x–y', z:'z(t)', v:'|v|(t)', msd:'MSD', energy:'énergies',
                           vhist:'histogramme des vitesses', zhist:'histogramme des altitudes' }
var REPORT_PLOT_KINDS  = ['xy','z','v','msd','energy','vhist','zhist']
var _report_print_mode = false                     // during report_print: figures rasterize to <img> instead of live <canvas>

// --- compaction helpers ------------------------------------------------------
function _rp_round(v){ if (v === 0 || !isFinite(v)){ return 0 } return +v.toPrecision(4) }   // ~4 sig-figs: halves JSON, no visible change
function _rp_idx(n){                                // decimated sample indices (≤ TRAJ_DRAW_MAX), always keeping the last
      var st = (typeof traj_stride === 'function') ? traj_stride(n) : Math.max(1, Math.ceil(n / 2000))
      var a = []; for (var k = 0; k < n; k += st){ a.push(k) }
      if (a.length && a[a.length-1] !== n-1){ a.push(n-1) }
      return a
}
function _rp_rle(hid, idx){                         // hidden-flags -> flip-index list over the sampled points (undefined if never hidden)
      if (!hid){ return undefined }
      var out = [], cur = false
      for (var i = 0; i < idx.length; i++){ var h = !!hid[idx[i]]; if (h !== cur){ out.push(i); cur = h } }
      return out.length ? out : undefined
}
function _rp_expand_hid(rle, len){                  // flip-index list -> boolean array for stroke_traj_curve
      var a = new Array(len), cur = false, p = 0
      for (var i = 0; i < len; i++){ if (p < rle.length && rle[p] === i){ cur = !cur; p++ } a[i] = cur }
      return a
}
function _rp_hex6(c){ return (/^#[0-9a-fA-F]{6}$/.test(c||'')) ? c : '#000000' }   // sanitize for <input type=color>

// --- capture the CURRENT scene's live data into decimated series -------------
function _rp_obj_label(obj){
      var m = (typeof traj_mass_label === 'function') ? traj_mass_label(obj.mass, obj.mass) : ('masse ' + obj.mass)
      var r = (typeof traj_radius_label === 'function') ? traj_radius_label(obj.radius, obj.radius) : ''
      return m + (r ? ' — ' + r : '')
}
function _rp_line_series(obj, field){
      var tr = obj.traj; if (!tr || !tr[field] || tr[field].length < 2){ return null }
      var arr = tr[field], idx = _rp_idx(arr.length), y = []
      for (var i = 0; i < idx.length; i++){ y.push(_rp_round(arr[idx[i]])) }
      var s = { scene: report_scene_key(), label: _rp_obj_label(obj), color: obj_hex(obj), data: { y: y } }
      var rle = _rp_rle(tr.hid, idx); if (rle){ s.hid = rle }
      return s
}
function _rp_xy_series(obj){
      var tr = obj.traj; if (!tr || !tr.x || tr.x.length < 2){ return null }
      var idx = _rp_idx(tr.x.length), x = [], y = []
      for (var i = 0; i < idx.length; i++){ x.push(_rp_round(tr.x[idx[i]])); y.push(_rp_round(tr.y[idx[i]])) }
      var s = { scene: report_scene_key(), label: _rp_obj_label(obj), color: obj_hex(obj), data: { x: x, y: y } }
      var rle = _rp_rle(tr.hid, idx); if (rle){ s.hid = rle }
      return s
}
function report_hist_bins(kind){                   // numeric bins of a live histogram (mirrors draw_velocity_hist / draw_altitude_hist)
      if (kind === 'v'){
            if (typeof collect_speeds !== 'function'){ return null }
            var sp = collect_speeds(), n = sp.length; if (!n){ return null }
            var vmax = 0; for (var k = 0; k < n; k++){ if (sp[k] > vmax){ vmax = sp[k] } } if (vmax <= 0){ vmax = 1 }
            var NB = (typeof VELO_HIST_BINS !== 'undefined') ? VELO_HIST_BINS : 20
            var counts = new Array(NB); for (var b = 0; b < NB; b++){ counts[b] = 0 }
            for (var k = 0; k < n; k++){ var bi = Math.floor(sp[k] / vmax * NB); if (bi >= NB){ bi = NB-1 } if (bi < 0){ bi = 0 } counts[bi]++ }
            var edges = []; for (var e = 0; e <= NB; e++){ edges.push(_rp_round(vmax * e / NB)) }
            return { edges: edges, counts: counts, nbins: NB, win: { lo: 0, hi: _rp_round(vmax) } }
      }
      if (kind === 'z'){
            if (typeof collect_altitudes !== 'function'){ return null }
            var zs = collect_altitudes(), n = zs.length; if (!n){ return null }
            var zmin = Infinity, zmax = -Infinity
            for (var k = 0; k < n; k++){ if (zs[k] < zmin){ zmin = zs[k] } if (zs[k] > zmax){ zmax = zs[k] } }
            if (zmin === zmax){ zmax = zmin + 1; zmin = zmin - 1 }
            var zlo = (typeof alt_win !== 'undefined' && alt_win) ? alt_win.zlo : zmin
            var zhi = (typeof alt_win !== 'undefined' && alt_win) ? alt_win.zhi : zmax
            if (zhi <= zlo){ zhi = zlo + 1 }
            var NB = Math.max(1, (typeof alt_bins !== 'undefined' ? alt_bins : 24) | 0)
            var counts = new Array(NB); for (var b = 0; b < NB; b++){ counts[b] = 0 }
            for (var k = 0; k < n; k++){ var z = zs[k]; if (z < zlo || z > zhi){ continue } var bi = Math.floor((z-zlo)/(zhi-zlo)*NB); if (bi >= NB){ bi = NB-1 } if (bi < 0){ bi = 0 } counts[bi]++ }
            var edges = []; for (var e = 0; e <= NB; e++){ edges.push(_rp_round(zlo + (zhi-zlo) * e / NB)) }
            return { edges: edges, counts: counts, nbins: NB, win: { lo: _rp_round(zlo), hi: _rp_round(zhi) } }
      }
      return null
}
function report_series_from_current(plot){         // one series per tracked object (lines), 3 for energy, 1 per histogram
      var out = []
      if (plot === 'xy' || plot === 'z' || plot === 'v' || plot === 'msd'){
            var t = (typeof tracked_objects === 'function') ? tracked_objects() : []
            var field = plot === 'z' ? 'z' : (plot === 'v' ? 'v' : 'msd')
            for (var i = 0; i < t.length; i++){ var s = (plot === 'xy') ? _rp_xy_series(t[i]) : _rp_line_series(t[i], field); if (s){ out.push(s) } }
      } else if (plot === 'energy'){
            if (typeof energy_hist !== 'undefined' && energy_hist.tot && energy_hist.tot.length > 1){
                  var defs = [['tot','énergie totale','#000000'], ['kin','énergie cinétique','#e53935'], ['pot','énergie potentielle','#1e88e5']]
                  for (var d = 0; d < defs.length; d++){
                        var arr = energy_hist[defs[d][0]], idx = _rp_idx(arr.length), y = []
                        for (var i = 0; i < idx.length; i++){ y.push(_rp_round(arr[idx[i]])) }
                        out.push({ scene: report_scene_key(), label: defs[d][1], color: defs[d][2], data: { y: y } })
                  }
            }
      } else if (plot === 'vhist'){
            var b = report_hist_bins('v'); if (b){ out.push({ scene: report_scene_key(), label: '|v| — ' + report_scene_key(), color: '#43a047', data: { edges: b.edges, counts: b.counts }, nbins: b.nbins, win: b.win }) }
      } else if (plot === 'zhist'){
            var b = report_hist_bins('z'); if (b){ out.push({ scene: report_scene_key(), label: 'z — ' + report_scene_key(), color: '#3949ab', data: { edges: b.edges, counts: b.counts }, nbins: b.nbins, win: b.win }) }
      }
      return out
}
function report_series_from_library(lib, plot, sceneName){   // pull another scene's saved series (deep-copied, scene-tagged)
      if (!lib || !lib.plots || !lib.plots[plot]){ return [] }
      var src = lib.plots[plot], out = []
      for (var i = 0; i < src.length; i++){
            var s = JSON.parse(JSON.stringify(src[i]))
            s.scene = sceneName
            if (sceneName){ s.label = (s.label || '') + ' (' + sceneName + ')' }    // prefix so overlaid same-colour curves stay distinguishable
            out.push(s)
      }
      return out
}
function report_available_plots_current(){         // plot types that have live data right now
      var out = []
      var t = (typeof tracked_objects === 'function') ? tracked_objects() : []
      var hasLine = false
      for (var i = 0; i < t.length; i++){ if (t[i].traj && t[i].traj.x && t[i].traj.x.length > 1){ hasLine = true; break } }
      if (hasLine){ out.push('xy'); out.push('z'); out.push('v'); out.push('msd') }
      if (typeof energy_hist !== 'undefined' && energy_hist.tot && energy_hist.tot.length > 1){ out.push('energy') }
      if (report_hist_bins('v')){ out.push('vhist') }
      if (report_hist_bins('z')){ out.push('zhist') }
      return out
}

// --- automatic per-scene curve library (captured on each run) ----------------
var _report_lib_sig = null
function report_library_capture(){                 // decimated snapshot of the CURRENT scene's curves -> its report JSON
      if (typeof report_scene_key !== 'function'){ return }
      var sig = ''
      var t = (typeof tracked_objects === 'function') ? tracked_objects() : []
      for (var i = 0; i < t.length; i++){ if (t[i].traj && t[i].traj.x){ sig += t[i].traj.x.length + ',' } }
      sig += (typeof energy_hist !== 'undefined' && energy_hist.tot ? energy_hist.tot.length : 0) + ';'
      sig += (typeof sim_time !== 'undefined' ? sim_time.toFixed(1) : '0')
      if (sig === _report_lib_sig){ return }                              // identical run already captured
      var lib = { ts: Date.now(), plots: {} }, any = false
      for (var p = 0; p < REPORT_PLOT_KINDS.length; p++){
            var arr = report_series_from_current(REPORT_PLOT_KINDS[p])
            if (arr && arr.length){ lib.plots[REPORT_PLOT_KINDS[p]] = arr; any = true }
      }
      if (!any){ return }
      _report_lib_sig = sig
      var name = report_scene_key()
      if (_report_wired && _report_scene === name){ report_state.library = lib; report_save(true) }
      else {                                                              // panel never opened: merge into the file without disturbing anything
            $.ajax({ url: '/report/' + encodeURIComponent(name), dataType: 'json', cache: false })
             .done(function(s){ s = s || {}; report_save_now(name, { md: s.md || '', figs: s.figs || {}, seq: s.seq | 0, descr: s.descr || '', library: lib }) })
      }
}

// --- self-contained plotter (renders a saved figure with NO live scene) ------
function report_plot_figure(canvas, plot, series){
      if (!canvas){ return }
      var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      if (!series || !series.length){ return }
      if (plot === 'vhist' || plot === 'zhist'){ _rp_plot_hist(ctx, W, H, plot, series); return }
      _rp_plot_lines(ctx, W, H, plot, series)
}
function _rp_plot_lines(ctx, W, H, plot, series){
      var isXY = (plot === 'xy'), isEnergy = (plot === 'energy'), i, k, s
      var L, T, PW, PH, a0, a1, b0, b1
      if (isXY){
            var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity
            for (i = 0; i < series.length; i++){ s = series[i]; var X = s.data.x, Y = s.data.y; if (!X || !Y){ continue }
                  for (k = 0; k < X.length; k++){ if (X[k] < xmin){ xmin = X[k] } if (X[k] > xmax){ xmax = X[k] } if (Y[k] < ymin){ ymin = Y[k] } if (Y[k] > ymax){ ymax = Y[k] } } }
            if (!isFinite(xmin)){ return }
            var cx = (xmin+xmax)/2, cy = (ymin+ymax)/2, half = Math.max((xmax-xmin)||1, (ymax-ymin)||1) * 0.55
            a0 = cx-half; a1 = cx+half; b0 = cy-half; b1 = cy+half
            var pad = 10, side = Math.min(W, H) - 2*pad; L = (W-side)/2; T = (H-side)/2; PW = side; PH = side
            ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.strokeRect(L, T, PW, PH)
      } else {
            var nmax = 0, vmin = Infinity, vmax = -Infinity
            for (i = 0; i < series.length; i++){ s = series[i]; var Y = s.data.y; if (!Y || !Y.length){ continue }
                  if (Y.length > nmax){ nmax = Y.length }
                  for (k = 0; k < Y.length; k++){ if (Y[k] < vmin){ vmin = Y[k] } if (Y[k] > vmax){ vmax = Y[k] } } }
            if (nmax < 2 || !isFinite(vmin)){ return }
            a0 = 0; a1 = nmax-1
            if (isEnergy){ if (vmin === vmax){ vmax = vmin+1; vmin = vmin-1 } var pd = (vmax-vmin)*0.1; b0 = vmin-pd; b1 = vmax+pd }
            else { b0 = 0; b1 = vmax > 0 ? vmax : 1 }
            var ML = isEnergy ? 48 : 46, MT = 6, MB = 6, MR = 4
            L = ML; T = MT; PW = W-ML-MR; PH = H-MT-MB
            ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
            for (var g = 0; g <= 4; g++){ var vv = b0 + (b1-b0)*g/4, yy = T + (1-(vv-b0)/((b1-b0)||1))*PH
                  ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(L+PW, yy); ctx.stroke()
                  ctx.fillText(fmt_energy(vv), L-4, yy) }
            if (isEnergy && b0 < 0 && b1 > 0){ var yz = T + (1-(0-b0)/((b1-b0)||1))*PH; ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, yz); ctx.lineTo(L+PW, yz); ctx.stroke() }
      }
      var v = { L:L, T:T, W:PW, H:PH, a0:a0, a1:a1, b0:b0, b1:b1 }
      ctx.save(); ctx.beginPath(); ctx.rect(L, T, PW, PH); ctx.clip()
      for (i = 0; i < series.length; i++){ s = series[i]
            var Y = s.data.y; if (!Y || Y.length < 2){ continue }
            var XY = [], HD = [], hidA = s.hid ? _rp_expand_hid(s.hid, Y.length) : null
            for (k = 0; k < Y.length; k++){ var ax = isXY ? s.data.x[k] : k; XY.push({ x: traj_px_x(v, ax), y: traj_px_y(v, Y[k]) }); HD.push(hidA ? hidA[k] : false) }
            stroke_traj_curve(ctx, XY, HD, s.color || '#000')
            if (isXY){ ctx.fillStyle = s.color || '#000'; ctx.beginPath(); ctx.arc(traj_px_x(v, s.data.x[Y.length-1]), traj_px_y(v, Y[Y.length-1]), 3, 0, 2*Math.PI); ctx.fill() }
      }
      ctx.restore()
}
function _rp_plot_hist(ctx, W, H, plot, series){
      var vertical = (plot === 'vhist'), single = (series.length === 1), i, k, s
      var vlo = Infinity, vhi = -Infinity, cmax = 0
      for (i = 0; i < series.length; i++){ s = series[i]; var ed = s.data.edges, ct = s.data.counts; if (!ed || !ct){ continue }
            if (ed[0] < vlo){ vlo = ed[0] } if (ed[ed.length-1] > vhi){ vhi = ed[ed.length-1] }
            for (k = 0; k < ct.length; k++){ if (ct[k] > cmax){ cmax = ct[k] } } }
      if (!isFinite(vlo)){ return } if (vhi <= vlo){ vhi = vlo + 1 } if (cmax <= 0){ cmax = 1 }
      if (vertical){                                  // value on X, count on Y (like draw_velocity_hist)
            var ML = 26, MT = 6, MB = 16, MR = 6, PW = W-ML-MR, PH = H-MT-MB
            ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
            var NT = Math.min(cmax, 4) || 1
            for (var t = 0; t <= NT; t++){ var val = Math.round(cmax*t/NT), y = MT + (1-t/NT)*PH; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W-MR, y); ctx.stroke(); ctx.fillText(val, ML-4, y) }
            var VX = function(val){ return ML + (val-vlo)/((vhi-vlo)||1)*PW }
            var VY = function(c){ return MT + (1-c/cmax)*PH }
            for (i = 0; i < series.length; i++){ s = series[i]; var ed = s.data.edges, ct = s.data.counts; if (!ed || !ct){ continue }
                  if (single){ ctx.fillStyle = s.color || '#43a047'; for (k = 0; k < ct.length; k++){ var x0 = VX(ed[k]), x1 = VX(ed[k+1]), yb = VY(ct[k]); ctx.fillRect(x0+1, yb, Math.max(1, x1-x0-2), MT+PH-yb) } }
                  else { ctx.strokeStyle = s.color || '#000'; ctx.lineWidth = 1.5; ctx.beginPath()
                        for (k = 0; k < ct.length; k++){ var xa = VX(ed[k]), xb = VX(ed[k+1]), yv = VY(ct[k]); if (k === 0){ ctx.moveTo(xa, MT+PH) } ctx.lineTo(xa, yv); ctx.lineTo(xb, yv) }
                        ctx.lineTo(VX(ed[ed.length-1]), MT+PH); ctx.stroke() }
            }
            ctx.fillStyle = '#666'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText(fmt_energy(vlo), ML, MT+PH+3); ctx.textAlign = 'right'; ctx.fillText(fmt_energy(vhi), W-MR, MT+PH+3)
      } else {                                        // value (z) on Y top=vhi, count on X (like draw_altitude_hist)
            var ML = 56, MT = 6, MB = 30, MR = 6, PW = W-ML-MR, PH = H-MT-MB
            ctx.font = '10px sans-serif'; ctx.fillStyle = '#666'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
            for (var t = 0; t <= 4; t++){ var zval = vhi - (vhi-vlo)*t/4, y = MT + t/4*PH; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W-MR, y); ctx.stroke(); ctx.fillText(fmt_energy(zval), ML-4, y) }
            var ZY = function(zval){ return MT + (1-(zval-vlo)/((vhi-vlo)||1))*PH }
            var ZX = function(c){ return ML + c/cmax*PW }
            for (i = 0; i < series.length; i++){ s = series[i]; var ed = s.data.edges, ct = s.data.counts; if (!ed || !ct){ continue }
                  if (single){ ctx.fillStyle = s.color || '#3949ab'; for (k = 0; k < ct.length; k++){ var yTop = ZY(ed[k+1]), yBot = ZY(ed[k]); ctx.fillRect(ML, yTop, ZX(ct[k])-ML, Math.max(1, yBot-yTop-1)) } }
                  else { ctx.strokeStyle = s.color || '#000'; ctx.lineWidth = 1.5; ctx.beginPath()
                        for (k = 0; k < ct.length; k++){ var ya = ZY(ed[k]), yb2 = ZY(ed[k+1]), xx = ZX(ct[k]); if (k === 0){ ctx.moveTo(ML, ya) } ctx.lineTo(xx, ya); ctx.lineTo(xx, yb2) }
                        ctx.lineTo(ML, ZY(ed[ed.length-1])); ctx.stroke() }
            }
            ctx.fillStyle = '#666'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText('0', ML, MT+PH+3); ctx.textAlign = 'right'; ctx.fillText(cmax, W-MR, MT+PH+3)
            ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('N', ML+PW/2, MT+PH+15)
            ctx.save(); ctx.translate(9, MT+PH/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', 0, 0); ctx.restore()
      }
}

// --- figure block: live canvas + editable HTML legend ------------------------
function report_paint_figures(){                   // called after report_render sets the preview innerHTML
      var box = document.getElementById('report_preview'); if (!box){ return }
      var figs = box.querySelectorAll('figure[data-fig-id]')
      for (var i = 0; i < figs.length; i++){
            (function(figEl){
                  var id = figEl.getAttribute('data-fig-id'), f = report_state.figs[id]
                  if (!f || !f.plot){ return }
                  var canvas = figEl.querySelector('canvas.report-fig-canvas'); if (canvas){ report_plot_figure(canvas, f.plot, f.series) }
                  var leg = figEl.querySelector('.report-legend'); if (leg){ report_build_legend(leg, id, f) }
            })(figs[i])
      }
}
function report_build_legend(leg, id, f){          // one editable row per series (swatch + label + remove)
      var $leg = $(leg).empty()
      for (var k = 0; k < f.series.length; k++){
            (function(idx){
                  var s = f.series[idx]
                  var row = $('<div class="report-legend-row">')
                  var sw = $('<span class="report-legend-sw">').css('background', s.color || '#000')
                  sw.on('click', function(ev){
                        ev.stopPropagation()
                        var inp = $('<input type="color">').val(_rp_hex6(s.color)).css({ position:'absolute', opacity:0, width:0, height:0 })
                        inp.on('input', function(){ s.color = this.value; sw.css('background', this.value)
                              var cv = leg.parentNode.querySelector('canvas.report-fig-canvas'); if (cv){ report_plot_figure(cv, f.plot, f.series) }
                              report_save() })
                        $('body').append(inp); inp[0].click(); setTimeout(function(){ inp.remove() }, 20000)
                  })
                  var lab = $('<input class="report-legend-label" type="text">').val(s.label || '')
                  lab.on('input', function(){ s.label = this.value; report_save() })
                  lab.on('mousedown click keydown keypress keyup wheel dblclick', function(e){ e.stopPropagation() })   // let typing work despite the box isolation
                  var del = $('<span class="report-legend-del" title="retirer cette courbe">×</span>')
                  del.on('click', function(ev){ ev.stopPropagation()
                        f.series.splice(idx, 1)
                        if (!f.series.length){ report_remove_fig(id) }
                        report_save(true); report_render()
                  })
                  row.append(sw).append(lab).append(del); $leg.append(row)
            })(k)
      }
}
function report_remove_fig(id){                     // drop a figure: delete its data + its [[fig:ID]] token
      delete report_state.figs[id]
      var re = new RegExp('\\[\\[fig:' + id + '(?:\\|[^\\]]*)?\\]\\]', 'g')
      report_state.md = report_state.md.replace(re, '')
      var ta = document.getElementById('report_md'); if (ta){ ta.value = report_state.md }
}
function report_fig_print_html(id, caption){        // rasterized figure for the print window (no live canvas there)
      var f = report_state.figs[id]; if (!f){ return '' }
      var off = document.createElement('canvas'); off.width = 340; off.height = 220
      report_plot_figure(off, f.plot, f.series)
      var comp = document.createElement('canvas'); comp.width = off.width; comp.height = off.height   // composite on white (the plot canvas is transparent)
      var cx = comp.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, comp.width, comp.height); cx.drawImage(off, 0, 0)
      var url = ''; try { url = comp.toDataURL('image/png') } catch(e){}
      var leg = ''
      if (f.series && f.series.length){ leg = '<ul style="list-style:none; padding:0; margin:4px 0; font-size:0.85em; text-align:center">'
            for (var k = 0; k < f.series.length; k++){ var s = f.series[k]
                  leg += '<li><span style="display:inline-block; width:10px; height:10px; background:' + report_esc(s.color || '#000') + '; margin-right:5px"></span>' + report_esc(s.label || '') + '</li>' }
            leg += '</ul>' }
      var cap = caption ? '<figcaption style="text-align:center; color:#666; font-size:0.9em; margin-top:2px">' + report_inline(report_esc(caption)) + '</figcaption>' : ''
      return '<figure style="margin:10px 0; text-align:center"><img src="' + url + '" style="max-width:100%; border:1px solid #ddd; border-radius:4px">' + leg + cap + '</figure>'
}

// --- insert a new figure / add a curve to an existing one --------------------
function report_new_figure(plot, series){
      if (!series || !series.length){ alert('Aucune courbe disponible pour « ' + (REPORT_PLOT_LABELS[plot] || plot) + ' ».\nLance l’animation (touche X) pour produire des données.'); return }
      var id = ++report_state.seq
      report_state.figs[id] = { plot: plot, series: series }
      var token = '[[fig:' + id + '|' + (REPORT_PLOT_LABELS[plot] || 'figure') + ']]'
      var ta = document.getElementById('report_md'), before = report_state.md, after = ''
      if (ta && $('#report_md').is(':visible')){
            var p = ta.selectionStart != null ? ta.selectionStart : report_state.md.length
            before = report_state.md.slice(0, p); after = report_state.md.slice(p)
      }
      var sb = (before && !/\n\s*$/.test(before)) ? '\n\n' : '', sa = (after && !/^\s*\n/.test(after)) ? '\n\n' : ''
      report_state.md = before + sb + token + sa + after
      if (ta){ ta.value = report_state.md }
      report_save(true); report_render()
}
function report_add_series(figId, extra){
      var f = report_state.figs[figId]; if (!f || !f.plot){ return }
      if (!extra || !extra.length){ alert('Aucune courbe compatible dans cette scène.'); return }
      for (var i = 0; i < extra.length; i++){ f.series.push(extra[i]) }
      report_save(true); report_render()
}

// --- right-click context menu (reuses the global .scene-ctx* CSS) ------------
var _report_ctx_box = null, _report_ctx_render = null
function report_ctx_close(e){
      if (e && e.type === 'click' && _report_ctx_box && _report_ctx_box[0].contains(e.target)){ return }   // click inside the menu: not a dismissal
      if (_report_ctx_box){ _report_ctx_box.remove(); _report_ctx_box = null; _report_ctx_render = null }
      document.removeEventListener('click', report_ctx_close, true)
      document.removeEventListener('keydown', _report_ctx_esc, true)
}
function _report_ctx_esc(e){ if (e.key === 'Escape' || e.keyCode === 27){ report_ctx_close() } }
function report_ctx_open(cx, cy, rootBuild){
      report_ctx_close()
      var box = $('<div class="scene-ctx">').appendTo('body'); _report_ctx_box = box
      function render(build){
            box.empty()
            var api = {
                  head: function(txt){ box.append($('<div class="scene-ctx-head">').append($('<span class="scene-ctx-name">').text(txt))) },
                  item: function(label, fn, cls){ var it = $('<div class="scene-ctx-item">').text(label); if (cls){ it.addClass(cls) } it.on('click', function(ev){ ev.stopPropagation(); fn() }); box.append(it); return it },
                  note: function(txt){ box.append($('<div class="scene-ctx-item" style="color:#999; cursor:default">').text(txt)) },
                  sep:  function(){ box.append($('<div class="scene-ctx-sep">')) }
            }
            build(api)
            var w = box.outerWidth(), h = box.outerHeight()
            box.css({ left: Math.min(cx, window.innerWidth - w - 4) + 'px', top: Math.min(cy, window.innerHeight - h - 4) + 'px' })
      }
      _report_ctx_render = render
      render(rootBuild)
      setTimeout(function(){ document.addEventListener('click', report_ctx_close, true); document.addEventListener('keydown', _report_ctx_esc, true) }, 0)
}
function report_ctx_new_figure(e){                  // right-click on empty report area
      var cx = e.clientX, cy = e.clientY
      report_scene_names(function(names){
            report_ctx_open(cx, cy, function(api){
                  api.head('Insérer une figure')
                  api.item('Cette scène', report_ctx_plot_current)
                  var others = _report_other_scenes(names)
                  if (others.length){ api.sep(); for (var i = 0; i < others.length; i++){ (function(nm){ api.item(nm, function(){ report_ctx_plot_scene(nm) }) })(others[i]) } }
            })
      })
}
function report_ctx_plot_current(){
      _report_ctx_render(function(a){
            a.head('Cette scène')
            var plots = report_available_plots_current()
            if (!plots.length){ a.note('aucune courbe (lance l’animation)'); return }
            for (var i = 0; i < plots.length; i++){ (function(pk){ a.item(REPORT_PLOT_LABELS[pk] || pk, function(){ report_new_figure(pk, report_series_from_current(pk)); report_ctx_close() }) })(plots[i]) }
      })
}
function report_ctx_plot_scene(scene){
      _report_ctx_render(function(a){ a.head(scene); a.note('chargement…') })
      report_fetch_library(scene, function(lib){
            if (!_report_ctx_box){ return }
            _report_ctx_render(function(a){
                  a.head(scene)
                  var keys = _report_lib_keys(lib)
                  if (!keys.length){ a.note('aucune courbe enregistrée'); return }
                  for (var i = 0; i < keys.length; i++){ (function(pk){ a.item(REPORT_PLOT_LABELS[pk] || pk, function(){ report_new_figure(pk, report_series_from_library(lib, pk, scene)); report_ctx_close() }) })(keys[i]) }
            })
      })
}
function report_ctx_add_to_figure(e, figId){        // right-click on an existing figure -> overlay a curve
      var f = report_state.figs[figId]; if (!f || !f.plot){ return }
      var cx = e.clientX, cy = e.clientY
      report_scene_names(function(names){
            report_ctx_open(cx, cy, function(api){
                  api.head('Ajouter une courbe — ' + (REPORT_PLOT_LABELS[f.plot] || f.plot))
                  api.item('Cette scène', function(){ report_add_series(figId, report_series_from_current(f.plot)); report_ctx_close() })
                  var others = _report_other_scenes(names)
                  if (others.length){ api.sep(); for (var i = 0; i < others.length; i++){ (function(nm){ api.item(nm, function(){ report_ctx_add_from_scene(figId, f.plot, nm) }) })(others[i]) } }
                  api.sep()
                  api.item('Supprimer la figure', function(){ report_remove_fig(figId); report_save(true); report_render(); report_ctx_close() }, 'scene-ctx-danger')
            })
      })
}
function report_ctx_add_from_scene(figId, plot, scene){
      _report_ctx_render(function(a){ a.head(scene); a.note('chargement…') })
      report_fetch_library(scene, function(lib){
            if (!_report_ctx_box){ return }
            report_add_series(figId, report_series_from_library(lib, plot, scene)); report_ctx_close()
      })
}
function _report_other_scenes(names){ var cur = report_scene_key(), out = []; for (var i = 0; i < names.length; i++){ if (names[i] && names[i] !== cur){ out.push(names[i]) } } return out }
function _report_lib_keys(lib){ var keys = []; if (lib && lib.plots){ for (var pk in lib.plots){ if (lib.plots[pk] && lib.plots[pk].length){ keys.push(pk) } } } return keys }
function report_scene_names(done){
      $.ajax({ url: '/scenes', dataType: 'json', cache: false })
       .done(function(arr){ var names = []; if (arr && arr.length){ for (var i = 0; i < arr.length; i++){ names.push(typeof arr[i] === 'string' ? arr[i] : arr[i].name) } } done(names) })
       .fail(function(){ done([]) })
}
function report_fetch_library(scene, done){
      $.ajax({ url: '/report/' + encodeURIComponent(scene), dataType: 'json', cache: false })
       .done(function(s){ done(s && s.library ? s.library : null) })
       .fail(function(){ done(null) })
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

// Transforms a figure token into HTML. Numeric figs ({plot,series}) become an interactive
// block (live <canvas> painted by report_paint_figures + editable HTML legend); legacy figs
// ({kind,url}) stay a read-only <img>. In print mode, numeric figs rasterize to <img>.
function report_fig_html(id, caption){
      var f = report_state.figs[id]
      if (!f){ return '<p style="color:#c00">[figure ' + report_esc(id) + ' manquante]</p>' }
      if (f.plot){                                        // numeric figure
            if (_report_print_mode){ return report_fig_print_html(id, caption) }
            var capN = caption ? '<figcaption style="text-align:center; color:#666; font-size:0.9em; margin-top:2px">' + report_inline(report_esc(caption)) + '</figcaption>' : ''
            return '<figure data-fig-id="' + report_esc(id) + '" style="margin:10px 0; text-align:center">' +
                   '<canvas class="report-fig-canvas" width="340" height="220" style="max-width:100%; border:1px solid #ddd; border-radius:4px; background:#fff"></canvas>' +
                   '<div class="report-legend" data-fig-id="' + report_esc(id) + '"></div>' + capN + '</figure>'
      }
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
      if (box){
            box.innerHTML = report_to_html(report_state.md) || '<p style="color:#aaa">Compte rendu vide — passe en édition et écris, ou <b>clic droit</b> pour insérer une courbe.</p>'
            report_paint_figures()                         // numeric figures: draw the canvases + wire the editable legends
      }
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
      _report_print_mode = true                            // numeric figs rasterize to <img> (no live canvas in the print window)
      var body = report_to_html(report_state.md)
      _report_print_mode = false
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
      // Insert a curve via a right-click menu (choose scene ▸ graph). Right-click ON a figure
      // adds a curve to it (overlay); right-click on empty area (or in the editor) makes a new figure.
      // contextmenu is NOT in the #report_box stop-list, so it reaches us; the menu lives on <body>.
      $('#report_preview').on('contextmenu', function(e){
            e.preventDefault()
            var fig = $(e.target).closest('figure[data-fig-id]')
            if (fig.length){ report_ctx_add_to_figure(e, fig.attr('data-fig-id')) }
            else { report_ctx_new_figure(e) }
      })
      $('#report_md').on('contextmenu', function(e){ e.preventDefault(); report_ctx_new_figure(e) })
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
            if (typeof report_state.descr !== 'string'){ report_state.descr = '' }   // description is edited directly now
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

// --- Description panel (short scene description = tooltip in the scene list) --------
// Opens on a click on the scene name. Its text is report_state.descr, saved with the report
// (server /reports still reads the `descr` field to fill the scene-list tooltips).
function description_set_visible(on){
      if (on){
            report_init()                                  // ensures the report of the CURRENT scene is loaded (sets _report_scene)
            var dt = document.getElementById('scene_descr_ta')
            if (dt){ dt.value = report_state.descr || '' }
            $('#description_scene').text((typeof scene !== 'undefined' && scene && scene.name) ? '— ' + scene.name : '')
            var box = document.getElementById('description_box')
            var nb  = document.getElementById('scene_name_navbar')
            if (box && nb){                                // place it UNDER the scene name (right side), not on the left
                  var r = nb.getBoundingClientRect(), w = box.offsetWidth || 340
                  box.style.top  = Math.round(r.bottom + 8) + 'px'
                  box.style.left = Math.round(Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))) + 'px'
            }
            $('#description_box').show()
            if (dt){ dt.focus() }
      } else {
            $('#description_box').hide()
      }
}
function description_toggle(){ description_set_visible($('#description_box').css('display') === 'none') }

// The navbar scene name shows the scene DESCRIPTION as a (Bootstrap, ≤600px) tooltip — like the
// items of the scene dropdown. `descOverride` lets the Description editor update it live; otherwise
// it reads the persisted scene_descriptions map.
function update_scene_name_tooltip(descOverride){
      var el = document.getElementById('scene_name_navbar'); if (!el){ return }
      var d = (typeof descOverride === 'string') ? descOverride
            : ((typeof scene_descriptions !== 'undefined' && typeof scene !== 'undefined' && scene && scene.name) ? (scene_descriptions[scene.name] || '') : '')
      var title = (d && d.trim()) ? d : 'No description yet — click to write one'
      if ($.fn && $.fn.tooltip){
            if (!el._descTipInit){ $(el).tooltip({ container: 'body', placement: 'bottom' }); el._descTipInit = true }  // init once
            $(el).attr('data-original-title', title)                                                                    // update content
      } else { el.title = title }
}

$(function(){
      // Click on the scene name -> Description panel (the Report opens from its navbar icon instead).
      $('#scene_name_navbar').css('cursor', 'pointer')
      update_scene_name_tooltip()
      $(document).on('click', '#scene_name_navbar', description_toggle)
      $(document).on('click', '#report_nav', report_toggle)                 // navbar notebook+pencil -> Report panel

      // Description editing -> report_state.descr -> saved with the report (feeds the tooltips) + live navbar tooltip.
      $(document).on('input', '#scene_descr_ta', function(){ report_state.descr = this.value; report_save(); update_scene_name_tooltip(this.value) })
      $('#description_close_btn').on('click', function(){ description_set_visible(false) })
      // Isolate from TrackballControls (bound to document) so typing / clicking works in the box.
      $('#description_box').on('mousedown click dblclick wheel keydown keypress keyup', function(e){ e.stopPropagation() })
})
