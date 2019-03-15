function import_collada(addr, scale, position, rotation){ // import collada files
    loader = new THREE.ColladaLoader();
    loader.load(addr, function(collada) {
      collada.scene.scale.set(scale[0],scale[1],scale[2]);
      collada.scene.position.x = position[0];
      collada.scene.position.y = position[1];
      collada.scene.position.z = position[2];
      collada.scene.rotation.x = rotation[0];
      scene.add(collada.scene)
    })
}// end import_collada
//

function meander(txt, sizex, sizey, posx, posy, posz, nbmeand, length,  nbseg, ang){
    /*
    meander
    */

      function CustomSinCurve( scale ) {
        	THREE.Curve.call( this );
        	this.scale = ( scale === undefined ) ? 1 : scale;
        }

          CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
          CustomSinCurve.prototype.constructor = CustomSinCurve;
          CustomSinCurve.prototype.getPoint = function ( t ) {
        	var tx = t * length;
        	var ty = 0;
        	var tz = Math.sin( nbmeand * Math.PI * t );
        	return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

        };
        var texture = new THREE.TextureLoader().load( txt );
        var path = new CustomSinCurve( 20 );
        var geometry = new THREE.TubeGeometry( path, nbseg, sizex, sizey, false );
        //var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        var material = new THREE.MeshBasicMaterial( { map: texture} );
        //var material = new THREE.MeshBasicMaterial( { color: 0xcceeff } ); // 4dc3ff
        var mesh = new THREE.Mesh( geometry, material );
        //mesh.rotation.set(ang)
        mesh.position.set(posx, posy, posz)
        mesh.scale.set(1,0.1,1)
        scene.add( mesh );

}

function simple_grid(posx, posy, posz, txt){
      /*
      Simple Grid
      */

      dic_simple_grid = {map:new THREE.TextureLoader().load( txt )} || {color: 0x000000}
      // "textures/hardwood2_diffuse.jpg"

      var group_simple_grid = new THREE.Group();

      var geometry = new THREE.CylinderGeometry( 0.2,0.2, 20, 32 );
      var material = new THREE.MeshBasicMaterial( dic_simple_grid );
      var cylinder0 = new THREE.Mesh( geometry, material );
      //var material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("texture/im-4-stickers-deco-Mosaiques-12x12cm-style-Azulejos-yellow.jpg")} );

      size_grid = 0.3
      space_grid = 3
      nbbar = 7

      for (i=0;i<nbbar;i++){          // vertic
         newgrid = cylinder0.clone()
         newgrid.position.y = 10
         newgrid.position.x = i*space_grid
         //newgrid.scale.x = 0.5
         group_simple_grid.add( newgrid );

      }
      for (i=0;i<nbbar;i++){               // horiz
         newgrid = cylinder0.clone()
         newgrid.rotation.set(0,0,Math.PI/2)
         newgrid.position.y = 1+i*space_grid
         newgrid.position.x = 9
         group_simple_grid.add( newgrid );

      }
        group_simple_grid.position.set(posx, posy, posz)
        group_simple_grid.scale.set(0.3,1,1)

        return group_simple_grid

}

function cage(posx, posy, posz){
    /*
    Cage
    */
    var geom_cube = new THREE.CubeGeometry( 5, 0.3, 5 )
    var texture = new THREE.TextureLoader().load( "textures/hardwood2_diffuse.jpg" );
    var material_cube = new THREE.MeshBasicMaterial({ map: texture })
    var ground_cage0 = new THREE.Mesh( geom_cube, material_cube )
    ground_cage0.position.set(2.5,0,2.5)
    var ground_cage1 = ground_cage0.clone()
    ground_cage1.position.y = 20
    //----------
    var group_cage = new THREE.Group();
    sgrid0 = simple_grid(0,0,0) //-100,30,70
    sgrid1 = sgrid0.clone()
    sgrid2 = sgrid0.clone()
    sgrid2.rotation.set(0,Math.PI/2,0)
    sgrid2.position.z = 5
    sgrid3 = sgrid2.clone()
    sgrid3.position.x = 5
    //sgrid3.position.set(-100,30,110)
    sgrid4 = sgrid1.clone()
    sgrid4.position.set(0,0,5)
    group_cage.add(sgrid1)
    group_cage.add(sgrid2)
    group_cage.add(sgrid3)
    group_cage.add(sgrid4)
    group_cage.add(ground_cage0)
    group_cage.add(ground_cage1)
    group_cage.position.set(posx, posy, posz)
    group_cage.scale.set(1.5,1,1.5)
    return group_cage

    }

function wavy_grid(sizex, sizey, posx, posy, posz){
      /*
      Wavy Grid
      */

      var group_grid = new THREE.Group();

      function CustomSinCurve( scale ) {
          THREE.Curve.call( this );
          this.scale = ( scale === undefined ) ? 1 : scale;
        }

          CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
          CustomSinCurve.prototype.constructor = CustomSinCurve;
          CustomSinCurve.prototype.getPoint = function ( t ) {

          var tx = t * 5 - 1.5;
          var ty = 0.1*Math.sin( 10 * Math.PI * t );
          var tz = 0;

          return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

        };

        var path = new CustomSinCurve( 20 );
        var geometry = new THREE.TubeGeometry( path, 200, 2, 20, false );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        //var material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("texture/im-4-stickers-deco-Mosaiques-12x12cm-style-Azulejos-yellow.jpg")} );
        var grid0 = new THREE.Mesh( geometry, material );
        size_grid = 0.3
        grid0.scale.set(size_grid,size_grid,size_grid)
        space_grid = 3

        for (i=0;i<10;i++){          // horiz
           newgrid = grid0.clone()
           newgrid.position.y = 50+i*space_grid
           newgrid.scale.x = 0.5
           group_grid.add( newgrid );

        }
        for (i=0;i<15;i++){               // vertic
           newgrid = grid0.clone()
           newgrid.rotation.set(0,0,Math.PI/2)
           newgrid.position.x = i*space_grid-10
           newgrid.position.y = 57
           group_grid.add( newgrid );

        }

        group_grid.position.set(posx, posy, posz)
        group_grid.scale.set(0.3,0.3,0.3)

        return group_grid

}

function gift(txt, size, posx, posy, posz, ang){
      /*
      Gift
      */
      sgift = size // size cube
      var geom_gift = new THREE.CubeGeometry( sgift, sgift, sgift )
      var texture = new THREE.TextureLoader().load(txt) // gift-boxes.jpg // roughness_map.jpg
      var mat_gift = new THREE.MeshBasicMaterial({ map: texture})
      gift0 = new THREE.Mesh( geom_gift, mat_gift )
      gift0.position.set(posx, posy, posz)
      gift0.rotation.y = ang
      return gift0
}

function bouq0(posx, posy, posz, nbf){
        /*
        Bouquet
        */

        var group_bouq0 = new THREE.Group();
        nbflowers = nbf || 9;
        dic_flow = {}
        flow0 = flower0(posx, posy, posz, -Math.PI/3)
        flow1 = flower0(posx, posy, posz, -Math.PI/2)
        divfact = 2
        for (i=0;i<nbflowers;i++){
            //dic_flow[i] = flower0(20,30,41, -Math.PI/(Math.random())) //+ Math.random()*0.1
            dic_flow[2*i] = flow0.clone()
            dic_flow[2*i].position.x += 5*Math.random()
            dic_flow[2*i].position.z += 5*Math.random()
            dic_flow[2*i].rotation.z = Math.PI/2 * (0.5-Math.random())
            dic_flow[2*i+1] = flow1.clone()
            dic_flow[2*i+1].position.x += 5*Math.random()
            dic_flow[2*i+1].position.z += 5*Math.random()
            dic_flow[2*i+1].rotation.z = Math.PI/2 * (0.5-Math.random())
            group_bouq0.add(dic_flow[2*i])
            group_bouq0.add(dic_flow[2*i+1])
        }
        return group_bouq0

}

function flower0(posx, posy, posz, ang){
      /*
      Flowers
      */
      return flower(posx, posy, posz, ang, 0xffffff, 0x336600, 0xffff99)

}

function flower(posx, posy, posz, ang, colpet, coltige, colcenter){
      /*
      Flowers
      */
      var group_flower = new THREE.Group();

      function CustomSinCurve( scale ) {
          THREE.Curve.call( this );
          this.scale = ( scale === undefined ) ? 1 : scale;
        }

          CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
          CustomSinCurve.prototype.constructor = CustomSinCurve;
          CustomSinCurve.prototype.getPoint = function ( t ) {
          rflow = 0.2
          nbturns = 5
          var tx = rflow*Math.sin( nbturns * Math.PI * t );
          var ty = 2*t;
          var tz = rflow*Math.cos( nbturns * Math.PI * t );

          return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

        };

        //--- Tige

        var path = new CustomSinCurve( 20 );
        var geometry = new THREE.TubeGeometry( path, 200, 2, 20, false );
        var material = new THREE.MeshBasicMaterial( { color: coltige  } ); //
        var tige = new THREE.Mesh( geometry, material );
        tige.scale.set(0.1,0.2,0.1)
        group_flower.add(tige)

        //------ Head

        var group_headpet = new THREE.Group();
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color : colcenter } ); // #ff99cc //  0x000000
        var head = new THREE.Mesh( geometry, material );
        head.position.set(0,1,0.7)
        size_head = 0.8
        group_headpet.add(head)

        //------ Petals

        dic_pet = {}
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color : colpet } ); // #ff99cc //  0x000000
        var pet0 = new THREE.Mesh( geometry, material );
        pet0.position.set(0,0,0)
        nbpets = 7                               // number petals
        radpet = 2*Math.PI/nbpets
        pet0.scale.set(1,1,0.3)
        distpet = 1.3
        for (i=0; i<nbpets; i++){
            dic_pet[i] = pet0.clone()
            dic_pet[i].position.set(distpet*Math.sin(radpet*i), 1+ distpet*Math.cos(radpet*i), 0)
            group_headpet.add(dic_pet[i])
        }

        group_headpet.rotation.set(ang,0,0)
        group_headpet.position.set(0,8,1)

        //-----
        group_flower.add(group_headpet)
        group_flower.position.set(posx, posy, posz)
        scale_flow = 0.5
        group_flower.scale.set(scale_flow, scale_flow, scale_flow)

        return group_flower

}

function puppet(posx, posy, posz, ang, colbody, colhead, colarm, colleg){
       /*
       Puppet
       */
       colb = colbody || 0xffff00
       var group_puppet = new THREE.Group()
       var geom_body = new THREE.CylinderBufferGeometry( 5, 5, 15, 32 );
       var mat_body = new THREE.MeshBasicMaterial( {color: colb} );
       var body = new THREE.Mesh( geom_body, mat_body );
       //---
       var geom_arm = new THREE.CylinderBufferGeometry( 5, 5, 20, 32 );
       var mat_arm = new THREE.MeshBasicMaterial( {color: 0xff99cc} );
       var arm = new THREE.Mesh( geom_arm, mat_arm );
       //---
       var geom_leg = new THREE.CylinderBufferGeometry( 8,8, 120, 32 );
       var mat_leg = new THREE.MeshBasicMaterial( {color: 0xff0000} );
       var leg = new THREE.Mesh( geom_leg, mat_leg );
       //---
       bodyscale = 10
       body.scale.set( bodyscale, bodyscale, bodyscale )
       body.position.set(-40,5,-0)
       group_puppet.add(body)
       //-------------------
       var hand1 = arm.clone()
       poshand = -30
       hand1.rotation.set(Math.PI/2, 0,0)
       hand1.scale.set(2,4,1)
       hand1.position.set(poshand,50,70)
       hand2 = hand1.clone()
       hand2.position.set(poshand,50,-70)
       group_puppet.add(hand1)
       group_puppet.add(hand2)
       //-----------
       levleg = -60
       leg1 = leg.clone()
       leg1.rotation.z = 3*Math.PI/2
       leg1.position.set(70,levleg,20)
       leg2 = leg1.clone()
       leg2.position.set(70,levleg,-20)
       // leg1.position.y = 0
       // leg1.position.z = 20
       group_puppet.add(leg1)
       group_puppet.add(leg2)
       //------------------
       // var geometry = new THREE.SphereGeometry( size, 32, 32 );
       // var texture = new THREE.TextureLoader().load( txt );
       // var material = new THREE.MeshBasicMaterial( {map: texture} );
       // var balloon = new THREE.Mesh( geometry, material );

       //---- Head

       var geometry = new THREE.SphereGeometry( 40, 32, 32 );
       //var texture = new THREE.TextureLoader().load( txt );
       var material = new THREE.MeshBasicMaterial( {color : 0xffffff} ); // #ff99cc //  0x000000
       var head = new THREE.Mesh( geometry, material );
       head.position.set(-30,150,0)
       group_puppet.add(head)

       //----- Hat
       var geom_hat = new THREE.ConeGeometry( 40, 63, 32 );
       //var texture = new THREE.TextureLoader().load( txt );
       var mat_hat = new THREE.MeshBasicMaterial( {color : 0xff00ff} ); // #ff99cc //  0x000000
       var hat = new THREE.Mesh( geom_hat, mat_hat );
       hat.position.set(-30,210,0)
       group_puppet.add(hat)

       //----
       group_puppet.position.set(posx, posy+250, posz)
       pupscale = 0.03
       group_puppet.scale.set(pupscale, pupscale, pupscale)
       group_puppet.position.set(posx, posy, posz)

       return group_puppet
}

//puppet(0,0,0,0)

function cheminey(posx, posy, posz){

  //var geom_chem = new THREE.CylinderBufferGeometry( 10,10, 70, 32 );
  var geom_chem = new THREE.CubeGeometry( 10,60,10 )
  var mat_chem = new THREE.MeshBasicMaterial( {color: 0xffffff} );
  var chem = new THREE.Mesh( geom_chem, mat_chem );
  chem.position.set(posx, posy, posz)


  return chem

}

function road_white(sizex, sizey, posx, posy, posz){
      /*
      road
      */

      function CustomSinCurve( scale ) {
        	THREE.Curve.call( this );
        	this.scale = ( scale === undefined ) ? 1 : scale;
        }

          CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
          CustomSinCurve.prototype.constructor = CustomSinCurve;
          CustomSinCurve.prototype.getPoint = function ( t ) {

        	var tx = t * 10 - 1.5;
        	var ty = 0;
        	var tz = Math.sin( 10 * Math.PI * t );

        	return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

        };

        var path = new CustomSinCurve( 20 );
        var geometry = new THREE.TubeGeometry( path, 200, 2, 20, false );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        //var material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("texture/im-4-stickers-deco-Mosaiques-12x12cm-style-Azulejos-yellow.jpg")} );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(0,100,10)
        mesh.scale.set(1,0.1,1)

        scene.add( mesh );

}

function ceiling_white(sizex, sizey, posx, posy, posz){
      /*
      ceiling
      */

      var geom_ceiling = new THREE.CubeGeometry( sizex, 1, sizey )
      var mat_ceiling = new THREE.MeshBasicMaterial({ color: 0xffffff }) // "texture/latte0.jpg"
      var ceiling = new THREE.Mesh( geom_ceiling, mat_ceiling );
      ceiling.position.set(posx, posy, posz)
      return ceiling

}

function ball(txt, size, posx, posy, posz){
      /*
      ball
      */
      var geometry = new THREE.SphereGeometry( size, 32, 32 );
      var texture = new THREE.TextureLoader().load( txt );
      var material = new THREE.MeshBasicMaterial( {map: texture} );
      var balloon = new THREE.Mesh( geometry, material );
      balloon.position.set(posx, posy, posz)
      return balloon
}

function do_floor(txt, size_pav, level_pav, scale_pav, sizez, sizex, posx, posz){
          pav_elem = pavage(txt, size_pav,  0,0,0, 0)
          dict_pav = {}
          for (i=0; i<sizex; i++){
              for (j=0; j<sizez; j++){
                dict_pav[j + sizez*i] = pav_elem.clone()
                dict_pav[j + sizez*i].scale.set(scale_pav, scale_pav, scale_pav)
                dict_pav[j + sizez*i].position.set(posx+size_pav*i*scale_pav, level_pav, posz-size_pav*j*scale_pav)
              }
          }
          for (i=0; i<Object.keys(dict_pav).length+1; i++){
                 group.add( dict_pav[i] )
          }
    }

var make_bulb = function(posx, posy, posz){
    /*
    Lamps
    */

    // rings

    var group_bulb = new THREE.Group();
    var geom_ring = new THREE.TorusGeometry( 10, 3, 16, 100 );
    var mat_ring = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    var mesh_ring = new THREE.Mesh( geom_ring, mat_ring );
    mesh_ring.position.set(  posx, posy, posz  );
    mesh_ring.rotation.set(  Math.PI/2,0, 0  );
    var scale_ring = 0.1
    for (i=0; i<5; i++){
      ring_bulb = mesh_ring.clone()
      ring_bulb.scale.set(scale_ring, scale_ring, scale_ring)
      ring_bulb.position.y = 5+posz+1.5*i;
      group_bulb.add(ring_bulb)
    }

    // cone
    var scale_cone = 1.2
    var geom_cone_bulb = new THREE.ConeGeometry( 10, 7, 32 );
    var mat_cone_bulb = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    var cone_bulb = new THREE.Mesh( geom_cone_bulb, mat_cone_bulb );
    cone_bulb.position.set(  posx, posy+2, posz  );
    cone_bulb.scale.set(  scale_cone, scale_cone, scale_cone  );
    group_bulb.add(cone_bulb)

    var bulbGeometry = new THREE.SphereGeometry( size_bulb, 16, 8 );
    bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );
    bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
    bulbLight.castShadow = true;
    bulbLight.position.set(  posx, posy, posz  ); // 60, 50, -60
    group_bulb.add(bulbLight)

    return group_bulb
}

function persians(txt, size,  x, y, z, angle){
    /*
    Persians
    */
    var group_persian = new THREE.Group();
    var geom_board = new THREE.CubeGeometry( 50, 7, 3 )
    var texture = new THREE.TextureLoader().load( txt );
    var material_board = new THREE.MeshBasicMaterial({ map: texture }) // "texture/latte0.jpg"
    simple_board0 = new THREE.Mesh( geom_board, material_board )
    dic_board = {}
    scale_board = size
    dic_board[0] = simple_board0.clone()
    dic_board[0].rotation.set(-Math.PI/3,angle,0)
    dic_board[0].position.set(x, y, z)  // 180,180,-10
    dic_board[0].scale.set(scale_board,scale_board*0.1,scale_board)
    for (i=1; i<20; i++){
      dic_board[i] = dic_board[0].clone()
      dic_board[i].position.y = dic_board[0].position.y-2*i
      group_persian.add( dic_board[i] )
    }
    return group_persian
}

function tapestry(txt, size,  x, y, z, angle){
      /*
      Tapestry
      */
      var geom_cube = new THREE.CubeGeometry( 2*size, 0.3, size )
      var material_cube = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture(txt) })
      var cube = new THREE.Mesh( geom_cube, material_cube )
      cube.position.set(x, y, z)
      cube.rotation.set(0, Math.PI/180*angle, 0)
      return cube
}

function column_torsed(txt, size,  x, y, z, nbcubes){
      /*
      Torsed column
      */
      var group_column = new THREE.Group();
      //scene.add( group_column );
      var geom_cube = new THREE.CubeGeometry( size, size, size )
      var texture = new THREE.TextureLoader().load( txt );
      var material_cube = new THREE.MeshBasicMaterial({ map: texture})
      cube = new THREE.Mesh( geom_cube, material_cube )
      cube.position.set(x, y, z)

      for (i=0; i<nbcubes; i++){
        newcube = cube.clone()
        newcube.rotation.set(0, Math.PI/10*i, 0)
        newcube.position.y = y+i*size
        group_column.add(newcube)
      }
      return group_column
}

function tableau(txt, size,  x, z, y, roty){
      /*
      Tableau
      */
      var geom = new THREE.PlaneGeometry( size, size, 5);
      var texture = new THREE.TextureLoader().load( txt );
      var mat= new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );
      var tabl = new THREE.Mesh( geom, mat); // , new THREE.SphericalReflectionMapping()

      tabl.position.x = +x;
      tabl.position.z = +z;
      tabl.rotation.y += roty;
      tabl.position.y = y; //hauteur
      return tabl
}

function pavage(txt, size,  x, z, y, roty){
      /*
      Pavage
      */

      var texture = new THREE.TextureLoader().load( txt );
      var geom_pav = new THREE.CubeGeometry( size, size, 3 )
      var material_pav = new THREE.MeshBasicMaterial({ map: texture, overdraw: true })
      pav = new THREE.Mesh( geom_pav, material_pav )

      pav.rotation.x += Math.PI/2;
      pav.position.x = x;
      pav.position.z = z;
      pav.rotation.y += roty;
      pav.position.y = y; //hauteur
      return pav
}

var bulblight = function(x,y,z){
	//   Bulb light
	bulbMat = new THREE.MeshStandardMaterial ( {
		emissive: 0xffffee,
		emissiveIntensity: 1,
		color: 0x000000
	   });

	  var bulbGeometry = new THREE.SphereGeometry( size_bulb, 16, 8 );
	  bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );
	  bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
	  bulbLight.castShadow = true;
	  bulbLight.position.set( x,y,z ); // 60, 50, -60

	  return bulbLight
}

function tube_scale(txt, sizex, sizey, posx, posy, posz){
          /*
          rambarde
          */
          function CustomSinCurve( scale ) {
          THREE.Curve.call( this );
          this.scale = ( scale === undefined ) ? 1 : scale;

        }

        CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
        CustomSinCurve.prototype.constructor = CustomSinCurve;
        CustomSinCurve.prototype.getPoint = function ( t ) {
          var length = 5
          var tx =  0;
          var ty =  t * length+ 0.1*Math.sin( 12 * Math.PI * t );
          var tz = 1.9 *  t * length;
          return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );
        };

        var path = new CustomSinCurve( 20 );
        var geometry = new THREE.TubeGeometry( path, 200, sizex, sizey, false );
        //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var texture = new THREE.TextureLoader().load( txt );
        var material = new THREE.MeshBasicMaterial( {color: 0x000000} ); // { map: texture}
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(posx, posy, posz)
        return mesh

}

function scale(txt, rot, posx, posy, posz, heighty, nbscales){
    	/*
      Scale, escaliers
    	*/
    	hstep = 5
    	lstep = 10
    	wstep = 40
    	sx = 0
    	sz = 0
    	sy = heighty + hstep
    	group_scale = new THREE.Group();
    	scene.add( group_scale );
    	var geom_step = new THREE.CubeGeometry( wstep, hstep, lstep )
      var texture = new THREE.TextureLoader().load( txt );
    	var material_step = new THREE.MeshBasicMaterial({ map: texture })
    	step0 = new THREE.Mesh( geom_step, material_step )
    	step0.position.set(sx,sy,sz);
    	for ( i=0; i<nbscales; i++){
      		step = step0.clone()
      		step.position.set(sx, sy+hstep*i, sz+lstep*i);
      		group_scale.add( step );
    	}
    	group_scale.rotation.y = rot; // 3*Math.PI / 2;
    	group_scale.position.set(posx, posy, posz); //420,0,0

      ztube = -10
      ramb0 = tube_scale(txt, 1,2, 20,ztube,-40)
      ramb1 = tube_scale(txt, 1,2, -20,ztube,-40)

      group_scale.add( ramb1 );
      group_scale.add( ramb0 );
}

var building3 = function(){

  	/*
    Building
  	*/

		group = new THREE.Group();
		scene.add( group );

		//------- Scale

    var text_scale = "textures/brick_diffuse.jpg"
		scale(text_scale, 3*Math.PI / 2, 420,0,0, 0, 15)
		scale(text_scale, 3*Math.PI / 2, 420,0,-120, 0, 15)
    scale(text_scale, Math.PI / 2, -150,0,0, 0, 15)
    scale(text_scale, Math.PI / 2, -150,0,-120, 0, 15)

		//------- Building

		sx = 10;
		sy = 50;
		sz = 50;
		cy = 70;
		var geom_wall = new THREE.CubeGeometry( sx, sy, sz )
		var material_wall = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		wall0 = new THREE.Mesh( geom_wall, material_wall )

		//------ Ceiling

		var geom_ceiling = new THREE.CubeGeometry( 100, 7, 100 )
		var material_ceiling = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg") })
		ceil0 = new THREE.Mesh( geom_ceiling, material_ceiling )

		//------ Floor wood, parquet

		var geom_floor = new THREE.CubeGeometry( 50, 7, 50 )
		var material_floor = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/hardwood2_diffuse.jpg") })
		floor_wood0 = new THREE.Mesh( geom_floor, material_floor )

    //------ cube

    scube = 10 // size cube
    var geom_cube = new THREE.CubeGeometry( scube, scube, scube )
		var material_cube = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture("textures/roughness_map.jpg") })
		cube0 = new THREE.Mesh( geom_cube, material_cube )

		//------ Ceil first stage

		ceil0.position.set(25,cy,-25);
		ceil1 = ceil0.clone()
		ceil1.position.set(125,cy,-25);
		ceil2 = ceil0.clone()
		ceil2.position.set(225,cy,-25);
		ceil3 = ceil0.clone()
		ceil3.position.set(25,cy,-125);
		ceil4 = ceil0.clone()
		ceil4.position.set(125,cy,-125);
		ceil5 = ceil0.clone()
		ceil5.position.set(225,cy,-125);

		//------ Wall first stage

		wall0.position.set(0,sy,0);
		wall1 = wall0.clone()
		wall1.position.set(sz/2,sy,sz/2);
		wall1.rotation.y = Math.PI / 2;
		wall2 = wall1.clone()
		wall2.position.set(2*sz,sy,sz/2);
		wall3 = wall0.clone()
		wall3.position.set(2*sz,sy,0);
		wall4 = wall0.clone()
		wall4.position.set(2*sz,sy,-sz);
		wall5 = wall0.clone()
		wall5.position.set(0,sy,-sz);
		wall6 = wall1.clone()
		wall6.position.set(sz/2,sy,-3*sz/2);
		wall7 = wall0.clone()
		wall7.position.set(sz,sy,-2*sz);
		wall8 = wall0.clone()
		wall8.position.set(2*sz,sy,-2*sz);
		wall9 = wall1.clone()
		wall9.position.set(5*sz/2,sy,-5*sz/2);
		wall10 = wall1.clone()
		wall10.position.set(7*sz/2,sy,-5*sz/2);
		wall11 = wall1.clone()
		wall11.position.set(5*sz,sy,-5*sz/2);
		wall12 = wall0.clone()
		wall12.position.set(11*sz/2,sy,-2*sz);
		wall13 = wall0.clone()
		wall13.position.set(11*sz/2,sy,-sz);
		wall14 = wall0.clone()
		wall14.position.set(11*sz/2,sy,-0);
		wall15 = wall1.clone()
		wall15.position.set(5*sz,sy,sz/2);
		wall16 = wall1.clone()
		wall16.position.set(4*sz,sy,sz/2);

		//----- Ceil first stage

		group.add( ceil0 );
		group.add( ceil1 );
		group.add( ceil2 );
		group.add( ceil3 );
		group.add( ceil4 );
		group.add( ceil5 );

		//-----
		group.add( wall0 );
		group.add( wall1 );
		group.add( wall2 );
		group.add( wall3 );
		group.add( wall4 );
		group.add( wall5 );
		group.add( wall6 );
		group.add( wall7 );
		group.add( wall8 );
		group.add( wall9 );
		group.add( wall10 );
		group.add( wall11 );
		group.add( wall12 );
		group.add( wall13 );
		group.add( wall14 );
		group.add( wall15 );
		group.add( wall16 );

		//------ second stage

		wall17 = wall0.clone()
		wall17.position.set(sz, 2*sz , -sz/2);
		wall18 = wall0.clone()
		wall18.position.set(sz, 2*sz , -3*sz/2);
		wall19 = wall1.clone()
		wall19.position.set(sz/2, 2*sz , -2*sz);
		wall20 = wall0.clone()
		wall20.position.set(2*sz, 2*sz , -sz/2);
		wall21 = wall0.clone()
		wall21.position.set(2*sz, 2*sz , -3*sz/2);
		wall22 = wall1.clone()
		wall22.position.set(5*sz/2, 2*sz , -2*sz);
		wall23 = wall1.clone()
		wall23.position.set(7*sz/2, 2*sz , -2*sz);
		wall24 = wall1.clone()
		wall24.position.set(5*sz/2, 2*sz , -3*sz);
		wall25 = wall1.clone()
		wall25.position.set(7*sz/2, 2*sz , -3*sz);
		group.add( wall17 );
		group.add( wall18 )
		group.add( wall19 )
		group.add( wall20 )
		group.add( wall21 )
		group.add( wall22 )
		group.add( wall23 )
		group.add( wall24 )
		group.add( wall25 )

		//------ Ceil second stage

		c2y = 130;
		ceil6 = ceil0.clone()
		ceil6.position.set(50,c2y,-50);
		ceil7 = ceil0.clone()
		ceil7.position.set(150,c2y,-50);
		ceil8 = ceil0.clone()
		ceil8.position.set(50,c2y,-150);
		ceil9 = ceil0.clone()
		ceil9.position.set(150,c2y,-150);

		//----- Ceil second stage

		group.add( ceil6 );
		group.add( ceil7 );
		group.add( ceil8 );
		group.add( ceil9 );

		//----- Wall 2nd

		wall26 = wall0.clone()
		wall26.position.set(sz, 3*sz , -sz);
		wall27 = wall1.clone()
		wall27.position.set(3*sz/2, 3*sz , -sz/2);
		wall28 = wall0.clone()
		wall28.position.set(2*sz, 3*sz , -sz/2);
		wall29 = wall0.clone()
		wall29.position.set(3*sz, 3*sz , -sz/2);
		wall30 = wall1.clone()
		wall30.position.set(7*sz/2, 3*sz , -sz);
		wall31 = wall1.clone()
		wall31.position.set(7*sz/2, 3*sz , -2*sz);
		wall32 = wall1.clone()
		wall32.position.set(3*sz/2, 3*sz , -2*sz);
		group.add( wall26 );
		group.add( wall27 );
		group.add( wall28 );
		group.add( wall29 );
		group.add( wall30 );
		group.add( wall31 );
		group.add( wall32 );

		//------ Ceil third stage, toit, dalle troisième étage

		c3y = 180;
		ceil10 = ceil0.clone()
		ceil10.position.set(50,c3y,-50);
		ceil11 = ceil0.clone()
		ceil11.position.set(150,c3y,-50);
		ceil12 = ceil0.clone()
		ceil12.position.set(50,c3y,-150);
		ceil13 = ceil0.clone()
		ceil13.position.set(150,c3y,-150);

		//----- Ceil third stage

		group.add( ceil10 );
		group.add( ceil11 );
		group.add( ceil12 );
		group.add( ceil13 );

    //-------------

     do_floor("texture/im-4-stickers-deco-Mosaiques-12x12cm-style-AzulejosCarreaux-de-ciment-Mint.jpg", 80, 185, 0.5, 5,5, 20, -20) // toit
     ball_roof0 = ball("texture/free-vector-marble-texture.jpg", 30, 100, 180, -100)
     group.add( ball_roof0 );
     // azulejos_portugal
     // im-4-stickers-deco-Mosaiques-12x12cm-style-AzulejosCarreaux-de-ciment-Mint



    //------------- Tableaux

		size_tab = 20;
		var sep_tab = 50;
    // liste des tableaux
		//list_tabl = [0, 1, 2 , 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    list_tabl = [ 5, 6, 8, 11, 12, 13, 14, 15, 19]
		all_tabl = []

    // floor impressionists, parquet

    level_floor = 20
    for (i=0; i<40;i++){
  			wall_corr0 = wall0.clone()
  			wall_corr1 = wall0.clone()
  			floor_corr0 = floor_wood0.clone()
  			floor_corr1 = floor_wood0.clone()
  			wall_corr0.position.set(sz, sz/2 , -3*sz-i*sz);
  			wall_corr1.position.set(2*sz, sz , -3*sz-i*sz);
  			floor_corr0.position.set(3*sz/2, level_floor , -3*sz-i*sz);
  			floor_corr1.position.set(5*sz/2, level_floor , -3*sz-i*sz);
  			group.add( wall_corr0 );
  			group.add( wall_corr1 );
  			group.add( floor_corr0 );
		}

    // Tableaux impressionistes

	    for (i=0; i<list_tabl.length; i++){
	        all_tabl.push(tableau('paintings/impressionnistes/' + list_tabl[i] + '.jpg', size_tab, 2*sz-10 , -3*sz-i*sz, 50, -Math.PI/2.0));
	        scene.add(all_tabl[i])
	    }

      // Other floors, floor Botero, parquet

        level_floor_inside0 = 25
        dict_floors0 = {}
        scale_floor0 = 0.25
        var repi = 15
        for (i=0; i<15; i++){
            for (j=0; j<repi; j++){
              dict_floors0[j+repi*i] = floor_wood0.clone()
              dict_floors0[j+repi*i].scale.set(scale_floor0,scale_floor0,scale_floor0)
              dict_floors0[j+repi*i].position.set(100+50*i*scale_floor0, level_floor_inside0, 30-50*j*scale_floor0)
            }
        }
        for (i=0; i<Object.keys(dict_floors0).length+1; i++){
               group.add( dict_floors0[i] )
        }

      // Other floors

        level_floor_inside1 = 25
        dict_floors1 = {}
        scale_floor1 = 0.25
        var repi = 15
        for (i=0; i<8; i++){
            for (j=0; j<repi; j++){
              dict_floors1[j+repi*i] = floor_wood0.clone()
              dict_floors1[j+repi*i].scale.set(scale_floor1,scale_floor1,scale_floor1)
              dict_floors1[j+repi*i].position.set(10+50*i*scale_floor1, level_floor_inside1, 30-50*j*scale_floor1)
            }
        }
        for (i=0; i<Object.keys(dict_floors1).length+1; i++){
               group.add( dict_floors1[i] )
        }

        //----- Cubes

        dict_cubes = {}
        dict_cubes[1] = cube0.clone()
        dict_cubes[1].position.set(0,80,-150);
        dict_cubes[2] = cube0.clone()
        dict_cubes[2].position.set(50,140,-150);
        dict_cubes[3] = cube0.clone()
        dict_cubes[3].position.set(100,140,-170);
        dict_cubes[4] = cube0.clone()
        dict_cubes[4].position.set(20,140,-50);
        for (i=1; i<Object.keys(dict_cubes).length+1; i++){
          group.add( dict_cubes[i] )
        }

        //----- Columns, pillars dans maison principale

        column_dic = {}
        column_dic[0] = column_torsed("texture/adesivo-de-parede-azulejos-05-cozinha.jpg", 5, 45,27,29, 10) // door
        column_dic[1] = column_dic[0].clone()
        column_dic[1].position.set(30,0,0)
        column_dic[2] = column_dic[0].clone()
        column_dic[2].position.set(75,0,0)
        column_dic[3] = column_dic[0].clone()
        column_dic[3].position.set(130,0,0)
        column_dic[4] = column_torsed("texture/adesivo-de-parede-azulejos-05-cozinha.jpg", 5, 10,70,-170, 12)
        column_dic[5] = column_dic[4].clone()
        column_dic[5].position.set(130,0,0)
        column_dic[6] = column_dic[4].clone()
        column_dic[6].position.set(30,60,-10)
        column_dic[7] = column_dic[4].clone()
        column_dic[7].position.set(120,60,-10)
        column_dic[8] = column_dic[4].clone()
        column_dic[8].position.set(170,60,150)
        column_dic[9] = column_dic[4].clone()
        column_dic[9].position.set(30,0,150)
        column_dic[10] = column_dic[4].clone()
        column_dic[10].position.set(150,0,130)
        //---
        column_dic[11] = column_dic[4].clone()
        column_dic[11].position.set(20,60,150)
        column_dic[12] = column_dic[4].clone()
        column_dic[12].position.set(50,60,80)
        for (i=0; i<Object.keys(column_dic).length+1; i++){
          group.add( column_dic[i] )
        }

        //-------------- Persians

        dict_pers = {}
        pers0 = persians("texture/latte0.jpg", 0.5, 0,0,0, 0)
        dict_pers[1] = pers0.clone()
        dict_pers[1].position.set(170,180,0)
        dict_pers[2] = pers0.clone()
        dict_pers[2].rotation.set(0,Math.PI/2,0)
        dict_pers[2].position.set(200,180,-30)
        dict_pers[3] = pers0.clone()
        dict_pers[3].rotation.set(0,Math.PI/2,0)
        dict_pers[3].position.set(200,130,-50)
        for (i=1; i<Object.keys(dict_pers).length+1; i++){
             scene.add( dict_pers[i] )
        }

        //-------------- Treillis

        // dict_treill = {}
        // treill0 = treillis("texture/latte0.jpg", 0.5, 0,0,0, 0)
        // dict_treill[1] = treill0.clone()
        // dict_treill[1].position.set(170,60,50)
        // for (i=1; i<Object.keys(dict_treill).length+1; i++){
        //      scene.add( dict_treill[i] )
        // }

        //-------------- Tapestries

        dict_taps = {}
        tap0 = tapestry("texture/tapis.jpg", 20,  0,0,0, 0)
        dict_taps[1] = tap0.clone()
        dict_taps[1].position.set(50,75,-150)
        dict_taps[2] = tap0.clone()
        dict_taps[2].position.set(120,140,-140)
        for (i=1; i<Object.keys(dict_taps).length+1; i++){
             scene.add( dict_taps[i] )
        }

        // Tableaux à l'intérieur, Botero

        dict_tabl_inside = {}
        big_tabl_size = 35
        dict_tabl_inside[1] = tableau("paintings/Botero/Athenaeum.jpeg",big_tabl_size, 140,-115,50, 0)
        dict_tabl_inside[2] = tableau("paintings/Botero/Fernando-Botero-painter.jpg",big_tabl_size, 110,-70,50, Math.PI/2)
        dict_tabl_inside[3] = tableau("paintings/Botero/picnic.jpg",big_tabl_size, 265,-90,50, 3*Math.PI/2)
        //dict_tabl_inside[4] = tableau("paintings/Botero/allant_au_lit.jpg",50, 265,-50,50, 3*Math.PI/2)
        dict_tabl_inside[4] = tableau("paintings/Botero/family-scene.jpg",big_tabl_size, 265,-30,50, 3*Math.PI/2)
        //dict_tabl_inside[5] = tableau("paintings/Botero/allant_au_lit.jpg",25, 110,-25,50, Math.PI/2)
        dict_tabl_inside[5] = tableau("paintings/Botero/flamenco_rouge.jpg",25, 110,-20,50, Math.PI/2)
        dict_tabl_inside[6] = tableau("paintings/Botero/orch.jpg",30, 240,15,50, Math.PI)
        dict_tabl_inside[7] = tableau("paintings/Botero/in_street.jpg",30, 200,15,50, Math.PI)
        //dict_tabl_inside[8] = tableau("paintings/Botero/allant_au_lit.jpg",20, 115,15,50, Math.PI)
        dict_tabl_inside[8] = tableau("paintings/Botero/tango-dancers.jpg",20, 115,15,50, Math.PI)
        dict_tabl_inside[9] = tableau("paintings/Botero/circus_flower-Fernando-Botero.jpg",30, 240,-115,50, 0)
        dict_tabl_inside[10] = tableau("paintings/Botero/self-portrait-with-sofia.jpg",20, 180,-115,50, 0)

        //family-scene-ii-fernando-botero-canvas-paintings
        for (i=1; i<Object.keys(dict_tabl_inside).length+1; i++){
             scene.add( dict_tabl_inside[i] )
        }

        //   Bulb light avec cône

        bulbMat = new THREE.MeshStandardMaterial ( {
            emissive: 0xffffee,
            emissiveIntensity: 1,
            color: 0x000000
           });

        dict_bulb = {}
        bulb0 = make_bulb(0,0,0)
        dict_bulb[1] = bulb0.clone()
        dict_bulb[1].position.set(60, 50, -60)
        dict_bulb[2] = bulb0.clone()
        dict_bulb[2].position.set(200, 50, -60)
        dict_bulb[3] = bulb0.clone()
        dict_bulb[3].position.set(130, 120, -60)
        dict_bulb[4] = bulb0.clone()
        dict_bulb[4].position.set(80, 120, -60)
        dict_bulb[5] = bulb0.clone()
        dict_bulb[5].position.set(80, 120, -120)
        dict_bulb[6] = bulb0.clone()
        dict_bulb[6].position.set(130, 170, -60)
        dict_bulb[7] = bulb0.clone()
        dict_bulb[7].position.set(130, 170, -120)
        dict_bulb[8] = bulb0.clone()
        dict_bulb[8].position.set(130, 50, -150)
        for (i=1; i<Object.keys(dict_bulb).length+1; i++){
              scene.add( dict_bulb[i] )
        }

        // Other floors, floor outside with checkers, outside Botero, sol, damiers

        do_floor("texture/166280_2322900.jpg", 50, 25, 0.5, 20, 7, 110, -140)  // Damiers après BOtero
        do_floor("texture/166280_2322900.jpg", 75, 135, 0.5, 2,1, 125, -20)  // second floor Damier
        do_floor("texture/489842808.jpg", 40, 75, 0.5, 5,2, 65, -10) // first floor
        do_floor("texture/im-4-stickers-deco-Mosaiques-12x12cm-style-AzulejosCarreaux-de-ciment-Vert.jpg", 50, 25, 0.5, 10,4, 30, 200) // Sol pour les tours
         // azulejos-oscuro.jpg // 166280_2322900.jpg / im-4-stickers-deco-Mosaiques-12x12cm-style-AzulejosCarreaux-de-ciment-Vert.jpg
         // do_floor("texture/Mosaique-pate-de-verre-CY29-VERT-TURQUOISE-zoom.jpg", 75, 135, 0.5, 2,1, 175, -20) //
         // do_floor("texture/Mosaique-pate-de-verre-CY08-ROSE-PARME-zoom.jpg", 75, 75, 0.5, 2,1, 175, -20) //
         do_floor("texture/azulejos-oscuro.jpg", 75, 135, 0.5, 1,1, 175, -22) // second floor
         do_floor("texture/azulejos-oscuro.jpg", 75, 75, 0.5, 2,3, 120, -40) // first floor
         do_floor("texture/166280_2322900.jpg", 78, 135, 0.5, 1,4, 60, -75) // second floor
         // mosaique-emaux-blanc-pur-103-pas-zoom.jpg

        // Tableaux rez de chaussée Shadoks

        dict_tabl_ff = {}
        big_tabl_size_ff = 8
        level0_ff = 55
        level1_ff = 45
        // dict_tabl_ff[1] = tableau("images/Shadok/bien_mal.jpg",big_tabl_size_ff, 10,0,  level0_ff, Math.PI/2)                  //
        // dict_tabl_ff[2] = tableau("images/Shadok/cerveau_fatigue.jpg",big_tabl_size_ff, 10,-15, level0_ff, Math.PI/2)           //
        // dict_tabl_ff[3] = tableau("images/Shadok/faut_y_aller.jpg",big_tabl_size_ff, 10,-30, level0_ff, Math.PI/2)  //
        // dict_tabl_ff[4] = tableau("images/Shadok/solutions.jpg",big_tabl_size_ff, 10,-45, level0_ff, Math.PI/2)  //
        // dict_tabl_ff[5] = tableau("images/Shadok/passoire.jpg",big_tabl_size_ff, 10,-60, level0_ff, Math.PI/2)  //
        // //-----------
        //dict_tabl_ff[6] = tableau("images/Shadok/connerie_intelligence.jpg",big_tabl_size_ff, 10,0,  level1_ff, Math.PI/2)    //

        //dict_tabl_ff[7] = tableau("images/Shadok/trop_intelligent.jpg",big_tabl_size_ff, 10,-15, level1_ff, Math.PI/2)
        //dict_tabl_ff[7] = tableau("images/Shadok/trop_intelligent.jpg",50, 10,-15, 50, Math.PI/2)           //
        // dict_tabl_ff[8] = tableau("images/Shadok/intérieur.jpg",big_tabl_size_ff, 10,-30, level1_ff, Math.PI/2)  //
        // dict_tabl_ff[9] = tableau("images/Shadok/précaution.jpg",big_tabl_size_ff, 10,-45, level1_ff, Math.PI/2)  //
        // dict_tabl_ff[10] = tableau("images/Shadok/réessayer.jpg",big_tabl_size_ff, 10,-60, level1_ff, Math.PI/2)  //
        //----------
        dict_tabl_ff[1] = tableau("images/Shadok/connerie_intelligence.jpg",40, 7,-30, level1_ff, Math.PI/2)
        dict_tabl_ff[2] = tableau("images/Shadok/solutions.jpg",40, 90,-30, level1_ff, 3*Math.PI/2)
        dict_tabl_ff[3] = tableau("images/Shadok/bien_mal.jpg",30, 30,-65, level1_ff, 0)
        dict_tabl_ff[4] = tableau("images/Shadok/précaution.jpg",30, 30,18,47, Math.PI)

        for (i=1; i<Object.keys(dict_tabl_ff).length+1; i++){
             scene.add( dict_tabl_ff[i] )
        }
        //----- The four columns, pillars, grandes tours en porcelaine

        var column_tower_dic = {}

        var space_col = 20
        height_tow = 20
        var column_tower_base = column_torsed("texture/azulejos_portugal.jpg", 15, 0,0,0, height_tow) // door
        for (i=0;i<4; i++){
            column_tower_dic[2*i] = column_tower_base.clone()
            column_tower_dic[2*i].position.set(45,10,80+space_col*i)
            column_tower_dic[2*i+1] = column_tower_base.clone()
            column_tower_dic[2*i+1].position.set(80,10,80+space_col*i)
        }

        for (i=0; i<Object.keys(column_tower_dic).length+1; i++){
          group.add( column_tower_dic[i] )
        }

        //--------- Ball

        posz_ball = -10
        size_ball = 2
        ball_dic = {}
        ball_dic[0] = ball("texture/verre-souffle-bariole-bar014.jpg", size_ball, 50,30, posz_ball-5)
        ball_dic[1] = ball("texture/bariolé_clair.jpeg", size_ball, 40,30, posz_ball+5)
        ball_dic[2] = ball("texture/verre-souffle-bariole-bar233.jpg", size_ball, 30,30, posz_ball-3)
        for (i=0; i < Object.keys(ball_dic).length+1; i++){
              group.add( ball_dic[i] )
        }

        //---------------
        ceil = ceiling_white(90,90, 50,66.5,-20)
        group.add( ceil )

        //------------- Road

        //road_white(10, 5, 0, 40, 100)

        // Meander

        // meander("texture/water_water.jpg", 5,700, -1000,22,50, 80, 500, 400, 0)

        // Grille ondulant dans les deux sens

        var dic_grille = {}
        height_grid = 63
        height_grid1 = 120
        // for (i=0; i<5; i++){
        //     dic_grille[i] = wavy_grid(2,2, 0,height_grid,-85+i*13)
        //     dic_grille[i].rotation.set(0,Math.PI/2,0)
        // }
        dic_grille[0] = wavy_grid(2,2, 0,height_grid,-85)
        dic_grille[0].rotation.set(0,Math.PI/2,0)
        dic_grille[1] = wavy_grid(2,2, 0,height_grid,-72)
        dic_grille[1].rotation.set(0,Math.PI/2,0)
        dic_grille[2] = wavy_grid(2,2, 0,height_grid,-59)
        dic_grille[2].rotation.set(0,Math.PI/2,0)
        dic_grille[3] = wavy_grid(2,2, 0,height_grid,-46)
        dic_grille[3].rotation.set(0,Math.PI/2,0)
        dic_grille[4] = wavy_grid(2,2, 0,height_grid,-33)
        dic_grille[4].rotation.set(0,Math.PI/2,0)
        dic_grille[5] = wavy_grid(2,2, 0,height_grid,-20)
        dic_grille[5].rotation.set(0,Math.PI/2,0)
        dic_grille[6] = wavy_grid(2,2, 33,height_grid,0)
        dic_grille[7] = wavy_grid(2,2, 20,height_grid,0)
        grid_up_z = 0
        dic_grille[8] = wavy_grid(2,2, 69,height_grid1,grid_up_z)
        dic_grille[9] = wavy_grid(2,2, 82,height_grid1,grid_up_z)
        dic_grille[10] = wavy_grid(2,2, 56,height_grid1,grid_up_z)

        for (i=0; i < Object.keys(dic_grille).length+1; i++){
              group.add( dic_grille[i] )
              }

        // Cages, tours, towers, faïence

        dic_cage[1] = cage(60,80,90) // Ascenseur au milieu des tours..
        dic_cage[2] = cage(60,130,150) // Ascenseur au milieu des tours..
        dic_cage[3] = cage(60,180,210) // Ascenseur au milieu des tours..
        for (i=1; i < Object.keys(dic_cage).length+1; i++){
              dic_cage_speed[i] = 5 + Math.random()*3
              scene.add( dic_cage[i] )
              }
        sg_up0 = simple_grid(140,75,-20, "textures/hardwood2_diffuse.jpg")
        scale_simple_grid = 2.5
        sg_up0.scale.set(scale_simple_grid, scale_simple_grid, scale_simple_grid)
        group.add( sg_up0 )

        //---------- Puppet

        pup0 = puppet(40,30,-20,0) // , 0xffffee
        pup0.rotation.y = 3*Math.PI/2
        scene.add( pup0 )

        gift0 = gift("texture/gift-boxes.jpg", 5, 37,30,-10, Math.PI/3)
        scene.add( gift0 )

        var chemi = cheminey(190, 210, -190)
        //chemi.scale.set(20,20,20)
        scene.add( chemi );

        //-------smoke from cheminey

        elarg = 2
        for (i=1; i<30; i++){
            var geom_smoke = new THREE.TorusGeometry( 10, 1, 5, 100 );
            var mat_smoke = new THREE.MeshBasicMaterial( { color: 0xffffff } );
            dic_smoke[i] = new THREE.Mesh( geom_smoke, mat_smoke );
            dic_smoke[i].rotation.x = Math.PI/2
            dic_smoke[i].position.set(190, 200+40+15*i, -190)
            dic_smoke_speed[i] = 5
            scene.add(dic_smoke[i])
        }

      bouquet0 = bouq0(20,30,41)
      bouquet1 = bouq0(160,30,-170,6) // 170,40,-170
      var bouquet2 = bouq0(95,75,-220,4)
      //dic_bouq = {}
      for (i=1; i<40; i++){
        var bouq = bouquet2.clone()
        bouq.position.set(0,0,-i*10*Math.random())
        scene.add(bouq)
        // var bouquet = bouq0(95,75,-220-i*10,4) // 170,40,-170
        // scene.add(bouquet)
        //bouquet3 = bouq0(95,75,-250,4) // 170,40,-170
      }


      scene.add(bouquet0)
      scene.add(bouquet1)



} // end group building
