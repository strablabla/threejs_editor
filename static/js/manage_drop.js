
function change_texture_with_dropped_one(tex){

  /*
  Replace the texture with the dropped one..
  */

  var last_select = listmat[LAST_SELECTED.name]
  var tex_addr = "static/upload/" + tex
  var texture =  new THREE.ImageUtils.loadTexture( tex_addr ) // take texture in static/upload..
  last_select.color.setHex(0xffffff);                         // set color to white
  last_select.map = texture;                                  // change the texture of the last selected object..
  last_select.map.needsUpdate = true                          // update the texture
  listorig[LAST_SELECTED.name].tex_addr = tex_addr            // save the new texture address..
  listorig[LAST_SELECTED.name].tex = tex            // save the new texture address..

}

var manage_drop = function(){

    /*
    Manage the folder or the file dropped in the Dropzone
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
              // htmlstring = "<img src=" +  'static/upload' + file.name "/>"
              // $('dz-message').html(htmlstring)

          },
          totaluploadprogress: function(progress) {
                  console.log("############ progress ", progress);
             }
      }; // end Dropzone.options.dropz
}
