/*

Different actions on the scene

*/

function position_panel_under_icon(name_obj, class_obj){

      /*
      Places the panel just under its menu icon (without overflowing the screen)
      and sets the horizontal position of the arrow (CSS variable --caret-left).
      */

      var $icon = $(name_obj), $panel = $(class_obj)
      var r = $icon[0].getBoundingClientRect()
      var iconCenter = r.left + r.width/2
      var panelW = $panel.outerWidth()
      var winW = $(window).width()
      // Icon on the right of the screen (e.g. Help "?") -> open the panel leftward with the caret at
      // the FAR RIGHT, under the icon. Otherwise open it just left of the icon (caret near the left).
      var rightSide = iconCenter > winW * 0.6
      var left = rightSide ? Math.round(iconCenter - panelW + 15) : Math.round(iconCenter - 30)
      if (left + panelW > winW - 6){ left = winW - panelW - 6 }   // no overflow on the right
      if (left < 6){ left = 6 }
      $panel.css({ left: left + 'px', right: 'auto' })
      var caret = Math.round(iconCenter - left - 9)               // 9 ~ half-base of the triangle
      caret = Math.max(12, Math.min(panelW - 24, caret))
      $panel[0].style.setProperty('--caret-left', caret + 'px')

}

function generic_action_panel(name_obj, class_obj){

      /*
      Typical actions
      */

      $(name_obj).click(function(){                            // click on the icon: open THIS panel, close the others
            var was_visible = $(class_obj).is(':visible')
            for (var k in list_panels){ $('.panel_' + list_panels[k]).hide() }  // close all menu panels
            if (!was_visible){
                  $(class_obj).show()                          // toggle: reopen this one if it was closed
                  position_panel_under_icon(name_obj, class_obj)  // under the icon + arrow
            }
      })
      $(name_obj).hover(function(){ controls.enabled = false }) // deactivate the controls when mouse is hover..
      // no more auto-hiding on exit: we only manage the camera controls
      $(class_obj).hover(
            function(){ controls.enabled = false },   // entering the panel: no camera rotation
            function(){ controls.enabled = true }     // exit: we re-enable the controls
      )

      // small close cross at the top right of the panel
      var $close = $('<div class="panel_close" title="Fermer"></div>').html('&times;')
      $close.on('click', function(){ $(class_obj).hide() })
      $(class_obj).append($close)

}

function mouseleave_hide_panel(class_panel){
      $(class_panel).mouseleave(function(){ $(class_panel).hide() }) // Hide when leaving the panel
}

function block_obj(obj){

      /*
      Block
      */

      $('#block_pos').text('block')
      var objname = dic_sphere_blocked[obj.name]
      scene.remove( objname )
      delete(objname)

}

function unblock_obj(obj){

      /*
      Unblock
      */

      $('#block_pos').text('unblock')
      sphblk = sphere_blocked(obj.position)
      dic_sphere_blocked[obj.name] = sphblk;

}

function show_block_unblock(){

      /*
      Value button block, unblock
      */

      if (LAST_SELECTED.blocked){ $('#block_pos').text('unblock') }
      else{ $('#block_pos').text('block') }

}

function actions_with_block_unblock(obj){

      /*
      Block or unblock the objects
      */

      if (LAST_SELECTED.blocked){ unblock_obj(obj) }
      else{ block_obj(obj) }

}

//------------------------   dicths, panels

dicths = {}
list_panels = ['objects', 'scene', 'tools', 'interaction', 'help']   // 'views' removed: 3D arrows via the V key

function one_element_dicths(name_panel){
    dicths[name_panel] = function(){ generic_action_panel("#" + name_panel, '.panel_' + name_panel) }}
for (var i in list_panels){ one_element_dicths(list_panels[i]) } // make_dicths

// Cap the Help tab content so its bottom never spills past the panel background ("into the void"):
// max-height = distance from the visible tab's top to the panel bottom, minus a small margin.
function size_help_tabs(){
      var panel = document.querySelector('.panel_help')
      if (!panel || !$(panel).is(':visible')){ return }
      var tabs = panel.querySelectorAll('.dyn_tab'), vis = null
      for (var i=0;i<tabs.length;i++){ if (tabs[i].offsetParent !== null){ vis = tabs[i]; break } }
      if (!vis){ return }
      var mh = Math.max(80, Math.round(panel.getBoundingClientRect().bottom - vis.getBoundingClientRect().top - 14))
      $('.panel_help .dyn_tab').css('max-height', mh + 'px')
}
// Delegated on document: robust whatever the load order (a direct $('#help') binding can miss if
// the navbar isn't in the DOM yet when this script runs -> size_help_tabs never fired on open).
$(document).on('click', '#help', function(){ setTimeout(size_help_tabs, 0) })                      // when the Help panel opens
$(document).on('click', '.panel_help .dyn_tab_btn', function(){ setTimeout(size_help_tabs, 0) })   // when switching Help tabs

// On window resize, re-align each OPEN panel (and its ▲ caret) under its navbar icon: the icons
// use relative positions (e.g. Help at 90%) and move, while the panels were placed once in px.
$(window).on('resize', function(){
      for (var k in list_panels){
            var nm = list_panels[k]
            if ($('.panel_' + nm).is(':visible')){ position_panel_under_icon('#' + nm, '.panel_' + nm) }
      }
      size_help_tabs()
})


//------------------------

function hide_show_keys(){

      /*
      Keyboard shortcuts panel: clean card, sections, keys in <kbd>.
      */

      var groups = [
            { title:'Create', rows:[
                  {k:['o'], d:'sphere (ball)'},        {k:['e'], d:'chain (balls + springs)'},
                  {k:['n'], d:'wall (2 clicks: start, end)'},  {k:['w'], d:'box (reflecting walls)'},
                  {k:['m'], d:'textured cube'},        {k:['l'], d:'simple cube'},
                  {k:['t'], d:'track'},                {k:['u'], d:'link two objects (spring)'},
                  {k:['b'], d:'no tool / cancel'} ]},
            { title:'Edit', rows:[
                  {k:['Ctrl','C'], d:'copy'}, {k:['Ctrl','V'], d:'paste'},
                  {k:['d'], d:'delete'},  {k:['r'], d:'rotate'},
                  {k:['h'], d:'horizontal plane'}, {k:['i'], d:'object info'},
                  {k:['↑'], d:'move up'}, {k:['↓'], d:'move down'} ]},
            { title:'Select', rows:[
                  {k:['s'], d:'select an area'}, {k:['p'], d:'pick several objects'},
                  {k:['g'], d:'move a group'} ]},
            { title:'Animation', rows:[
                  {k:['x'], d:'start / pause / resume'} ]},
            { title:'View', rows:[
                  {k:['k'], d:'set camera view (drag: A → look-at)'},
                  {k:['V'], d:'show / hide view arrows'},
                  {k:['Ctrl','K'], d:'show / hide this shortcuts card'} ]},
            { title:'History', rows:[
                  {k:['Ctrl','Z'], d:'undo'}, {k:['Ctrl','Y'], d:'redo'} ]},
            { title:'Mouse', rows:[
                  {k:['right-click'], d:'green object → edit attributes'},
                  {k:['right-click'], d:'elastic → edit stiffness'} ]}
      ]

      var inner = '<div class="pk_grid">'
      for (var g in groups){
            inner += '<div class="pk_section"><h3>' + groups[g].title + '</h3>'
            for (var r in groups[g].rows){
                  var row = groups[g].rows[r], kb = []
                  for (var i in row.k){ kb.push('<kbd class="pk">' + row.k[i] + '</kbd>') }
                  inner += '<div class="pk_row"><span class="pk_desc">' + row.d + '</span>'
                       +  '<span class="pk_keys">' + kb.join('<span class="pk_plus">+</span>') + '</span></div>'
            }
            inner += '</div>'
      }
      inner += '</div>'

      // Same content in two places: the Help panel "Keys" tab (no title, no wasted space) and the
      // floating Ctrl+K card (which keeps a title as it has no other header).
      $('#help_keys_content').html(inner)
      $('.panel_keys').html('<span class="pk_close" title="close">&times;</span><h2>Keyboard shortcuts</h2>' + inner)
      $('.panel_keys').on('click', '.pk_close', function(){ $('.panel_keys').hide() })

}

function camera_pos_orient(s0,s1,altit){

      /*
      newview parameters
      */

      camera.position.set(s0.x, s0.y, s0.z + altit); // Set position like this
      camera.up = new THREE.Vector3(0,0,1);
      controls.target = new THREE.Vector3(s1.x, s1.y, s1.z + altit);

}

function set_new_view(x, y, altit){

      /*
      Setting the view
      */

      var target = {'x':0,'y':0,'z':0}
      var pos = {'x':x,'y':y,'z':altit}
      camera_pos_orient( pos, target , altit )

}

function apply_view(name){                  // applies a view preset (used by the 3D arrows of the Views panel)

      var altit_high = 2000, altit_low = 200
      if (name === 'above_view'){ set_new_view(0, 0, altit_high) }
      else if (name === 'front_view'){ set_new_view(0, -2000, altit_low) }
      else if (name === 'back_view'){ set_new_view(0, 2000, altit_low) }
      else if (name === 'left_view'){ set_new_view(-2000, 0, altit_low) }
      else if (name === 'right_view'){ set_new_view(2000, 0, altit_low) }

}

$(document).ready(function(){

      /*
      Change the views
      */

      altit_high = 2000
      altit_low = 200

      $('#above_view').click(function(){ set_new_view(0,0,altit_high)})
      $('#front_view').click(function(){ set_new_view(0,-2000,altit_low)})
      $('#back_view').click(function(){ set_new_view(0,2000,altit_low)})
      $('#left_view').click(function(){ set_new_view(-2000,0,altit_low)})
      $('#right_view').click(function(){ set_new_view(2000,0,altit_low)})

  })// end ready

function block_pos_object(){

      /*
      block/unblock
      */

      $('#block_pos').click(function(){     // block the movement of the object..

            for (i in objects){
                if (objects[i].name == $('#name_panel').text()){
                   objects[i].blocked = ! objects[i].blocked;
                   actions_with_block_unblock(objects[i])
                } // end if
            } // end for
      }) // end block_pos.click

}
//

function change_orientation(i){

      /*
      Modify orientation for rebounce
      */

      objects[i].orientation.x = Math.cos(objects[i].rotation.z)
      objects[i].orientation.y = Math.sin(objects[i].rotation.z)

}

function save_params_panel_object(){

    /*
    Save the params of the class .panel
    */

    $('#save_param').click(function(){
        $('.panel').css({'top':"10px","left":"-300px"})            // close panel about object infos when mouse leaves..

        for (i in objects){
            if (objects[i].name == $('#name_panel').text()){
               objects[i].rotation.z = parseFloat($('#angle_panel').val())            // angle
               objects[i].material.opacity = parseFloat($('#alpha_panel').val())      // opacity
               objects[i].material.needsUpdate = true;                    // refreshing
               objects[i].mass = parseFloat($('#mass_panel').val())            // mass
               // dimensions (walls, cubes, slabs...): the fields were displayed but ignored until now
               if (typeof set_parallelepiped_dims === 'function' && objects[i].width !== undefined){
                  set_parallelepiped_dims(objects[i], { width : parseFloat($('#width_panel').val()),
                                                        height : parseFloat($('#height_panel').val()),
                                                        thickness : parseFloat($('#thickness_panel').val()) })
               }
               // change the orientation
               if (objects[i].type == 'wall_box'){
                  change_orientation(i)
               }
               //alert(objects[i].name + ' has orientation x ' + objects[i].orientation.x)
            } // end if
        } // end for
        controls.enabled = true;
    }) // end click

}

function init_interf_actions(){

      /*
      Define the actions in the interface..
      */

      hide_show_keys()        //---------------------- Keys
      dicths.objects()        //---------------------- Objects..
      dicths.scene()          //---------------------- scene
      dicths.tools()          //---------------------- scene
      dicths.interaction()    //---------------------- Interaction (physics)
      dicths.help()           //---------------------- Help

      // Actions

      block_pos_object()     //-------------------- Block
      save_params_panel_object()  //--------- Save Parameters

      //---------------------- Dropzone for textures

      manage_drop()  // manage the Dropzone

      //---------------------- Tooltips of the menu icons

      $('[data-toggle="tooltip"]').not('#scene').tooltip({ container: 'body', placement: 'bottom' })
      $('#scene').tooltip({ container: 'body', placement: 'right' })   // leftmost icon: tooltip to the RIGHT (arrow on the left), not clipped

      //---------------------- Click on the tool name (navbar) -> no tool

      $('#active_obj_navbar').click(function(){
            reinit_params_ok()                              // disables all tools
            $('#active_obj_navbar').text('')
            $('#curr_tool').text('')
            $('#obj_icon_grid .obj-icon').removeClass('active')   // clear the Object panel icon highlight
      })

 }
