(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var settings = require('./settings')
var S = settings
var O = require('./observer')

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

      O.trigger('game-created', true)
    }
  , update: function(){
      if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
        O.trigger('keyboard-a', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
        O.trigger('keyboard-q', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.R)) {
        O.trigger('keyboard-r', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.S)) {
        O.trigger('keyboard-s', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.T)) {
        O.trigger('keyboard-t', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.P)) {
        O.trigger('keyboard-p', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
        O.trigger('keyboard-z', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.X)) {
        O.trigger('keyboard-x', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.C)) {
        O.trigger('keyboard-c', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.V)) {
        O.trigger('keyboard-v', true)
      } else if (game.input.keyboard.isDown(Phaser.Keyboard.J)) {
        O.trigger('keyboard-j', true)
      }

      O.trigger('update', true)
    }
  , render: function(){}

  // Bodies
  , bodies: []
  , registerBody: function(body){
      publicObject.bodies.push(body)
    }
  , unregisterBody: function(body){
      if (publicObject.bodies.indexOf(body) !== -1) {
        publicObject.bodies.splice(publicObject.bodies.indexOf(body), 1)
      }
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
  , removeConstraint: function(c){
      return game.physics.p2.removeConstraint(c)
    }
  }

  var game = new Phaser.Game(settings.width, settings.height, Phaser.AUTO, '', { preload: publicObject.preload, create: publicObject.create, update: publicObject.update, render: publicObject.render })

  return publicObject
}()

},{"./observer":4,"./settings":6}],2:[function(require,module,exports){
var Settings = require('./settings') // Object
var Game = require('./game') // Singleton object
var O = require('./observer') // Singleton object. Events handling
var Kinect = require('./kinect') // Singleton object
var Piko = require('./piko') // Constructor object

// Wait both for kinect and game
var kinect_opened = false
  , game_created = false
  , processKinect = function(){
      if(!kinect_opened || !game_created) return;

      var players = {}

      O.add('kinect-message', function(data){
        if (!data.player) return;

        if (!players.hasOwnProperty(data.player)) {
          // Create new player
          var x = data.right_shoulder ? data.right_shoulder.x : 400
          var y = data.right_shoulder ? data.right_shoulder.y : 300
          players[data.player] = new Piko(Game, data.player, x, y)
        }

        players[data.player].processKinect(data)
      })

      // Check players for being alive every 5 seconds
      setInterval(function(){
        for(var i in players) {
          if (players.hasOwnProperty(i)) {
            if (players[i].shouldDie()) {
              console.log('Player ' + i + ' should die')
              players[i].destroy()
              delete players[i]
            }
          }
        }
      }, Settings.bodyLifespan)
    }
O.add('kinect-opened', function(){
  kinect_opened = true
  processKinect()
})
O.add('game-created', function(){
  game_created = true
  processKinect()
})

Kinect.connect()

// Wait for 10 seconds, if kinect not found that add a Piko
setTimeout(function(){
  if (!Kinect.isConnected()) {
    var Player1 = new Piko(Game, 1, 400, 300)
    console.log('Adding autonome player')
  }
}, 10000)

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
  , O = require('./observer')

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
  , heightQueueLimit: 10
  }
  this.bp = {} // Body parts
  this.c = {} // Constraints
  this.h = {heights: [], prevMaxHeight: 0} // Cache
  this.f = {} // Funcions/Callbacks
  this.lastAlive = Date.now()

  this.addBody()
  this.addHead()
  this.addLegs()
  this.addHands()

  this.addConstraintHead()
  this.addConstraintHandLeft()
  this.addConstraintHandRight()
  this.addConstraintLegLeft()
  this.addConstraintLegRight()

  this.hookKeyboard()
  this.hookUpdate()

  this.game.registerBody(this)

  if (!S.isDebug) this.bp.body.bringToTop()
}

Piko.prototype.destroy = function(){
  var i;

  // Remove hooks
  this.unhookUpdate()
  this.unhookKeyboard()

  // Remove contraints from P2
  for (i in this.c) {
    if (this.c.hasOwnProperty(i)) {
      this.game.removeConstraint(this.c[i])
      delete this.c[i]
    }
  }

  // Remove bodies from P2
  for (i in this.bp) {
    if (this.bp.hasOwnProperty(i)) {
      this.bp[i].destroy()
      delete this.bp[i]
    }
  }
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

Piko.prototype.hookKeyboard = function(){
  var that = this

  O.add('keyboard-a', this.f.f1 = function(){that.c.handRight.rotated += that.s.rotationStep}) // down
  O.add('keyboard-q', this.f.f2 = function(){that.c.handRight.rotated -= that.s.rotationStep}) // up
  O.add('keyboard-r', this.f.f3 = function(){that.c.head.rotated -= that.s.rotationStep}) // left
  O.add('keyboard-s', this.f.f4 = function(){that.c.head.rotated += that.s.rotationStep}) // right
  O.add('keyboard-t', this.f.f5 = function(){that.c.handLeft.rotated += that.s.rotationStep}) // down
  O.add('keyboard-p', this.f.f6 = function(){that.c.handLeft.rotated -= that.s.rotationStep}) // up
  O.add('keyboard-z', this.f.f7 = function(){that.c.legRight.rotated += that.s.rotationStep}) // left
  O.add('keyboard-x', this.f.f8 = function(){that.c.legRight.rotated -= that.s.rotationStep}) // right
  O.add('keyboard-c', this.f.f9 = function(){that.c.legLeft.rotated += that.s.rotationStep}) // left
  O.add('keyboard-v', this.f.f10 = function(){that.c.legLeft.rotated -= that.s.rotationStep}) // right
  O.add('keyboard-j', this.f.f11 = function(){
    // Jump
    if (that.bp.body.body.data.angle > -Math.PI / 4 && that.bp.body.body.data.angle < Math.PI / 4) {
      that.bp.body.body.velocity.y = -400;
    }
  })
}
Piko.prototype.unhookKeyboard = function(){
  O.remove('keyboard-a', this.f.f1)
  O.remove('keyboard-q', this.f.f2)
  O.remove('keyboard-r', this.f.f3)
  O.remove('keyboard-s', this.f.f4)
  O.remove('keyboard-t', this.f.f5)
  O.remove('keyboard-p', this.f.f6)
  O.remove('keyboard-z', this.f.f7)
  O.remove('keyboard-x', this.f.f8)
  O.remove('keyboard-c', this.f.f9)
  O.remove('keyboard-v', this.f.f10)
  O.remove('keyboard-j', this.f.f11)
}

Piko.prototype.hookUpdate = function(){
  var that = this

  O.add('update', this.f.u = function(){
    that.rotateObject(that.c.handLeft)
    that.rotateObject(that.c.handRight)
    that.rotateObject(that.c.legLeft)
    that.rotateObject(that.c.legRight)
    that.rotateObject(that.c.head)
  })
}
Piko.prototype.unhookUpdate = function(){
  O.remove('update', this.f.u)
}

Piko.prototype.rotateObject = function(obj) {
  if (obj.rotated < -Math.PI) obj.rotated += Math.PI * 2
  if (obj.rotated > Math.PI) obj.rotated -= Math.PI * 2

  if (obj.rotated < obj.limits[0] || obj.rotated > obj.limits[1]) {
    if (Math.abs(obj.rotated - obj.limits[0]) < Math.abs(obj.rotated - obj.limits[1])) {
      obj.rotated = obj.limits[0]
    } else {
      obj.rotated = obj.limits[1]
    }
  }

  this.setRevolutionLimits(obj, obj.rotated)
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

Piko.prototype.processKinect = function(data){
  this.lastAlive = Date.now()

  // Hands
  this.c.handLeft.rotated = angleBetween3Points(data.left_shoulder, data.right_shoulder, data.right_elbow, this.c.handLeft.rotated) - Math.PI * 0.5
  this.c.handRight.rotated = angleBetween3Points(data.right_shoulder, data.left_shoulder, data.left_elbow, this.c.handLeft.rotated) + Math.PI * 0.5

  // Legs
  this.c.legLeft.rotated = -angleByHorizont(data.right_hip, data.right_foot, this.c.legLeft.rotated) - Math.PI * 0.5
  this.c.legRight.rotated = -angleByHorizont(data.left_hip, data.left_foot, this.c.legRight.rotated) - Math.PI * 0.5

  // Head
  if(data.neck !== undefined) {
    // Neck is very unstable
    var a = -Math.atan2((data.left_shoulder.y + data.right_shoulder.y) * 0.5 - data.neck.y, (data.left_shoulder.x + data.right_shoulder.x) * 0.5 - data.neck.x)
    if (a < -Math.PI * 0.5) a += Math.PI
    if (a > Math.PI * 0.5) a -= Math.PI

    this.c.head.rotated = a
  }

  this.recordHeight(data)
  var h
  if(h = this.jumpHeight() > 0){
    console.log(h)
    this.bp.body.body.velocity.y = -800 - h*5;
  }
}


Piko.prototype.recordHeight = function(data) {
  // Remove oldest height limits is limit reached
  if (this.h.heights.length + 1 > this.s.heightQueueLimit) this.h.heights.shift();

  this.h.heights.push((data.left_shoulder.y + data.right_shoulder.y + data.left_shoulder.y + data.right_shoulder.y) * 0.25)
}

Piko.prototype.jumpHeight = function() {
  // Check only if we have history data
  if (this.h.heights.length == this.s.heightQueueLimit) {
    var min = this.h.heights.reduce(function(prev, curr){return Math.min(prev, curr)}, this.h.heights[0])
    var max = this.h.heights.reduce(function(prev, curr){return Math.max(prev, curr)}, this.h.heights[0])

    // Previous max should be lower as Y axis is inverse
    if (max - min > 80 && max < this.h.prevMaxHeight) {
      this.h.heights = [] // reset jumps history
      this.h.prevMaxHeight = max
      return max-min
    }

    // Store previous max so we can check if we jumped up or down
    this.h.prevMaxHeight = max

    return 0
  }
}

Piko.prototype.shouldDie = function(){
  return Date.now() - this.lastAlive > S.bodyLifespan;
}

module.exports = Piko

},{"./observer":4,"./settings":6}],6:[function(require,module,exports){
Settings = {
  width: 800
, height: 600
, isDebug: false
, spriteScale: 300/13.8 // 21.74
, bodyLifespan: 5000
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