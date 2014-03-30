console.log('1')


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
  game.load.image('body', 'images/body_s.png');
  game.load.image('head', 'images/head_s.png');
  game.load.image('member', 'images/member_s.png');
  game.load.image('ground', 'images/ground.png');
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
  Piko.ground.body.static = true;

  Piko.body.body.clearShapes();
  // Piko.body.body.loadPolygon('physicsData', 'body');

  //  So they don't collide with each other
  // Piko.body.body.clearCollision(true, true);
  // Piko.head.body.clearCollision(true, true);

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

  //  Create our spring
  //  The parameters are: createSpring(sprite1, sprite2, restLength, stiffness, damping, worldA, worldB, localA, localB)
  //  See the docs for more details
  Piko.legsSpring = game.physics.p2.createSpring(Piko.legLeft, Piko.legRight, handXDisplacement * 2, 1, 1, null, null, [0, handYDisplacementConstraint], [0, handYDisplacementConstraint]);

  // var constraintHandLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [-pikoS.bodyWidth / 2 + pikoS.handWidth, handYDisplacement], Piko.handLeft, [0, -pikoS.handLength * 0.5 + pikoS.handWidth * 0.5]);
  Piko.c.constraintHandLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [-handXDisplacement, handYDisplacement], Piko.handLeft, [0, handYDisplacementConstraint]);
  setRevolutionLimits(Piko.c.constraintHandLeft, Math.PI / 6)
  Piko.c.constraintHandRight = game.physics.p2.createRevoluteConstraint(Piko.body, [+handXDisplacement, handYDisplacement], Piko.handRight, [0, handYDisplacementConstraint]);
  setRevolutionLimits(Piko.c.constraintHandRight, -Math.PI / 6)

  Piko.body.bringToTop()
  // Piko.body.body.rotateLeft(45)
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
