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
		* move a whole group
    * h : make an horizontal plane..
    * i : infos about the selected object
    * k : select camera position and view direction with the mouse..
    * n : new piece with mouse
    * m : cubes with texture
    * r : rotation
    * s : select an area
    * SHIFT : select many objects separately
    * arrow up : move up
    * arrow down : move down
*/}.toString().slice(14,-3)


function load_params(k, msg, curr_tex_addr){

    /*
    Load the parameters of each object..
    */

    listorig[k]['clone_infos'] = msg[k]['clone_infos']                       // add the infos about cloning
    listorig[k]['tex_addr'] =  curr_tex_addr               									 // texture address
    listorig[k]['tex'] =  curr_tex_addr.split('/').pop(-1)
    listorig[k]['blocked'] =  msg[k]['blocked']             		            // blocked
    listorig[k]['del'] =  msg[k]['del']             		                    // delete autorization

}

function load_object(k, msg){

      /*
      Create a new object json file containing all the information about the scene..
      */

      //-------------- Wall

      if (msg[k]['type'] == "wall"){  // wall

            curr_tex_addr = msg[k]['tex_addr'] || basic_tex_addr;
            curr_tex = new THREE.ImageUtils.loadTexture( curr_tex_addr ) // by default white texture
            listmat[k] = new THREE.MeshBasicMaterial({ map : curr_tex, color : basic_color})
            listorig[k] = make_wall( k, msg[k]['pos'], msg[k]['rot'], listmat[k] )   // make the wall object
            load_params(k, msg, curr_tex_addr)
       } // end if

      //-------------- Cube with textures

      else if (msg[k]['type'] == "cube_mult_tex"){  // cube

             curr_tex_mult_addr = msg[k]['tex_addr'] || basic_multiple_tex_addr;
             curr_tex_mult = 'face_color';                                										// name of the folder for the textures
             listmat[k] = make_meshFaceMaterial(curr_tex_mult)                                // texture for each face
             listorig[k] = make_cube_texture( k, msg[k]['pos'], msg[k]['rot'], listmat[k] )   // make the cube with texture
             load_params(k, msg, curr_tex_addr)

             //listorig[k].material.color = 0xffffff            	  // color

        } // end if
} // end load_object ...

function load_scene(msg){

      /*
      Loading the scene
      */

      for (i=0; i < Object.keys(msg).length; i++){ 					// Create the objects at the beginning
              var k = Object.keys(msg)[i]  									// k is the objects name
              load_object(k, msg)                           // load the objects wall..

          } // end for

} // end load_scene..


function emit_infos_scene(){          									// emits the positions toward the server to save them

    /*
    Send the informations (about position, cloning, rotation, type of object..) to the server..
    */

    var listpos = {}         // dictionary of all the informations about the scene to be saved in a json file..
    for (i in objects){
          if (objects[i].type != 'pawn' & objects[i].type != null & !objects[i].del){ // & !objects[i].del
              var x = objects[i].rotation.x
              var y = objects[i].rotation.y
              var z = objects[i].rotation.z
              var infos_obj = {
                               "pos": objects[i].position,
                               "rot": {x,y,z},
                               "clone_infos": objects[i].clone_infos,
                               "type": objects[i].type,
                               'tex_addr' : objects[i].tex_addr,
                               'blocked' : objects[i].blocked
                              };
              listpos[objects[i].name] = infos_obj;   			// add informations about the objects in the scene to listpos
              listpos['datetime'] = { 'date': moment().format('MMMM Do YYYY, h:mm:ss a'), 'type':'date' }; // save the date
            }    // end if
          }    // end for
    socket.emit( 'message', JSON.stringify(listpos));  // send the informations to the server
  }    // end emit_infos_scene

function init() {

  /*
  Initialize the scene..
  */

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  //------------------------- Camera

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 2000;
  camera.position.y = -2000;
  camera.position.x = 0;

  //------------------------- Control the view

  controls = new THREE.TrackballControls( camera );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 4; // 1.2 original //
  controls.panSpeed = 2;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  scene = new THREE.Scene();

  scene.add( new THREE.AmbientLight( 0x505050 ) );

  // ----------------------------------------------- Light

  // const ambientLight = new THREE.HemisphereLight(
  //   0xddeeff, // bright sky color
  //   0x202020, // dim ground color
  //   3, // intensity
  // );

  var light = new THREE.SpotLight( 0xffffff, 1.5 );
  light.position.set( 200, 500, 5000 );
  light.castShadow = true;

  // ----------------------------------------------- Shadow

  light.shadowCameraNear = 200;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 50;
  // -------------------------
  light.shadowBias = -0.00022;
  light.shadowDarkness = 0.5;

  scene.add( light );

  //make_objects_onflat()
  ground = make_uniform_ground()  							// make the board
  // ------------------------- Shadow ground
  light.shadowMapWidth = ground.size;
  light.shadowMapHeight = ground.size;
  //make_small_seats()     		// make the seats
  //make_seat()            		// make the seat

  listorig = {}
  listmat = {} 																	// list of materials


  //-----------------------------------------

  /*
  Communication server client..
  */

  socket.emit( 'begin',  "hello from client"); // send mess to server for ping pong..
  socket.on('server_pos', function(msg) {
        load_scene(msg)  // When receiving the scene from the server (pos.json), load it in the client..
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

  //------------------

  renderer.domElement.addEventListener( 'mousedown', mouse_create_object_or_action, false ); // -------- Create object
  renderer.domElement.addEventListener( 'mouseup', give_infos, false ); 				//--------- Infos
  renderer.domElement.addEventListener( 'mouseup', emit_infos_scene, false ); //---------- Emit the infos about all the objects..

  //--------------------

  container.appendChild( renderer.domElement );
  window.addEventListener( 'resize', onWindowResize, false );

} // end init
