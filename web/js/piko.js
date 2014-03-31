var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })
  , isDebug = false
  , isConsole = false
  , spriteScale = 300/13.8 // 21.74
  , Piko = {c:{}, s:{rotationStep: Math.PI / 180}} // Body parts, constraints, settings
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

  if(!isDebug) game.add.text(0,0,'To control press: qapt - hands, zxcv - legs, rs - head',{});

  Piko.body = game.add.sprite(pikoS.center.x, pikoS.center.y, 'body');
  Piko.head = game.add.sprite(pikoS.center.x, pikoS.center.y - (pikoS.bodyHeightFull * 0.5 + pikoS.neck + pikoS.headHeight * 0.5), 'head')
  // Add legs
  Piko.legLeft = game.add.sprite(pikoS.center.x + pikoS.legDistance, pikoS.center.y + pikoS.bodyHeightFull * 0.5, 'member')
  Piko.legRight = game.add.sprite(pikoS.center.x - pikoS.legDistance, pikoS.center.y + pikoS.bodyHeightFull * 0.5, 'member')
  // Add hands
  var handYDisplacement = -pikoS.bodyHeightFull * 0.5 + pikoS.bodyRadii
    , handYDisplacementConstraint = -pikoS.handLength * 0.5 + pikoS.handWidth * 0.5
    , handXDisplacement = pikoS.bodyWidth / 2 - pikoS.handWidth * 0.5
  Piko.handLeft = game.add.sprite(pikoS.center.x + handXDisplacement, pikoS.center.y + handYDisplacement - handYDisplacementConstraint, 'member')
  Piko.handRight = game.add.sprite(pikoS.center.x - handXDisplacement, pikoS.center.y + handYDisplacement - handYDisplacementConstraint, 'member')

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
  Piko.c.constraintHead.rotated = 0 // cache rotation constraint
  Piko.c.constraintHead.limits = [-Math.PI * 0.2, Math.PI * 0.2] // cache rotation limits
  setRevolutionLimits(Piko.c.constraintHead, Piko.c.constraintHead.rotated)

  // Leg left
  Piko.c.constraintLegLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [pikoS.legDistance, pikoS.bodyHeightFull * 0.5], Piko.legLeft, [0, 0]);
  Piko.c.constraintLegLeft.rotated = 0
  Piko.c.constraintLegLeft.limits = [-Math.PI / 4, Math.PI / 4]
  setRevolutionLimits(Piko.c.constraintLegLeft, Piko.c.constraintLegLeft.rotated)
  // Leg right
  Piko.c.constraintLegRight = game.physics.p2.createRevoluteConstraint(Piko.body, [-pikoS.legDistance, pikoS.bodyHeightFull * 0.5], Piko.legRight, [0, 0]);
  Piko.c.constraintLegRight.rotated = 0
  Piko.c.constraintLegRight.limits = [-Math.PI / 4, Math.PI / 4]
  setRevolutionLimits(Piko.c.constraintLegRight, Piko.c.constraintLegRight.rotated)

  // Spring parameters: createSpring(sprite1, sprite2, restLength, stiffness, damping, worldA, worldB, localA, localB)
  // Piko.legsSpring = game.physics.p2.createSpring(Piko.legLeft, Piko.legRight, handXDisplacement * 2, 4, 1, null, null, [0, handYDisplacementConstraint], [0, handYDisplacementConstraint]);

  // Hand left
  Piko.c.constraintHandLeft = game.physics.p2.createRevoluteConstraint(Piko.body, [+handXDisplacement, handYDisplacement], Piko.handLeft, [0, handYDisplacementConstraint]);
  Piko.c.constraintHandLeft.rotated = -Math.PI / 6
  Piko.c.constraintHandLeft.limits = [ -Math.PI * 0.8, -Math.PI / 6]
  setRevolutionLimits(Piko.c.constraintHandLeft, Piko.c.constraintHandLeft.rotated)
  // Hand right
  Piko.c.constraintHandRight = game.physics.p2.createRevoluteConstraint(Piko.body, [-handXDisplacement, handYDisplacement], Piko.handRight, [0, handYDisplacementConstraint]);
  Piko.c.constraintHandRight.rotated = Math.PI / 6
  Piko.c.constraintHandRight.limits = [Math.PI / 6, Math.PI * 0.8]
  setRevolutionLimits(Piko.c.constraintHandRight, Piko.c.constraintHandRight.rotated)

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

// Apply rotation limits
function rotateObject(obj) {
  if (obj.rotated < -Math.PI) obj.rotated += Math.PI * 2
  if (obj.rotated > Math.PI) obj.rotated -= Math.PI * 2

  if (obj.rotated < obj.limits[0] || obj.rotated > obj.limits[1]) {
    if (Math.abs(obj.rotated - obj.limits[0]) < Math.abs(obj.rotated - obj.limits[1])) {
      obj.rotated = obj.limits[0]
    } else {
      obj.rotated = obj.limits[1]
    }
  }

  setRevolutionLimits(obj, obj.rotated)
}

function update() {
  // Check key states every frame.
  if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
    // Right hand down
    Piko.c.constraintHandRight.rotated += Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
    // Right hand up
    Piko.c.constraintHandRight.rotated -= Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.R)) {
    // Head left
    Piko.c.constraintHead.rotated -= Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.S)) {
    // Head right
    Piko.c.constraintHead.rotated += Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.T)) {
    // Left hand down
    Piko.c.constraintHandLeft.rotated += Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.P)) {
    // Left hand up
    Piko.c.constraintHandLeft.rotated -= Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
    // Right leg left
    Piko.c.constraintLegRight.rotated += Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.X)) {
    // Right leg right
    Piko.c.constraintLegRight.rotated -= Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.C)) {
    // Left leg left
    Piko.c.constraintLegLeft.rotated += Piko.s.rotationStep
  } else if (game.input.keyboard.isDown(Phaser.Keyboard.V)) {
    // Left leg right
    Piko.c.constraintLegLeft.rotated -= Piko.s.rotationStep
  } else {
    //
  }

  rotateObject(Piko.c.constraintHandLeft)
  rotateObject(Piko.c.constraintHandRight)
  rotateObject(Piko.c.constraintLegLeft)
  rotateObject(Piko.c.constraintLegRight)
  rotateObject(Piko.c.constraintHead)
}

/*{
  "head": {},
  "neck": {},
  "torso": {},
  "left_shoulder": {},
  "left_elbow": {},
  "left_hand": {},
  "left_hip": {},
  "left_knee": {},
  "left_foot": {},
  "right_shoulder": {},
  "right_elbow": {},
  "right_hand": {},
  "right_hip": {},
  "right_knee": {},
  "right_foot": {}
}*/

function angleBetweenLinesAsPoints(p11, p12, p21, p22, fallback) {
  if(!p11 || !p12 || !p21 || !p22) return fallback;

  var angle1 = Math.atan2(p11.y - p12.y, p11.x - p12.x);
  var angle2 = Math.atan2(p21.y - p22.y, p21.x - p22.x);
  return angle1-angle2;
}

function angleBetween3Points(p1, p2, p3, fallback) {
  return angleBetweenLinesAsPoints(p1, p2, p2, p3, fallback)
}

function angleByHorizont(p1, p2, fallback) {
  if(!p1 || !p2) return fallback;
  return Math.atan2(p1.y - p2.y, p1.x - p2.x);
}

O.add('kinect', function(obj){
  if (!Piko.body) return; // do not process until we have Piko body parts

  if (+obj.player === 1 || true) {
    Piko.c.constraintHandLeft.rotated = angleBetween3Points(obj.left_shoulder, obj.right_shoulder, obj.right_elbow, Piko.c.constraintHandLeft.rotated) - Math.PI * 0.5
    Piko.c.constraintHandRight.rotated = angleBetween3Points(obj.right_shoulder, obj.left_shoulder, obj.left_elbow, Piko.c.constraintHandLeft.rotated) + Math.PI * 0.5
    if(obj.neck !== undefined) {
      // Neck is very unstable
      var a = -Math.atan2((obj.left_shoulder.y + obj.right_shoulder.y) * 0.5 - obj.neck.y, (obj.left_shoulder.x + obj.right_shoulder.x) * 0.5 - obj.neck.x)
      if (a < -Math.PI * 0.5) a += Math.PI
      if (a > Math.PI * 0.5) a -= Math.PI

      Piko.c.constraintHead.rotated = a
    }
    Piko.c.constraintLegLeft.rotated = -angleByHorizont(obj.right_hip, obj.right_foot, Piko.c.constraintLegLeft.rotated) - Math.PI * 0.5
    Piko.c.constraintLegRight.rotated = -angleByHorizont(obj.left_hip, obj.left_foot, Piko.c.constraintLegRight.rotated) - Math.PI * 0.5
  }
})

function render() {

}
