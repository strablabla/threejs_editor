
var camera, scene, renderer;
var effect, controls;
var element, container;
var bulbLight, bulbMat, groundMat, hemiLight
var dist = 500
var size_cube = 5
var size_house_piece = 50
var size_bulb = 5
var param_bulb = 0
var moving = false
var dic_cage = {}
var dic_cage_speed = {}
var dic_smoke = {}
var dic_smoke_speed = {}

window.onload = function(event) {

    // ref for lumens: http://www.power-sure.com/lumens.htm
    var bulbLuminousPowers = {
        "110000 lm (1000W)": 110000,
        "3500 lm (300W)": 3500,
        "1700 lm (100W)": 1700,
        "800 lm (60W)": 800,
        "400 lm (40W)": 400,
        "180 lm (25W)": 180,
        "20 lm (4W)": 20,
        "Off": 0
    };

    // ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
    var hemiLuminousIrradiances = {
        "0.0001 lx (Moonless Night)": 0.0001,
        "0.002 lx (Night Airglow)": 0.002,
        "0.5 lx (Full Moon)": 0.5,
        "3.4 lx (City Twilight)": 3.4,
        "50 lx (Living Room)": 50,
        "100 lx (Very Overcast)": 100,
        "350 lx (Office Room)": 350,
        "400 lx (Sunrise/Sunset)": 400,
        "1000 lx (Overcast)": 1000,
        "18000 lx (Daylight)": 18000,
        "50000 lx (Direct Sun)": 50000
    };

    var params = {
        shadows: true,
        exposure: 0.68,
        bulbPower: Object.keys( bulbLuminousPowers )[ 0 ],
        hemiIrradiance: Object.keys( hemiLuminousIrradiances )[0]
    };

    var clock = new THREE.Clock();

    function init() {

      renderer = new THREE.WebGLRenderer();
      //----------------
      renderer.physicallyCorrectLights = true;
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      renderer.shadowMap.enabled = true;
      //-------------Fog
      element = renderer.domElement;
      container = document.getElementById('container');
      container.appendChild(element);

      effect = new THREE.StereoEffect(renderer);

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog( 0xffffff, 0, 1000 );
      hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
      scene.add( hemiLight );

      // var light = new THREE.AmbientLight( 0xffffff , 100000); // soft white light
      // scene.add( light );

      camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.01, 10000);
      //camera.position.set(-500, 400, -200);
      // camera.position.set(dist/2, dist/2, dist/2);
      camera.position.set(40,180,-260);
      scene.add(camera);

      controls = new THREE.OrbitControls(camera, element);
      // controls.rotateUp(Math.PI / 4);
      controls.target.set(
          camera.position.x + 0.1,
          camera.position.y,
          camera.position.z
      );
      controls.noZoom = true;
      controls.noPan = true;

      function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();
        element.addEventListener('click', fullscreen, false);
        window.removeEventListener('deviceorientation', setOrientationControls, true);

    } // end init

   window.addEventListener('deviceorientation', setOrientationControls, true);

    // Sky

     var size_sphere = 1000
     make_sky(size_sphere)

      // Buildings

      building3()

      /* ground  */

      size_ground = 3000
      var geometry = new THREE.PlaneGeometry( size_ground, size_ground, 1, 1 );
      //var material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
      //var material = new THREE.MeshBasicMaterial( { color: 0x999966 } );
      var material = new THREE.MeshBasicMaterial( { color: 0xffeecc } );

      material.opacity = 0.001
      var ground = new THREE.Mesh( geometry, material );
      ground.position.y = 20;
      ground.material.side = THREE.DoubleSide;
      ground.rotation.x = Math.PI/2;
      scene.add( ground );

      window.addEventListener('resize', resize, false);
      setTimeout(resize, 1);

      window.addEventListener('touchstart', function() {
          moving = !moving
         }); // end touchstart
    }

    function resize() {
      var width = container.offsetWidth;
      var height = container.offsetHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      //renderer.setSize(width, height);
      effect.setSize(width, height);
    }

    function update(dt) {
      resize();
      camera.updateProjectionMatrix();
      controls.update(dt);
    }

    var previousShadowMap = false;

    function render(dt) {

      if (moving){
          var direction = camera.getWorldDirection();
          distance = 2;
          camera.position.add( direction.multiplyScalar(distance) );
      }

      renderer.toneMappingExposure = Math.pow( params.exposure, 5.0 ); // to allow for very bright scenes.
      renderer.shadowMap.enabled = params.shadows;

      if( params.shadows !== previousShadowMap ) {
        //   material.needsUpdate = true;
          //groundMat.needsUpdate = true;
          previousShadowMap = params.shadows;
      }

      // Moving cages up and down

      for (i=1; i < Object.keys(dic_cage).length+1; i++){
              if (dic_cage[i].position.y < 400){
                  dic_cage_speed[i] *= 1;
              }
              else{
                  dic_cage_speed[i] *= -1;
              }
              if (dic_cage[i].position.y < 30){
                dic_cage_speed[i] *= -1;
              }
              dic_cage[i].position.y += dic_cage_speed[i]*0.1
            }


      // Moving smoke

      //maxlev_smoke = 330
      maxlev_smoke = 550
      for (i=1; i < Object.keys(dic_smoke).length+1; i++){
              if (dic_smoke[i].position.y < maxlev_smoke){
                  dic_smoke_speed[i] *= 1;
              }
              else{
                  dic_smoke[i].position.y = 240;
                  //dic_smoke[i].mesh.setGeometry(THREE.TorusGeometry( 10, 1, 5, 100 ));
                  // var geom_smoke = new THREE.TorusGeometry( 10, 1, 5, 100 );
                  // var mat_smoke = new THREE.MeshBasicMaterial( { color: 0xffffff } );
                  // dic_smoke[i] = new THREE.Mesh( geom_smoke, mat_smoke );
                  // dic_smoke[i].rotation.x = Math.PI/2
                  // dic_smoke[i].position.set(190, 200+40, -190)
              }

              dic_smoke[i].position.y += dic_smoke_speed[i]*0.2
              //dic_smoke[i].mesh.setGeometry(torusGeometry);
              fact_smoke = dic_smoke[i].position.y/250
              //fact_smokey = dic_smoke[i].position.y/200
              dic_smoke[i].scale.set(fact_smoke,fact_smoke,fact_smoke)

            }

      //dic_smoke[1].position.y += dic_smoke_speed[1]*0.03


      bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow( 0.02, 2.0 ); // convert from intensity to irradiance at bulb surface
      hemiLight.intensity = hemiLuminousIrradiances[ params.hemiIrradiance ];
      effect.render(scene, camera);
    }

    function animate(t) {
      requestAnimationFrame(animate);
      update(clock.getDelta());
      render(clock.getDelta());
    }

    function fullscreen() {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    }

    init();
    animate();

}
