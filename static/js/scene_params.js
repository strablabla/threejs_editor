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
// Positionnement caméra par glisser (touche k) : A au clic, flèche + pointillés vers la souris jusqu'au relâcher
poscam_dragging = false             // un glisser de positionnement est en cours
poscam_A = null                     // point A (future position caméra), Vector3 sur le plan du sol
poscam_marker = null                // repère visuel de A
poscam_arrow = null                 // THREE.ArrowHelper orientée de A vers la souris
poscam_line = null                  // ligne pointillée A -> souris

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
attract_softening = 40;                // ε : adoucissement de Plummer F = G·m·m/(r²+ε²) — supprime la singularité 1/r² (conservation d'énergie)
use_cell_lists = false                 // collisions courte portée en O(n) (grille spatiale) au lieu de la double boucle O(n²) — résultat physiquement identique
use_barnes_hut = false                 // attraction 1/r² approchée par octree en O(n log n) au lieu de O(n²) — APPROXIMATION (voir barnes_hut_theta)
barnes_hut_theta = 0.5                  // seuil d'ouverture Barnes-Hut : 0 = exact (lent), plus grand = plus rapide mais plus approché (~0.5 usuel)

//-------------------- Energies

elast_energy = 0    // elastic
kin_energy = 0      // kinetic
grav_energy = 0     // gravity (uniforme en z + newtonienne)
attract_energy = 0  // énergie potentielle de gravité newtonienne (paires)
tot_energy = 0      // total
show_energy_graph = false   // affichage du graphe temporel d'énergie (panneau Tools)
show_velocity_hist = false  // affichage de l'histogramme des normes de vitesse (panneau Tools)
show_trajectories = false   // affichage de la fenêtre trajectoires + MSD (Monitoring)
traj_show = { xy:true, z:false, msd:true }   // tracés visibles dans la fenêtre trajectoires (bascules indépendantes -> toutes combinaisons)
z_means_only = false        // z(t) : n'afficher que les moyennes ⟨z⟩ (masque les courbes z(t))
show_altitude_hist = false  // affichage de l'histogramme nombre de particules vs altitude (Monitoring)
show_speeds = false         // flèches 3D de vitesse sur chaque objet mobile (onglet Initial speeds)
alt_color_filter = 'all'    // histogramme d'altitude : 'all' ou '#rrggbb' — ne compte que les objets de cette couleur
                            // (les cases couleur des trajectoires n'ont pas d'état propre : elles reflètent
                            //  directement obj.track_trajectory, cf. refresh_traj_color_filters)
traj_colors_open = true     // trajectoires : liste dépliable des couleurs à suivre — dépliée ou repliée
sim_time = 0                // temps de simulation écoulé (u.a.) depuis le dernier reset des trajectoires ; se fige à la pause

//---------------------- Déplacement dans un plan vertical (double-clic sur un objet)

vdrag_obj = null            // objet en mode plan vertical (null = mode inactif)
vdrag_plane = null          // plan vertical : repère visuel ET support de projection de la souris
vdrag_dragging = false      // un glisser est en cours
vdrag_pos0 = null           // position de l'objet au moment de la prise (Vector3)
vdrag_hit0 = null           // point d'accroche sur le plan (Vector3) — glisser relatif : pas de saut au clic

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
box_id_counter = 0                          // identifiant unique par boîte (regroupe ses 4 parois)
list_lids = []                              // couvercles actifs : { box_id, mesh, bounds:{xmin,xmax,ymin,ymax}, z }
dragging_box = false                        // déplacement d'une boîte "movable" en cours
box_drag_parts = []                         // parois + couvercle déplacés en bloc
box_drag_orig = []                          // leurs positions au moment de la prise
box_drag_anchor = {x:0, y:0}                // point du plan au moment de la prise (drag relatif)
box_drag_sel = false                        // déplacement d'un groupe persistant : la zone de sélection (pointillés+coins) suit
box_drag_dotted_orig = []                    // positions d'origine des pointillés pendant le drag
box_drag_corners_orig = []                   // positions d'origine des coins noirs pendant le drag
group_id_counter = 0                         // identifiant de groupe persistant (déplacement souris en bloc)
group_highlighted = {}                       // { group_id: bool } — coloration violette du groupe activée ou non
dotted_relat = []                            // offsets des pointillés relativement à SELECTED (suivent le groupe)
list_sel_corners = []                        // marques noires aux coins de la zone (retirées au Ctrl+S)
corners_relat = []                           // offsets des coins relativement à SELECTED (suivent le groupe)

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
color_sphere_default = 0xffcccc;    // couleur par défaut des boules à la création (rose)
color_clone_pale_blue = 0xcceeff;
color_mark_pale_rose = 0xffcccc;
color_mark_quite_red = 0xff1a1a;
color_mark_quite_grey = 0xa6a6a6;
color_group_medium_blue = 0x99ccff;
color_group_persistent_violet = 0xcc99ff;   // groupe PERSISTANT (Ctrl+Maj+G) — distinct du bleu temporaire
color_track_green = 0x99ff99;
color_track_blue = 0xcceeff;
color_no_interaction_pink = 0xffcccc;
color_harmonic_pairs_pale_blue = 0xcceeff;

//------------------------ Textures

basic_tex_addr = "static/upload/Blank.jpg";  	// default texture
basic_multiple_tex_addr = "static/upload/face_color";  	// default texture
default_texture = 'face_color';
