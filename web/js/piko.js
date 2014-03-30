var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })
  , isDebug = false
  , isConsole = false
  , spriteScale = 300/13.8 // 21.74
  , Piko = {c:{}} // Body parts
  , piko = { // Pico settings
      bodyWidth: 6.2
    , bodyHeightFull: 8.4 // 183
    , bodyHeightLower: 8.4 - 3.1
    , bodyRadii: 3.1
    , legHeight: 2.4
    , legWidth: 0.6
    , legDistance: 1.5
    , handLength: 2.4
    , handWidth: 0.6
    , neck: 0.2
    , headHeight: 4.2
    , heightTotal: 13.8
    }
  , pikoS = { // Piko settings scaled
      center: {
        x: game.width/2
      , y: game.height/2
      }
    }
  , setRevolutionLimits = function(obj, upper, lower){
      if(lower === undefined || lower === null) lower = upper;

      obj.upperLimitEnabled = true;
      obj.upperLimit = upper;
      obj.lowerLimitEnabled = true;
      obj.lowerLimit = lower;
    }

  for(var key in piko) {if (!piko.hasOwnProperty(key)) continue;
    pikoS[key] = piko[key] * spriteScale
  }

function preload() {
  game.load.image('body', 'assets/body_s.png');
  game.load.image('head', 'assets/head_s.png');
  game.load.image('member', 'assets/member_s.png');
  game.load.image('ground', 'assets/ground.png');

  game.load.image('object_1', 'assets/object_1.png');
  game.load.image('object_2', 'assets/object_2.png');
  game.load.image('object_3', 'assets/object_3.png');

  game.load.physics('physicsData', 'assets/physics.json')
}

function create() {
  //  We're going to be using physics, so enable the Arcade Physics system
  game.physics.startSystem(Phaser.Physics.P2JS);

  game.stage.backgroundColor = isDebug ? '#DDDDDD' : '#FFFFFF';

  //  Make things a bit more bouncey
  game.physics.p2.defaultRestitution = 0.8;
  game.physics.p2.gravity.y = 200;

  if(!isDebug) game.add.text(0,0,'Press qapt to control hands, rs to control head',{});

  Piko.body = game.add.sprite(pikoS.center.x, pikoS.center.y, 'body');
  Piko.head = game.add.sprite(pikoS.center.x, pikoS.center.y - (pikoS.bodyHeightFull * 0.5 + pikoS.neck + pikoS.headHeight * 0.5), 'head')
  // Add legs
  Piko.legLeft = game.add.sprite(pikoS.center.x - pikoS.legDistance, pikoS.center.y + pikoS.bodyHeightFull * 0.5, 'member')
  Piko.legRight = game.add.sprite(pikoS.center.x + pikoS.legDistance, pikoS.center.y + pikoS.bodyHeightFull * 0.5, 'member')
  // Add hands
  var handYDisplacement = -pikoS.bodyHeightFull * 0.5 + pikoS.bodyRadii
    , handYDisplacementConstraint = -pikoS.handLength * 0.5 + pikoS.handWidth * 0.5
    , handXDisplacement = pikoS.bodyWidth / 2 - pikoS.handWidth * 0.5
  Piko.handLeft = game.add.sprite(pikoS.center.x - handXDisplacement, pikoS.center.y + handYDisplacement - handYDisplacementConstraint, 'member')
  Piko.handRight = game.add.sprite(pikoS.center.x + handXDisplacement, pikoS.center.y + handYDisplacement - handYDisplacementConstraint, 'member')

  Piko.ground = game.add.sprite(game.width / 2, game.height - 10, 'ground')

  //  Enable parts for physics. This creates a default rectangular body.
  game.physics.p2.enable([Piko.body, Piko.head, Piko.legLeft, Piko.legRight, Piko.handLeft, Piko.handRight, Piko.ground], isDebug);

  // Make ground static
  Piko.ground.body.static = true;

  // Add custom shapes
  Piko.body.body.clearShapes();
  Piko.body.body.loadPolygon('physicsData', 'body_s');
  Piko.head.body.clearShapes();
  Piko.head.body.loadPolygon('physicsData', 'head_s')
  Piko.legLeft.body.clearShapes();
  Piko.legLeft.body.loadPolygon('physicsData', 'member_s')
  Piko.legRight.body.clearShapes();
  Piko.legRight.body.loadPolygon('physicsData', 'member_s')

  Piko.c.constraintHead = game.physics.p2.createRevoluteConstraint(Piko.body, [0, -pikoS.bodyHeightFull * 0.5], Piko.head, [0, pikoS.headHeight * 0.5 + pikoS.neck]);
  setRevolutionLimits(Piko.c.constraintHead, 0)

  //  Modify a few body properties
  // sprite.body.setZeroDamping();
  // sprite.body.fixedRotation = true;

  // var constraintLegLeft = game.physics.p2.createLockConstraint(Piko.body, Piko.legLeft, [0, 0], 0);
  Piko.c.constraintLegLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [-pikoS.legDistance, pikoS.bodyHeightFull * 0.5], Piko.legLeft, [0, 0]);
  setRevolutionLimits(Piko.c.constraintLegLeft, 0, -Math.PI / 2)
  Piko.c.constraintLegRight = game.physics.p2.createRevoluteConstraint(Piko.body, [pikoS.legDistance, pikoS.bodyHeightFull * 0.5], Piko.legRight, [0, 0]);
  setRevolutionLimits(Piko.c.constraintLegRight, Math.PI / 2, 0)

  // Spring parameters: createSpring(sprite1, sprite2, restLength, stiffness, damping, worldA, worldB, localA, localB)
  Piko.legsSpring = game.physics.p2.createSpring(Piko.legLeft, Piko.legRight, handXDisplacement * 2, 4, 1, null, null, [0, handYDisplacementConstraint], [0, handYDisplacementConstraint]);

  Piko.c.constraintHandLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [-handXDisplacement, handYDisplacement], Piko.handLeft, [0, handYDisplacementConstraint]);
  setRevolutionLimits(Piko.c.constraintHandLeft, Math.PI / 6)
  Piko.c.constraintHandRight = game.physics.p2.createRevoluteConstraint(Piko.body, [+handXDisplacement, handYDisplacement], Piko.handRight, [0, handYDisplacementConstraint]);
  setRevolutionLimits(Piko.c.constraintHandRight, -Math.PI / 6)

  if (!isDebug) Piko.body.bringToTop()
  // Piko.body.body.rotateLeft(45)

  setTimeout(addRandomObject, 3000)

  game.physics.p2.setPostBroadphaseCallback(checkCollisions, this);
}

function checkCollisions(body1, body2){
  if ((body1.sprite.key === 'body' && body2.sprite.key === 'member') || (body2.sprite.key === 'body' && body1.sprite.key === 'member')) {
    return false;
  }

  return true;
}

var RObjects
function addRandomObject() {
  var object_id = ~~(Math.random() * 3 + 1)
  RObject = game.add.sprite(game.width * 0.51, game.height * 0.2, 'object_' + object_id);
  game.physics.p2.enable([RObject], isDebug);

  RObject.body.clearShapes();
  RObject.body.loadPolygon('physicsData', 'object_' + object_id);
}

var leftHandLastRotation = Math.PI / 6
  , rightHandLastRotation = -Math.PI / 6
  , headLastRotation = 0
  , rotationStep = Math.PI / 180

function update() {
  // Check key states every frame.
  if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
    // Left hand down
    leftHandLastRotation -= rotationStep
    setRevolutionLimits(Piko.c.constraintHandLeft, leftHandLastRotation)
    if(isConsole) console.log('left down', leftHandLastRotation)
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
    // Left hand up
    leftHandLastRotation += rotationStep
    setRevolutionLimits(Piko.c.constraintHandLeft, leftHandLastRotation)
    if(isConsole) console.log('left up', leftHandLastRotation)
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.R)) {
    // Head left
    headLastRotation -= rotationStep
    setRevolutionLimits(Piko.c.constraintHead, headLastRotation)
    if(isConsole) console.log('head left', headLastRotation)
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.S)) {
    // Head right
    headLastRotation += rotationStep
    setRevolutionLimits(Piko.c.constraintHead, headLastRotation)
    if(isConsole) console.log('head left', headLastRotation)
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.T)) {
    // Right hand down
    rightHandLastRotation += rotationStep
    setRevolutionLimits(Piko.c.constraintHandRight, rightHandLastRotation)
    if(isConsole) console.log('right down', rightHandLastRotation)
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.P)) {
    // Right hand up
    rightHandLastRotation -= rotationStep
    setRevolutionLimits(Piko.c.constraintHandRight, rightHandLastRotation)
    if(isConsole) console.log('right up', rightHandLastRotation)
  } else {
    //
  }
}

function render() {

}
