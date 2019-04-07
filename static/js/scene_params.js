/*

Scene parameters

*/

var container, stats;
var camera, controls, scene, projector, renderer;
var objects = [], plane;
new_wall_ok = false;  		    	// create a new wall with the mouse
new_simple_cube_ok = false;  		// create a new simple_cube with the mouse
new_cube_texture_ok = false
new_pavement_ok = false;
select_obj = false;             // select multiple objects.
make_plane = false;             // make a plane
selpos = [];
select_poscam = false; 			    // change camera position with mouse
list_obj_inside = [];  					// list of the objects inside the area..
select_picking = false;         // picking the object fr future action..
infos_in_place = false;
select_obj_infos = false;
select_move_group = false;
select_make_track = false;
select_traj = false;   							// object trajectory..
dic_sphere_blocked = {}							// dict of the sphere indicating the element is blocked..
dict_pos_relat = {}
list_dotted_area = []
list_marks_track = []
size_elem_dotted_line = 15					// size of each element of the dotted line delimiting the selection area
step_up_down = 10;   								// vertical step when moving an object up or down
nearest_elem = null;
orientation_track = 'x'
last_mark_track = null
var track_width = 40
coord_track_blocked = null
dir_track_blocked = null
perpendicular_track = true
anti_dic = {'x':'y','y':'x'}

//------------------- Colors

var pale_blue0 = 0xccf5ff;
var orange_medium = 0xffddcc;
color_dotted_line_black = 0x000000;
//basic_color_pale_yellow = 0xffffcc;  											// white color by default...
color_basic_default_pale_grey = 0xf2f2f2
color_near_object_yellow = 0xffff66;
color_intersected_green = 0x66ff33;
color_object_inside_pink = 0xffcccc;
color_clone_pale_blue = 0xcceeff;
color_mark_pale_rose = 0xffcccc;
color_mark_quite_red = 0xff1a1a;
color_mark_quite_grey = 0xa6a6a6;
color_group_medium_blue = 0x99ccff;
color_track_green = 0x99ff99;
color_track_blue = 0xcceeff;

//------------------------ Textures

basic_tex_addr = "static/upload/Blank.jpg";  	// default texture
basic_multiple_tex_addr = "static/upload/face_color";  	// default texture
default_texture = 'face_color';
