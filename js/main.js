var isHighScore = false;
// setup on clicks

var lockFunction =  window.screen.orientation.lock;

function onComplete( playerScore ) {
  // initilize firebase database reference
  firebase.initializeApp({
    apiKey: "AIzaSyB4wXRHi-0m6buDyfMUoFjSx64OIuK_BBE",
    authDomain: "wood-labyrinth.firebaseapp.com",
    databaseURL: "https://wood-labyrinth.firebaseio.com",
    storageBucket: "wood-labyrinth.appspot.com"
  });
  // get scoreboard reference from database
  var scoreboard = firebase.database().ref('scoreboard');

  // create empty high score array
  var highScoreArray = [];
  // get scores data
  scoreboard.orderByChild("score").on("value", function ( fbScores ) {
    // loop through scores data
    fbScores.forEach(function( fbScore ) {
      // create object and add to array of highscores
      highScoreArray.unshift({
        name: fbScore.val().name,
        score: fbScore.val().score,
        key: fbScore.key
      });
    });
    // determin whether the player's score is top 10 or not
    if ( playerScore > highScoreArray[9] ) {
      isHighScore = true;
    }
  });
}

function onSubmit( playerScore ) {
  //get player name from input fields
  var playerName = 'ABC';
  // create key for input
  var key = database.ref().child("scoreboard").push().key;
  // remove 10th score
  scoreboard.child(highScoreArray[9].key).remove();
  // add player score
  database.ref( "scoreboard/" + key ).set({
    score: playerScore,
    name: playerName
  });
}

var engine, scene, canvas, light, lightRig, camera, wallLeft, ball, ballMat, target, score;

var totalFrames = 0;
var wallColor = new BABYLON.Color3( 255/255, 115/255, 0/255 );
var obsticalColor = new BABYLON.Color3( 158/255, 217/255, 255/255 );
var ballColor = new BABYLON.Color3( 160/255, 160/255, 160/255 );
var targetColor = new BABYLON.Color3( 75/255, 216/255, 100/255 );
var wallHeight = 60;
var wallsWidth = 45;
var wallsDepth = 4;
var isPlaying = false;

var playAgainButton = document.getElementById('playAgainButton');
var startButton = document.getElementById('startContainer_startButton');
var fullScreenButton = document.getElementById('startContainer_fullScreen');

startButton.addEventListener("click", function() {
  isPlaying = true;
  ball.physicsImpostor.setMass( 100 );
  var startContainer = document.getElementById('startContainer');
  startContainer.style.display = 'none';
  // request full screen on chrome
  canvas.webkitRequestFullScreen();
  // lock screen after full screen is set on chrome
  lockFunction.call(window.screen.orientation, 'portrait-primary');
});


playAgainButton.addEventListener("click", function() {
  location.reload();
});

document.getElementById('submit').addEventListener("click", function() {
  if (document.getElementById('nameInput').value !== '') {
    uploadScoreToFirebase();
    document.getElementById('winContainer').style.display = 'none';
    getHighScores();
    document.getElementById('highScores').style.display = 'block';
  } else {
    document.getElementById('requiredFieldWarning').style.display = "block";
  }
}, false);

function uploadScoreToFirebase() {
  var key = database.ref().child("scoreboard").push().key;
  var name = document.getElementById('nameInput').value;
  // Add the score to firebase
  database.ref( "scoreboard/" + key ).set({
    score: score,
    name: name
  });
}

init();

function createScene() {
  scene = new BABYLON.Scene( engine );
  scene.enablePhysics( new BABYLON.Vector3( 0, 0, 0 ), new BABYLON.OimoJSPlugin());
  scene.clearColor = wallColor;

  // camera
  camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3( 0, 60, 0 ), scene );
  camera.setTarget( BABYLON.Vector3.Zero() );

  // point light
  light = new BABYLON.PointLight( "light", new BABYLON.Vector3( 0, 50, 0 ), lightRig );
  light.intensity = 1;
  light.specular = new BABYLON.Color3(0.2, 0.2, 0.2);
  
  lightRig = BABYLON.MeshBuilder.CreateBox("lightRig", {height: 120, width: 120, depth: 120}, scene);
  light.parent = lightRig;

  // create ball
  ball = BABYLON.MeshBuilder.CreateSphere( "ball", { diameter: 3 }, scene );
  ball.position = new BABYLON.Vector3( -21, 1.5, 28.5 );
  ball.physicsImpostor = new BABYLON.PhysicsImpostor( ball, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.2, restitution: 0.8}, scene );
  ballMat = new BABYLON.StandardMaterial( "ballMat", scene );
  ballMat.diffuseColor = ballColor;
  ballMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  ballMat.emissiveFresnelParameters = new BABYLON.FresnelParameters();
  ballMat.emissiveFresnelParameters.power = 0.1;
  ballMat.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
  ballMat.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();
  ball.material = ballMat;

  var wallMat = new BABYLON.StandardMaterial( "wallMat", scene );
  wallMat.diffuseColor = wallColor;
  wallMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  wallMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  // background
  // var background = BABYLON.MeshBuilder.CreateGround( "background", { width: wallsWidth * 2, height: wallHeight * 2 }, scene );
  // background.position = new BABYLON.Vector3( 0, -10, 0 );
  // background.material = wallMat;

  // walls
  var floorPart1 = BABYLON.MeshBuilder.CreateGround( "floorPart1", { width: wallsWidth, height: wallHeight-4 }, scene );
  floorPart1.physicsImpostor = new BABYLON.PhysicsImpostor( floorPart1, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  floorPart1.position = new BABYLON.Vector3( 0, 0, 2 );
  floorPart1.material = wallMat;

  var floorPart2 = BABYLON.MeshBuilder.CreateGround( "floorPart2", { width: wallsWidth-4, height: 4 }, scene );
  floorPart2.physicsImpostor = new BABYLON.PhysicsImpostor( floorPart2, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  floorPart2.position = new BABYLON.Vector3( -2, 0, -wallHeight/2+2 );
  floorPart2.material = wallMat;

  var wallTop = BABYLON.MeshBuilder.CreateGround( "wallTop", { width: wallsWidth, height: wallsDepth }, scene );
  wallTop.physicsImpostor = new BABYLON.PhysicsImpostor( wallTop, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  wallTop.position = new BABYLON.Vector3( 0, wallsDepth/2, wallHeight/2 );
  wallTop.rotation.x = -Math.PI/2;
  wallTop.material = wallMat;

  var wallBottom = BABYLON.MeshBuilder.CreateGround( "wallBottom", { width: wallsWidth, height: wallsDepth * 1.5 }, scene );
  wallBottom.physicsImpostor = new BABYLON.PhysicsImpostor( wallBottom, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  wallBottom.position = new BABYLON.Vector3( 0, wallsDepth/4, -wallHeight/2 );
  wallBottom.rotation.x = Math.PI/2;
  wallBottom.material = wallMat;

  wallLeft = BABYLON.MeshBuilder.CreateGround( "wallLeft", { width: wallsDepth, height: wallHeight }, scene );
  wallLeft.physicsImpostor = new BABYLON.PhysicsImpostor( wallLeft, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  wallLeft.position = new BABYLON.Vector3( -wallsWidth/2, wallsDepth/2, 0 );
  wallLeft.rotation.z = -Math.PI/2;
  wallLeft.material = wallMat;

  var wallRight = BABYLON.MeshBuilder.CreateGround( "wallRight", { width: wallsDepth * 1.5, height: wallHeight }, scene );
  wallRight.physicsImpostor = new BABYLON.PhysicsImpostor( wallRight, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  wallRight.position = new BABYLON.Vector3( wallsWidth/2, wallsDepth/4, 0 );
  wallRight.rotation.z = Math.PI/2;
  wallRight.material = wallMat;


  var wallFront = BABYLON.MeshBuilder.CreateGround( "wallFront", { width: wallsWidth, height: wallHeight }, scene );
  wallFront.physicsImpostor = new BABYLON.PhysicsImpostor( wallFront, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  wallFront.position = new BABYLON.Vector3( 0, wallsDepth, 0 );
  var invisibleMat = new BABYLON.StandardMaterial( "invisibleMat", scene );
  invisibleMat.diffuseColor = new BABYLON.Color3( 0, 0, 0 );
  invisibleMat.alpha = 0;
  wallFront.material = invisibleMat;

  // target
  target = BABYLON.MeshBuilder.CreateBox("target", {height: 4, width: 4, depth: 4}, scene);
  var targetMat = new BABYLON.StandardMaterial( "targetMat", scene );
  targetMat.diffuseColor = targetColor;
  target.material = targetMat;
  target.physicsImpostor = new BABYLON.PhysicsImpostor( target, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  target.position = new BABYLON.Vector3( 20.5, -4, -28 );

  // obsticals
  var obsticalMat = new BABYLON.StandardMaterial( "wallMat", scene );
  obsticalMat.diffuseColor = obsticalColor;
  obsticalMat.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
  obsticalMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  obstical1 = BABYLON.MeshBuilder.CreateBox("obstical1", { height: 3, width: 10, depth: 1 }, scene);
  obstical1.position = new BABYLON.Vector3( -17.5, 1.5, 25 );
  obstical1.physicsImpostor = new BABYLON.PhysicsImpostor( obstical1, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical1.material = obsticalMat;

  obstical2 = BABYLON.MeshBuilder.CreateBox("obstical2", { height: 3, width: 1, depth: 15 }, scene);
  obstical2.position = new BABYLON.Vector3( -1.5, 1.5, 22.5 );
  obstical2.physicsImpostor = new BABYLON.PhysicsImpostor( obstical2, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical2.material = obsticalMat;

  obstical3 = BABYLON.MeshBuilder.CreateBox("obstical3", { height: 3, width: 8, depth: 1 }, scene);
  obstical3.position = new BABYLON.Vector3( -1.5, 1.5, 15 );
  obstical3.physicsImpostor = new BABYLON.PhysicsImpostor( obstical3, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical3.material = obsticalMat;

  obstical4 = BABYLON.MeshBuilder.CreateBox("obstical4", { height: 3, width: 41, depth: 1 }, scene);
  obstical4.position = new BABYLON.Vector3( -2, 1.5, 8 );
  obstical4.physicsImpostor = new BABYLON.PhysicsImpostor( obstical4, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical4.material = obsticalMat;

  obstical5 = BABYLON.MeshBuilder.CreateBox("obstical5", { height: 3, width: 1, depth: 35 }, scene);
  obstical5.position = new BABYLON.Vector3( 7.5, 1.5, 7 );
  obstical5.physicsImpostor = new BABYLON.PhysicsImpostor( obstical5, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical5.material = obsticalMat;

  obstical6 = BABYLON.MeshBuilder.CreateBox("obstical6", { height: 3, width: 10, depth: 1 }, scene);
  obstical6.position = new BABYLON.Vector3( 17.5, 1.5, 16 );
  obstical6.physicsImpostor = new BABYLON.PhysicsImpostor( obstical6, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical6.material = obsticalMat;

  obstical7 = BABYLON.MeshBuilder.CreateBox("obstical7", { height: 3, width: 1, depth: 12 }, scene);
  obstical7.position = new BABYLON.Vector3( 13, 1.5, 18.5 );
  obstical7.physicsImpostor = new BABYLON.PhysicsImpostor( obstical7, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical7.material = obsticalMat;

  obstical8 = BABYLON.MeshBuilder.CreateBox("obstical8", { height: 3, width: 1, depth: 3 }, scene);
  obstical8.position = new BABYLON.Vector3( 18, 1.5, 10 );
  obstical8.physicsImpostor = new BABYLON.PhysicsImpostor( obstical8, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical8.material = obsticalMat;

  obstical9 = BABYLON.MeshBuilder.CreateBox("obstical9", { height: 3, width: 10, depth: 1 }, scene);
  obstical9.position = new BABYLON.Vector3( 17.5, 1.5, 0 );
  obstical9.physicsImpostor = new BABYLON.PhysicsImpostor( obstical9, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical9.material = obsticalMat;

  obstical10 = BABYLON.MeshBuilder.CreateBox("obstical10", { height: 3, width: 1, depth: 4 }, scene);
  obstical10.position = new BABYLON.Vector3( 12, 1.5, 1.5 );
  obstical10.physicsImpostor = new BABYLON.PhysicsImpostor( obstical10, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical10.material = obsticalMat;

  obstical11 = BABYLON.MeshBuilder.CreateBox("obstical11", { height: 3, width: 12, depth: 1 }, scene);
  obstical11.position = new BABYLON.Vector3( 13, 1.5, -11 );
  obstical11.physicsImpostor = new BABYLON.PhysicsImpostor( obstical11, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical11.material = obsticalMat;

  obstical12 = BABYLON.MeshBuilder.CreateBox("obstical12", { height: 3, width: 23, depth: 1 }, scene);
  obstical12.position = new BABYLON.Vector3( 11, 1.5, -17 );
  obstical12.physicsImpostor = new BABYLON.PhysicsImpostor( obstical12, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical12.material = obsticalMat;

  obstical13 = BABYLON.MeshBuilder.CreateBox("obstical13", { height: 3, width: 1, depth: 20 }, scene);
  obstical13.position = new BABYLON.Vector3( 0, 1.5, -7 );
  obstical13.physicsImpostor = new BABYLON.PhysicsImpostor( obstical13, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical13.material = obsticalMat;

  obstical14 = BABYLON.MeshBuilder.CreateBox("obstical14", { height: 3, width: 7, depth: 1 }, scene);
  obstical14.position = new BABYLON.Vector3( 0, 1.5, 2.5 );
  obstical14.physicsImpostor = new BABYLON.PhysicsImpostor( obstical14, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical14.material = obsticalMat;

  obstical15 = BABYLON.MeshBuilder.CreateBox("obstical15", { height: 3, width: 6, depth: 1 }, scene);
  obstical15.position = new BABYLON.Vector3( -10, 1.5, 2.5 );
  obstical15.physicsImpostor = new BABYLON.PhysicsImpostor( obstical15, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical15.material = obsticalMat;

  obstical16 = BABYLON.MeshBuilder.CreateBox("obstical16", { height: 3, width: 1, depth: 6 }, scene);
  obstical16.position = new BABYLON.Vector3( -13, 1.5, 0 );
  obstical16.physicsImpostor = new BABYLON.PhysicsImpostor( obstical16, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical16.material = obsticalMat;

  obstical17 = BABYLON.MeshBuilder.CreateBox("obstical17", { height: 3, width: 9, depth: 1 }, scene);
  obstical17.position = new BABYLON.Vector3( -18, 1.5, -2.5 );
  obstical17.physicsImpostor = new BABYLON.PhysicsImpostor( obstical17, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical17.material = obsticalMat;

  obstical18 = BABYLON.MeshBuilder.CreateBox("obstical18", { height: 3, width: 19, depth: 1 }, scene);
  obstical18.position = new BABYLON.Vector3( -10, 1.5, -10 );
  obstical18.physicsImpostor = new BABYLON.PhysicsImpostor( obstical18, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical18.material = obsticalMat;

  obstical19 = BABYLON.MeshBuilder.CreateBox("obstical19", { height: 3, width: 1, depth: 5 }, scene);
  obstical19.position = new BABYLON.Vector3( -19, 1.5, -10 );
  obstical19.physicsImpostor = new BABYLON.PhysicsImpostor( obstical19, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical19.material = obsticalMat;

  obstical20 = BABYLON.MeshBuilder.CreateBox("obstical20", { height: 3, width: 10, depth: 1 }, scene);
  obstical20.position = new BABYLON.Vector3( -17.5, 1.5, -16 );
  obstical20.physicsImpostor = new BABYLON.PhysicsImpostor( obstical20, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical20.material = obsticalMat;

  obstical21 = BABYLON.MeshBuilder.CreateBox("obstical21", { height: 3, width: 1, depth: 3 }, scene);
  obstical21.position = new BABYLON.Vector3( -12, 1.5, -15 );
  obstical21.physicsImpostor = new BABYLON.PhysicsImpostor( obstical21, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical21.material = obsticalMat;

  obstical22 = BABYLON.MeshBuilder.CreateBox("obstical22", { height: 3, width: 1, depth: 14 }, scene);
  obstical22.position = new BABYLON.Vector3( -7, 1.5, -17 );
  obstical22.physicsImpostor = new BABYLON.PhysicsImpostor( obstical22, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical22.material = obsticalMat;

  obstical23 = BABYLON.MeshBuilder.CreateBox("obstical23", { height: 3, width: 10, depth: 1 }, scene);
  obstical23.position = new BABYLON.Vector3( -11.5, 1.5, -24 );
  obstical23.physicsImpostor = new BABYLON.PhysicsImpostor( obstical23, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical23.material = obsticalMat;

  obstical24 = BABYLON.MeshBuilder.CreateBox("obstical23", { height: 3, width: 1, depth: 10 }, scene);
  obstical24.position = new BABYLON.Vector3( -3, 1.5, -25 );
  obstical24.physicsImpostor = new BABYLON.PhysicsImpostor( obstical24, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical24.material = obsticalMat;

  obstical25 = BABYLON.MeshBuilder.CreateBox("obstical23", { height: 3, width: 1, depth: 10 }, scene);
  obstical25.position = new BABYLON.Vector3( 6, 1.5, -22 );
  obstical25.physicsImpostor = new BABYLON.PhysicsImpostor( obstical25, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical25.material = obsticalMat;

  obstical26 = BABYLON.MeshBuilder.CreateBox("obstical23", { height: 3, width: 1, depth: 9 }, scene);
  obstical26.position = new BABYLON.Vector3( 13, 1.5, -26 );
  obstical26.physicsImpostor = new BABYLON.PhysicsImpostor( obstical26, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstical26.material = obsticalMat;

  scene.activeCamera.fov = 0.5;
  setTimeout(function(){
    onResize();
  }, 500);
};

// get mobile device gyroscope info
window.addEventListener( "deviceorientation", function(e) {
  if ( !e.beta === null || !e.gamma === null ) {
    document.body.classList.add('body--isDesktop');
  } else {
    document.body.classList.add('body--isMobile');
  }

  var gravIntensity = 150;
  var gravX = 0;
  var gravY = 0;
  var gravZ = 0;

  var beta  = e.beta;
  var gamma = e.gamma;

  lightRig.rotation.x = beta * ( Math.PI / 180 );
  if ( beta > 90 || beta < -90 ) {
    gravX = -( gamma / 90 );
    lightRig.rotation.z = -gamma * ( Math.PI / 180 );

    if ( beta > 0 ) {
      gravY = ( beta - 90 ) / 90;
      gravZ = -1 - ( beta - 90 ) / 90;
    } else {
      gravY = ( beta + 90 ) / -90;
      gravZ = 1 - ( beta + 90 ) / 90;
    }
  } else {
    gravX = gamma / 90;
    gravZ = -beta / 90;
    gravY = -1 + ( beta / -90 );
    lightRig.rotation.z = gamma * ( Math.PI / 180 );
  }

  var ballEmissivePower = 0;
  if ( gravX > 0 ) {
    if ( gravZ > 0 ) {
      ballEmissivePower = 1 - (gravX + gravZ);
    } else {
      ballEmissivePower = 1 - (gravX + -gravZ);
    }
  } else {
    if ( gravZ > 0 ) {
      ballEmissivePower = 1 - (-gravX + gravZ);
    } else {
      ballEmissivePower = 1 - (-gravX + -gravZ);
    }
  }
  ballMat.emissiveFresnelParameters.power = ballEmissivePower * 2;

  // set gravity
  scene.getPhysicsEngine().setGravity( new BABYLON.Vector3(
      gravX * gravIntensity,
      gravY * gravIntensity,
      gravZ * gravIntensity
  ));

}, true);

window.addEventListener( "resize", onResize, false );
function onResize() {
  engine.resize();
  var zoomingSteps = 0.01;
  if ( scene.activeCamera.isCompletelyInFrustum( wallLeft ) ) {
    scene.beforeRender = function () {
      if ( scene.activeCamera.isCompletelyInFrustum( wallLeft ) ) {
        scene.activeCamera.fov -= zoomingSteps;
      }
    }
  } else if ( !scene.activeCamera.isCompletelyInFrustum( wallLeft ) ) {
    scene.beforeRender = function () {
      if ( !scene.activeCamera.isCompletelyInFrustum( wallLeft ) ) {
        scene.activeCamera.fov += zoomingSteps;
      }
    }
  }
};

function init() {
  canvas = document.getElementById( "renderCanvas" );

  engine = new BABYLON.Engine( canvas, true);
  
  createScene();
  engine.runRenderLoop( function () {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;

    if (isPlaying) {
      // calculate score
      score = Math.round(((30 - Math.log(totalFrames))) * 300);
      if (score < 0) {
        score = 0;
      }
    }

    // when the ball hits the target
    if ( ball.intersectsMesh( target, false ) ) {
      engine.stopRenderLoop();

      var winContainer = document.getElementById('winContainer');
      var scoreContainer = document.getElementById('scoreContainer');
      winContainer.style.display = 'block';
      scoreContainer.innerHTML = score;

    } else {
      totalFrames++;
    }
    scene.render();
  });
};
