
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
             $("#dropz").hide()                                              // hidding dropzone when files are dropped
             var newpath = file.fullPath.match(/^.+\/\d{1,2}/)[0]            // name has to contain 1 or 2 decimals
             var newfullpath = file.fullPath.match(/^.+\/\d{1,2}.+/)[0]      // name has to contain 1 or 2 decimals
             var newpath_id = newpath.replace('\/','-')
             var newfullpath_id = newfullpath.replace('\/','-')
             var basename = newfullpath_id.split('-')[0]
             // alert(newfullpath)
             if (list_addr.indexOf(newpath) == -1){                          // if not registered yet. 
                var find_pdata = newpath.match(/pdata/g)                     // search for pdata
                  if (!find_pdata){                                          // if there is not pdata
                    currentpath = newpath_id
                    $('.listfiles').append($("<li>")
                                   .attr('id', newpath_id)
                                   .text(newpath + "....")                   // folder name
                                   .append($('<input/>')
                                      .addClass('check')
                                      .attr('id', 'box_' + newpath_id)
                                      .attr('type', "checkbox").css({'left':'280px', 'top':'-10px'}))  // checkbox
                                   .append($('<span>').text('+').attr('id', 'show' + newpath_id))      // toggle list of files
                                   .append($("<ul>").attr('id', 'ul' + newpath_id ).hide())
                                   );  // add path to list
                    $('#show' + newpath_id).click(function(){
                            $(this).next().toggle()
                          })
                    list_addr.push(newpath)                 // registering the path
                   }                                        // end !find_pdata
                 }                                          // end if in registered list of paths
              else {
                 $('#'+'ul'+ currentpath ).append($("<li>").text(newfullpath));
                 var currpath = $('#' + currentpath )
                 if (newfullpath.match(/vclist/g)){currpath.css({'color':'#ff9999'})}             // case T2T2
                 else if (newfullpath.match(/vdlist/g)){currpath.css({'color':'#99ccff'})}        // case T1T2
                 else if (newfullpath.match(/difflist/g)){currpath.css({'color':'#85e085'})}      // case DT2
                }
           },
          sending: function(file, xhr, data){
              data.append("fullPath", file.fullPath);
              $('.dz-preview').remove()                       // remove the Thumbnails
              // File upload Progress
          },
          totaluploadprogress: function(progress) {
                  console.log("############ progress ", progress);
             }
      }; // end Dropzone.options.dropz
}