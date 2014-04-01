* Add kinect controls
* If kinect not connected: load one piko
* If kinect connected: load piko only when player detected
  * Multiple pikos
  * If no user - remove piko
  * If no users - display message: "Rise your hands up to detect you", add default Piko
  * When user detected but not processed - display message: "Human detected, processing..."
  * When user processed, remove default Piko
* If hands rised up - drop a random object


function create() {
  setTimeout(addRandomObject, 3000)
}


var RObjects
function addRandomObject() {
  var object_id = ~~(Math.random() * 3 + 1)
  RObject = game.add.sprite(game.width * 0.51, game.height * 0.2, 'object_' + object_id);
  game.physics.p2.enable([RObject], isDebug);

  RObject.body.clearShapes();
  RObject.body.loadPolygon('physicsData', 'object_' + object_id);
}


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

var heightLimits = []
  , heightQueueLimit = 10
  , prevMax = 0
function recordHeight(obj) {
  // Remove oldest height limits is limit reached
  if (heightLimits.length + 1 > heightQueueLimit) heightLimits.shift();
  heightLimits.push((obj.left_shoulder.y + obj.right_shoulder.y + obj.left_shoulder.y + obj.right_shoulder.y) * 0.25)
}
function checkForJump() {
  if (heightLimits.length == heightQueueLimit) {
    var min = heightLimits.reduce(function(prev, curr){return Math.min(prev, curr)}, heightLimits[0])
    var max = heightLimits.reduce(function(prev, curr){return Math.max(prev, curr)}, heightLimits[0])

    // Previous max should be lower as Y axis is inverse
    if (max - min > 80 && max < prevMax) {
      console.log(max, min)
      Piko.body.body.velocity.y = -800 - (max - min)*5;
      console.log(-800 - (max - min)*5)
      heightLimits = []
    }

    // Store previous max so we can check if we jumped up or down
    prevMax = max
  }
}

O.add('kinect', function(obj){
  if (!Piko.body) return; // do not process until we have Piko body parts

  recordHeight(obj)
  checkForJump()

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
