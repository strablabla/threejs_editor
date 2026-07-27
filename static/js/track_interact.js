/*

Make track

*/

function find_orientation_firstmark_mouse() {

      /*
      Main orientation
      */

      var beg = list_marks_track.slice(-2,-1)[0]
      var mouse = mousepos()
      //--------------
      var dx = Math.abs(beg.position.x - mouse.x);
      var dy = Math.abs(beg.position.y - mouse.y);
      var dz = Math.abs(beg.position.z - mouse.z);
      dic_dist = { 'x' : dx, 'y' : dy, 'z' : dz }
      var max_val = Math.max(dx, dy, dz)

      var key = Object.keys(dic_dist).filter(function(key) {return dic_dist[key] === max_val})[0];

      return key

}

function dir_coord_blocked_track(){

      /*
      dir coord..
      */

      var end = list_marks_track.slice(-2,-1)[0]
      dir_track_blocked = anti_dic[find_orientation_firstmark_mouse()]
      coord_track_blocked = end.position[dir_track_blocked]  // blocked the position

      return [dir_track_blocked, coord_track_blocked]

}

function track_in_mouse_moving(){

      /*
      Action when selected and moving
      */

      var [dir_track_blocked, coord_track_blocked] = dir_coord_blocked_track()
      SELECTED.position[dir_track_blocked] = coord_track_blocked; //coord_track_blocked

}

function width_length_with_orientation(beg,end){

      /*
      width and length according to the orientation
      */

      var orientation_track = find_orientation_marks(beg,end)
      // dir_track_blocked = orientation_track
      // coord_track_blocked = end.position[dir_track_blocked]  // blocked the position

      //----------- dimensions

      //var track_length = getDistance(beg,end)
      var width = getDistance(beg,end)
      if ( orientation_track == 'x' ){
          var rot = Math.PI/2
      }else{
          var rot = 0
      }

      return [width,rot]
}

function params_for_track(){

      /*
      Oriented track
      */

      var [beg,end] = list_marks_track.slice(-2)
      //--------- dim
      var [width,rot] = width_length_with_orientation(beg,end)
      var dim = { width : width, height : track_height, thickness : track_width}
      //--------- r
      var r = {'x': 0, 'y':0, 'z':rot}
      //--------- p
      var [mx,my,mz] = getMiddle(beg,end)
      var p = {'x': mx, 'y':my, 'z':mz}

      return [p,r,dim]

}

function make_oriented_track(){

      /*
      Oriented track
      */

      var [p,r,dim] = params_for_track()
      mat_track = new THREE.MeshBasicMaterial( { color : color_track_blue } )
      var [newname, interptsub] = random_name_mousepos()
      var track = simple_parallelepiped(newname, p, r, mat_track, dim, "wall_box")
      track.is_track = true                     // tells a track segment from an ordinary box wall
      track.orientation = new THREE.Vector3(1,0,0)   // (both are 'wall_box' for the physics)
      var axis = new THREE.Vector3( 0, 0, 1 );
      track.orientation.applyAxisAngle( axis, r.z );
      set_track_solid(track, true)              // solid by default: the balls bounce off the track

}

function set_track_solid(seg, on){

      /*
      Solid segment or not — read by is_solid_track, which puts it in the sphere-BOX bounce
      (bounce_balls_on_cubes): a real box, so the height of the slab counts.

      The segment must be kept OUT of list_moving_objects. That list is what makes the walls of a
      box bounce, as infinite vertical planes — a track sitting in it used to block every ball
      whatever its altitude. Note that load_wall_box pushes EVERY wall_box, hence the removal
      here rather than a simple "don't add": a track drawn in this session was crossed while the
      same track reloaded from disk was an infinite wall.
      */

      if (!seg){ return }
      seg.track_solid = !!on
      seg.blocked = true                        // a track never moves under gravity, solid or not
      var k = list_moving_objects.indexOf(seg)
      if (k >= 0){ list_moving_objects.splice(k, 1) }

}

function is_track_segment(o){

      /*
      A track slab. 'is_track' is written at creation; a scene drawn before that flag existed is
      recognised by shape instead: a 'wall_box' belonging to no box is necessarily a track segment
      (the walls of a box always carry a box_id, cf. wall_for_box).
      */

      return !!o && (o.is_track === true || (o.type === 'wall_box' && o.box_id === undefined))

}

function track_objects(){                       // every track segment present in the scene ("all" in the context menu)

      var a = []
      for (var i in objects){ if (is_track_segment(objects[i]) && !objects[i].del){ a.push(objects[i]) } }
      return a

}

function find_orientation_marks(mesh1, mesh2) {

      /*
      Main orientation
      */

      var dx = Math.abs(mesh1.position.x - mesh2.position.x);
      var dy = Math.abs(mesh1.position.y - mesh2.position.y);
      var dz = Math.abs(mesh1.position.z - mesh2.position.z);
      dic_dist = { 'x' : dx, 'y' : dy, 'z' : dz }
      var max_val = Math.max(dx, dy, dz)
      var key = Object.keys(dic_dist).filter(function(key) {return dic_dist[key] === max_val})[0];

      return key

}


function remove_track_mark(mark){

      /*
      Definitively removes a laying mark. They are also referenced by selpos, list_sel_corners
      and objects (cf. corner() and make_mark), so a plain scene.remove() used to leave invisible
      ghosts behind — still pickable by the raycaster, and still counted as "an area being
      defined" (selpos), which kept the next selected object glued to the mouse.
      */

      if (!mark){ return }
      scene.remove(mark)
      if (mark.geometry && mark.geometry.dispose){ mark.geometry.dispose() }
      var lists = [ selpos, list_sel_corners, objects ]
      for (var i = 0; i < lists.length; i++){
            var k = lists[i].indexOf(mark)
            if (k >= 0){ lists[i].splice(k, 1) }
      }
      if (last_mark_track === mark){ last_mark_track = null }
      if (SELECTED === mark){ SELECTED = null }

}

function end_track(){

      /*
      End of a track: the marks still standing are removed and the state is reset. Without
      this, list_marks_track kept growing from one track to the next, and the first segment
      of a new track was drawn from the last point of the PREVIOUS one.
      */

      while (list_marks_track.length){ remove_track_mark( list_marks_track.pop() ) }
      last_mark_track = null
      SELECTED = null
      controls.enabled = true
      limits_and_action_reinit_var()             // selpos = [], select usable again

}

function make_marks_and_track(){

      /*
      Marks laid down by the mouse. Only TWO are alive at a time: the anchor (start of the
      segment being drawn) and the one that follows the mouse. As soon as a segment has been
      turned into a slab its anchor is removed — the slab itself shows the path, the marks
      were only guides.
      */

      if (!list_marks_track.length){
            list_marks_track.push( corner(color_mark_quite_red) )   // very first click: start of the track
      } else {
            remove_track_mark( list_marks_track.shift() )           // previous anchor, now covered by its slab
      }
      var mark = corner(color_track_green)                          // follows the mouse until the next click
      list_marks_track.push(mark)
      SELECTED = mark
      controls.enabled = false
      last_mark_track = mark

}
