/*

Déplacement d'un objet dans un PLAN VERTICAL (double-clic).

Le glisser normal projette la souris sur le plan du sol (`plane`, horizontal z=0) et garde z constant
(voir mouse_move_interact.js) : impossible de changer l'altitude. D'où un second support de projection,
VERTICAL : `vdrag_plane`, un plan qui contient l'objet et la verticale, orienté face à la caméra.

Dans ce plan le déplacement est LIBRE (deux degrés de liberté) : en hauteur (z) et latéralement le long
de la direction horizontale du plan. L'objet ne quitte jamais le plan.

Cycle de vie (mode persistant) :
      double-clic sur un objet  -> le plan apparaît, l'objet passe en mode plan vertical
      glisser sur l'objet       -> il suit la souris DANS le plan ; autant de fois qu'on veut
      Échap / 2e double-clic /  -> sortie du mode, le plan disparaît
      clic dans le vide            (+ sortie auto si l'objet est supprimé : vdrag_check_alive)

L'état (vdrag_obj, vdrag_plane, vdrag_dragging, vdrag_pos0, vdrag_hit0) est déclaré dans scene_params.js.

*/

var VDRAG_SIZE = 2000        // côté du plan : assez grand pour que la souris ne sorte JAMAIS du support pendant un
                             // glisser. Le plan est ré-orienté à CHAQUE prise (mousedown) mais reste FIGÉ pendant le
                             // glisser : s'il suivait l'objet, déplacer l'objet déplacerait le support -> boucle.
var VDRAG_SEGS = 10          // 10x10 mailles -> quadrillage lisible (cellules de 200)

function init_vertical_drag(){

      /*
      Crée le plan vertical (masqué) et branche les entrées du mode.
      Appelé depuis init() APRÈS la création de renderer (on a besoin de renderer.domElement).
      */

      var geom = new THREE.PlaneGeometry( VDRAG_SIZE, VDRAG_SIZE, VDRAG_SEGS, VDRAG_SEGS )
      var mat = new THREE.MeshBasicMaterial( { color: 0x2e7d32, opacity: 0.35, transparent: true,
                                               wireframe: true, side: THREE.DoubleSide } )   // DoubleSide : cliquable des deux côtés
      vdrag_plane = new THREE.Mesh( geom, mat )
      vdrag_plane.up.set(0, 0, 1)          // « haut » = z : lookAt() alignera l'axe local Y sur la verticale du monde
      vdrag_plane.visible = false
      scene.add( vdrag_plane )
      // NB : vdrag_plane n'est PAS poussé dans `objects` -> intersectObjects(objects) ne le touche jamais.

      renderer.domElement.addEventListener( 'dblclick', vdrag_dblclick, false )
      document.addEventListener( 'keydown', function(event){
            if (event.keyCode === 27 && vdrag_obj){ exit_vertical_mode() }      // Échap = sortie
      }, false )

}

function vdrag_orient_plane(obj){

      /*
      Place le plan sur l'objet et l'oriente face à la caméra tout en restant VERTICAL :
      sa normale est la direction objet->caméra privée de sa composante z.
      */

      var n = new THREE.Vector3(camera.position.x - obj.position.x,
                                camera.position.y - obj.position.y, 0)
      if (n.lengthSq() < 1e-6){ n.set(1, 0, 0) }        // caméra à la verticale de l'objet : normale indéfinie -> axe x par défaut
      n.normalize()
      vdrag_plane.position.copy(obj.position)
      vdrag_plane.lookAt(new THREE.Vector3().addVectors(obj.position, n))   // +Z local -> n ; up=(0,0,1) => Y local = verticale
      vdrag_plane.visible = true
      vdrag_plane.updateMatrixWorld(true)   // INDISPENSABLE : Mesh.raycast projette le rayon via matrixWorld, qui n'est
                                            // rafraîchi qu'au render() suivant. Sans ça, le raycast du mousedown (même tick
                                            // que la ré-orientation) utiliserait l'ANCIENNE orientation et manquerait le plan.

}

function enter_vertical_mode(obj){

      vdrag_obj = obj
      vdrag_orient_plane(obj)
      container.style.cursor = 'move'

}

function exit_vertical_mode(){

      vdrag_obj = null
      vdrag_dragging = false
      if (vdrag_plane){ vdrag_plane.visible = false }
      controls.enabled = true
      container.style.cursor = 'auto'

}

function vdrag_dblclick(event){

      /*
      Double-clic : bascule le mode altitude sur l'objet visé.
      Sur le MÊME objet -> sortie ; sur un autre -> on bascule dessus ; dans le vide -> sortie.
      */

      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObjects( objects )
      if (!hits.length){ exit_vertical_mode(); return }
      var obj = hits[0].object
      if (vdrag_obj === obj){ exit_vertical_mode() } else { enter_vertical_mode(obj) }

}

function vdrag_hit_point(raycaster){

      /*
      Point visé par la souris SUR le plan vertical (Vector3), ou null si la souris est hors du plan.
      */

      var hits = raycaster.intersectObject( vdrag_plane )
      return hits.length ? hits[0].point : null

}

function vdrag_mouse_down(event){

      /*
      Retourne true si le clic est consommé par le mode altitude (l'appelant doit alors s'arrêter là,
      pour ne PAS enclencher la sélection/glisser horizontal habituel).
      */

      if (!vdrag_obj){ return false }
      var raycaster = make_raycaster(event)
      var hits = raycaster.intersectObjects( objects )
      if (!hits.length || hits[0].object !== vdrag_obj){    // clic ailleurs -> on quitte le mode et on laisse
            exit_vertical_mode()                            // le traitement normal (sélection, création...) suivre son cours
            return false
      }
      vdrag_orient_plane(vdrag_obj)                         // la caméra a pu tourner depuis l'entrée dans le mode : on remet
                                                            // le plan face à elle AVANT de mesurer le point d'accroche, sinon
                                                            // un plan vu par la tranche rend le glisser inexploitable
      var hit = vdrag_hit_point(raycaster)
      if (!hit){ return false }
      vdrag_dragging = true
      vdrag_pos0 = vdrag_obj.position.clone()               // glisser RELATIF : l'objet ne saute pas sous le curseur au clic
      vdrag_hit0 = hit.clone()
      controls.enabled = false                              // le trackball ne doit pas tourner pendant le glisser
      container.style.cursor = 'move'

      return true

}

function vdrag_mouse_move(event){

      /*
      Glisser LIBRE dans le plan : l'objet suit le point d'accroche, en hauteur comme latéralement.

      Le déplacement appliqué est (point visé − point d'accroche). Ces deux points appartiennent au
      MÊME plan, donc leur différence est un vecteur DU plan : l'objet glisse dans le plan vertical
      sans jamais en sortir — sa composante le long de la normale reste rigoureusement constante.
      */

      var hit = vdrag_hit_point(make_raycaster(event))
      if (!hit){ return }
      vdrag_obj.position.copy(vdrag_pos0).add(hit.clone().sub(vdrag_hit0))   // clone : sub() modifierait le point d'intersection

}

function vdrag_check_alive(){

      /*
      Sortie automatique si l'objet suivi a disparu (touche « d », suppression d'une zone, chargement
      d'une autre scène) : sans ça le plan resterait affiché, accroché à un objet retiré de la scène.
      Appelé à chaque frame depuis render() ; le test court-circuite hors mode altitude.
      */

      if (vdrag_obj && (vdrag_obj.del || objects.indexOf(vdrag_obj) < 0)){ exit_vertical_mode() }

}

function vdrag_mouse_up(){

      /*
      Fin du glisser — on RESTE en mode altitude (mode persistant : on peut réajuster tout de suite).
      La persistance de la scène est assurée par emit_infos_scene (listener 'mouseup' distinct).
      */

      vdrag_dragging = false
      if (vdrag_obj){ vdrag_orient_plane(vdrag_obj) }       // la caméra a pu bouger entre deux glissers : on ré-oriente

}
