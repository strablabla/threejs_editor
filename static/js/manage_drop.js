
function change_texture_with_dropped_one(tex){

  /*
  Replace the texture with the dropped one..
  */

  // var last_select = listmat[LAST_SELECTED.name]
  // var texture =  new THREE.ImageUtils.loadTexture( "static/upload/" + tex ) // take texture in static/upload..
  // last_select.color.setHex(0xffffff);                       // set color to white
  // last_select.map = texture;                                // change the texture of the last selected object..
  // last_select.map.needsUpdate = true                        // update the texture

  var texture =  new THREE.ImageUtils.loadTexture( "static/upload/" + tex ) // take texture in static/upload..
  listmat[LAST_SELECTED.name].color.setHex(0xffffff);                       // set color to white
  listmat[LAST_SELECTED.name].map = texture;                                // change the texture of the last selected object..
  listmat[LAST_SELECTED.name].map.needsUpdate = true                        // update the texture

}

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

           },
          sending: function(file, xhr, data){

              if(file.fullPath){                                  // case of a folder
                  data.append("fullPath", file.fullPath);
                  //alert("file.fullPath is " + file.fullPath)
              }

              if(file.name){                                      // case of a file
                  data.append("name", file.name);
                  change_texture_with_dropped_one(file.name)
                  //$('#curr_func').css('background-color','red')
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
