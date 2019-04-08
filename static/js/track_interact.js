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

      var track_length = getDistance(beg,end)
      if ( orientation_track == 'x' ){
          var width = track_width
          var thickness = track_length
      }else{
          var width = track_length
          var thickness = track_width
      }

      return [width,thickness]
}

function params_for_track(){

      /*
      Oriented track
      */

      var [beg,end] = list_marks_track.slice(-2)
      //--------- dim
      var [width,thickness] = width_length_with_orientation(beg,end)
      var dim = { width : width, height : 5, thickness : thickness}
      //--------- r
      var r = {'x': 0, 'y':0, 'z':0}
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
      var track = simple_parallelepiped(newname, p, r, mat_track, dim, "track")

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


function save_plot_track(corner0,corner1){

      /*
      Save the plots used for the track..
      */

      if ( list_marks_track.length == 0 ){
          list_marks_track.push(corner0)
          list_marks_track.push(corner1)
      }else{ list_marks_track.push(corner1) }

}

function make_marks_and_track(){

      /*
      Graphical limits moved with the mouse..
      */

      col = color_corner()
      var corner0 = corner(color_mark_quite_red)
      if (list_marks_track.length > 1){scene.remove(corner0)}

      var corner1 = corner(color_track_green)
      save_plot_track(corner0,corner1)
      SELECTED = corner1
      controls.enabled = false
      last_mark_track = corner1

}
