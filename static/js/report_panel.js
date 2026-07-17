/*
  Compte rendu (report) — fenêtre d'édition légère avec aperçu et snapshots des graphes.

  Objectif : rédiger un compte rendu d'expérience et y intégrer les IMAGES produites dans
  la fenêtre « Trajectories » (graphes x–y, z(t), MSD). Chaque snapshot est FIGÉ : on capture
  le canvas tel qu'il est à l'instant du clic (PNG en data-URL), de sorte qu'on peut conserver
  plusieurs instants d'un même graphe au fil de l'expérience.

  Stack : vanilla JS + jQuery (comme le reste du projet). Pas de dépendance markdown externe —
  un mini-rendu maison suffit pour un compte rendu de labo (titres, gras/italique, listes, figures).

  Persistance : texte + figures sont sauvegardés dans localStorage, PAR SCÈNE — clé
  `report::<scene.name>` (scène sans nom : bucket `__unnamed__`). Chaque expérience a donc
  son propre compte rendu : charger/créer une autre scène bascule sur SON rapport, aucun
  rapport ne migre d'une expérience à l'autre. Même convention que l'historique undo/redo
  (`scene_history::<nom>`), migré au renommage dans panel_scene.html.

  Inspiré du ReportPanel de sam3_exp (directives !fig / !img), adapté au contexte : ici les
  figures sont des snapshots de canvas référencés par un jeton [[fig:ID|légende]].
*/

var REPORT_LS_PREFIX = 'report::'
var REPORT_LS_OLD_KEY = 'threejs_report_v1'   // ancienne clé unique (avant le rapport par scène) — migrée une fois
var report_state = { md: '', figs: {}, seq: 0 }   // figs: { id -> {kind, url} } ; seq : compteur d'id
var _report_wired = false
var _report_scene_key = null                  // clé localStorage de la scène actuellement chargée dans l'éditeur

// Clé localStorage du rapport de la scène courante (scène sans nom -> bucket dédié).
function report_scene_key(){
      var nm = (typeof scene !== 'undefined' && scene && scene.name) ? scene.name : ''
      return REPORT_LS_PREFIX + (nm || '__unnamed__')
}

// --- Persistance (par scène) ------------------------------------------------

function report_load(){
      report_state = { md: '', figs: {}, seq: 0 }        // repart vierge : sinon un rapport migrerait entre scènes
      try {
            var raw = localStorage.getItem(_report_scene_key)
            if (raw){
                  var s = JSON.parse(raw)
                  report_state.md   = typeof s.md === 'string' ? s.md : ''
                  report_state.figs = (s.figs && typeof s.figs === 'object') ? s.figs : {}
                  report_state.seq  = s.seq | 0
            }
      } catch(e){ /* localStorage indisponible ou JSON cassé : on repart vierge */ }
}

function report_save(){
      if (!_report_scene_key){ return }
      try { localStorage.setItem(_report_scene_key, JSON.stringify(report_state)) }
      catch(e){ /* quota dépassé (beaucoup de figures) : on n'interrompt pas l'édition */ }
}

// Bascule l'éditeur sur le rapport de la scène courante (appelé quand la scène change :
// load / new / clear / rename, via update_scene_name_display). Les éditions en cours sont
// déjà persistées (sauvegarde à chaque frappe), donc on peut charger l'autre rapport sans risque.
function report_bind_scene(){
      if (!_report_wired){ return }                      // pas encore initialisé : report_init chargera la bonne scène
      var key = report_scene_key()
      if (key === _report_scene_key){ return }           // même scène : rien à faire
      _report_scene_key = key
      report_load()
      var ta = document.getElementById('report_md'); if (ta){ ta.value = report_state.md }
      report_render()
}

// --- Snapshots des graphes de trajectoires ----------------------------------

var REPORT_CANVAS = { xy:'traj_canvas', z:'z_canvas', msd:'msd_canvas' }
var REPORT_LABEL  = { xy:'x–y', z:'z(t)', msd:'MSD' }

// Compose le canvas source sur un fond blanc (les graphes sont dessinés en transparent :
// sans fond, le PNG serait transparent et illisible à l'impression) et renvoie un data-URL.
function report_capture(kind){
      var src = document.getElementById(REPORT_CANVAS[kind])
      if (!src || !src.width || !src.height){ return null }
      if (typeof show_trajectories !== 'undefined' && show_trajectories && typeof draw_trajectories === 'function'){
            draw_trajectories()                            // s'assure que le canvas reflète l'état courant
      }
      var off = document.createElement('canvas')
      off.width = src.width; off.height = src.height
      var ctx = off.getContext('2d')
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, off.width, off.height)
      try { ctx.drawImage(src, 0, 0) } catch(e){ return null }
      return off.toDataURL('image/png')
}

// Capture le graphe et insère un jeton figure dans le texte, à la position du curseur.
function report_snapshot(kind){
      var url = report_capture(kind)
      if (!url){ alert('Graphe « ' + REPORT_LABEL[kind] + ' » indisponible.\nOuvre la fenêtre Trajectories et lance l’animation.'); return }
      var id = ++report_state.seq
      report_state.figs[id] = { kind: kind, url: url }
      var t = 'u.a.'
      if (typeof sim_time !== 'undefined'){ t = sim_time.toFixed(1) + ' u.a.' }
      var token = '[[fig:' + id + '|' + REPORT_LABEL[kind] + ' — t = ' + t + ']]'

      var ta = document.getElementById('report_md')
      // Insère au curseur si on est en édition, sinon on ajoute à la fin.
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
      report_save()
      report_render()                                      // reflète immédiatement l'insertion en aperçu
}

// --- Rendu markdown léger ---------------------------------------------------

function report_esc(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Formatage en ligne : gras, italique, code, sur du texte DÉJÀ échappé.
function report_inline(s){
      return s
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
            .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0; padding:0 3px; border-radius:3px">$1</code>')
}

// Transforme un jeton figure en <figure><img><figcaption> ; renvoie '' si l'id est inconnu.
function report_fig_html(id, caption){
      var f = report_state.figs[id]
      if (!f){ return '<p style="color:#c00">[figure ' + report_esc(id) + ' manquante]</p>' }
      var cap = caption ? '<figcaption style="text-align:center; color:#666; font-size:0.9em; margin-top:2px">' + report_inline(report_esc(caption)) + '</figcaption>' : ''
      return '<figure style="margin:10px 0; text-align:center">' +
             '<img src="' + f.url + '" alt="' + report_esc(REPORT_LABEL[f.kind] || 'figure') + '" style="max-width:100%; border:1px solid #ddd; border-radius:4px">' +
             cap + '</figure>'
}

// Remplace les jetons [[fig:ID|légende]] d'une ligne par leur HTML (les captures sûres restent inline).
function report_apply_figs(line){
      return line.replace(/\[\[fig:(\d+)(?:\|([^\]]*))?\]\]/g, function(_m, id, cap){
            return report_fig_html(parseInt(id, 10), cap || '')
      })
}

// Mini markdown : titres (#/##/###), listes (-, 1.), séparateur (---), paragraphes, + figures.
function report_to_html(md){
      var lines = md.split('\n')
      var out = [], list = null   // list = 'ul' | 'ol' | null
      function close_list(){ if (list){ out.push('</' + list + '>'); list = null } }

      for (var i = 0; i < lines.length; i++){
            var raw = lines[i]
            var line = raw.trim()

            // Figure seule sur sa ligne -> bloc (hors paragraphe)
            if (/^\[\[fig:\d+(?:\|[^\]]*)?\]\]$/.test(line)){
                  close_list(); out.push(report_apply_figs(line)); continue
            }
            if (line === ''){ close_list(); continue }
            if (line === '---'){ close_list(); out.push('<hr style="border:0; border-top:1px solid #ddd; margin:12px 0">'); continue }

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

// --- Bascule édition / aperçu -----------------------------------------------

function report_set_mode(edit){
      var ta = $('#report_md'), pv = $('#report_preview'), btn = $('#report_mode_btn')
      if (edit){
            ta.show(); pv.hide(); btn.text('aperçu')
      } else {
            report_render(); ta.hide(); pv.show(); btn.text('éditer')
      }
}

// --- Export PDF (fenêtre imprimable autonome) -------------------------------

function report_print(){
      var w = window.open('', '_blank')
      if (!w){ alert('Le navigateur a bloqué la fenêtre d’impression (autorise les pop-ups pour ce site).'); return }
      var body = report_to_html(report_state.md)
      w.document.write(
            '<!doctype html><html><head><meta charset="utf-8"><title>Compte rendu</title>' +
            '<style>body{font-family:sans-serif; max-width:760px; margin:24px auto; padding:0 16px; color:#222; line-height:1.55}' +
            'img{max-width:100%}</style></head><body>' + body + '</body></html>')
      w.document.close()
      // Laisse les images (data-URL) se décoder avant d'ouvrir le dialogue d'impression.
      w.onload = function(){ w.focus(); w.print() }
}

// --- Câblage (idempotent) ---------------------------------------------------

function report_init(){
      if (_report_wired){ return }
      _report_wired = true

      // Migration unique : l'ancien rapport à clé unique devient celui de la scène « sans nom ».
      try {
            var old = localStorage.getItem(REPORT_LS_OLD_KEY)
            if (old !== null){
                  var unnamed = REPORT_LS_PREFIX + '__unnamed__'
                  if (localStorage.getItem(unnamed) === null){ localStorage.setItem(unnamed, old) }
                  localStorage.removeItem(REPORT_LS_OLD_KEY)
            }
      } catch(e){ /* pas grave si la migration échoue */ }

      _report_scene_key = report_scene_key()
      report_load()

      var ta = document.getElementById('report_md')
      if (ta){ ta.value = report_state.md }

      // Édition -> état + persistance (aperçu recalculé à la bascule)
      $('#report_md').on('input', function(){ report_state.md = this.value; report_save() })
      // Les frappes ne doivent pas déclencher les raccourcis clavier de la scène pendant l'édition.
      $('#report_md').on('keydown keypress keyup', function(e){ e.stopPropagation() })

      $('#report_mode_btn').on('click', function(){ report_set_mode(!$('#report_md').is(':visible')) })
      $('.report_snap_btn').on('click', function(){ report_snapshot(this.getAttribute('data-kind')) })
      $('#report_pdf_btn').on('click', report_print)
      $('#report_clear_btn').on('click', function(){
            if (!confirm('Effacer tout le compte rendu (texte et figures) ?')){ return }
            report_state.md = ''; report_state.figs = {}; report_state.seq = 0
            var t = document.getElementById('report_md'); if (t){ t.value = '' }
            report_save(); report_render()
      })

      report_make_draggable()
      report_set_mode(false)                               // s'ouvre en aperçu
}

// Rend la fenêtre déplaçable par sa barre de titre (les autres fenêtres sont fixes ;
// un compte rendu profite d'être repositionnable pour dégager les graphes).
function report_make_draggable(){
      var box = document.getElementById('report_box')
      var head = document.getElementById('report_header')
      if (!box || !head){ return }
      var dx = 0, dy = 0, dragging = false
      head.addEventListener('mousedown', function(e){
            if (e.target.classList.contains('mon_close') || e.target.tagName === 'BUTTON'){ return }
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
