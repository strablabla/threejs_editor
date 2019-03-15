
var manage_drop = function(){
    /*
    Manage the folder dropped on the Dropzone
    */

    var list_addr = []
    var progmin = 0
    var currentpath = ""

    Dropzone.options.dropz = {
          paramName: "file",                                                 // The name that will be used to transfer the file
          maxFilesize: 2,                                                    // MB
          success: function(file, response) {
             //alert('helllloooooo Sir !!! ')
             //alert("file.fullPath in success is " + file.fullPath)
             //$("#dropz").hide()                                              // hidding dropzone when files are dropped

           },
          sending: function(file, xhr, data){

              if(file.fullPath){                                  // case of a folder
                  data.append("fullPath", file.fullPath);
                  //alert("file.fullPath is " + file.fullPath)
              }

              if(file.name){                                      // case of a file
                  data.append("name", file.name);
                  //alert("file.name is " + file.name
                  //var texture = new THREE.TextureLoader().load( "/static/upload/48.jpg" );
                  //var material = new THREE.MeshBasicMaterial( { map: texture } );
                  //SELECTED.material.map = texture;
                  // SELECTED.material.needsUpdate = true;
                  // SELECTED.material.map.needsUpdate = true;
                  // SELECTED.material.map = texture;
                  //LAST_SELECTED.material.color.setHex(0xffff66)

                  //LAST_SELECTED.material.color.setHex(0xffff66)

                  // Instantiate the material we will be using


                  // var material = new THREE.MeshBasicMaterial();
                  // // Instantiate a geometry to use
                  // var geometry = new THREE.BoxGeometry( 1, 1, 1 );
                  // // Instatiate the mesh with the geometry and material
                  // var cube = new THREE.Mesh( geometry, material );
                  // cube.position.set(0,0,0);
                  //
                  // // Then load the texture
                  // loader.load(arr[textureToShow], function(tex) {
                  //  // Once the texture has loaded
                  //  // Asign it to the material
                  //  material.map = tex;
                  //  // Update the next texture to show

                  // Load a texture

// var texture = new THREE.TextureLoader().load( "../upload/47.jpg" );
//
// // Create a geometry
// // 	Create a box (cube) of 10 width, length, and height
// var geometry = new THREE.BoxGeometry( 100, 100, 100 );
// // Create a MeshBasicMaterial with a loaded texture
// var material = new THREE.MeshBasicMaterial( {color:"red"} ); //{ map: texture}
//
// // Combine the geometry and material into a mesh
// var mesh = new THREE.Mesh( geometry, material );
// mesh.position.set(0,0,0)
// // Add the mesh to the scene
// scene.add( mesh );


                  var texture = new THREE.TextureLoader().load( "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif" );
                  // "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif"

                  var wall_length = 150;
                  var wall_width = 150;
                  var wall_height = 300;

                  var geometry = new THREE.CubeGeometry( wall_width, wall_length, wall_height );
                  var material = new THREE.MeshBasicMaterial( { map: texture } )
                  var object = new THREE.Mesh( geometry, material );
                  //var object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: "red" } ) );
                  object.position.set(0,0,0)
                  scene.add( object );
                  //objects.push( object )


                  //allow cross origin loading
                  // loader.crossOrigin = '';
                  //
                  // loader.load("/static/upload/48.jpg", function(tex) {
                  //      // Once the texture has loaded
                  //      // Asign it to the material
                  //      LAST_SELECTED.material.map = tex;
                  //      LAST_SELECTED.material.map.needsUpdate = true;
                  //      //$('#curr_func').text(LAST_SELECTED.material.map)
                  //      document.getElementById("curr_func").textContent = LAST_SELECTED.material.map;
                  //      //LAST_SELECTED.material.color.setHex(0xffff66)
                  //     });

                  // LAST_SELECTED.material.map = texture;
                  // LAST_SELECTED.material.map.needsUpdate = true;


                  $('#curr_func').css('background-color','red')

                  //$('#curr_func').css('background-color','blue')
              }

              //alert("file.fullPath name is " + file.name)
              $('.dz-preview').remove()                       // remove the Thumbnails
              // File upload Progress
          },
          totaluploadprogress: function(progress) {
                  console.log("############ progress ", progress);
             }
      }; // end Dropzone.options.dropz
}
