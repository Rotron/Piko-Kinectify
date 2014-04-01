(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var settings = require('./settings')
var S = settings

// Singleton
module.exports = function(){
  var publicObject = {
    preload: function(){
      game.load.image('body', 'assets/body_s.png');
      game.load.image('head', 'assets/head_s.png');
      game.load.image('member', 'assets/member_s.png');
      game.load.image('ground', 'assets/ground.png');

      game.load.image('object_1', 'assets/object_1.png');
      game.load.image('object_2', 'assets/object_2.png');
      game.load.image('object_3', 'assets/object_3.png');

      game.load.physics('physicsData', 'assets/physics.json')
    }
  , create: function(){
      //  Use P2.js physics
      game.physics.startSystem(Phaser.Physics.P2JS);

      game.stage.backgroundColor = settings.isDebug ? '#DDDDDD' : '#FFFFFF';

      //  Make things a bit more bouncey
      game.physics.p2.defaultRestitution = 0.8;

      // Gravity
      game.physics.p2.gravity.y = 200;

      if(!settings.isDebug) game.add.text(0,0,'To control press: qapt - hands, zxcv - legs, rs - head',{});

      // Add ground
      publicObject.ground = game.add.sprite(S.width / 2, S.height - 10, 'ground')
      publicObject.enable(publicObject.ground)
      publicObject.ground.body.static = true; // Make ground static

      game.physics.p2.setPostBroadphaseCallback(publicObject.checkCollisions, this);
    }
  , update: function(){}
  , render: function(){}

  // Bodies
  , bodies: []
  , registerBody: function(body){
      publicObject.bodies.push(body)
    }
  , checkCollisions: function(body1, body2){
      if(body1.pikoId && body2.pikoId && body1.pikoId == body2.pikoId)
        if ((body1.sprite.key === 'body' && body2.sprite.key === 'member') || (body2.sprite.key === 'body' && body1.sprite.key === 'member')) {
          return false;
        }

      return true;
    }

  // Proxy methods
  , addSprite: function(x, y, sprite_title){
      return game.add.sprite(x, y, sprite_title)
    }
  , enable: function(bodies){
      return game.physics.p2.enable(bodies, S.isDebug);
    }
  , addRevoluteConstraint: function(b1, p1, b2, p2){
      return game.physics.p2.createRevoluteConstraint(b1, p1, b2, p2)
    }
  }

  var game = new Phaser.Game(settings.width, settings.height, Phaser.AUTO, '', { preload: publicObject.preload, create: publicObject.create, update: publicObject.update, render: publicObject.render })

  return publicObject
}()

},{"./settings":6}],2:[function(require,module,exports){
var Settings = require('./settings') // Object
var Game = require('./game') // Singleton object
var O = require('./observer') // Singleton object. Events handling
var Kinect = require('./kinect') // Singleton object
var Piko = require('./piko') // Constructor object

Kinect.connect()
setTimeout(function(){console.log(Kinect.isConnected())}, 2000)

setTimeout(function(){
  var Player1 = new Piko(Game, 1, 200, 300)
  var Player2 = new Piko(Game, 2, 600, 300)

  // var Player1 = new Piko(Game, 1, 600, 400)
  // var Player2 = new Piko(Game, 2, 600, 200)
}, 1000)


},{"./game":1,"./kinect":3,"./observer":4,"./piko":5,"./settings":6}],3:[function(require,module,exports){
var Settings = require('./settings')
var O = require('./observer')

module.exports = function(){
  var connection = {}
  var connect = function(){
    if (connection.readyState === undefined || connection.readyState > 1) {
      connection = new WebSocket('ws://'+Settings.socket.hostname+':'+Settings.socket.port+'/'+Settings.socket.path);

      connection.onopen = function () {
        O.trigger('kinect-opened', true)
      };

      connection.onmessage = function (event) {
        O.trigger('kinect-message', JSON.parse(event.data))
      };

      connection.onclose = function (event) {
        O.trigger('kinect-closed', true)
      };
    }
  }

  return {
    connect: connect
  , isConnected: function(){
      return connection.readyState !== undefined && connection.readyState == 1
    }
  }
}()

},{"./observer":4,"./settings":6}],4:[function(require,module,exports){
module.exports = function(){
  // Private var
  var observers = []

  return {
    add: function(topic, observer) {
      observers[topic] || (observers[topic] = [])

      observers[topic].push(observer)
    }
  , remove: function(topic, observer) {
      if (!observers[topic])
        return;

      var index = observers[topic].indexOf(observer)

      if (~index) {
        observers[topic].splice(index, 1)
      }
    }
  , trigger: function(topic, message) {
      if (!observers[topic])
        return;

      for (var i = observers[topic].length - 1; i >= 0; i--) {
        observers[topic][i](message)
      };
    }
  }
}()

},{}],5:[function(require,module,exports){
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

},{"./settings":6}],6:[function(require,module,exports){
Settings = {
  width: 800
, height: 600
, isDebug: false
, spriteScale: 300/13.8 // 21.74
, piko: { // Pico settings
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
, pikoS: { // Piko settings scaled
    center: {
      x: 800/2
    , y: 600/2
    }
  }
, socket: {
    hostname: "localhost",
    port: "8080",
    path: "p5websocket",
  }
}

for(var key in Settings.piko) {if (!Settings.piko.hasOwnProperty(key)) continue;
  Settings.pikoS[key] = Settings.piko[key] * Settings.spriteScale
}

module.exports = Settings

},{}]},{},[2]);