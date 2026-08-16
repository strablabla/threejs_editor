/*

Initialization of the scene..

*/


//===================================================================== Simple markdown

    /*
    Simple markdown used for providing informations to the user.
    It handles classical markdown list syntax.
    */

    simple_md = function(text){ // mini markdown for the help

				/*
				Simple markdown
				*/

        var all_text = text.split('\n')
        var htm = $('<div/>')
        var ul = $('<ul/>').css({'text-align':'left'})
        for (i in all_text){
            var text_insert = all_text[i].trim().slice(1) // prepare text
            if (all_text[i].match(/^\s{4}\*/)){    // detect list first level
                ul.append($('<li/>').text(text_insert).css({"font-weight": "bold"}))
                } // end if
            if (all_text[i].match(/^\s{8}\*/)){  // detect list second level
                    var interm1 = $('<ul/>').append($('<li/>').text(text_insert))
                    ul.append(interm1)
                    } // end if
            if (all_text[i].match(/^\s{12}\*/)){  // detect list third level
                    var interm2 = $('<ul/>').append($('<li/>').text(text_insert))
                    interm1.append(interm2)
                    } // end if
            if (all_text[i].match(/\s*\#/)){ // detect #
                htm.append($('<h1/>').text(text_insert))
                } // end if
        } // end for
        htm.append(ul);
        return htm.html()
    } // end function

var keys = function(){/*
# Keys:
* action
    * c : clone
    * d : delete
		* g : move a whole group
    * h : make an horizontal plane..
    * o : sphere (ball)
    * e : chain (balls linked by springs)
    * u : link two objects with a spring
    * i : infos about the selected object
    * k : select camera position and view direction with the mouse..
    * l : simple cube
    * m : cubes with texture
    * n : wall (single panel)
    * w : box (enclosure of reflecting walls)
    * a : start the physics animation
    * x : toggle animation on/off
    * r : rotation
    * s : select an area
    * p: select many objects separately
    * arrow up : move up
    * arrow down : move down
*/}.toString().slice(14,-3)

function load_speed(msg,name){

    /*
    Load the speed from the json, used in load_params
    */

    var speed = msg[name]['speed']
    listorig[name]['speed'] = new THREE.Vector3()
    listorig[name]['speed']['x'] = speed.x
    listorig[name]['speed']['y'] = speed.y
    listorig[name]['speed']['z'] = speed.z
    // Initial speed of the object (listing by v0 in the Trajectories window). 'v0' comes from the
    // file when it has one (loaded just above, with the other attributes); a scene saved before v0
    // existed has none -> the loaded speed IS the initial state of that scene.
    if (listorig[name]['v0'] === undefined){
          listorig[name]['v0'] = Math.sqrt(speed.x*speed.x + speed.y*speed.y + speed.z*speed.z)
    }

}

function each_object_material(obj, fn){          // the material of an object, or each sub-material (MeshFaceMaterial)

    var m = obj && obj.material
    if (!m){ return }
    if (m.materials){ for (var j in m.materials){ fn(m.materials[j]) } }
    else { fn(m) }

}

function restore_opacity(obj, op){

    /*
    Restores a saved opacity. In three.js the 'opacity' of a material is IGNORED as long as
    'transparent' is false, and the loaders build most materials opaque (basic_sphere and
    load_wall_box do; only load_parallelepiped_shapes asks for transparent). Writing back the
    number alone therefore repainted every reloaded wall / ball FULLY OPAQUE — the opacity set
    from the context menu was lost at the next load. Same treatment as the lids (restore_lids).
    */

    if (op === undefined || op === null || isNaN(op)){ return }
    each_object_material(obj, function(mat){
          mat.opacity = op
          if (op < 1){ mat.transparent = true }    // no point paying for blending at opacity 1
          mat.needsUpdate = true
    })

}

function load_params(name, msg, curr_tex_addr){

    /*
    Load the parameters of each object..
    */

    listorig[name]['tex_addr'] =  curr_tex_addr               									 // texture address
    listorig[name]['tex'] =  curr_tex_addr.split('/').pop(-1)
    restore_opacity(listorig[name], msg[name]['opacity'])                            // opacity
    /* Generic attributes copied back as they were saved. This list is the MIRROR of
       list_attr_emit in make_infos_obj_of: an attribute saved there and missing here is simply
       lost on reload, with no error -- which is exactly how a tissue used to come back as a
       heap of plain balls. The names present there and absent here (radius, orientation,
       speed, dimensions...) are deliberate: the type-specific loaders restore those. */
    var list_attr_obj = ['clone_infos', 'blocked', 'del',
                          'mass', 'radius_interact', 'v0', 'is_track', 'track_solid',
                          'magnet', 'friction', 'group_id', 'tissue', 'tissue_idx',
                          'bubble', 'bubble_idx', 'gas_of', 'track_trajectory']
    for (var i in list_attr_obj){
          var attr = list_attr_obj[i]
          if (msg[name][attr] !== undefined){ listorig[name][attr] = msg[name][attr] }   // (undefined -> do not overwrite)
    }
    if (listorig[name].track_trajectory && typeof reset_trajectory === 'function'){
          reset_trajectory(listorig[name])       // tracked object: it needs its .traj, otherwise record_trajectories crashes
    }
    if (listorig[name].group_id !== undefined && listorig[name].group_id > group_id_counter){
          group_id_counter = listorig[name].group_id             // avoids group id collisions
    }
    if (msg[name]['color'] !== undefined && listorig[name].material && listorig[name].material.color){
          listorig[name].material.color.setHex(msg[name]['color'])   // saved color
          listorig[name].currentHex = msg[name]['color']             // + "real" color stored
    }
    load_speed(msg,name)
    // A ball saved as an anchor must come back black: the colour above is the REAL one, the
    // blocked state is only known once the attributes have been copied.
    if (typeof refresh_blocked_color === 'function'){ refresh_blocked_color(listorig[name]) }

}

dic_type_parall = { "wall" : make_wall,
                    "simple_cube" : make_simple_cube,
                    "pavement" : make_pavement
                   }

function load_parallelepiped_shapes(name, msg){

      /*
      Load parallelepipedic objects
      */

      curr_tex_addr = msg[name]['tex_addr'] || basic_tex_addr;
      curr_tex = new THREE.ImageUtils.loadTexture( curr_tex_addr ) // by default white texture
      listmat[name] = new THREE.MeshBasicMaterial({ map : curr_tex, color : color_basic_default_pale_grey, transparent : true, opacity : 1 })
      listorig[name] = dic_type_parall[msg[name]['type']]( name, msg[name]['pos'], msg[name]['rot'], listmat[name] )   // make the wall object
      set_parallelepiped_dims( listorig[name], { width : msg[name]['width'],        // saved dimensions: make_wall & co
                                                 height : msg[name]['height'],      // recreate the object with their default
                                                 thickness : msg[name]['thickness'] } )  // sizes -> we resize it afterwards
      load_params(name, msg, curr_tex_addr)

}

function load_cube_mult_tex(name, msg){

      /*
      cube multitexture
      */

      curr_tex_mult_addr = msg[name]['tex_addr'] || basic_multiple_tex_addr;
      curr_tex_mult = 'face_color';                                										// name of the folder for the textures
      listmat[name] = make_meshFaceMaterial(curr_tex_mult)                                // texture for each face
      listorig[name] = make_cube_texture( name, msg[name]['pos'], msg[name]['rot'], listmat[name] )   // make the cube with texture
      load_params(name, msg, curr_tex_addr)

}

function load_sphere(name, msg){

      /*
      Reload a sphere (chain ball included) with its velocity/mass/etc.
      */

      curr_tex_addr = msg[name]['tex_addr'] || basic_tex_addr;
      listorig[name] = basic_sphere( name, msg[name]['pos'], msg[name]['rot'], color_sphere_default )
      load_params(name, msg, curr_tex_addr)
      if (msg[name]['radius'] !== undefined){ set_sphere_radius(listorig[name], msg[name]['radius']) }  // saved radius
      list_moving_objects.push(listorig[name])   // becomes dynamic again (animates with 'x')

}

function load_wall_box(name, msg){

      /*
      Reload a box wall (wall_box): dimensions, orientation, static.
      */

      curr_tex_addr = msg[name]['tex_addr'] || basic_tex_addr;
      curr_tex = new THREE.ImageUtils.loadTexture( curr_tex_addr )
      listmat[name] = new THREE.MeshBasicMaterial({ map : curr_tex, color : color_basic_default_pale_grey })
      var dim = { width : msg[name]['width'], height : msg[name]['height'], thickness : msg[name]['thickness'] }
      var obj = simple_parallelepiped( name, msg[name]['pos'], msg[name]['rot'], listmat[name], dim, 'wall_box' )
      var ori = msg[name]['orientation']
      if (ori){ obj.orientation = new THREE.Vector3(ori.x, ori.y, ori.z) }
      if (msg[name]['box_id'] !== undefined){    // grouping the 4 walls of the same box
            obj.box_id = msg[name]['box_id']
            if (obj.box_id > box_id_counter){ box_id_counter = obj.box_id }   // avoids id collisions
      }
      if (msg[name]['movable'] !== undefined){ obj.movable = msg[name]['movable'] }   // movable box
      listorig[name] = obj
      load_params(name, msg, curr_tex_addr)
      obj.blocked = true                         // static wall
      list_moving_objects.push(obj)              // in the interactions loop -> the balls bounce
      // a track segment can be made non-solid from its context menu: honour that choice
      // (absent from an older scene -> solid, the default)
      if (typeof is_track_segment === 'function' && is_track_segment(obj) && typeof set_track_solid === 'function'){
            set_track_solid(obj, obj.track_solid !== false)
      }

}

function load_object(name, msg){

      /*
      Create a new object json file containing all the information about the scene..
      */

      var t = msg[name]['type']
      if (t in dic_type_parall){ load_parallelepiped_shapes(name, msg) }
      else if (t == "cube_mult_tex"){ load_cube_mult_tex(name, msg) }
      else if (t == "sphere"){ load_sphere(name, msg) }
      else if (t == "wall_box"){ load_wall_box(name, msg) }
      // 'elastic'/'spring': ignored, recreated via load_chains

} // end load_object ...

function load_chains(msg){

      /*
      Rebuilds the chain links (springs) from the saved pairs.
      */

      if (!msg['_chains']){ return }
      for (var k in msg['_chains']){
            var s0 = listorig[ msg['_chains'][k][0] ]
            var s1 = listorig[ msg['_chains'][k][1] ]
            if (s0 && s1){
                  var kind = msg['_chains'][k][5]                 // 'struct' | 'shear' | 'bend' (absent on older scenes)
                  // Shear and bending springs of a tissue carry no visible elastic: they are
                  // internal, and drawing them would bury the mesh under a web of tubes.
                  var el = (kind === 'shear' || kind === 'bend') ? null : create_elastic([s0, s1])
                  var pair = [s0, s1, el]
                  if (kind !== undefined && kind !== null){ pair.tissue_kind = kind }
                  var ksaved = msg['_chains'][k][2]               // saved own stiffness (if set)
                  if (ksaved !== undefined && ksaved !== null){ pair.k_spring = ksaved }
                  var lsaved = msg['_chains'][k][3]               // saved own rest length (if set)
                  if (lsaved !== undefined && lsaved !== null){ pair.rest_length = lsaved }
                  var tid = msg['_chains'][k][4]                  // tissue this spring belongs to
                  if (tid !== undefined && tid !== null){ pair.tissue_id = tid }
                  list_paired_harmonic.push(pair)
            }
      }
      if (list_paired_harmonic.length > 0){ color_pairs_in_blue() }
      // Balls of one tissue must SHARE a single descriptor: each was serialized with its own
      // copy, so re-point them all at the first one. Otherwise editing the mesh from one ball
      // would leave the others with stale values.
      var seen = {}
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]; if (!o || !o.tissue){ continue }
            var id = o.tissue.id
            if (seen[id]){ o.tissue = seen[id] } else { seen[id] = o.tissue }
            if (typeof tissue_next_id !== 'undefined' && id >= tissue_next_id){ tissue_next_id = id + 1 }
      }
      // Same for the bubbles. Sharing matters more here: the descriptor carries the face list
      // and the reference volume V0, both read every frame by accel_pressure.
      var seenb = {}
      for (var i in list_moving_objects){
            var o = list_moving_objects[i]; if (!o || !o.bubble){ continue }
            var idb = o.bubble.id
            if (seenb[idb]){ o.bubble = seenb[idb] } else { seenb[idb] = o.bubble }
            if (typeof bubble_next_id !== 'undefined' && idb >= bubble_next_id){ bubble_next_id = idb + 1 }
      }
      // The elastics were just rebuilt from scratch, hence opaque: a transparent shell would
      // come back as see-through balls inside a cage of solid tubes. Repaint from the value
      // kept on the descriptor.
      for (var idb2 in seenb){
            var op = seenb[idb2].op
            if (op !== undefined && op < 1 && typeof bubble_set_opacity === 'function'){
                  bubble_set_opacity(seenb[idb2].id, op)
            }
      }

}

function load_scene(msg){

      /*
      Loading the scene
      */

      for (i=0; i < Object.keys(msg).length; i++){ 					// Create the objects at the beginning
              var name = Object.keys(msg)[i]  									// k is the objects name
              load_object(name, msg)                           // load the objects wall..
          } // end for
      load_chains(msg)                                         // rebuilds the chain springs
      try { if (typeof restore_lids === 'function'){ restore_lids(msg) } }             // lids (non-blocking)
      catch(e){ console.warn('restore_lids a échoué :', e) }
      try { if (msg['_dynamics']){ restore_dynamics(msg['_dynamics']) } }              // Dynamics settings (non-blocking)
      catch(e){ console.warn('restore_dynamics a échoué :', e) }
      if (msg['scene_name'] && msg['scene_name'] != 'None'){   // restores the scene name
            scene.name = msg['scene_name']
            $('#scene_name').val(scene.name)
      }
      if (typeof update_scene_name_display === 'function'){ update_scene_name_display() }

} // end load_scene..

function restore_dynamics(d){

      /*
      Restores the Dynamics panel settings saved with the scene,
      then refreshes the panel controls (if present).
      */

      for (var pi=0; pi<PERSISTED_DYNAMICS.length; pi++){    // same list as get_scene_data(): no second one to keep in step
            var pk = PERSISTED_DYNAMICS[pi]
            if (d[pk] !== undefined){ window[pk] = d[pk] }   // absent from an older scene -> the default stays
      }
      // The four needing a conversion on the way in -- mirror of get_scene_data().
      if (d.attract_strength !== undefined){ attract_strength_one_over_r2 = d.attract_strength }   // JSON key differs
      if (d.altitude_fit_expr !== undefined){ altitude_fit_expr = d.altitude_fit_expr }
      if (d.traj_show){                                 // key by key: an older scene may not have them all
            var tkeys = ['xy', 'z', 'msd', 'v']
            for (var ti in tkeys){ if (d.traj_show[tkeys[ti]] !== undefined){ traj_show[tkeys[ti]] = d.traj_show[tkeys[ti]] } }
      }
      if (d.mon_chrono && typeof mon_chrono !== 'undefined'){         // per-window observation time (u.a.), re-armed on load
            for (var _mw in mon_chrono){ if (d.mon_chrono[_mw] !== undefined){ mon_chrono[_mw] = d.mon_chrono[_mw]
                  if (typeof mon_fired !== 'undefined'){ mon_fired[_mw] = false }
                  var $mi = $('.mon-chrono[data-win="' + _mw + '"]')
                  if ($mi.length){ $mi.val((d.mon_chrono[_mw] == null) ? '' : ((typeof mon_fmt_hms === 'function') ? mon_fmt_hms(d.mon_chrono[_mw]) : d.mon_chrono[_mw])) } } }
      }
      if (typeof refresh_dynamics_panel === 'function'){ refresh_dynamics_panel() }  // updates the checkboxes/sliders

}


function set_controls(controls){

      /*
      Setting the controls parameters..
      */

      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 4; // 1.2 original //
      controls.panSpeed = 2;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;

}

function set_light(light){

      /*
      Setting the light parameters..
      */

      light.position.set( 200, 500, 5000 );
      light.castShadow = true;

      // ----------------------------------------------- Shadow

      light.shadowCameraNear = 200;
      light.shadowCameraFar = camera.far;
      light.shadowCameraFov = 50;
      // -------------------------
      light.shadowBias = -0.00022;
      light.shadowDarkness = 0.5;

}

function condition_emit(i){

      /*
      Deal with the conditions
      */

      var emit_conditions = objects[i].type != 'pawn' &
                            objects[i].type != null &
                            objects[i].type != 'elastic' &   // recreated from the chain pairs (_chains)
                            objects[i].type != 'spring' &
                            objects[i].type != 'lid' &       // lids: not persisted (recreated on the fly)
                            !objects[i].del

      return emit_conditions

}

function make_infos_obj(i){ return make_infos_obj_of(objects[i]) }   // serializes objects[i]

function make_infos_obj_of(obj){

      /*
      Recreation dictionary of an object (same format as load_object): position,
      rotation, opacity, attributes and color. Reused by copy/paste.
      */

      var list_attr_emit = ['clone_infos', 'type', 'tex_addr', 'blocked',
                          'mass', 'speed', 'v0', 'radius', 'radius_interact', 'magnet', 'friction',
                          'width', 'height', 'thickness', 'orientation', 'box_id', 'movable', 'group_id',
                          'is_track', 'track_solid',   // a track segment, and whether the balls bounce off it
                          'tissue', 'tissue_idx',      // mesh a ball belongs to, and its rank in it
                          'bubble', 'bubble_idx',      // shell a ball belongs to, and its rank (the faces use it)
                          'gas_of',                    // gas ball: id of the bubble it fills
                          'track_trajectory']  // useful to recreate spheres/boxes (+ the trajectory selection)
      var x = obj.rotation.x
      var y = obj.rotation.y
      var z = obj.rotation.z
      var mat = obj.material
      // representative material: a MeshFaceMaterial (textured cube) carries nothing itself,
      // the opacity lives in its sub-materials
      var omat = (mat && mat.materials && mat.materials.length) ? mat.materials[0] : mat
      var opacity = (omat && omat._origOpacity !== undefined) ? omat._origOpacity          // original opacity if objects dimmed by the arrows
                  : ((omat && omat.opacity !== undefined) ? omat.opacity : 1)
      var infos_obj = {
                       "pos": obj.position,
                       "rot": {x,y,z},
                       'opacity' : opacity
                      };
      for (var j in list_attr_emit){
            var key = list_attr_emit[j]
            infos_obj[key] = obj[key]
      }
      // "real" color (currentHex if the object is selected/green, otherwise the material color)
      if (mat && mat.color){
            infos_obj['color'] = (obj.currentHex !== undefined) ? obj.currentHex : mat.color.getHex()
      }

      return infos_obj

}

function get_scene_data(){              // builds the scene JSON (without sending it) -- reused by save init

    var listpos = {}         // dictionary of all the informations about the scene to be saved in a json file..
    for (i in objects){
          if (condition_emit(i)){
              infos_obj = make_infos_obj(i)
              listpos[objects[i].name] = infos_obj;   			// add informations about the objects in the scene to listpos
              listpos['datetime'] = { 'date': moment().format('MMMM Do YYYY, h:mm:ss a'), 'type':'date' }; // save the date
              listpos['scene_name'] = scene.name
            }    // end if
          }    // end for
    if (list_paired_harmonic.length > 0){              // saves the chain links (ball names + own stiffness)
          listpos['_chains'] = list_paired_harmonic.map(function(p){ return [p[0].name, p[1].name, p.k_spring, p.rest_length, p.tissue_id, p.tissue_kind] })
    }
    if (typeof list_lids !== 'undefined' && list_lids.length > 0){   // lids (recreated from their box_id on loading)
          listpos['_lids'] = list_lids.map(function(l){ return { box_id: l.box_id, opacity: l.mesh.material.opacity, locked: !!l.mesh.locked } })
    }
    var dyn = {}                                       // Dynamics panel settings (saved with the scene)
    for (var pi=0; pi<PERSISTED_DYNAMICS.length; pi++){         // the plain ones: JSON key = global name, value as-is
          var pk = PERSISTED_DYNAMICS[pi]
          if (window[pk] === undefined){                        // name misspelled in the list, or global never declared:
                console.warn('get_scene_data: ' + pk + ' is undefined, not saved')   // say it instead of dropping it silently
                continue
          }
          dyn[pk] = window[pk]
    }
    // The four needing a conversion on the way out -- restore_dynamics() mirrors them explicitly too.
    dyn.attract_strength  = attract_strength_one_over_r2        // JSON key differs from the global name
    dyn.altitude_fit_expr = (typeof altitude_fit_expr !== 'undefined') ? altitude_fit_expr : ''
    dyn.traj_show  = { xy:!!traj_show.xy, z:!!traj_show.z, msd:!!traj_show.msd, v:!!traj_show.v }   // x-y / z(t) / MSD / |v|(t)
    dyn.mon_chrono = (typeof mon_chrono !== 'undefined') ? mon_chrono : undefined                   // per-window observation time (u.a.)
    listpos['_dynamics'] = dyn
    return listpos
}

function json_ascii(data){

    /*
    JSON.stringify + \uXXXX escaping of EVERY non-ASCII character.

    Essential: python-engineio 3.x decodes the *polling* transport as latin-1. An « è » (U+00E8)
    sent as-is therefore comes back as « Ã¨ » — and since socket.io ALWAYS starts in polling before
    switching to websocket, the auto-save that follows the page load fell into this trap and
    added ONE layer of mojibake at EVERY opening of the app (« Archimède » -> « ArchimÃ¨de »
    -> « ArchimÃÂ¨de » -> ...). By sending only ASCII, the transport has nothing left to
    corrupt; \uXXXX is valid JSON, json.loads() on the server side restores the real characters.
    (The server -> client direction is already safe: python-socketio serializes with ensure_ascii=True.)
    */

    return JSON.stringify(data).replace(/[\u0080-\uffff]/g, function(c){
          return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
    })

}

function emit_infos_scene(archive_name){          									// emits the positions toward the server to save them

    /*
    Send the informations to the server (-> pos.json, current working state).
    archive_name (string): if provided, requests explicit archiving in scenes/<archive_name>.json.
    Called without argument by the auto-save (mouseup) -> no named scene archiving.
    */

    var data = get_scene_data()
    if (typeof history_record === 'function'){ history_record(data) }   // undo/redo: records the state (ignored during a restore)
    if (typeof archive_name === 'string' && archive_name){ data['_archive'] = archive_name }  // explicit save
    socket.emit( 'message', JSON.stringify(data));
  }    // end emit_infos_scene

function init() {

  /*
  Initialize the scene..
  */

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  //------------------------- Camera

  // near=10 / far=60000: we see much farther without the scene being clipped when zooming out.
  // Raising near (1 -> 10) together with far keeps the far/near ratio LOW (6000 < 10000
  // from before), so the depth buffer precision stays good (no z-fighting).
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 10, 60000 );
  camera.position.set(0,-2000,2000)

  //------------------------- Control the view

  controls = new THREE.TrackballControls( camera );
  set_controls(controls)

  //------------------------- Scene

  scene = new THREE.Scene();
  scene.add( new THREE.AmbientLight( 0x505050 ) );

  // ----------------------------------------------- Light

  // const ambientLight = new THREE.HemisphereLight(
  //   0xddeeff, // bright sky color
  //   0x202020, // dim ground color
  //   3, // intensity
  // );

  var light = new THREE.SpotLight( 0xffffff, 1.5 );
  set_light(light)
  scene.add( light );

  //make_objects_onflat()
  ground = make_uniform_ground()  							// make the board
  // ------------------------- Shadow ground
  light.shadowMapWidth = ground.size;
  light.shadowMapHeight = ground.size;
  //make_small_seats()     		// make the seats
  //make_seat()            		// make the seat

  listorig = {}                                 // list of objects
  listmat = {} 																	// list of materials

  //-----------------------------------------

  /*
  Communication server client..
  */

  socket.emit( 'begin',  "hello from client"); // send mess to server for ping pong..
  socket.on('server_pos', function(msg) {
        load_scene(msg)             // When receiving the scene from the server (pos.json), load it in the client..
        if (typeof history_seed === 'function'){ history_seed() }   // undo/redo: resumes the scene history (or sets the baseline)
      });// end socket.on

  // var gjson ;
  // gjson = getJSON('../static/js/pos.json', function(data){
  // 	  $('.panel_keys').text(JSON.stringify(data))
  // }) ;


  // $.getJSON("../static/js/pos.json", function (msg) {
  // 		//$('.panel_keys').text(JSON.stringify(msg))
  // 		$('.panel_keys').text("helllo darling")
  //     //load_scene(msg)
  // 		});

 // var request = new XMLHttpRequest();
 // request.open("GET", '../static/pos.json', false);
 // request.send(null)
 // var jsobj = JSON.parse(request.responseText);
 // console.log(jsobj)
 // load_scene(jsobj)
 // dicsimple = {"rrr":"rrer"}
 // document.getElementById("curr_func").textContent = "heeeee"; //dicsimple['rrr'];

  init_drag();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.sortObjects = false;
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  init_vertical_drag();       // vertical plane + double-click (altitude mode) — after renderer: needs domElement

  //------------------

  renderer.domElement.addEventListener( 'mousedown', mouse_create_object_or_action, false ); // -------- Create object
  renderer.domElement.addEventListener( 'mouseup', give_infos, false ); 				//--------- Infos
  renderer.domElement.addEventListener( 'mouseup', emit_infos_scene, false ); //---------- Emit the infos about all the objects..

  //--------------------

  container.appendChild( renderer.domElement );
  window.addEventListener( 'resize', onWindowResize, false );

} // end init
