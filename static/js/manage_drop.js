
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

function change_multiple_texture_with_dropped_ones(tex){

  /*
  Replace the texture with multiple texture the dropped one..
  */

  var last_select = listmat[LAST_SELECTED.name];
  var tex_addr = "static/upload/" + tex;
  var materials = [];
  for (i=0; i<6; i++){
      materials.push(new THREE.MeshLambertMaterial({
          map:  THREE.ImageUtils.loadTexture( tex_addr + '/' + i +'.jpg' )
          }) // end Lambert
     ) // end push
  } // end for
  var texture = new THREE.MeshFaceMaterial(materials)
  //new THREE.MeshBasicMaterial({ map : curr_tex, color : basic_color})
  $('#curr_func').css('background-color','red')
  // last_select.color.setHex(0xffffff);                         // set color to white
  // last_select.map = texture;                                  // change the texture of the last selected object..
  // last_select.map.needsUpdate = true                          // update the texture
  // listorig[LAST_SELECTED.name].tex_addr = tex_addr            // save the new texture address..
  // listorig[LAST_SELECTED.name].tex = tex            // save the new texture address..
  // listorig[LAST_SELECTED.name].multiple_tex = true
  $('#curr_func').css('background-color','blue')

  make_cube('xxxxx',listorig[LAST_SELECTED.name].position,listorig[LAST_SELECTED.name].rotation,texture)

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
          successmultiple: function(file, response) {

                var dir_tex = file.fullPath.split('/')[0]
                $('#curr_func').text('queuecomplete')
                change_multiple_texture_with_dropped_ones(dir_tex)

           },
          success: function(file, response) {

           },
          sending: function(file, xhr, data){

              if(file.fullPath){                                  // case of a folder
                  data.append("fullPath", file.fullPath);

              }

              else{                                      // case of a file
                  data.append("name", file.name);
                  change_texture_with_dropped_one(file.name)
                  $('#curr_func').css('background-color','green')
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
