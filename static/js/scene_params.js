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
// Camera positioning by drag (key k): A on click, arrow + dotted line toward the mouse until release
poscam_dragging = false             // a positioning drag is in progress
poscam_A = null                     // point A (future camera position), Vector3 on the ground plane
poscam_marker = null                // visual marker of A
poscam_arrow = null                 // THREE.ArrowHelper oriented from A toward the mouse
poscam_line = null                  // dotted line A -> mouse

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

scene_animation_ok = false   // the animation only starts when pressing 'a' (or voice « animation »)
gravity_ok = true            // vertical gravity (z) toggleable from the Interaction panel
springs_ok = true            // spring forces (chains/elastics)
step_up_down = 10;   								// vertical step when moving an object up or down
list_moving_objects = []
random_initial_speed = true   // true = random initial velocity (symmetric); false = start at 0
random_speed_module = 50;     // magnitude of the initial velocity (slider in the Interaction panel)
random_speed_z = false        // true = adds a random z component (like vx and vy); false = velocity in the x-y plane
list_paired_harmonic = []
list_interm_pair = []
paire_harmonic = false
harmonic_const = 0.06     // spring stiffness (k/m) — integrated with Verlet (force = k·displacement)
dist_inter_wall_obj = 50
dist_min_center_center = 40;   // distance under which a shock is produced..
lenght_spring = 150;   // rest length of the springs (> ball diameter): avoids the chain folding back
one_over_r2 = true
attract_strength_one_over_r2 = 50000;  // G (Newtonian gravity F = G·m_i·m_j/r²) — to adjust via the Interaction panel
attract_softening = 40;                // ε: Plummer softening F = G·m·m/(r²+ε²) — removes the 1/r² singularity (energy conservation)
use_cell_lists = false                 // short-range collisions in O(n) (spatial grid) instead of the O(n²) double loop — physically identical result
use_barnes_hut = false                 // 1/r² attraction approximated by octree in O(n log n) instead of O(n²) — APPROXIMATION (see barnes_hut_theta)
barnes_hut_theta = 0.5                  // Barnes-Hut opening threshold: 0 = exact (slow), larger = faster but more approximate (~0.5 usual)

//-------------------- Energies

elast_energy = 0    // elastic
kin_energy = 0      // kinetic
grav_energy = 0     // gravity (uniform in z + Newtonian)
attract_energy = 0  // Newtonian gravity potential energy (pairs)
tot_energy = 0      // total
show_energy_graph = false   // display of the energy time graph (Tools panel)
show_velocity_hist = false  // display of the velocity magnitude histogram (Tools panel)
show_trajectories = false   // display of the trajectories + MSD window (Monitoring)
traj_show = { xy:true, z:false, msd:true }   // plots visible in the trajectories window (independent toggles -> all combinations)
z_means_only = false        // z(t): show only the means ⟨z⟩ (hides the z(t) curves)
show_altitude_hist = false  // display of the number-of-particles vs altitude histogram (Monitoring)
show_report = false         // display of the « Compte rendu » window (Monitoring) — editor + graph snapshots
show_speeds = false         // 3D velocity arrows on each moving object (Initial speeds tab)
alt_color_filter = 'all'    // altitude histogram: 'all' or '#rrggbb' — only counts objects of this color
                            // (the trajectory color checkboxes have no own state: they reflect
                            //  directly obj.track_trajectory, cf. refresh_traj_color_filters)
traj_colors_open = true     // trajectories: expandable list of colors to track — expanded or collapsed
sim_time = 0                // elapsed simulation time (a.u.) since the last trajectories reset; freezes on pause

//---------------------- Movement in a vertical plane (double-click on an object)

vdrag_obj = null            // object in vertical plane mode (null = inactive mode)
vdrag_plane = null          // vertical plane: visual marker AND mouse projection support
vdrag_dragging = false      // a drag is in progress
vdrag_pos0 = null           // object position at the moment of grab (Vector3)
vdrag_hit0 = null           // anchor point on the plane (Vector3) — relative drag: no jump on click

//------------

max_kin = 0       // maximum of kinetic energy
max_elast = 0     // maximum of elastic energy

//--------------

nearest_elem = null;
yellow_obj = null;      // object currently colored yellow ("nearest" highlight)
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
box_id_counter = 0                          // unique identifier per box (groups its 4 walls)
list_lids = []                              // active lids: { box_id, mesh, bounds:{xmin,xmax,ymin,ymax}, z }
dragging_box = false                        // dragging a "movable" box in progress
box_drag_parts = []                         // walls + lid moved as a block
box_drag_orig = []                          // their positions at the moment of grab
box_drag_anchor = {x:0, y:0}                // point of the plane at the moment of grab (relative drag)
box_drag_sel = false                        // dragging a persistent group: the selection area (dotted line+corners) follows
box_drag_dotted_orig = []                    // original positions of the dotted line during the drag
box_drag_corners_orig = []                   // original positions of the black corners during the drag
group_id_counter = 0                         // persistent group identifier (mouse block move)
group_highlighted = {}                       // { group_id: bool } — violet coloring of the group enabled or not
dotted_relat = []                            // offsets of the dotted line relative to SELECTED (follow the group)
list_sel_corners = []                        // black marks at the corners of the area (removed on Ctrl+S)
corners_relat = []                           // offsets of the corners relative to SELECTED (follow the group)

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
color_sphere_default = 0xffcccc;    // default color of the balls at creation (pink)
color_clone_pale_blue = 0xcceeff;
color_mark_pale_rose = 0xffcccc;
color_mark_quite_red = 0xff1a1a;
color_mark_quite_grey = 0xa6a6a6;
color_group_medium_blue = 0x99ccff;
color_group_persistent_violet = 0xcc99ff;   // PERSISTENT group (Ctrl+Shift+G) — distinct from the temporary blue
color_track_green = 0x99ff99;
color_track_blue = 0xcceeff;
color_no_interaction_pink = 0xffcccc;
color_harmonic_pairs_pale_blue = 0xcceeff;

//------------------------ Textures

basic_tex_addr = "static/upload/Blank.jpg";  	// default texture
basic_multiple_tex_addr = "static/upload/face_color";  	// default texture
default_texture = 'face_color';
