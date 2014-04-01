
* If kinect connected:
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
