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
                          'magnet', 'friction', 'group_id']
    for (var i in list_attr_obj){
          var attr = list_attr_obj[i]
          if (msg[name][attr] !== undefined){ listorig[name][attr] = msg[name][attr] }   // (undefined -> ne pas écraser)
    }
    if (listorig[name].group_id !== undefined && listorig[name].group_id > group_id_counter){
          group_id_counter = listorig[name].group_id             // évite les collisions d'id de groupe
    }
    if (msg[name]['color'] !== undefined && listorig[name].material && listorig[name].material.color){
          listorig[name].material.color.setHex(msg[name]['color'])   // couleur sauvegardée
          listorig[name].currentHex = msg[name]['color']             // + couleur "réelle" mémorisée
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
      Recharge une sphère (boule de chaîne incluse) avec sa vitesse/masse/etc.
      */

      curr_tex_addr = msg[name]['tex_addr'] || basic_tex_addr;
      listorig[name] = basic_sphere( name, msg[name]['pos'], msg[name]['rot'], color_sphere_default )
      load_params(name, msg, curr_tex_addr)
      if (msg[name]['radius'] !== undefined){ set_sphere_radius(listorig[name], msg[name]['radius']) }  // rayon sauvegardé
      list_moving_objects.push(listorig[name])   // redevient dynamique (anime au prochain 'a')

}

function load_wall_box(name, msg){

      /*
      Recharge un mur de boîte (wall_box) : dimensions, orientation, statique.
      */

      curr_tex_addr = msg[name]['tex_addr'] || basic_tex_addr;
      curr_tex = new THREE.ImageUtils.loadTexture( curr_tex_addr )
      listmat[name] = new THREE.MeshBasicMaterial({ map : curr_tex, color : color_basic_default_pale_grey })
      var dim = { width : msg[name]['width'], height : msg[name]['height'], thickness : msg[name]['thickness'] }
      var obj = simple_parallelepiped( name, msg[name]['pos'], msg[name]['rot'], listmat[name], dim, 'wall_box' )
      var ori = msg[name]['orientation']
      if (ori){ obj.orientation = new THREE.Vector3(ori.x, ori.y, ori.z) }
      if (msg[name]['box_id'] !== undefined){    // regroupement des 4 parois d'une même boîte
            obj.box_id = msg[name]['box_id']
            if (obj.box_id > box_id_counter){ box_id_counter = obj.box_id }   // évite les collisions d'id
      }
      if (msg[name]['movable'] !== undefined){ obj.movable = msg[name]['movable'] }   // boîte déplaçable
      listorig[name] = obj
      load_params(name, msg, curr_tex_addr)
      obj.blocked = true                         // mur statique
      list_moving_objects.push(obj)              // dans la boucle d'interactions -> les boules rebondissent

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
      // 'elastic'/'spring' : ignorés, recréés via load_chains

} // end load_object ...

function load_chains(msg){

      /*
      Reconstruit les liaisons de chaîne (ressorts) à partir des paires sauvegardées.
      */

      if (!msg['_chains']){ return }
      for (var k in msg['_chains']){
            var s0 = listorig[ msg['_chains'][k][0] ]
            var s1 = listorig[ msg['_chains'][k][1] ]
            if (s0 && s1){
                  var el = create_elastic([s0, s1])
                  var pair = [s0, s1, el]
                  var ksaved = msg['_chains'][k][2]               // raideur propre sauvegardée (si réglée)
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
      load_chains(msg)                                         // reconstruit les ressorts des chaînes
      try { if (typeof restore_lids === 'function'){ restore_lids(msg) } }             // couvercles (non bloquant)
      catch(e){ console.warn('restore_lids a échoué :', e) }
      try { if (msg['_dynamics']){ restore_dynamics(msg['_dynamics']) } }              // réglages Dynamics (non bloquant)
      catch(e){ console.warn('restore_dynamics a échoué :', e) }
      if (msg['scene_name'] && msg['scene_name'] != 'None'){   // restitue le nom de la scène
            scene.name = msg['scene_name']
            $('#scene_name').val(scene.name)
      }
      if (typeof update_scene_name_display === 'function'){ update_scene_name_display() }

} // end load_scene..

function restore_dynamics(d){

      /*
      Restaure les réglages du panneau Dynamics sauvegardés avec la scène,
      puis rafraîchit les contrôles du panneau (si présent).
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
      if (d.altitude_fit_expr !== undefined){ altitude_fit_expr = d.altitude_fit_expr }
      if (typeof refresh_dynamics_panel === 'function'){ refresh_dynamics_panel() }  // met à jour les cases/curseurs

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
                            objects[i].type != 'elastic' &   // recréés à partir des paires de chaîne (_chains)
                            objects[i].type != 'spring' &
                            objects[i].type != 'lid' &       // couvercles : non persistés (recréés à la volée)
                            !objects[i].del

      return emit_conditions

}

function make_infos_obj(i){ return make_infos_obj_of(objects[i]) }   // sérialise objects[i]

function make_infos_obj_of(obj){

      /*
      Dictionnaire de recréation d'un objet (même format que load_object) : position,
      rotation, opacité, attributs et couleur. Réutilisé par le copier/coller.
      */

      var list_attr_emit = ['clone_infos', 'type', 'tex_addr', 'blocked',
                          'mass', 'speed', 'radius', 'radius_interact', 'magnet', 'friction',
                          'width', 'height', 'thickness', 'orientation', 'box_id', 'movable', 'group_id']  // utiles pour recréer sphères/boîtes
      var x = obj.rotation.x
      var y = obj.rotation.y
      var z = obj.rotation.z
      var mat = obj.material
      var opacity = (mat && mat._origOpacity !== undefined) ? mat._origOpacity : (mat ? mat.opacity : 1)  // opacité d'origine si objets atténués par les flèches
      var infos_obj = {
                       "pos": obj.position,
                       "rot": {x,y,z},
                       'opacity' : opacity
                      };
      for (var j in list_attr_emit){
            var key = list_attr_emit[j]
            infos_obj[key] = obj[key]
      }
      // couleur "réelle" (currentHex si l'objet est sélectionné/vert, sinon la couleur du matériau)
      if (mat && mat.color){
            infos_obj['color'] = (obj.currentHex !== undefined) ? obj.currentHex : mat.color.getHex()
      }

      return infos_obj

}

function get_scene_data(){              // construit le JSON de la scène (sans l'envoyer) -- réutilisé par save init

    var listpos = {}         // dictionary of all the informations about the scene to be saved in a json file..
    for (i in objects){
          if (condition_emit(i)){
              infos_obj = make_infos_obj(i)
              listpos[objects[i].name] = infos_obj;   			// add informations about the objects in the scene to listpos
              listpos['datetime'] = { 'date': moment().format('MMMM Do YYYY, h:mm:ss a'), 'type':'date' }; // save the date
              listpos['scene_name'] = scene.name
            }    // end if
          }    // end for
    if (list_paired_harmonic.length > 0){              // sauve les liaisons de chaîne (noms des boules + raideur propre)
          listpos['_chains'] = list_paired_harmonic.map(function(p){ return [p[0].name, p[1].name, p.k_spring] })
    }
    if (typeof list_lids !== 'undefined' && list_lids.length > 0){   // couvercles (recréés depuis leur box_id au chargement)
          listpos['_lids'] = list_lids.map(function(l){ return { box_id: l.box_id, opacity: l.mesh.material.opacity } })
    }
    listpos['_dynamics'] = {                           // réglages du panneau Dynamics (sauvegardés avec la scène)
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
          // toggles d'affichage (Monitoring)
          show_energy_graph: show_energy_graph,
          show_velocity_hist: show_velocity_hist,
          show_altitude_hist: show_altitude_hist,
          show_trajectories: show_trajectories,
          altitude_fit_expr: (typeof altitude_fit_expr !== 'undefined') ? altitude_fit_expr : ''
    }
    return listpos
}

function json_ascii(data){

    /*
    JSON.stringify + échappement \uXXXX de TOUT caractère non-ASCII.

    Indispensable : python-engineio 3.x décode le transport *polling* en latin-1. Un « è » (U+00E8)
    émis en clair revient donc en « Ã¨ » — et comme socket.io démarre TOUJOURS en polling avant de
    basculer en websocket, l'auto-save qui suit le chargement de la page tombait dans ce trou et
    ajoutait UNE couche de mojibake à CHAQUE ouverture de l'appli (« Archimède » -> « ArchimÃ¨de »
    -> « ArchimÃÂ¨de » -> ...). En n'envoyant que de l'ASCII, le transport n'a plus rien à
    corrompre ; \uXXXX est du JSON valide, json.loads() côté serveur restitue les vrais caractères.
    (Le sens serveur -> client est déjà sûr : python-socketio sérialise avec ensure_ascii=True.)
    */

    return JSON.stringify(data).replace(/[\u0080-\uffff]/g, function(c){
          return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
    })

}

function emit_infos_scene(archive_name){          									// emits the positions toward the server to save them

    /*
    Send the informations to the server (-> pos.json, état de travail courant).
    archive_name (string) : si fourni, demande l'archivage explicite dans scenes/<archive_name>.json.
    Appelé sans argument par l'auto-save (mouseup) -> pas d'archivage de scène nommée.
    */

    var data = get_scene_data()
    if (typeof history_record === 'function'){ history_record(data) }   // undo/redo : enregistre l'état (ignoré pendant une restauration)
    if (typeof archive_name === 'string' && archive_name){ data['_archive'] = archive_name }  // sauvegarde explicite
    socket.emit( 'message', JSON.stringify(data));
  }    // end emit_infos_scene

function init() {

  /*
  Initialize the scene..
  */

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  //------------------------- Camera

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
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
        if (typeof history_seed === 'function'){ history_seed() }   // undo/redo : reprend l'historique de la scène (ou pose la baseline)
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
  init_vertical_drag();       // plan vertical + double-clic (mode altitude) — après renderer : a besoin de domElement

  //------------------

  renderer.domElement.addEventListener( 'mousedown', mouse_create_object_or_action, false ); // -------- Create object
  renderer.domElement.addEventListener( 'mouseup', give_infos, false ); 				//--------- Infos
  renderer.domElement.addEventListener( 'mouseup', emit_infos_scene, false ); //---------- Emit the infos about all the objects..

  //--------------------

  container.appendChild( renderer.domElement );
  window.addEventListener( 'resize', onWindowResize, false );

} // end init
