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
      if (typeof wall_preview_clear === 'function'){ wall_preview_clear() }   // no leftover dashed line
      if (typeof ending_track === 'function'){ ending_track() }   // leaving the track tool via the panel ends the track too

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
//-------------------- Walls (key n: drawn from a start point to an end point)
wall_height_default = 300      // vertical extent of a new wall (adjustable afterwards: right click)
wall_thickness_default = 5     // thickness of a new wall
wall_length_default = 150      // length used when the 2 ends coincide (click without dragging)
wall_min_length = 20           // below this, the 2 clicks are considered to be at the same place
dist_min_center_center = 40;   // distance under which a shock is produced..
lenght_spring = 150;   // DEFAULT rest length of the springs (> ball diameter): avoids the chain folding back
                       // a pair may carry its own 'rest_length', which wins (see accel_spring)
//-------------------- Tissue (complex object: grid of balls linked by springs)
new_tissue_ok = false  // creation tool, like the other new_*_ok (reinit_params_ok sweeps them)
tissue_nw = 6          // balls across the width, at creation
tissue_nl = 6          // balls along the length, at creation
tissue_k  = harmonic_const   // stiffness of a new tissue's springs (same scale as harmonic_const)
tissue_l0 = lenght_spring    // equilibrium distance between two neighbouring balls
tissue_next_id = 1     // identifies a tissue: every ball of the same mesh shares it
//-------------------- Bubble (complex object: closed spherical shell + internal gas)
new_bubble_ok = false  // creation tool, like the other new_*_ok
bubble_level = 2       // icosphere subdivisions: 0/1/2/3 -> 12/42/162/642 balls
bubble_R = 300         // radius at creation
bubble_k = harmonic_const      // stiffness of the surface springs
bubble_kb = harmonic_const/6   // bending stiffness (soft, as for the tissue)
bubble_P = 0.5         // pressure, DIMENSIONLESS. The force a face carries grows as R², the
                       // spring pull only as R, so a raw pressure would behave completely
                       // differently at another radius. The actual coefficient is P·k/R, which
                       // measurement shows keeps the same inflation (~1.09) from R=150 to 600
                       // and from mesh level 1 to 3. The gas is isothermal, P0·V0/V: the shell
                       // resists more as it is squeezed and settles by itself. 0 = no gas.
bubble_next_id = 1
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
traj_show = { xy:true, z:false, msd:true, v:false }   // plots visible in the trajectories window (independent toggles -> all combinations) ; v = |velocity|(t)
z_means_only = false        // z(t): show only the means ⟨z⟩ (hides the z(t) curves)
traj_color_sort = 'color'   // « suivre par couleur » listing: 'color' (compact grid) | 'mass' | 'v0' (one color per line, sorted, value shown)
show_altitude_hist = false  // display of the number-of-particles vs altitude histogram (Monitoring)
show_report = false         // display of the « Compte rendu » window (Monitoring) — editor + graph snapshots
show_speeds = false         // 3D velocity arrows on each moving object (Initial speeds tab)
alt_color_filter = 'all'    // altitude histogram: 'all' or '#rrggbb' — only counts objects of this color
velo_color_filter = 'all'   // velocity histogram: 'all' or '#rrggbb' — only counts objects of this color
speed_color_filter = 'all'  // Initial speeds: 'all' or '#rrggbb' — balls the tab acts on (reinit, flatten z, previews)
flatten_z_level = 0         // Initial speeds: altitude of the plane « flatten z » projects onto (0 = ground plane)
                            // (the trajectory color checkboxes have no own state: they reflect
                            //  directly obj.track_trajectory, cf. refresh_traj_color_filters)
traj_colors_open = true     // trajectories: expandable list of colors to track — expanded or collapsed
traj_modes_open = true      // trajectories: expandable list of plots (x-y / z(t) / MSD / |v|(t)) — idem
sim_time = 0                // elapsed simulation time (a.u.) since the last trajectories reset; freezes on pause

//---------------------- Settings that travel with the scene

/*
Names saved into the scene JSON (_dynamics) and restored from it, by
get_scene_data() and restore_dynamics() in init_scene.js. Both directions read
THIS list, so a parameter can no longer be saved without being restored (or the
reverse): that desync was silent, since neither side raises anything.
Adding a persisted parameter = declaring it above, and one line here.

Only for parameters whose JSON key is their own name and whose value is stored
as-is. The four needing a conversion (attract_strength, altitude_fit_expr,
traj_show, mon_chrono) stay explicit in init_scene.js.
*/

PERSISTED_DYNAMICS = [
      'gravity_ok', 'springs_ok', 'one_over_r2', 'attract_softening',
      'use_cell_lists', 'use_barnes_hut', 'barnes_hut_theta',
      'random_initial_speed', 'random_speed_module', 'random_speed_z',
      'track_height',
      // display toggles (Monitoring)
      'show_energy_graph', 'show_velocity_hist', 'show_altitude_hist',
      'show_trajectories', 'show_report', 'show_speeds',
      // selections INSIDE the monitoring windows
      'z_means_only', 'traj_color_sort', 'traj_colors_open', 'traj_modes_open',
      'alt_color_filter', 'velo_color_filter',
      // Initial speeds tab
      'speed_color_filter', 'flatten_z_level'
]

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
var track_height = 5                // height of the slabs; changed by the right-click menu of a segment,
                                    // and used for the segments drawn afterwards
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
color_blocked_black = 0x111111;     // a BALL that has been blocked (anchor): shown black.
                                    // Walls, box walls, track slabs and pavements are blocked
                                    // by construction, not by choice -- they keep their look.
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
