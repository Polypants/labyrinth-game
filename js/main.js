var isHighScore = false;
var playerScore = 0;

var lockFunction = window.screen.orientation.lock;
var scoreContainer = document.getElementById('scoreContainer');
var winContainer = document.getElementById('winContainer');
var playAgainButton = document.getElementById('playAgainButton');
var startButton = document.getElementById('startContainer_startButton');
var fullScreenButton = document.getElementById('startContainer_fullScreen');
var canvas = document.getElementById('renderCanvas');
var submitButton = document.getElementById('submit');
var viewHighScores = document.getElementById('viewHighScores');
var ifHighScore = document.getElementById('ifHighScore');
var startContainer = document.getElementById('startContainer');
var highScoreArray = [];

var totalFrames = 0;
var wallColor = new BABYLON.Color3( 255/255, 115/255, 0/255 );
var obstacleColor = new BABYLON.Color3( 158/255, 217/255, 255/255 );
var ballColor = new BABYLON.Color3( 160/255, 160/255, 160/255 );
var targetColor = new BABYLON.Color3( 75/255, 216/255, 100/255 );
var wallHeight = 60;
var wallsWidth = 45;
var wallsDepth = 4;
var isPlaying = false;

var engine, scene, light, lightRig, camera, wallLeft, ball, ballMat, target, score;

// initialize firebase database reference
firebase.initializeApp({
  apiKey: "AIzaSyB4wXRHi-0m6buDyfMUoFjSx64OIuK_BBE",
  authDomain: "wood-labyrinth.firebaseapp.com",
  databaseURL: "https://wood-labyrinth.firebaseio.com",
  storageBucket: "wood-labyrinth.appspot.com"
});

// get database reference
var database = firebase.database();

// get scoreboard reference from database
var scoreboard = firebase.database().ref('scoreboard');

function onComplete() {
  // exit full screen mode
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  // show winContainer window
  winContainer.style.display = 'block';
  // set win container window score to player score
  scoreContainer.innerHTML = playerScore;
  // get scores data
  scoreboard.orderByChild('score').on('value', function(fbScores) {
    highScoreArray = [];
    // loop through scores data
    fbScores.forEach(function(fbScore) {
      // create object and add to array of high scores
      highScoreArray.unshift({
        name: fbScore.val().name,
        score: fbScore.val().score,
        key: fbScore.key
      });
    });
    // determine whether the player's score is top 10 or not
    console.log(playerScore);
    console.log(highScoreArray[9]);
    if (playerScore > highScoreArray[9].score) {
      isHighScore = true;
      viewHighScores.style.display = 'none';
      ifHighScore.style.display = 'block';
      console.log("isHighScore: " + isHighScore);
    }
  });
}

startButton.addEventListener('click', function() {
  isPlaying = true;
  ball.physicsImpostor.setMass( 100 );
  startContainer.style.display = 'none';
  // request full screen on chrome
  canvas.webkitRequestFullScreen();
  // lock screen after full screen is set on chrome
  lockFunction.call(window.screen.orientation, 'portrait-primary');
});

playAgainButton.addEventListener('click', function() {
  location.reload();
});

submitButton.addEventListener('click', function() {
  // check if initials are entered
  if (document.getElementById('nameInput').value !== '') {
    // create key for entry in firebase
    var key = database.ref().child('scoreboard').push().key;
    // get layer name from input field
    var name = document.getElementById('nameInput').value;
    // remove 10th score, if there is one
    if (highScoreArray[9] !== undefined) {
      scoreboard.child(highScoreArray[9].key).remove();
    }
    // Add the score to firebase
    database.ref( 'scoreboard/' + key ).set({
      score: playerScore,
      name: name
    });
    // hide the winContainer window
    winContainer.style.display = 'none';
    // show the high scores
    displayHighScores();
  } else {
    // show 'initials ware required' warning
    document.getElementById('requiredFieldWarning').style.display = 'block';
  }
}, false);

viewHighScores.addEventListener('click', function() {
    // hide the winContainer window
    winContainer.style.display = 'none';
    // show the high scores
    displayHighScores();
});

function displayHighScores() {
  // display high score array
  var highScoreHTML = '';
  highScoreArray.forEach( function(scoreObj) {
    var liString = '<li>' + scoreObj.name + ' ' + scoreObj.score + '</li>';
    highScoreHTML = highScoreHTML.concat(liString);
  });
  document.getElementById('highScoreList').innerHTML = highScoreHTML;
  document.getElementById('highScores').style.display = 'block';
  playAgainButton.style.display = 'block';
}

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
  light.specular = new BABYLON.Color3( 0.2, 0.2, 0.2 );
  
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

  // obstacle
  var obstacleMat = new BABYLON.StandardMaterial( "wallMat", scene );
  obstacleMat.diffuseColor = obstacleColor;
  obstacleMat.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
  obstacleMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  obstacle1 = BABYLON.MeshBuilder.CreateBox("obstacle1", { height: 3, width: 10, depth: 1 }, scene);
  obstacle1.position = new BABYLON.Vector3( -17.5, 1.5, 25 );
  obstacle1.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle1, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle1.material = obstacleMat;

  obstacle2 = BABYLON.MeshBuilder.CreateBox("obstacle2", { height: 3, width: 1, depth: 15 }, scene);
  obstacle2.position = new BABYLON.Vector3( -1.5, 1.5, 22.5 );
  obstacle2.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle2, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle2.material = obstacleMat;

  obstacle3 = BABYLON.MeshBuilder.CreateBox("obstacle3", { height: 3, width: 8, depth: 1 }, scene);
  obstacle3.position = new BABYLON.Vector3( -1.5, 1.5, 15 );
  obstacle3.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle3, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle3.material = obstacleMat;

  obstacle4 = BABYLON.MeshBuilder.CreateBox("obstacle4", { height: 3, width: 41, depth: 1 }, scene);
  obstacle4.position = new BABYLON.Vector3( -2, 1.5, 8 );
  obstacle4.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle4, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle4.material = obstacleMat;

  obstacle5 = BABYLON.MeshBuilder.CreateBox("obstacle5", { height: 3, width: 1, depth: 35 }, scene);
  obstacle5.position = new BABYLON.Vector3( 7.5, 1.5, 7 );
  obstacle5.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle5, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle5.material = obstacleMat;

  obstacle6 = BABYLON.MeshBuilder.CreateBox("obstacle6", { height: 3, width: 10, depth: 1 }, scene);
  obstacle6.position = new BABYLON.Vector3( 17.5, 1.5, 16 );
  obstacle6.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle6, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle6.material = obstacleMat;

  obstacle7 = BABYLON.MeshBuilder.CreateBox("obstacle7", { height: 3, width: 1, depth: 12 }, scene);
  obstacle7.position = new BABYLON.Vector3( 13, 1.5, 18.5 );
  obstacle7.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle7, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle7.material = obstacleMat;

  obstacle8 = BABYLON.MeshBuilder.CreateBox("obstacle8", { height: 3, width: 1, depth: 3 }, scene);
  obstacle8.position = new BABYLON.Vector3( 18, 1.5, 10 );
  obstacle8.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle8, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle8.material = obstacleMat;

  obstacle9 = BABYLON.MeshBuilder.CreateBox("obstacle9", { height: 3, width: 10, depth: 1 }, scene);
  obstacle9.position = new BABYLON.Vector3( 17.5, 1.5, 0 );
  obstacle9.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle9, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle9.material = obstacleMat;

  obstacle10 = BABYLON.MeshBuilder.CreateBox("obstacle10", { height: 3, width: 1, depth: 4 }, scene);
  obstacle10.position = new BABYLON.Vector3( 12, 1.5, 1.5 );
  obstacle10.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle10, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle10.material = obstacleMat;

  obstacle11 = BABYLON.MeshBuilder.CreateBox("obstacle11", { height: 3, width: 12, depth: 1 }, scene);
  obstacle11.position = new BABYLON.Vector3( 13, 1.5, -11 );
  obstacle11.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle11, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle11.material = obstacleMat;

  obstacle12 = BABYLON.MeshBuilder.CreateBox("obstacle12", { height: 3, width: 23, depth: 1 }, scene);
  obstacle12.position = new BABYLON.Vector3( 11, 1.5, -17 );
  obstacle12.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle12, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle12.material = obstacleMat;

  obstacle13 = BABYLON.MeshBuilder.CreateBox("obstacle13", { height: 3, width: 1, depth: 20 }, scene);
  obstacle13.position = new BABYLON.Vector3( 0, 1.5, -7 );
  obstacle13.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle13, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle13.material = obstacleMat;

  obstacle14 = BABYLON.MeshBuilder.CreateBox("obstacle14", { height: 3, width: 7, depth: 1 }, scene);
  obstacle14.position = new BABYLON.Vector3( 0, 1.5, 2.5 );
  obstacle14.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle14, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle14.material = obstacleMat;

  obstacle15 = BABYLON.MeshBuilder.CreateBox("obstacle15", { height: 3, width: 6, depth: 1 }, scene);
  obstacle15.position = new BABYLON.Vector3( -10, 1.5, 2.5 );
  obstacle15.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle15, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle15.material = obstacleMat;

  obstacle16 = BABYLON.MeshBuilder.CreateBox("obstacle16", { height: 3, width: 1, depth: 6 }, scene);
  obstacle16.position = new BABYLON.Vector3( -13, 1.5, 0 );
  obstacle16.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle16, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle16.material = obstacleMat;

  obstacle17 = BABYLON.MeshBuilder.CreateBox("obstacle17", { height: 3, width: 9, depth: 1 }, scene);
  obstacle17.position = new BABYLON.Vector3( -18, 1.5, -2.5 );
  obstacle17.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle17, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle17.material = obstacleMat;

  obstacle18 = BABYLON.MeshBuilder.CreateBox("obstacle18", { height: 3, width: 19, depth: 1 }, scene);
  obstacle18.position = new BABYLON.Vector3( -10, 1.5, -10 );
  obstacle18.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle18, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle18.material = obstacleMat;

  obstacle19 = BABYLON.MeshBuilder.CreateBox("obstacle19", { height: 3, width: 1, depth: 5 }, scene);
  obstacle19.position = new BABYLON.Vector3( -19, 1.5, -10 );
  obstacle19.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle19, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle19.material = obstacleMat;

  obstacle20 = BABYLON.MeshBuilder.CreateBox("obstacle20", { height: 3, width: 10, depth: 1 }, scene);
  obstacle20.position = new BABYLON.Vector3( -17.5, 1.5, -16 );
  obstacle20.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle20, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle20.material = obstacleMat;

  obstacle21 = BABYLON.MeshBuilder.CreateBox("obstacle21", { height: 3, width: 1, depth: 3 }, scene);
  obstacle21.position = new BABYLON.Vector3( -12, 1.5, -15 );
  obstacle21.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle21, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle21.material = obstacleMat;

  obstacle22 = BABYLON.MeshBuilder.CreateBox("obstacle22", { height: 3, width: 1, depth: 14 }, scene);
  obstacle22.position = new BABYLON.Vector3( -7, 1.5, -17 );
  obstacle22.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle22, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle22.material = obstacleMat;

  obstacle23 = BABYLON.MeshBuilder.CreateBox("obstacle23", { height: 3, width: 10, depth: 1 }, scene);
  obstacle23.position = new BABYLON.Vector3( -11.5, 1.5, -24 );
  obstacle23.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle23, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle23.material = obstacleMat;

  obstacle24 = BABYLON.MeshBuilder.CreateBox("obstacle23", { height: 3, width: 1, depth: 10 }, scene);
  obstacle24.position = new BABYLON.Vector3( -3, 1.5, -25 );
  obstacle24.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle24, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle24.material = obstacleMat;

  obstacle25 = BABYLON.MeshBuilder.CreateBox("obstacle23", { height: 3, width: 1, depth: 10 }, scene);
  obstacle25.position = new BABYLON.Vector3( 6, 1.5, -22 );
  obstacle25.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle25, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle25.material = obstacleMat;

  obstacle26 = BABYLON.MeshBuilder.CreateBox("obstacle23", { height: 3, width: 1, depth: 9 }, scene);
  obstacle26.position = new BABYLON.Vector3( 13, 1.5, -26 );
  obstacle26.physicsImpostor = new BABYLON.PhysicsImpostor( obstacle26, BABYLON.PhysicsEngine.BoxImpostor, { move: false }, scene );
  obstacle26.material = obstacleMat;

  scene.activeCamera.fov = 0.5;
  setTimeout(function(){
    onResize();
  }, 500);
};

// get mobile device gyroscope info
window.addEventListener( 'deviceorientation', function(e) {
  if ( e.beta !== null || e.gamma !== null ) {
    document.body.classList.remove('body--isDesktop');
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

(function init() {
  engine = new BABYLON.Engine(canvas, true);
  
  createScene();
  engine.runRenderLoop( function () {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;

    if (isPlaying) {
      // calculate score
      playerScore = Math.round(((30 - Math.log(totalFrames))) * 300);
      if (playerScore < 0) {
        playerScore = 0;
      }
    }

    // when the ball hits the target
    if ( ball.intersectsMesh( target, false ) ) {
      engine.stopRenderLoop();

      onComplete();

    } else {
      totalFrames++;
    }
    scene.render();
  });
}());
