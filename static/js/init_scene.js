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

}

function load_params(name, msg, curr_tex_addr){

    /*
    Load the parameters of each object..
    */

    listorig[name]['tex_addr'] =  curr_tex_addr               									 // texture address
    listorig[name]['tex'] =  curr_tex_addr.split('/').pop(-1)
    listorig[name].material['opacity'] =  msg[name]['opacity']             		    // opacity
    var list_attr_obj = ['clone_infos', 'blocked', 'del',
                          'mass', 'radius_interact',
                          'magnet', 'friction', 'group_id', 'track_trajectory']
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
      list_moving_objects.push(listorig[name])   // becomes dynamic again (animates on next 'a')

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
                  var el = create_elastic([s0, s1])
                  var pair = [s0, s1, el]
                  var ksaved = msg['_chains'][k][2]               // saved own stiffness (if set)
                  if (ksaved !== undefined && ksaved !== null){ pair.k_spring = ksaved }
                  list_paired_harmonic.push(pair)
            }
      }
      if (list_paired_harmonic.length > 0){ color_pairs_in_blue() }

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

      if (d.gravity_ok !== undefined){ gravity_ok = d.gravity_ok }
      if (d.springs_ok !== undefined){ springs_ok = d.springs_ok }
      if (d.one_over_r2 !== undefined){ one_over_r2 = d.one_over_r2 }
      if (d.attract_strength !== undefined){ attract_strength_one_over_r2 = d.attract_strength }
      if (d.attract_softening !== undefined){ attract_softening = d.attract_softening }
      if (d.use_cell_lists !== undefined){ use_cell_lists = d.use_cell_lists }
      if (d.use_barnes_hut !== undefined){ use_barnes_hut = d.use_barnes_hut }
      if (d.barnes_hut_theta !== undefined){ barnes_hut_theta = d.barnes_hut_theta }
      if (d.random_initial_speed !== undefined){ random_initial_speed = d.random_initial_speed }
      if (d.random_speed_module !== undefined){ random_speed_module = d.random_speed_module }
      if (d.random_speed_z !== undefined){ random_speed_z = d.random_speed_z }
      if (d.show_energy_graph !== undefined){ show_energy_graph = d.show_energy_graph }
      if (d.show_velocity_hist !== undefined){ show_velocity_hist = d.show_velocity_hist }
      if (d.show_altitude_hist !== undefined){ show_altitude_hist = d.show_altitude_hist }
      if (d.show_trajectories !== undefined){ show_trajectories = d.show_trajectories }
      if (d.show_report !== undefined){ show_report = d.show_report }
      if (d.show_speeds !== undefined){ show_speeds = d.show_speeds }
      if (d.altitude_fit_expr !== undefined){ altitude_fit_expr = d.altitude_fit_expr }
      if (d.traj_show){                                 // key by key: an older scene may not have them all
            var tkeys = ['xy', 'z', 'msd', 'v']
            for (var ti in tkeys){ if (d.traj_show[tkeys[ti]] !== undefined){ traj_show[tkeys[ti]] = d.traj_show[tkeys[ti]] } }
      }
      if (d.z_means_only !== undefined){ z_means_only = d.z_means_only }
      if (d.traj_colors_open !== undefined){ traj_colors_open = d.traj_colors_open }
      if (d.traj_modes_open !== undefined){ traj_modes_open = d.traj_modes_open }
      if (d.alt_color_filter !== undefined){ alt_color_filter = d.alt_color_filter }
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
                          'mass', 'speed', 'radius', 'radius_interact', 'magnet', 'friction',
                          'width', 'height', 'thickness', 'orientation', 'box_id', 'movable', 'group_id',
                          'track_trajectory']  // useful to recreate spheres/boxes (+ the trajectory selection)
      var x = obj.rotation.x
      var y = obj.rotation.y
      var z = obj.rotation.z
      var mat = obj.material
      var opacity = (mat && mat._origOpacity !== undefined) ? mat._origOpacity : (mat ? mat.opacity : 1)  // original opacity if objects dimmed by the arrows
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
          listpos['_chains'] = list_paired_harmonic.map(function(p){ return [p[0].name, p[1].name, p.k_spring] })
    }
    if (typeof list_lids !== 'undefined' && list_lids.length > 0){   // lids (recreated from their box_id on loading)
          listpos['_lids'] = list_lids.map(function(l){ return { box_id: l.box_id, opacity: l.mesh.material.opacity } })
    }
    listpos['_dynamics'] = {                           // Dynamics panel settings (saved with the scene)
          gravity_ok: gravity_ok,
          springs_ok: springs_ok,
          one_over_r2: one_over_r2,
          attract_strength: attract_strength_one_over_r2,
          attract_softening: attract_softening,
          use_cell_lists: use_cell_lists,
          use_barnes_hut: use_barnes_hut,
          barnes_hut_theta: barnes_hut_theta,
          random_initial_speed: random_initial_speed,
          random_speed_module: random_speed_module,
          random_speed_z: random_speed_z,
          // display toggles (Monitoring)
          show_energy_graph: show_energy_graph,
          show_velocity_hist: show_velocity_hist,
          show_altitude_hist: show_altitude_hist,
          show_trajectories: show_trajectories,
          show_report: show_report,
          show_speeds: show_speeds,
          altitude_fit_expr: (typeof altitude_fit_expr !== 'undefined') ? altitude_fit_expr : '',
          // selections INSIDE the monitoring windows (which plots, which display)
          traj_show: { xy:!!traj_show.xy, z:!!traj_show.z, msd:!!traj_show.msd, v:!!traj_show.v },   // x-y / z(t) / MSD / |v|(t)
          z_means_only: z_means_only,                  // z(t): means ⟨z⟩ only
          traj_colors_open: traj_colors_open,          // "suivre par couleur" list expanded or not
          traj_modes_open: traj_modes_open,            // "tracés" list expanded or not
          alt_color_filter: alt_color_filter           // altitude histogram: color counted
    }
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
