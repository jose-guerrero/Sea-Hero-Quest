
var Colors = {
	white:0xd8d0d1,
	grey:0xcccccc,
	darkGrey: 0x7c7c7c,
	lightGreen: 0x8eafa6,
	yellow: 0xffd342,
	brown: 0x715337,
	lightBrown: 0x725f4c,
	red: 0xdf3636,
	blue: 0x307ddd,
	orange: 0xDB7525,
	green: 0x28b736,
	brass: 0xbca345,
};




window.addEventListener('load', init, false);

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,renderer, container, controls,loaderManager,loaded;

var sphereShape, sphereBody, world, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[];

var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

function createScene() {

	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	scene = new THREE.Scene();

	scene.fog = new THREE.Fog (0x4ca7e6, 400, 800);

	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 4000;

	renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	});

	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	container = document.getElementById('canvas');
	container.appendChild(renderer.domElement);
	window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

var hemisphereLight, shadowLight;

function createLights() {
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, 1)
	scene.add(hemisphereLight);

	shadowLight = new THREE.DirectionalLight(0xbfe0f8, .8);

	shadowLight.position.set(-300,650,350);
	shadowLight.castShadow = true;
	shadowLight.shadow.camera.left = -700;
	shadowLight.shadow.camera.right = 700;
	shadowLight.shadow.camera.top = 500;
	shadowLight.shadow.camera.bottom = -500;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;
	shadowLight.shadow.mapSize.width = 2056;
	shadowLight.shadow.mapSize.height = 2056;

	scene.add(shadowLight);
}


var Sea = function() {

	this.mesh = new THREE.Object3D();

	var geomWaves = new THREE.PlaneBufferGeometry(2000, 2000, 500, 500);
	geomWaves.rotateX(-Math.PI / 2);

	this.uniforms = {
        uMap: {type: 't', value: null},
        uTime: {type: 'f', value: 0},
        uColor: {type: 'f', value: new THREE.Color('#307ddd')},
	    fogColor:    { type: "c", value: scene.fog.color },
	    fogNear:     { type: "f", value: scene.fog.near },
	    fogFar:      { type: "f", value: scene.fog.far }
    };


    var textureLoader = new THREE.TextureLoader(loaderManager);


	var geomSeaBed = new THREE.PlaneBufferGeometry(2000, 2000, 5, 5);
	geomSeaBed.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	var matWaves = new THREE.MeshPhongMaterial( {
		color:0x307ddd,
		shading:THREE.SmoothShading,
	});
	var seaBed = new THREE.Mesh(geomSeaBed, matWaves);
	seaBed.position.set(0,0,0);
	seaBed.castShadow = false;
	seaBed.receiveShadow = true;
	this.mesh.add(seaBed);
}


function initSkybox(){

	var urls = [
		'images/skybox/sky_pos_x.png',
		'images/skybox/sky_neg_x.png',
		'images/skybox/sky_pos_y.png',
		'images/skybox/sky_neg_y.png',
		'images/skybox/sky_neg_z.png',
		'images/skybox/sky_pos_z.png'
	];

	var reflectionCube = new THREE.CubeTextureLoader(loaderManager).load( urls );
	reflectionCube.format = THREE.RGBFormat;

	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = reflectionCube;

	var material = new THREE.ShaderMaterial( {

		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide

	} ), skyBox = new THREE.Mesh( new THREE.BoxGeometry( 2000, 1000, 2000 ), material );
	skyBox.position.set(0,0,0);
	scene.add( skyBox );
}

var Beacon = function() {

	this.mesh = new THREE.Object3D();

	var matRed = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading, wireframe:false});
	var matWhite = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading, wireframe:false});

	var geomBeaconMerged = new THREE.Geometry();

	var geomBeaconBase = new THREE.CylinderGeometry( 10, 10, 7, 10, 1);
	var beaconBase = new THREE.Mesh(geomBeaconBase, matRed);
	beaconBase.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1, 0));
	beaconBase.updateMatrix();
	geomBeaconMerged.merge(beaconBase.geometry, beaconBase.matrix);

	var geomBeaconTower1 = new THREE.CylinderGeometry( 6, 8, 10, 4, 1);
	var beaconTower1 = new THREE.Mesh(geomBeaconTower1, matRed);
	beaconTower1.applyMatrix( new THREE.Matrix4().makeTranslation(0, 7.5, 0));
	beaconTower1.updateMatrix();
	geomBeaconMerged.merge(beaconTower1.geometry, beaconTower1.matrix);

	var geomBeaconTower2 = new THREE.CylinderBufferGeometry( 4.5, 5.5, 6, 4, 1);
	var beaconTower2 = new THREE.Mesh(geomBeaconTower2, matWhite);
	beaconTower2.position.set(0,13,0);
	beaconTower2.castShadow = true;
	beaconTower2.receiveShadow = true;
	this.mesh.add(beaconTower2);

	var geomBeaconTower3 = new THREE.CylinderGeometry( 3.5, 5.5, 10, 4, 1);
	var beaconTower3 = new THREE.Mesh(geomBeaconTower3, matRed);
	beaconTower3.applyMatrix( new THREE.Matrix4().makeTranslation(0, 21, 0));
	beaconTower3.updateMatrix();
	geomBeaconMerged.merge(beaconTower3.geometry, beaconTower3.matrix);

	var geomBeaconTop = new THREE.SphereGeometry( 5, 4, 5);
	var beaconTop = new THREE.Mesh(geomBeaconTop, matRed);
	beaconTop.applyMatrix( new THREE.Matrix4().makeTranslation(0, 29, 0));
	beaconTop.updateMatrix();
	geomBeaconMerged.merge(beaconTop.geometry, beaconTop.matrix);

	var beacon = new THREE.Mesh(geomBeaconMerged, matRed);
	beacon.castShadow = true;
	beacon.receiveShadow = true;
	this.mesh.add(beacon);
}

var Beacon2 = function() {

	this.mesh = new THREE.Object3D();

	var matgreen = new THREE.MeshPhongMaterial({color:Colors.green, shading:THREE.FlatShading, wireframe:false});
	var matyellow = new THREE.MeshPhongMaterial({color:Colors.yellow, shading:THREE.FlatShading, wireframe:false});

	var geomBeaconMerged = new THREE.Geometry();

	var geomBeaconBase = new THREE.CylinderGeometry( 10, 10, 7, 10, 1);
	var beaconBase = new THREE.Mesh(geomBeaconBase, matgreen);
	beaconBase.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1, 0));
	beaconBase.updateMatrix();
	geomBeaconMerged.merge(beaconBase.geometry, beaconBase.matrix);

	var geomBeaconTower1 = new THREE.CylinderGeometry( 6, 8, 10, 4, 1);
	var beaconTower1 = new THREE.Mesh(geomBeaconTower1, matgreen);
	beaconTower1.applyMatrix( new THREE.Matrix4().makeTranslation(0, 7.5, 0));
	beaconTower1.updateMatrix();
	geomBeaconMerged.merge(beaconTower1.geometry, beaconTower1.matrix);

	var geomBeaconTower2 = new THREE.CylinderBufferGeometry( 4.5, 5.5, 6, 4, 1);
	var beaconTower2 = new THREE.Mesh(geomBeaconTower2, matyellow);
	beaconTower2.position.set(0,13,0);
	beaconTower2.castShadow = true;
	beaconTower2.receiveShadow = true;
	this.mesh.add(beaconTower2);

	var geomBeaconTower3 = new THREE.CylinderGeometry( 3.5, 5.5, 10, 4, 1);
	var beaconTower3 = new THREE.Mesh(geomBeaconTower3, matgreen);
	beaconTower3.applyMatrix( new THREE.Matrix4().makeTranslation(0, 21, 0));
	beaconTower3.updateMatrix();
	geomBeaconMerged.merge(beaconTower3.geometry, beaconTower3.matrix);

	var geomBeaconTop = new THREE.SphereGeometry( 5, 4, 5);
	var beaconTop = new THREE.Mesh(geomBeaconTop, matgreen);
	beaconTop.applyMatrix( new THREE.Matrix4().makeTranslation(0, 29, 0));
	beaconTop.updateMatrix();
	geomBeaconMerged.merge(beaconTop.geometry, beaconTop.matrix);

	var beacon = new THREE.Mesh(geomBeaconMerged, matgreen);
	beacon.castShadow = true;
	beacon.receiveShadow = true;
	this.mesh.add(beacon);
}

var swayBeacon = function (){
	for (var i = 0; i <beaconArray.length; i++){
		var min = 0.005;
		var max = 0.01;
		var offset = Math.random() * (max - min) + min;
	 	beaconArray[i].mesh.rotation.z = Math.sin(Date.now() * 0.0008)  * Math.PI * 0.05 ;
		beaconArray[i].mesh.rotation.x = Math.sin(Date.now() * 0.001 + offset)  * Math.PI * 0.02 ;
		beaconArray[i].mesh.position.y = Math.sin(Date.now() * 0.001 + offset)  * -1 ;
    }
}

var Boat = function() {

	this.mesh = new THREE.Object3D();
	var cameraMesh = new THREE.Group();
	this.group = new THREE.Group();

	var matGrey = new THREE.MeshPhongMaterial({color:Colors.grey, shading:THREE.SmoothShading, wireframe:false});
	var matDarkGrey = new THREE.MeshStandardMaterial({color:Colors.darkGrey,emissive: Colors.darkGrey,emissiveIntensity: 0.25,metalness: .3,roughness: .15,	shading:THREE.FlatShading,	wireframe:false});
	var matWhite = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.SmoothShading, wireframe:false});
	var matRed = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.SmoothShading, wireframe:false});
	var matBrown = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.SmoothShading, wireframe:false});
	var matLightBrown = new THREE.MeshPhongMaterial({color:Colors.lightBrown, shading:THREE.SmoothShading, wireframe:false});
	var matLightGreen = new THREE.MeshPhongMaterial({color:Colors.lightGreen, shading:THREE.SmoothShading, wireframe:false});
	var matYellow = new THREE.MeshPhongMaterial({color:Colors.yellow, shading:THREE.SmoothShading, wireframe:false});
	var matBlueGlass = new THREE.MeshPhongMaterial({color:Colors.blue, shading:THREE.SmoothShading,	transparent: true, opacity: .6, wireframe:false});
	var matOrange = new THREE.MeshPhongMaterial({color:Colors.orange, shading:THREE.SmoothShading, wireframe:false});

	var geomWhiteMerged = new THREE.Geometry();
	var geomBrownMerged = new THREE.Geometry();
	var geomBlueMerged = new THREE.Geometry();

	var geomHull = new THREE.BoxGeometry(25,7.5,50,1,1,2);
		//bow vertices
		geomHull.vertices[2].x-=12.5;
		geomHull.vertices[5].x-=12.5;
		geomHull.vertices[5].z+=5;
		geomHull.vertices[6].x+=12.5;
		geomHull.vertices[9].x+=12.5;
		geomHull.vertices[9].z+=5;
		//Sub vertices
		geomHull.vertices[3].x-=5;
		geomHull.vertices[4].x-=5;
		geomHull.vertices[10].x+=5;
		geomHull.vertices[11].x+=5;
		//extendBoat
		geomHull.vertices[4].z-=10;
		geomHull.vertices[10].z-=10;
		geomHull.vertices[1].z-=10;
		geomHull.vertices[7].z-=10;
	geomHull.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1.25, 0) );
	var hull = new THREE.Mesh(geomHull, matRed);
	hull.updateMatrix();
	geomWhiteMerged.merge(hull.geometry, hull.matrix);


	var geomLowerRailOuter = new THREE.BoxGeometry(25,3,50,1,1,2);
	geomLowerRailOuter.vertices[2].x-=12.5;
	geomLowerRailOuter.vertices[5].x-=12.5;
	geomLowerRailOuter.vertices[6].x+=12.5;
	geomLowerRailOuter.vertices[9].x+=12.5;

	geomLowerRailOuter.vertices[2].z-=2;
	geomLowerRailOuter.vertices[5].z-=2;
	geomLowerRailOuter.vertices[6].z-=2;
	geomLowerRailOuter.vertices[9].z-=2;

	geomLowerRailOuter.vertices[4].z-=10;
	geomLowerRailOuter.vertices[10].z-=10;
	geomLowerRailOuter.vertices[1].z-=10;
	geomLowerRailOuter.vertices[7].z-=10;

	var geomLowerDeckInner = new THREE.BoxGeometry(20,3,45,1,1,2);
	geomLowerDeckInner.vertices[2].x-=10;
	geomLowerDeckInner.vertices[5].x-=10;
	geomLowerDeckInner.vertices[6].x+=10;
	geomLowerDeckInner.vertices[9].x+=10;
	geomLowerDeckInner.vertices[4].z-=9;
	geomLowerDeckInner.vertices[10].z-=9;
	geomLowerDeckInner.vertices[1].z-=9;
	geomLowerDeckInner.vertices[7].z-=9;

	var geomLowerRailInnerBSP = new ThreeBSP(geomLowerDeckInner);
	var geomLowerRailOuterBSP = new ThreeBSP(geomLowerRailOuter);
	var lowerRailBSP = geomLowerRailOuterBSP.subtract(geomLowerRailInnerBSP);

	var lowerRail = lowerRailBSP.toMesh( matBrown );

	lowerRail.position.set(0,4,0);
	lowerRail.updateMatrix();
	geomBrownMerged.merge(lowerRail.geometry, lowerRail.matrix);


	var geomUpperRailOuter = new THREE.BoxGeometry(25,1,50,1,1,2);
	geomUpperRailOuter.vertices[2].x-=12.5;
	geomUpperRailOuter.vertices[5].x-=12.5;
	geomUpperRailOuter.vertices[6].x+=12.5;
	geomUpperRailOuter.vertices[9].x+=12.5;

	geomUpperRailOuter.vertices[2].z-=2;
	geomUpperRailOuter.vertices[5].z-=2;
	geomUpperRailOuter.vertices[6].z-=2;
	geomUpperRailOuter.vertices[9].z-=2;

	geomUpperRailOuter.vertices[4].z-=10;
	geomUpperRailOuter.vertices[10].z-=10;
	geomUpperRailOuter.vertices[1].z-=10;
	geomUpperRailOuter.vertices[7].z-=10;

	var geomUpperDeckInner = new THREE.BoxGeometry(20,1,45,1,1,2);
	geomUpperDeckInner.vertices[2].x-=10;
	geomUpperDeckInner.vertices[5].x-=10;
	geomUpperDeckInner.vertices[6].x+=10;
	geomUpperDeckInner.vertices[9].x+=10;
	geomUpperDeckInner.vertices[4].z-=9;
	geomUpperDeckInner.vertices[10].z-=9;
	geomUpperDeckInner.vertices[1].z-=9;
	geomUpperDeckInner.vertices[7].z-=9;

	var geomUpperRailInnerBSP = new ThreeBSP(geomUpperDeckInner);
	var geomUpperRailOuterBSP = new ThreeBSP(geomUpperRailOuter);
	var upperRailBSP = geomUpperRailOuterBSP.subtract(geomUpperRailInnerBSP);

	var geomUpperDeckCut = new THREE.BoxGeometry(8,5,5);
	geomUpperDeckCut.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 24) );
	var geomUpperDeckCutBSP = new ThreeBSP(geomUpperDeckCut);


	var upperRailCutBSP = upperRailBSP.subtract(geomUpperDeckCutBSP);

	var upperRail = upperRailCutBSP.toMesh( matBrown );

	upperRail.position.set(0,8.5,0);
	upperRail.updateMatrix();
	geomBrownMerged.merge(upperRail.geometry, upperRail.matrix);


	// Rope railing
	var ropeCurve = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-4.5,0,-.65),
		new THREE.Vector3(-8,-3,0),
		new THREE.Vector3(-12.75,0,0.5),
		new THREE.Vector3(-13,0,0),
		new THREE.Vector3(-13,-3,-5),
		new THREE.Vector3(-13,0,-9.5),
		new THREE.Vector3(-13,0,-10.5),
		new THREE.Vector3(-13,-3,-15),
		new THREE.Vector3(-13,0,-20),
		new THREE.Vector3(-13,-3,-25),
		new THREE.Vector3(-13,0,-30),
		new THREE.Vector3(-12.5,-3,-35),
		new THREE.Vector3(-9.75,0,-39),
		new THREE.Vector3(-8,-3,-44),
		new THREE.Vector3(-3,0,-48),
		new THREE.Vector3(0,-2,-51),
		new THREE.Vector3(3,0,-48),
		new THREE.Vector3(6,-3,-44),
		new THREE.Vector3(9.75,0,-39),
		new THREE.Vector3(12.5,-3,-35),
		new THREE.Vector3(13,0,-30),
		new THREE.Vector3(14,-3,-25),
		new THREE.Vector3(13,0,-20),
		new THREE.Vector3(13,-3,-15),
		new THREE.Vector3(13,0,-10),
		new THREE.Vector3(13,-3,-5),
		new THREE.Vector3(13,0,0),
		new THREE.Vector3(12.75,0,0.5),
		new THREE.Vector3(8,-3,0),
		new THREE.Vector3(4.5,0,-.65)
		]);
	var ropeGeom = new THREE.TubeGeometry(ropeCurve, 120, .5, 8, false);

	var textRope = new THREE.TextureLoader(loaderManager).load( "images/rope.jpg" );
	textRope.wrapS = THREE.RepeatWrapping;
	textRope.wrapT = THREE.RepeatWrapping;
	textRope.repeat.set( 50, 1 );

	var matRope = new THREE.MeshStandardMaterial( {
		transparent: false,
		map: textRope,
		roughness: 1,
	});

	var rope = new THREE.Mesh(ropeGeom, matRope);
	rope.position.set(0,8.5,25);
	rope.castShadow = true;
	rope.receiveShadow = true;
	this.group.add(rope);

	// Boyes
	var geomBoatBoye = new THREE.SphereBufferGeometry(3,8,8);
	var boatBoye = new THREE.Mesh(geomBoatBoye, matRed);
	boatBoye.castShadow = true;
	boatBoye.receiveShadow = true;
	geomBoatBoye.applyMatrix( new THREE.Matrix4().makeTranslation(0, -3, 0) );
	boatBoye.position.set(14,6,0);
	boatBoye.rotation.z = Math.PI/8;
	this.group.add(boatBoye);

	var geomBoatBoyeTop = new THREE.CylinderBufferGeometry(1,2.5,2,8);
	geomBoatBoyeTop.applyMatrix( new THREE.Matrix4().makeTranslation(0,-3, 0) );
	var boatBoyeTop = new THREE.Mesh(geomBoatBoyeTop, matWhite);
	boatBoyeTop.castShadow = true;
	boatBoyeTop.receiveShadow = true;
	boatBoyeTop.position.set(0,2.5,0);
	boatBoye.add(boatBoyeTop);

	var boatBoye2 = boatBoye.clone();
	boatBoye2.position.set(-7.5, 6, -19);
	boatBoye2.rotation.z = -Math.PI/6;
	boatBoye2.rotation.y = -Math.PI/6;
	this.group.add(boatBoye2);

	// Railing
	var geomRail = new THREE.BoxGeometry(1.5,3,1.5,);
	var rail1 = new THREE.Mesh(geomRail, matRed);
	rail1.castShadow = true;
	rail1.receiveShadow = true;
	rail1.position.set(11,7,23.5);
	rail1.updateMatrix();
	geomBrownMerged.merge(rail1.geometry, rail1.matrix);

	var rail2 = rail1.clone();
	rail2.castShadow = true;
	rail2.receiveShadow = true;
	rail2.position.set(-6,7,23.5);
	rail2.updateMatrix();
	geomBrownMerged.merge(rail2.geometry, rail2.matrix);

	var rail3 = rail1.clone();
	rail3.castShadow = true;
	rail3.receiveShadow = true;
	rail3.position.set(6,7,23.5);
	rail3.updateMatrix();
	geomBrownMerged.merge(rail3.geometry, rail3.matrix);

	var rail4 = rail1.clone();
	rail4.castShadow = true;
	rail4.receiveShadow = true;
	rail4.position.set(-11,7,23.5);
	rail4.updateMatrix();
	geomBrownMerged.merge(rail4.geometry, rail4.matrix);

	var railRep = rail1.clone();
	railRep.castShadow = true;
	railRep.receiveShadow = true;
	railRep.position.set(-11,7,14);
	railRep.updateMatrix();
	geomBrownMerged.merge(railRep.geometry, railRep.matrix);

	var rail5 = rail1.clone();
	rail5.castShadow = true;
	rail5.receiveShadow = true;
	rail5.position.set(11,7,14);
	rail5.updateMatrix();
	geomBrownMerged.merge(rail5.geometry, rail5.matrix);

	var railRep2 = railRep.clone();
	railRep2.castShadow = true;
	railRep2.receiveShadow = true;
	railRep2.position.set(11,7,2);
	railRep2.updateMatrix();
	geomBrownMerged.merge(railRep2.geometry, railRep2.matrix);

	var railRep2b = railRep2.clone();
	railRep2b.castShadow = true;
	railRep2b.receiveShadow = true;
	railRep2b.position.set(-11,7,2);
	railRep2b.updateMatrix();
	geomBrownMerged.merge(railRep2b.geometry, railRep2b.matrix);

	var railRep3 = railRep.clone();
	railRep3.castShadow = true;
	railRep3.receiveShadow = true;
	railRep3.position.set(-11,7,-9.5);
	railRep3.updateMatrix();
	geomBrownMerged.merge(railRep3.geometry, railRep3.matrix);

	var railRep3b = railRep3.clone();
	railRep3b.castShadow = true;
	railRep3b.receiveShadow = true;
	railRep3b.position.set(11,7,-9.5);
	railRep3b.updateMatrix();
	geomBrownMerged.merge(railRep3b.geometry, railRep3b.matrix);

	var rail6 = rail1.clone();
	rail6.castShadow = true;
	rail6.receiveShadow = true;
	rail6.position.set(-5.5,7,-17);
	rail6.rotation.y = Math.PI/3.5;
	rail6.updateMatrix();
	geomBrownMerged.merge(rail6.geometry, rail6.matrix);

	var rail7 = rail1.clone();
	rail7.castShadow = true;
	rail7.receiveShadow = true;
	rail7.position.set(5.5,7,-17);
	rail7.rotation.y = Math.PI/3.5;
	rail7.updateMatrix();
	geomBrownMerged.merge(rail7.geometry, rail7.matrix);

	var rail8 = rail1.clone();
	rail8.castShadow = true;
	rail8.receiveShadow = true;
	rail8.position.set(0,7,-24);
	rail8.rotation.y = Math.PI/4;
	rail8.updateMatrix();
	geomBrownMerged.merge(rail8.geometry, rail8.matrix);


	//cabinet
	var cabinet = new THREE.Group();
	cabinet.position.set(0,13,10);

	var geomCabinCorner = new THREE.BoxGeometry(2,24,2);
	var cabinCorner1 = new THREE.Mesh(geomCabinCorner, matRed);
	cabinCorner1.castShadow = true;
	cabinCorner1.receiveShadow = true;
	cabinCorner1.position.set(7,14,3);
	cabinCorner1.updateMatrix();
	geomBrownMerged.merge(cabinCorner1.geometry, cabinCorner1.matrix);

	var cabinCorner2 = cabinCorner1.clone();
	cabinCorner2.castShadow = true;
	cabinCorner2.receiveShadow = true;
	cabinCorner2.position.set(-7,14,3);
	cabinCorner2.updateMatrix();
	geomBrownMerged.merge(cabinCorner2.geometry, cabinCorner2.matrix);

	var geomCabinCornerShort = new THREE.BoxGeometry(2,22,2);
	var cabinCorner3 = new THREE.Mesh(geomCabinCornerShort, matRed);
	cabinCorner3.castShadow = true;
	cabinCorner3.receiveShadow = true;
	cabinCorner3.position.set(-7,13,17);
	cabinCorner3.updateMatrix();
	geomBrownMerged.merge(cabinCorner3.geometry, cabinCorner3.matrix);

	var cabinCorner4 = cabinCorner3.clone();
	cabinCorner4.castShadow = true;
	cabinCorner4.receiveShadow = true;
	cabinCorner4.position.set(7,13,17);
	cabinCorner4.updateMatrix();
	geomBrownMerged.merge(cabinCorner4.geometry, cabinCorner4.matrix);

	//Cabin Roof
	var geomCabinRoof = new THREE.BoxGeometry(20,1,20, 2,1,1);
	geomCabinRoof.vertices[8].y+=.5;
	geomCabinRoof.vertices[9].y+=.5;
	geomCabinRoof.vertices[10].y+=.5;
	geomCabinRoof.vertices[11].y+=.5;
	var cabinRoof = new THREE.Mesh(geomCabinRoof, matBlueGlass);
	cabinRoof.position.set(0,25,10);
	cabinRoof.rotation.x = Math.PI/20;
	cabinRoof.updateMatrix();
	geomWhiteMerged.merge(cabinRoof.geometry, cabinRoof.matrix);

	var geomRoofCrest = new THREE.BoxGeometry(5,0.5,20, 2,1,1);
	geomRoofCrest.vertices[8].y+=.5;
	geomRoofCrest.vertices[9].y+=.5;
	var roofCrest = new THREE.Mesh(geomRoofCrest, matGrey);
	roofCrest.position.set(0,26,10);
	roofCrest.rotation.x = cabinRoof.rotation.x;
	roofCrest.updateMatrix();
	geomWhiteMerged.merge(roofCrest.geometry, roofCrest.matrix);

	//Cabin Walls

	var geomCabinSideWall = new THREE.BoxGeometry(1,22,12);
	geomCabinSideWall.vertices[1].y+=2.5;
	geomCabinSideWall.vertices[4].y+=2.5;
	var geomCabinSideWallCut = new THREE.CylinderGeometry(4,4,1,20);
	geomCabinSideWallCut.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
	geomCabinSideWallCut.applyMatrix(new THREE.Matrix4().makeTranslation(0, 4, 0));
	var CabinSideWallBSP = new ThreeBSP(geomCabinSideWall);
	var CabinSideWallCutBSP = new ThreeBSP(geomCabinSideWallCut);
	var CabinSideWallIntersectionBSP = CabinSideWallBSP.subtract(CabinSideWallCutBSP);
	var cabinSideWallR = CabinSideWallIntersectionBSP.toMesh(matRed);
	cabinSideWallR.position.set(6.5,13,10);
	cabinSideWallR.updateMatrix();
	geomWhiteMerged.merge(cabinSideWallR.geometry, cabinSideWallR.matrix);

		//Cabin SideWindows
		var geomCabinSideWindowFrame = new THREE.CylinderGeometry(4,4,1.5,20);
		var geomCabinSideWindowFrameCut = new THREE.CylinderGeometry(3.5,3.5,1.5,20);
		var geomCabinSideWindowFrameBSP = new ThreeBSP(geomCabinSideWindowFrame);
		var geomCabinSideWindowFrameCutBSP = new ThreeBSP(geomCabinSideWindowFrameCut);
		var CabinSideWindowFrameIntersectionBSP = geomCabinSideWindowFrameBSP.subtract(geomCabinSideWindowFrameCutBSP);
		var cabinSideWindowFrame = CabinSideWindowFrameIntersectionBSP.toMesh(matGrey);
		cabinSideWindowFrame.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
		cabinSideWindowFrame.position.set(6.5,17,10);
		cabinSideWindowFrame.updateMatrix();
		geomWhiteMerged.merge(cabinSideWindowFrame.geometry, cabinSideWindowFrame.matrix);


		var geomCabinSideWindow = new THREE.CylinderGeometry(3.5,3.5,1,20);
		geomCabinSideWindow.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
		var cabinSideWindow = new THREE.Mesh(geomCabinSideWindow, matBlueGlass);
		cabinSideWindow.position.set(6.5,17,10);
		cabinSideWindow.updateMatrix();
		geomBlueMerged.merge(cabinSideWindow.geometry, cabinSideWindow.matrix);

		var cabinSideWallL = cabinSideWallR.clone();
		cabinSideWallL.position.set(-6.5,13,10);
		cabinSideWallL.updateMatrix();
		geomWhiteMerged.merge(cabinSideWallL.geometry, cabinSideWallL.matrix);

		var cabinSideWindowFrameL = cabinSideWindowFrame.clone();
		cabinSideWindowFrameL.position.set(-6.5,17,10);
		cabinSideWindowFrameL.updateMatrix();
		geomWhiteMerged.merge(cabinSideWindowFrameL.geometry, cabinSideWindowFrameL.matrix);

		var cabinSideWindowL = cabinSideWindow.clone();
		cabinSideWindowL.position.set(-6.5,17,10);
		cabinSideWindowL.updateMatrix();
		geomBlueMerged.merge(cabinSideWindowL.geometry, cabinSideWindowL.matrix);


	var geomCabinFrontWall = new THREE.BoxGeometry(12,24,1,5);
	var geomCabinFrontWallCut = new THREE.BoxGeometry(9,12,1,5);
	geomCabinFrontWallCut.vertices[0].y-=2.5;
	geomCabinFrontWallCut.vertices[1].y-=2.5;
	geomCabinFrontWallCut.vertices[4].y-=2.5;
	geomCabinFrontWallCut.vertices[5].y-=2.5;

	geomCabinFrontWallCut.applyMatrix( new THREE.Matrix4().makeTranslation(0, 3, 0));
	var CabinFrontWallBSP = new ThreeBSP(geomCabinFrontWall);
	var CabinFrontWallCutBSP = new ThreeBSP(geomCabinFrontWallCut);
	var CabinFrontWallIntersectionBSP = CabinFrontWallBSP.subtract(CabinFrontWallCutBSP);
	var cabinFrontWall = CabinFrontWallIntersectionBSP.toMesh(matWhite);
	cabinFrontWall.position.set(0,14.5,3.5);
	cabinFrontWall.updateMatrix();
	geomWhiteMerged.merge(cabinFrontWall.geometry, cabinFrontWall.matrix);

	var geomCabinBackWall = new THREE.BoxGeometry(12,22,1);
	var geomCabinBackWallCut = new THREE.BoxGeometry(8,16,1);
	///geomCabinBackWallCut.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 0));
	var CabinBackWallBSP = new ThreeBSP(geomCabinBackWall);
	var CabinBackWallCutBSP = new ThreeBSP(geomCabinBackWallCut);
	var CabinBackWallIntersectionBSP = CabinBackWallBSP;
	var cabinBackWall = CabinBackWallIntersectionBSP.toMesh(matBrown);
	cabinBackWall.position.set(0,13,16.5);
	cabinBackWall.updateMatrix();
	geomWhiteMerged.merge(cabinBackWall.geometry, cabinBackWall.matrix);

	var geomCabinDoor = new THREE.BoxGeometry(8,16,1);
	var geomCabinDoorCut = new THREE.CylinderGeometry(2,2,1,20);
	///geomCabinDoorCut.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	///geomCabinDoorCut.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
	var CabinDoorBSP = new ThreeBSP(geomCabinDoor);
	var CabinDoorCutBSP = new ThreeBSP(geomCabinDoorCut);
	var CabinDoorlIntersectionBSP = CabinDoorBSP;
	var cabinDoor = CabinDoorlIntersectionBSP.toMesh(matRed);
	cabinDoor.position.set(0,13,17.5);
	cabinDoor.updateMatrix();
	geomWhiteMerged.merge(cabinDoor.geometry, cabinDoor.matrix);
/*
	var geomCabinDoorWindow = new THREE.CylinderGeometry(2,2,1,20);
	geomCabinDoorWindow.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	geomCabinDoorWindow.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
	var cabinDoorWindow = new THREE.Mesh(geomCabinDoorWindow, matBlueGlass);
	cabinDoorWindow.position.set(0,13,17.5);
	cabinDoorWindow.updateMatrix();
	geomBlueMerged.merge(cabinDoorWindow.geometry, cabinDoorWindow.matrix);*/




	//Engine Block
	this.engineBlock = new THREE.Group();
	this.engineBlock.position.set(0,2.5,23);
	var engineBlockOffset = new THREE.Group();
	engineBlockOffset.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 4) );

	var geomEngineMain = new THREE.BoxBufferGeometry(5,11,3);
	geomEngineMain.applyMatrix( new THREE.Matrix4().makeTranslation(0, -1.5, 0) );
	var engineMain = new THREE.Mesh(geomEngineMain, matGrey);
	engineMain.castShadow = true;
	engineMain.receiveShadow = true;
	engineBlockOffset.add(engineMain);

	var geomEngineUpper = new THREE.BoxBufferGeometry(5,3,6);
	var engineUpper = new THREE.Mesh(geomEngineUpper, matGrey);
	engineUpper.position.set(0,4.5,-1.5);
	engineMain.add(engineUpper);

	var geomEngineTop = new THREE.BoxGeometry(5,2,6);
	geomEngineTop.vertices[1].x-=1;
	geomEngineTop.vertices[4].x+=1;
	geomEngineTop.vertices[5].x+=1;
	geomEngineTop.vertices[0].x-=1;

	var engineTop = new THREE.Mesh(geomEngineTop, matRed);
	engineTop.castShadow = true;
	engineTop.receiveShadow = true;
	engineTop.position.set(0,2.5,0);
	engineUpper.add(engineTop);

	//Propellor

	this.propellor = new THREE.Group();
	this.propellor.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
	this.propellor.position.set(0,-6,2.5);
	this.propellor.scale.set(.6,.6,.6);

	var geomPropMerged = new THREE.Geometry();

	var geomPropCore = new THREE.CylinderGeometry( 2, 2, 4, 8, 1);
	var propCore = new THREE.Mesh(geomPropCore, matBrown);
	propCore.updateMatrix();
	geomPropMerged.merge(propCore.geometry, propCore.matrix);


	var geomPropBlade = new THREE.BoxGeometry( 3, .5, 5);
	var propBlade1 = new THREE.Mesh(geomPropBlade, matBrown);
	propBlade1.castShadow = true;
	propBlade1.receiveShadow = true;
	propBlade1.position.set(0,0,-3.5);
	propBlade1.rotation.z = Math.PI/10;
	propBlade1.updateMatrix();
	geomPropMerged.merge(propBlade1.geometry, propBlade1.matrix);

	var propBlade2 = propBlade1.clone();
	propBlade2.position.set(3.5,0,0);
	propBlade2.rotation.y = Math.PI/2;
	propBlade2.rotation.z = -propBlade1.rotation.z;
	propBlade2.updateMatrix();
	geomPropMerged.merge(propBlade2.geometry, propBlade2.matrix);

	var propBlade3 = propBlade1.clone();
	propBlade3.position.set(0,0,3.5);
	propBlade3.rotation.z = -propBlade1.rotation.z;
	propBlade3.updateMatrix();
	geomPropMerged.merge(propBlade3.geometry, propBlade3.matrix);

	var propBlade4 = propBlade2.clone();
	propBlade4.position.set(-3.5,0,0);
	propBlade4.rotation.z = -propBlade2.rotation.z *2;
	propBlade4.updateMatrix();
	geomPropMerged.merge(propBlade4.geometry, propBlade4.matrix);

	var propMerged = new THREE.Mesh(geomPropMerged, matBrown);
	propMerged.castShadow = true;
	propMerged.receiveShadow = true;
	this.propellor.add(propMerged);


	engineBlockOffset.add(this.propellor);

	this.engineBlock.add(engineBlockOffset);

	this.group.add(this.engineBlock);

	var whiteGeom = new THREE.Mesh(geomWhiteMerged, matYellow);
	whiteGeom.castShadow = true;
	whiteGeom.receiveShadow = true;
	this.group.add(whiteGeom);

	var brownGeom = new THREE.Mesh(geomBrownMerged, matBrown);
	brownGeom.castShadow = true;
	brownGeom.receiveShadow = true;
	this.group.add(brownGeom);

	var blueGeom = new THREE.Mesh(geomBlueMerged, matBlueGlass);
	blueGeom.castShadow = true;
	blueGeom.receiveShadow = true;
	this.group.add(blueGeom);

	//var greyGeom = new THREE.Mesh(geomGreyMerged, matDarkGrey);
	//greyGeom.castShadow = true;
	//greyGeom.receiveShadow = true;
	//this.group.add(greyGeom);

	// Anchor Camera to Boat

	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
		);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set(0,30,100);

	cameraMesh.add(camera);

	cameraMesh.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, -24) );

	cameraMesh.add(this.group);

	this.mesh.add(cameraMesh);
/*
	var listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio sourcevar sound = new THREE.Audio( listener );
var sound = new THREE.Audio( listener );
// load a sound and set it as the Audio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load( 'sounds/tetris.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	sound.play();
});*/

}



Boat.prototype.swayBoat = function (){

	boat.group.rotation.z = Math.sin(Date.now() * 0.001) * Math.PI * 0.01 ;
	boat.group.rotation.x = Math.sin(Date.now() * 0.002) * Math.PI * 0.01 ;
	boat.group.rotation.y = Math.sin(Date.now() * 0.001) * Math.PI * 0.01 ;
	boat.engineBlock.rotation.z = Math.sin(Date.now() * 0.05) * Math.PI * 0.005 ;
}



var beaconArray = [];
var sea, boat, desertIsland, beacon,loader;


function createSea(){
	sea = new Sea();
	scene.add(sea.mesh);
	sea.mesh.castShadow = false;
	sea.mesh.receiveShadow = true;
}

function createBoat(){
	boat = new Boat();
	boat.mesh.position.set(550,0.25,502);
	boat.mesh.scale.set(0.5,0.5,0.5);
	scene.add(boat.mesh);
}

function createBeacon(x,y,z){
	beacon = new Beacon();
	beacon.mesh.position.set(x, y, z);
	beacon.mesh.scale.set(0.5,0.5,0.5);
	scene.add(beacon.mesh);
	beaconArray.push(beacon);
}

function createBeacon2(x,y,z){
	beacon = new Beacon2();
	beacon.mesh.position.set(x, y, z);
	beacon.mesh.scale.set(0.5,0.5,0.5);
	scene.add(beacon.mesh);
	beaconArray.push(beacon);
}

function createYacht(){

	var marker = new THREE.Object3D();
	scene.add(marker);

		var mtlLoader = new THREE.MTLLoader();
		var yatch_1;
				mtlLoader.load("./obj/rio/materials.mtl", function( materials ) {
						materials.preload();

						var objLoader = new THREE.OBJLoader();
						objLoader.setMaterials( materials );
						objLoader.load("./obj/rio/model.obj", function ( object ) {

							object.position.z = 0;
							object.position.y = 50;

							object.scale.set(100,100,100);
							marker.add(object);
						});

					});

 }



var conos = 5;
var tomado=[false,false,false,false,false];

function init() {


	var taken = new Array(20);

	for (let i=0;i<20;i++)
	{
		taken[i]=false;
	}

	var possible_buoys =
	   [
			  [511,0.25,338],
			 [277,0.25,-486],
			 [-200,0.25,-594],
			 [-496,0.25,-576],
			 [27,0.25,-384],
			 [248,0.25,503],
			 [-49,0.25,695],
			 [-361,0.25,-365],
			 [-622,0.25,-86],
			 [527,0.25,-79],
			 [-497,0.25,337],
			 [29,0.25,489],
			 [-472,0.25,106],
			 [-254,0.25,340],
			 [563,0.25,-408],
			 [-509,0.25,-331],
			 [-236,0.25,493],
		 	 [491,0.25,592],
		 	 [630,0.25,146]
		 ];


	createScene();
	createLights();
	createYacht();
	createSea();
	createBoat();
	initSkybox();



	for (let i=0;i<5;i++)
	{
		let randomi;
		while (1)
		{
			randomi =  Math.floor(Math.random()*19);
			console.log(taken[randomi]);
			if (taken[randomi] !== true)
			{
				break;
			}
		}

		console.log(randomi);
		taken[randomi] = true;
		createBeacon(possible_buoys[randomi][0],0.25,possible_buoys[randomi][2]);
	}


/*
	createBeacon( Math.random() * ((-480) - (-700)) + (-700), 0.25, Math.random() * ((-480) - (-700)) + (-700));
	createBeacon( Math.random() * ((700) - (480)) + (480), 0.25, Math.random() * ((-480) - (-700)) + (-700));
	createBeacon( Math.random() * ((-480) - (-700)) + (-700), 0.25, Math.random() * ((700) - (480)) + (480));
	createBeacon( Math.random() * ((-480) - (-700)) + (-700), 0.25, Math.random() * ((700) - (480)) + (480));
	createBeacon( Math.random() * ((700) - (480)) + (480), 0.25,Math.random() * ((700) - (480)) + (480));
*/
	///initTime();
	loop();
}



function loop(e){
	sea.uniforms.uTime.value = e * 0.001;
	swayBeacon();
	boat.swayBoat();

	renderer.render(scene, camera);
	requestAnimationFrame(loop);
	animation();
}

function animation (){


	var delta = clock.getDelta(); // seconds.

		//BOAT ANIMATIONS
	//////////////////////////

		var rotateAngle = Math.PI / 3.5 * delta;
		var propellorAngle = -Math.PI * 4 * delta;   // degrees per second
		var moveDistance = 100 * delta; // 100 pixels per second

		//Engine Idle
		boat.propellor.rotateOnAxis( new THREE.Vector3(0,1,0), propellorAngle/8);

		//Engine Rotation
		var engineY = boat.engineBlock.rotation.y;
		var maxEngineY = .8;


	//BOAT CONTROLS
	//////////////////////////
	if ( keyboard.pressed("Q")) {
		var modal = document.getElementById('myModal2');
		modal.style.display = "block";
   }

		if ( keyboard.pressed("W") ) {
			boat.mesh.translateZ( -moveDistance );

			boat.propellor.rotateOnAxis( new THREE.Vector3(0,1,0), propellorAngle);
		}

		if ( keyboard.pressed("S") ) {
			boat.mesh.translateZ(  moveDistance );

			boat.propellor.rotateOnAxis( new THREE.Vector3(0,1,0), -propellorAngle);
		}

		if ( keyboard.pressed("A") ) {
			setTimeout(function(){
				boat.mesh.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
			}, 100);

			if (keyboard.pressed("S")) {
				boat.engineBlock.rotation.y = THREE.Math.clamp(engineY + (delta*2.5), -maxEngineY, maxEngineY);
			} else {
				boat.engineBlock.rotation.y = THREE.Math.clamp(engineY - (delta*2.5), -maxEngineY, maxEngineY);
			}

			if ( ! (keyboard.pressed("W") || keyboard.pressed("S"))) {
				boat.propellor.rotateOnAxis( new THREE.Vector3(0,1,0), propellorAngle);
			}
		}

		if ( keyboard.pressed("D") ){
			setTimeout(function(){
				boat.mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
			}, 100);

			if (keyboard.pressed("S")) {
				boat.engineBlock.rotation.y = THREE.Math.clamp(engineY - (delta*2.5), -maxEngineY, maxEngineY);
			} else {
				boat.engineBlock.rotation.y = THREE.Math.clamp(engineY + (delta*2.5), -maxEngineY, maxEngineY);
			}


			if ( ! (keyboard.pressed("W") || keyboard.pressed("S"))) {
				boat.propellor.rotateOnAxis( new THREE.Vector3(0,1,0), propellorAngle);
			}
		}

		// Steering Decay

		if ( ! ( keyboard.pressed("A") || keyboard.pressed("D") ) && ( keyboard.pressed("W") || keyboard.pressed("S") ) ) {

			if ( engineY > 0 ) {
				boat.engineBlock.rotation.y = THREE.Math.clamp( engineY - delta * 1.75, 0, maxEngineY );
			} else {
				boat.engineBlock.rotation.y = THREE.Math.clamp( engineY + delta * 1.75, - maxEngineY, 0 );
			}
		}

	///	console.log("x->"+boat.mesh.position.x+" z->"+boat.mesh.position.z);

	for (let i = 0; i < 5; i++)
	{
	 	let xi = boat.mesh.position.x - beaconArray[i].mesh.position.x;
		let zi = boat.mesh.position.z - beaconArray[i].mesh.position.z;

		if (Math.sqrt(xi*xi + zi*zi) < 50 && !tomado[i])
		{
			tomado[i]=true;
			conos--;
			beaconArray[i].mesh.scale.set(0.1);
			createBeacon2(beaconArray[i].mesh.position.x, beaconArray[i].mesh.position.y, beaconArray[i].mesh.position.z);

	/*		if (conos === 0)
			{
				var modal = document.getElementById('myModal');
				modal.style.display = "block"
				console.log("ganaste");
			}*/
			///console.log(i);

   if (conos === 0)
	 {
			var modal = document.getElementById('myModal');
			modal.style.display = "block";
		/////username

			let usuario = window.location.href.substr(window.location.href.indexOf("=")+1,window.location.href.length);

			$.ajax({
				type : 'POST',
			  url : "https://usernamescoredb.herokuapp.com/users",
				data: {
					"user": {"name":usuario,
										"score": parseFloat(Math.round(clock.elapsedTime * 100) / 100).toFixed(2)}
				},
				headers : {
					'Access-Control-Allow-Origin' : '*'
				},
				 success: function(response)
				 {
					 if (response === "success")
					 {
						 console.log("success");
					 }
				 }
			 });
		 }


			break;
		}
	}
	controls.update();
}
