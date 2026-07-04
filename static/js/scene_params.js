/*

Scene parameters

*/

//---------------- Basic objects

new_wall_ok = false;  		    	// create a new wall with the mouse
new_cube_ok = false;  		// create a new simple_cube with the mouse
new_cube_texture_ok = false
new_pavement_ok = false;
new_plane_ok = false;             // make a plane
new_sphere_ok = false;          // make a sphere
new_box_ok = false              // box
new_no_tool_ok = false           // no tool, option to deactivate tools
new_track_ok = false
new_string_ok = false           // string
//dict_obj_param = {}

function reinit_params_ok(){

      /*
      Reinitialize the variables for the object creation.
      */

      for(key in window) { if (key.match('^(new_)\\w*_ok')){
        window[key] = false
      }
    } // end for

}

//---------------------- Camera

select_poscam = false; 			    // change camera position with mouse

//---------------------- Infos

infos_in_place = false;
show_obj_infos_ok = false;       // infos about the selected object..

//---------------------- Group

select_move_group = false;      // move entire group..
dict_pos_relat = {}

//----------------------  Miscellaneous

select_traj = false;   							// object trajectory..
dic_sphere_blocked = {}							// dict of the sphere indicating the element is blocked..

//----------------------  Movement and interactions

scene_animation_ok = false   // l'animation ne démarre qu'à l'appui sur 'a' (ou voix « animation »)
gravity_ok = true            // gravité verticale (z) activable depuis le panneau Interaction
springs_ok = true            // forces de ressort (chaînes/élastiques)
step_up_down = 10;   								// vertical step when moving an object up or down
list_moving_objects = []
random_initial_speed = true   // true = vitesse de départ aléatoire (symétrique) ; false = départ à 0
random_speed_module = 50;     // intensité de la vitesse de départ (curseur dans le panneau Interaction)
random_speed_z = false        // true = ajoute une composante z aléatoire (comme vx et vy) ; false = vitesse dans le plan x-y
list_paired_harmonic = []
list_interm_pair = []
paire_harmonic = false
harmonic_const = 0.06     // raideur du ressort (k/m) — intégrée en Verlet (force = k·déplacement)
dist_inter_wall_obj = 50
dist_min_center_center = 40;   // distance under which a shock is produced..
lenght_spring = 150;   // longueur au repos des ressorts (> diamètre des boules) : évite le repliement de la chaîne
one_over_r2 = true
attract_strength_one_over_r2 = 50000;  // G (gravité newtonienne F = G·m_i·m_j/r²) — à ajuster via le panneau Interaction

//-------------------- Energies

elast_energy = 0    // elastic
kin_energy = 0      // kinetic
grav_energy = 0     // gravity (uniforme en z + newtonienne)
attract_energy = 0  // énergie potentielle de gravité newtonienne (paires)
tot_energy = 0      // total
show_energy_graph = false   // affichage du graphe temporel d'énergie (panneau Tools)
show_velocity_hist = false  // affichage de l'histogramme des normes de vitesse (panneau Tools)

//------------

max_kin = 0       // maximum of kinetic energy
max_elast = 0     // maximum of elastic energy

//--------------

nearest_elem = null;
yellow_obj = null;      // objet actuellement colorié en jaune (surbrillance "plus proche")
radius_spring = 40;     // spring radius
radius_elastic = 20;    // elastic radius
list_forbid_obj_for_interact = ['spring', 'elastic', 'pawn'] // list of non interacting types..

//---------------------- Selection

selpos = [];
select_picking = false;         // picking the object fr future action..
new_select_ok = false;             // select multiple objects.
list_dotted_area = []
size_elem_dotted_line = 15					// size of each element of the dotted line delimiting the selection area
list_obj_inside = [];  					// list of the objects inside the area

//---------------------- Track

list_marks_track = []
orientation_track = 'x'  // orientation by default
last_mark_track = null
var track_width = 40
coord_track_blocked = null
dir_track_blocked = null
perpendicular_track = true
anti_dic = {'x':'y','y':'x'}        // return perpendicular direction ..

//----------------------- String

list_string = []

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
color_no_interaction_pink = 0xffcccc;
color_harmonic_pairs_pale_blue = 0xcceeff;

//------------------------ Textures

basic_tex_addr = "static/upload/Blank.jpg";  	// default texture
basic_multiple_tex_addr = "static/upload/face_color";  	// default texture
default_texture = 'face_color';
