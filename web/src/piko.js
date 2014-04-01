var Settings = require('./settings')
  , S = Settings

var Piko = function(game, id, x, y){
  this.init(game, id, x, y)
}

Piko.prototype.init = function(game, id, x, y){
  this.game = game
  this.id = id
  this.s = { // Settings
    x: x || Settings.pikoS.center.x
  , y: y || Settings.pikoS.center.y
  , rotationStep: Math.PI / 180
  , handYDisplacement: -S.pikoS.bodyHeightFull * 0.5 + S.pikoS.bodyRadii
  , handYDisplacementConstraint: -S.pikoS.handLength * 0.5 + S.pikoS.handWidth * 0.5
  , handXDisplacement: S.pikoS.bodyWidth / 2 - S.pikoS.handWidth * 0.5
  }
  this.bp = {} // Body parts
  this.c = {} // Constraints

  this.addBody()
  this.addHead()
  this.addLegs()
  this.addHands()

  this.addConstraintHead()
  this.addConstraintHandLeft()
  this.addConstraintHandRight()
  this.addConstraintLegLeft()
  this.addConstraintLegRight()

  this.game.registerBody(this)

  if (!S.isDebug) this.bp.body.bringToTop()
}

Piko.prototype.addBody = function(){
  this.bp.body = this.game.addSprite(this.s.x, this.s.y, 'body');

  this.game.enable(this.bp.body)

  this.bp.body.body.clearShapes();
  this.bp.body.body.loadPolygon('physicsData', 'body_s');

  this.bp.body.body.pikoId = this.id
}

Piko.prototype.addHead = function(){
  this.bp.head = this.game.addSprite(this.s.x, this.s.y - (S.pikoS.bodyHeightFull * 0.5 + S.pikoS.neck + S.pikoS.headHeight * 0.5), 'head')

  this.game.enable(this.bp.head)

  this.bp.head.body.clearShapes();
  this.bp.head.body.loadPolygon('physicsData', 'head_s');

  this.bp.head.body.pikoId = this.id
}

Piko.prototype.addLegs = function(){
  this.bp.legLeft = this.game.addSprite(this.s.x + S.pikoS.legDistance, this.s.y + S.pikoS.bodyHeightFull * 0.5, 'member')
  this.bp.legRight = this.game.addSprite(this.s.x - S.pikoS.legDistance, this.s.y + S.pikoS.bodyHeightFull * 0.5, 'member')

  this.game.enable([this.bp.legLeft, this.bp.legRight])

  this.bp.legLeft.body.clearShapes();
  this.bp.legRight.body.clearShapes();
  this.bp.legLeft.body.loadPolygon('physicsData', 'member_s');
  this.bp.legRight.body.loadPolygon('physicsData', 'member_s');

  this.bp.legLeft.body.pikoId = this.id
  this.bp.legRight.body.pikoId = this.id
}

Piko.prototype.addHands = function(){
  this.bp.handLeft = this.game.addSprite(this.s.x + this.s.handXDisplacement, this.s.y + this.s.handYDisplacement - this.s.handYDisplacementConstraint, 'member')
  this.bp.handRight = this.game.addSprite(this.s.x - this.s.handXDisplacement, this.s.y + this.s.handYDisplacement - this.s.handYDisplacementConstraint, 'member')

  this.game.enable([this.bp.handLeft, this.bp.handRight])

  this.bp.handLeft.body.clearShapes();
  this.bp.handRight.body.clearShapes();
  this.bp.handLeft.body.loadPolygon('physicsData', 'member_s');
  this.bp.handRight.body.loadPolygon('physicsData', 'member_s');

  this.bp.handLeft.body.pikoId = this.id
  this.bp.handRight.body.pikoId = this.id
}

Piko.prototype.addConstraint = function(b1, p1, b2, p2, angleStart, angleMin, angleMax){
  var constraint = this.game.addRevoluteConstraint(b1, p1, b2, p2);
  constraint.rotated = angleStart // cache rotation constraint
  constraint.limits = [angleMin, angleMax] // cache rotation limits
  this.setRevolutionLimits(constraint, constraint.rotated)

  return constraint
}

Piko.prototype.setRevolutionLimits = function(obj, upper, lower){
  if(lower === undefined || lower === null) lower = upper;

  obj.upperLimitEnabled = true;
  obj.upperLimit = upper;
  obj.lowerLimitEnabled = true;
  obj.lowerLimit = lower;
}

Piko.prototype.addConstraintHead = function(){
  this.c.head = this.addConstraint(
    this.bp.body
  , [0, -S.pikoS.bodyHeightFull * 0.5]
  , this.bp.head
  , [0, S.pikoS.headHeight * 0.5 + S.pikoS.neck]
  , 0
  , -Math.PI * 0.2
  , Math.PI * 0.2
  )
}

Piko.prototype.addConstraintHandLeft = function(){
  this.c.handLeft = this.addConstraint(
    this.bp.body
  , [this.s.handXDisplacement, this.s.handYDisplacement]
  , this.bp.handLeft
  , [0, this.s.handYDisplacementConstraint]
  , -Math.PI / 6
  , -Math.PI * 0.8
  , -Math.PI / 6
  )
}
Piko.prototype.addConstraintHandRight = function(){
  this.c.handRight = this.addConstraint(
    this.bp.body
  , [-this.s.handXDisplacement, this.s.handYDisplacement]
  , this.bp.handRight
  , [0, this.s.handYDisplacementConstraint]
  , Math.PI / 6
  , Math.PI / 6
  , Math.PI * 0.8
  )
}
Piko.prototype.addConstraintLegLeft = function(){
  this.c.legLeft = this.addConstraint(
    this.bp.body
  , [S.pikoS.legDistance, S.pikoS.bodyHeightFull * 0.5]
  , this.bp.legLeft
  , [0, 0]
  , 0
  , -Math.PI / 4
  , Math.PI /4
  )
}
Piko.prototype.addConstraintLegRight = function(){
  this.c.legRight = this.addConstraint(
    this.bp.body
  , [-S.pikoS.legDistance, S.pikoS.bodyHeightFull * 0.5]
  , this.bp.legRight
  , [0, 0]
  , 0
  , -Math.PI / 4
  , Math.PI /4
  )
}

module.exports = Piko
