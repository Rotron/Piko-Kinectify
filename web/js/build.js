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
  , displayText: function(text){
      if (this.text) {
        this.text.destroy()
      }
      this.text = game.add.text(0, 0, text, {});
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

var defaultPlayer = null

// Wait both for kinect and game
var kinect_opened = false
  , game_created = false
  , processKinect = function(){
      if(!kinect_opened || !game_created) return;

      var players = {}

      O.add('kinect-message', function(data){
        if (data.status) {
          if (data.status == 'detected') {
            Game.displayText('New player detected. Rise your hands up to calibrate!')
          }else if (data.status == 'calibrated'){
            Game.displayText('Player calibrated. Welcome on board')
          }
        }

        if (!data.player) return;

        if (!players.hasOwnProperty(data.player)) {
          if (defaultPlayer !== null) {
            // Kill default player
            defaultPlayer.destroy()
            defaultPlayer = null
          }

          // Create new player
          var x = data.right_shoulder ? data.right_shoulder.x : 400
          var y = data.right_shoulder ? data.right_shoulder.y : 300
          players[data.player] = new Piko(Game, data.player, x, y)
        }

        players[data.player].processKinect(data)
      })

      // Check players for being alive every 5 seconds
      setInterval(function(){
        var count = 0

        for(var i in players) {
          if (players.hasOwnProperty(i)) {
            if (players[i].shouldDie()) {
              console.log('Player ' + i + ' should die')
              players[i].destroy()
              delete players[i]
            } else {
              count += 1
            }
          }
        }

        if (count == 0) {
          Game.displayText('Rise your hands up to calibrate!')
          if (defaultPlayer === null)
            defaultPlayer = new Piko(Game, -1, 400, 300)
        }
      }, Settings.bodyLifespan)
    }
O.add('kinect-opened', function(){
  Game.displayText('Connected to Kinect, waiting for players')

  kinect_opened = true
  processKinect()
})
O.add('game-created', function(){
  if (!Kinect.isConnected())
    Game.displayText('Searching for Kinect connection, wait 10 sec')

  game_created = true
  processKinect()
})

Kinect.connect()
var kinectTryToConnect = setInterval(function(){
  if(!Kinect.isConnected())
    Kinect.connect()
}, 10000)

// Wait for 10 seconds, if kinect not found that add a Piko
setTimeout(function(){
  if (!Kinect.isConnected()) {
    defaultPlayer = new Piko(Game, -1, 400, 300)
    Game.displayText('To control press: qapt - hands, zxcv - legs, rs - head')
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

  O.add('keyboard-q', this.f.f1 = function(){that.c.handRight.rotated += that.s.rotationStep}) // up
  O.add('keyboard-a', this.f.f2 = function(){that.c.handRight.rotated -= that.s.rotationStep}) // down
  O.add('keyboard-t', this.f.f3 = function(){that.c.handLeft.rotated += that.s.rotationStep}) // down
  O.add('keyboard-p', this.f.f4 = function(){that.c.handLeft.rotated -= that.s.rotationStep}) // up
  O.add('keyboard-s', this.f.f5 = function(){that.c.head.rotated += that.s.rotationStep}) // right
  O.add('keyboard-r', this.f.f6 = function(){that.c.head.rotated -= that.s.rotationStep}) // left
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
  O.remove('keyboard-q', this.f.f1)
  O.remove('keyboard-a', this.f.f2)
  O.remove('keyboard-t', this.f.f3)
  O.remove('keyboard-p', this.f.f4)
  O.remove('keyboard-s', this.f.f5)
  O.remove('keyboard-r', this.f.f6)
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
      x: 1008/2
    , y: 700/2
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYnVtYnUvRGV2ZWxvcG1lbnQvV2ViUHJvamVjdHMvUGlrby1LaW5lY3RpZnkvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9idW1idS9EZXZlbG9wbWVudC9XZWJQcm9qZWN0cy9QaWtvLUtpbmVjdGlmeS93ZWIvc3JjL2dhbWUuanMiLCIvVXNlcnMvYnVtYnUvRGV2ZWxvcG1lbnQvV2ViUHJvamVjdHMvUGlrby1LaW5lY3RpZnkvd2ViL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9idW1idS9EZXZlbG9wbWVudC9XZWJQcm9qZWN0cy9QaWtvLUtpbmVjdGlmeS93ZWIvc3JjL2tpbmVjdC5qcyIsIi9Vc2Vycy9idW1idS9EZXZlbG9wbWVudC9XZWJQcm9qZWN0cy9QaWtvLUtpbmVjdGlmeS93ZWIvc3JjL29ic2VydmVyLmpzIiwiL1VzZXJzL2J1bWJ1L0RldmVsb3BtZW50L1dlYlByb2plY3RzL1Bpa28tS2luZWN0aWZ5L3dlYi9zcmMvcGlrby5qcyIsIi9Vc2Vycy9idW1idS9EZXZlbG9wbWVudC9XZWJQcm9qZWN0cy9QaWtvLUtpbmVjdGlmeS93ZWIvc3JjL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4vc2V0dGluZ3MnKVxudmFyIFMgPSBzZXR0aW5nc1xudmFyIE8gPSByZXF1aXJlKCcuL29ic2VydmVyJylcblxuLy8gU2luZ2xldG9uXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBwdWJsaWNPYmplY3QgPSB7XG4gICAgcHJlbG9hZDogZnVuY3Rpb24oKXtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnYm9keScsICdhc3NldHMvYm9keV9zLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdoZWFkJywgJ2Fzc2V0cy9oZWFkX3MucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ21lbWJlcicsICdhc3NldHMvbWVtYmVyX3MucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2dyb3VuZCcsICdhc3NldHMvZ3JvdW5kLnBuZycpO1xuXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ29iamVjdF8xJywgJ2Fzc2V0cy9vYmplY3RfMS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnb2JqZWN0XzInLCAnYXNzZXRzL29iamVjdF8yLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdvYmplY3RfMycsICdhc3NldHMvb2JqZWN0XzMucG5nJyk7XG5cbiAgICAgIGdhbWUubG9hZC5waHlzaWNzKCdwaHlzaWNzRGF0YScsICdhc3NldHMvcGh5c2ljcy5qc29uJylcbiAgICB9XG4gICwgY3JlYXRlOiBmdW5jdGlvbigpe1xuICAgICAgLy8gIFVzZSBQMi5qcyBwaHlzaWNzXG4gICAgICBnYW1lLnBoeXNpY3Muc3RhcnRTeXN0ZW0oUGhhc2VyLlBoeXNpY3MuUDJKUyk7XG5cbiAgICAgIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc2V0dGluZ3MuaXNEZWJ1ZyA/ICcjREREREREJyA6ICcjRkZGRkZGJztcblxuICAgICAgLy8gIE1ha2UgdGhpbmdzIGEgYml0IG1vcmUgYm91bmNleVxuICAgICAgZ2FtZS5waHlzaWNzLnAyLmRlZmF1bHRSZXN0aXR1dGlvbiA9IDAuODtcblxuICAgICAgLy8gR3Jhdml0eVxuICAgICAgZ2FtZS5waHlzaWNzLnAyLmdyYXZpdHkueSA9IDIwMDtcblxuICAgICAgLy8gQWRkIGdyb3VuZFxuICAgICAgcHVibGljT2JqZWN0Lmdyb3VuZCA9IGdhbWUuYWRkLnNwcml0ZShTLndpZHRoIC8gMiwgUy5oZWlnaHQgLSAxMCwgJ2dyb3VuZCcpXG4gICAgICBwdWJsaWNPYmplY3QuZW5hYmxlKHB1YmxpY09iamVjdC5ncm91bmQpXG4gICAgICBwdWJsaWNPYmplY3QuZ3JvdW5kLmJvZHkuc3RhdGljID0gdHJ1ZTsgLy8gTWFrZSBncm91bmQgc3RhdGljXG5cbiAgICAgIGdhbWUucGh5c2ljcy5wMi5zZXRQb3N0QnJvYWRwaGFzZUNhbGxiYWNrKHB1YmxpY09iamVjdC5jaGVja0NvbGxpc2lvbnMsIHRoaXMpO1xuXG4gICAgICBPLnRyaWdnZXIoJ2dhbWUtY3JlYXRlZCcsIHRydWUpXG4gICAgfVxuICAsIHVwZGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuQSkpIHtcbiAgICAgICAgTy50cmlnZ2VyKCdrZXlib2FyZC1hJywgdHJ1ZSlcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlEpKSB7XG4gICAgICAgIE8udHJpZ2dlcigna2V5Ym9hcmQtcScsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKGdhbWUuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5SKSkge1xuICAgICAgICBPLnRyaWdnZXIoJ2tleWJvYXJkLXInLCB0cnVlKVxuICAgICAgfSBlbHNlIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuUykpIHtcbiAgICAgICAgTy50cmlnZ2VyKCdrZXlib2FyZC1zJywgdHJ1ZSlcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlQpKSB7XG4gICAgICAgIE8udHJpZ2dlcigna2V5Ym9hcmQtdCcsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKGdhbWUuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5QKSkge1xuICAgICAgICBPLnRyaWdnZXIoJ2tleWJvYXJkLXAnLCB0cnVlKVxuICAgICAgfSBlbHNlIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuWikpIHtcbiAgICAgICAgTy50cmlnZ2VyKCdrZXlib2FyZC16JywgdHJ1ZSlcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlgpKSB7XG4gICAgICAgIE8udHJpZ2dlcigna2V5Ym9hcmQteCcsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKGdhbWUuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5DKSkge1xuICAgICAgICBPLnRyaWdnZXIoJ2tleWJvYXJkLWMnLCB0cnVlKVxuICAgICAgfSBlbHNlIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuVikpIHtcbiAgICAgICAgTy50cmlnZ2VyKCdrZXlib2FyZC12JywgdHJ1ZSlcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLkopKSB7XG4gICAgICAgIE8udHJpZ2dlcigna2V5Ym9hcmQtaicsIHRydWUpXG4gICAgICB9XG5cbiAgICAgIE8udHJpZ2dlcigndXBkYXRlJywgdHJ1ZSlcbiAgICB9XG4gICwgcmVuZGVyOiBmdW5jdGlvbigpe31cblxuICAvLyBCb2RpZXNcbiAgLCBib2RpZXM6IFtdXG4gICwgcmVnaXN0ZXJCb2R5OiBmdW5jdGlvbihib2R5KXtcbiAgICAgIHB1YmxpY09iamVjdC5ib2RpZXMucHVzaChib2R5KVxuICAgIH1cbiAgLCB1bnJlZ2lzdGVyQm9keTogZnVuY3Rpb24oYm9keSl7XG4gICAgICBpZiAocHVibGljT2JqZWN0LmJvZGllcy5pbmRleE9mKGJvZHkpICE9PSAtMSkge1xuICAgICAgICBwdWJsaWNPYmplY3QuYm9kaWVzLnNwbGljZShwdWJsaWNPYmplY3QuYm9kaWVzLmluZGV4T2YoYm9keSksIDEpXG4gICAgICB9XG4gICAgfVxuICAsIGNoZWNrQ29sbGlzaW9uczogZnVuY3Rpb24oYm9keTEsIGJvZHkyKXtcbiAgICAgIGlmKGJvZHkxLnBpa29JZCAmJiBib2R5Mi5waWtvSWQgJiYgYm9keTEucGlrb0lkID09IGJvZHkyLnBpa29JZClcbiAgICAgICAgaWYgKChib2R5MS5zcHJpdGUua2V5ID09PSAnYm9keScgJiYgYm9keTIuc3ByaXRlLmtleSA9PT0gJ21lbWJlcicpIHx8IChib2R5Mi5zcHJpdGUua2V5ID09PSAnYm9keScgJiYgYm9keTEuc3ByaXRlLmtleSA9PT0gJ21lbWJlcicpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAvLyBQcm94eSBtZXRob2RzXG4gICwgYWRkU3ByaXRlOiBmdW5jdGlvbih4LCB5LCBzcHJpdGVfdGl0bGUpe1xuICAgICAgcmV0dXJuIGdhbWUuYWRkLnNwcml0ZSh4LCB5LCBzcHJpdGVfdGl0bGUpXG4gICAgfVxuICAsIGVuYWJsZTogZnVuY3Rpb24oYm9kaWVzKXtcbiAgICAgIHJldHVybiBnYW1lLnBoeXNpY3MucDIuZW5hYmxlKGJvZGllcywgUy5pc0RlYnVnKTtcbiAgICB9XG4gICwgYWRkUmV2b2x1dGVDb25zdHJhaW50OiBmdW5jdGlvbihiMSwgcDEsIGIyLCBwMil7XG4gICAgICByZXR1cm4gZ2FtZS5waHlzaWNzLnAyLmNyZWF0ZVJldm9sdXRlQ29uc3RyYWludChiMSwgcDEsIGIyLCBwMilcbiAgICB9XG4gICwgcmVtb3ZlQ29uc3RyYWludDogZnVuY3Rpb24oYyl7XG4gICAgICByZXR1cm4gZ2FtZS5waHlzaWNzLnAyLnJlbW92ZUNvbnN0cmFpbnQoYylcbiAgICB9XG4gICwgZGlzcGxheVRleHQ6IGZ1bmN0aW9uKHRleHQpe1xuICAgICAgaWYgKHRoaXMudGV4dCkge1xuICAgICAgICB0aGlzLnRleHQuZGVzdHJveSgpXG4gICAgICB9XG4gICAgICB0aGlzLnRleHQgPSBnYW1lLmFkZC50ZXh0KDAsIDAsIHRleHQsIHt9KTtcbiAgICB9XG4gIH1cblxuICB2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZShzZXR0aW5ncy53aWR0aCwgc2V0dGluZ3MuaGVpZ2h0LCBQaGFzZXIuQVVUTywgJycsIHsgcHJlbG9hZDogcHVibGljT2JqZWN0LnByZWxvYWQsIGNyZWF0ZTogcHVibGljT2JqZWN0LmNyZWF0ZSwgdXBkYXRlOiBwdWJsaWNPYmplY3QudXBkYXRlLCByZW5kZXI6IHB1YmxpY09iamVjdC5yZW5kZXIgfSlcblxuICByZXR1cm4gcHVibGljT2JqZWN0XG59KClcbiIsInZhciBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vc2V0dGluZ3MnKSAvLyBPYmplY3RcbnZhciBHYW1lID0gcmVxdWlyZSgnLi9nYW1lJykgLy8gU2luZ2xldG9uIG9iamVjdFxudmFyIE8gPSByZXF1aXJlKCcuL29ic2VydmVyJykgLy8gU2luZ2xldG9uIG9iamVjdC4gRXZlbnRzIGhhbmRsaW5nXG52YXIgS2luZWN0ID0gcmVxdWlyZSgnLi9raW5lY3QnKSAvLyBTaW5nbGV0b24gb2JqZWN0XG52YXIgUGlrbyA9IHJlcXVpcmUoJy4vcGlrbycpIC8vIENvbnN0cnVjdG9yIG9iamVjdFxuXG52YXIgZGVmYXVsdFBsYXllciA9IG51bGxcblxuLy8gV2FpdCBib3RoIGZvciBraW5lY3QgYW5kIGdhbWVcbnZhciBraW5lY3Rfb3BlbmVkID0gZmFsc2VcbiAgLCBnYW1lX2NyZWF0ZWQgPSBmYWxzZVxuICAsIHByb2Nlc3NLaW5lY3QgPSBmdW5jdGlvbigpe1xuICAgICAgaWYoIWtpbmVjdF9vcGVuZWQgfHwgIWdhbWVfY3JlYXRlZCkgcmV0dXJuO1xuXG4gICAgICB2YXIgcGxheWVycyA9IHt9XG5cbiAgICAgIE8uYWRkKCdraW5lY3QtbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICBpZiAoZGF0YS5zdGF0dXMpIHtcbiAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ2RldGVjdGVkJykge1xuICAgICAgICAgICAgR2FtZS5kaXNwbGF5VGV4dCgnTmV3IHBsYXllciBkZXRlY3RlZC4gUmlzZSB5b3VyIGhhbmRzIHVwIHRvIGNhbGlicmF0ZSEnKVxuICAgICAgICAgIH1lbHNlIGlmIChkYXRhLnN0YXR1cyA9PSAnY2FsaWJyYXRlZCcpe1xuICAgICAgICAgICAgR2FtZS5kaXNwbGF5VGV4dCgnUGxheWVyIGNhbGlicmF0ZWQuIFdlbGNvbWUgb24gYm9hcmQnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZGF0YS5wbGF5ZXIpIHJldHVybjtcblxuICAgICAgICBpZiAoIXBsYXllcnMuaGFzT3duUHJvcGVydHkoZGF0YS5wbGF5ZXIpKSB7XG4gICAgICAgICAgaWYgKGRlZmF1bHRQbGF5ZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIEtpbGwgZGVmYXVsdCBwbGF5ZXJcbiAgICAgICAgICAgIGRlZmF1bHRQbGF5ZXIuZGVzdHJveSgpXG4gICAgICAgICAgICBkZWZhdWx0UGxheWVyID0gbnVsbFxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENyZWF0ZSBuZXcgcGxheWVyXG4gICAgICAgICAgdmFyIHggPSBkYXRhLnJpZ2h0X3Nob3VsZGVyID8gZGF0YS5yaWdodF9zaG91bGRlci54IDogNDAwXG4gICAgICAgICAgdmFyIHkgPSBkYXRhLnJpZ2h0X3Nob3VsZGVyID8gZGF0YS5yaWdodF9zaG91bGRlci55IDogMzAwXG4gICAgICAgICAgcGxheWVyc1tkYXRhLnBsYXllcl0gPSBuZXcgUGlrbyhHYW1lLCBkYXRhLnBsYXllciwgeCwgeSlcbiAgICAgICAgfVxuXG4gICAgICAgIHBsYXllcnNbZGF0YS5wbGF5ZXJdLnByb2Nlc3NLaW5lY3QoZGF0YSlcbiAgICAgIH0pXG5cbiAgICAgIC8vIENoZWNrIHBsYXllcnMgZm9yIGJlaW5nIGFsaXZlIGV2ZXJ5IDUgc2Vjb25kc1xuICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGNvdW50ID0gMFxuXG4gICAgICAgIGZvcih2YXIgaSBpbiBwbGF5ZXJzKSB7XG4gICAgICAgICAgaWYgKHBsYXllcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXJzW2ldLnNob3VsZERpZSgpKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQbGF5ZXIgJyArIGkgKyAnIHNob3VsZCBkaWUnKVxuICAgICAgICAgICAgICBwbGF5ZXJzW2ldLmRlc3Ryb3koKVxuICAgICAgICAgICAgICBkZWxldGUgcGxheWVyc1tpXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY291bnQgKz0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb3VudCA9PSAwKSB7XG4gICAgICAgICAgR2FtZS5kaXNwbGF5VGV4dCgnUmlzZSB5b3VyIGhhbmRzIHVwIHRvIGNhbGlicmF0ZSEnKVxuICAgICAgICAgIGlmIChkZWZhdWx0UGxheWVyID09PSBudWxsKVxuICAgICAgICAgICAgZGVmYXVsdFBsYXllciA9IG5ldyBQaWtvKEdhbWUsIC0xLCA0MDAsIDMwMClcbiAgICAgICAgfVxuICAgICAgfSwgU2V0dGluZ3MuYm9keUxpZmVzcGFuKVxuICAgIH1cbk8uYWRkKCdraW5lY3Qtb3BlbmVkJywgZnVuY3Rpb24oKXtcbiAgR2FtZS5kaXNwbGF5VGV4dCgnQ29ubmVjdGVkIHRvIEtpbmVjdCwgd2FpdGluZyBmb3IgcGxheWVycycpXG5cbiAga2luZWN0X29wZW5lZCA9IHRydWVcbiAgcHJvY2Vzc0tpbmVjdCgpXG59KVxuTy5hZGQoJ2dhbWUtY3JlYXRlZCcsIGZ1bmN0aW9uKCl7XG4gIGlmICghS2luZWN0LmlzQ29ubmVjdGVkKCkpXG4gICAgR2FtZS5kaXNwbGF5VGV4dCgnU2VhcmNoaW5nIGZvciBLaW5lY3QgY29ubmVjdGlvbiwgd2FpdCAxMCBzZWMnKVxuXG4gIGdhbWVfY3JlYXRlZCA9IHRydWVcbiAgcHJvY2Vzc0tpbmVjdCgpXG59KVxuXG5LaW5lY3QuY29ubmVjdCgpXG52YXIga2luZWN0VHJ5VG9Db25uZWN0ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgaWYoIUtpbmVjdC5pc0Nvbm5lY3RlZCgpKVxuICAgIEtpbmVjdC5jb25uZWN0KClcbn0sIDEwMDAwKVxuXG4vLyBXYWl0IGZvciAxMCBzZWNvbmRzLCBpZiBraW5lY3Qgbm90IGZvdW5kIHRoYXQgYWRkIGEgUGlrb1xuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICBpZiAoIUtpbmVjdC5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgZGVmYXVsdFBsYXllciA9IG5ldyBQaWtvKEdhbWUsIC0xLCA0MDAsIDMwMClcbiAgICBHYW1lLmRpc3BsYXlUZXh0KCdUbyBjb250cm9sIHByZXNzOiBxYXB0IC0gaGFuZHMsIHp4Y3YgLSBsZWdzLCBycyAtIGhlYWQnKVxuICAgIGNvbnNvbGUubG9nKCdBZGRpbmcgYXV0b25vbWUgcGxheWVyJylcbiAgfVxufSwgMTAwMDApXG4iLCJ2YXIgU2V0dGluZ3MgPSByZXF1aXJlKCcuL3NldHRpbmdzJylcbnZhciBPID0gcmVxdWlyZSgnLi9vYnNlcnZlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIGNvbm5lY3Rpb24gPSB7fVxuICB2YXIgY29ubmVjdCA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKGNvbm5lY3Rpb24ucmVhZHlTdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IGNvbm5lY3Rpb24ucmVhZHlTdGF0ZSA+IDEpIHtcbiAgICAgIGNvbm5lY3Rpb24gPSBuZXcgV2ViU29ja2V0KCd3czovLycrU2V0dGluZ3Muc29ja2V0Lmhvc3RuYW1lKyc6JytTZXR0aW5ncy5zb2NrZXQucG9ydCsnLycrU2V0dGluZ3Muc29ja2V0LnBhdGgpO1xuXG4gICAgICBjb25uZWN0aW9uLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgTy50cmlnZ2VyKCdraW5lY3Qtb3BlbmVkJywgdHJ1ZSlcbiAgICAgIH07XG5cbiAgICAgIGNvbm5lY3Rpb24ub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIE8udHJpZ2dlcigna2luZWN0LW1lc3NhZ2UnLCBKU09OLnBhcnNlKGV2ZW50LmRhdGEpKVxuICAgICAgfTtcblxuICAgICAgY29ubmVjdGlvbi5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIE8udHJpZ2dlcigna2luZWN0LWNsb3NlZCcsIHRydWUpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY29ubmVjdDogY29ubmVjdFxuICAsIGlzQ29ubmVjdGVkOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24ucmVhZHlTdGF0ZSAhPT0gdW5kZWZpbmVkICYmIGNvbm5lY3Rpb24ucmVhZHlTdGF0ZSA9PSAxXG4gICAgfVxuICB9XG59KClcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgLy8gUHJpdmF0ZSB2YXJcbiAgdmFyIG9ic2VydmVycyA9IFtdXG5cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGZ1bmN0aW9uKHRvcGljLCBvYnNlcnZlcikge1xuICAgICAgb2JzZXJ2ZXJzW3RvcGljXSB8fCAob2JzZXJ2ZXJzW3RvcGljXSA9IFtdKVxuXG4gICAgICBvYnNlcnZlcnNbdG9waWNdLnB1c2gob2JzZXJ2ZXIpXG4gICAgfVxuICAsIHJlbW92ZTogZnVuY3Rpb24odG9waWMsIG9ic2VydmVyKSB7XG4gICAgICBpZiAoIW9ic2VydmVyc1t0b3BpY10pXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdmFyIGluZGV4ID0gb2JzZXJ2ZXJzW3RvcGljXS5pbmRleE9mKG9ic2VydmVyKVxuXG4gICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgIG9ic2VydmVyc1t0b3BpY10uc3BsaWNlKGluZGV4LCAxKVxuICAgICAgfVxuICAgIH1cbiAgLCB0cmlnZ2VyOiBmdW5jdGlvbih0b3BpYywgbWVzc2FnZSkge1xuICAgICAgaWYgKCFvYnNlcnZlcnNbdG9waWNdKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGZvciAodmFyIGkgPSBvYnNlcnZlcnNbdG9waWNdLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIG9ic2VydmVyc1t0b3BpY11baV0obWVzc2FnZSlcbiAgICAgIH07XG4gICAgfVxuICB9XG59KClcbiIsInZhciBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vc2V0dGluZ3MnKVxuICAsIFMgPSBTZXR0aW5nc1xuICAsIE8gPSByZXF1aXJlKCcuL29ic2VydmVyJylcblxudmFyIFBpa28gPSBmdW5jdGlvbihnYW1lLCBpZCwgeCwgeSl7XG4gIHRoaXMuaW5pdChnYW1lLCBpZCwgeCwgeSlcbn1cblxuUGlrby5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGdhbWUsIGlkLCB4LCB5KXtcbiAgdGhpcy5nYW1lID0gZ2FtZVxuICB0aGlzLmlkID0gaWRcbiAgdGhpcy5zID0geyAvLyBTZXR0aW5nc1xuICAgIHg6IHggfHwgU2V0dGluZ3MucGlrb1MuY2VudGVyLnhcbiAgLCB5OiB5IHx8IFNldHRpbmdzLnBpa29TLmNlbnRlci55XG4gICwgcm90YXRpb25TdGVwOiBNYXRoLlBJIC8gMTgwXG4gICwgaGFuZFlEaXNwbGFjZW1lbnQ6IC1TLnBpa29TLmJvZHlIZWlnaHRGdWxsICogMC41ICsgUy5waWtvUy5ib2R5UmFkaWlcbiAgLCBoYW5kWURpc3BsYWNlbWVudENvbnN0cmFpbnQ6IC1TLnBpa29TLmhhbmRMZW5ndGggKiAwLjUgKyBTLnBpa29TLmhhbmRXaWR0aCAqIDAuNVxuICAsIGhhbmRYRGlzcGxhY2VtZW50OiBTLnBpa29TLmJvZHlXaWR0aCAvIDIgLSBTLnBpa29TLmhhbmRXaWR0aCAqIDAuNVxuICAsIGhlaWdodFF1ZXVlTGltaXQ6IDEwXG4gIH1cbiAgdGhpcy5icCA9IHt9IC8vIEJvZHkgcGFydHNcbiAgdGhpcy5jID0ge30gLy8gQ29uc3RyYWludHNcbiAgdGhpcy5oID0ge2hlaWdodHM6IFtdLCBwcmV2TWF4SGVpZ2h0OiAwfSAvLyBDYWNoZVxuICB0aGlzLmYgPSB7fSAvLyBGdW5jaW9ucy9DYWxsYmFja3NcbiAgdGhpcy5sYXN0QWxpdmUgPSBEYXRlLm5vdygpXG5cbiAgdGhpcy5hZGRCb2R5KClcbiAgdGhpcy5hZGRIZWFkKClcbiAgdGhpcy5hZGRMZWdzKClcbiAgdGhpcy5hZGRIYW5kcygpXG5cbiAgdGhpcy5hZGRDb25zdHJhaW50SGVhZCgpXG4gIHRoaXMuYWRkQ29uc3RyYWludEhhbmRMZWZ0KClcbiAgdGhpcy5hZGRDb25zdHJhaW50SGFuZFJpZ2h0KClcbiAgdGhpcy5hZGRDb25zdHJhaW50TGVnTGVmdCgpXG4gIHRoaXMuYWRkQ29uc3RyYWludExlZ1JpZ2h0KClcblxuICB0aGlzLmhvb2tLZXlib2FyZCgpXG4gIHRoaXMuaG9va1VwZGF0ZSgpXG5cbiAgdGhpcy5nYW1lLnJlZ2lzdGVyQm9keSh0aGlzKVxuXG4gIGlmICghUy5pc0RlYnVnKSB0aGlzLmJwLmJvZHkuYnJpbmdUb1RvcCgpXG59XG5cblBpa28ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICB2YXIgaTtcblxuICAvLyBSZW1vdmUgaG9va3NcbiAgdGhpcy51bmhvb2tVcGRhdGUoKVxuICB0aGlzLnVuaG9va0tleWJvYXJkKClcblxuICAvLyBSZW1vdmUgY29udHJhaW50cyBmcm9tIFAyXG4gIGZvciAoaSBpbiB0aGlzLmMpIHtcbiAgICBpZiAodGhpcy5jLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICB0aGlzLmdhbWUucmVtb3ZlQ29uc3RyYWludCh0aGlzLmNbaV0pXG4gICAgICBkZWxldGUgdGhpcy5jW2ldXG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGJvZGllcyBmcm9tIFAyXG4gIGZvciAoaSBpbiB0aGlzLmJwKSB7XG4gICAgaWYgKHRoaXMuYnAuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgIHRoaXMuYnBbaV0uZGVzdHJveSgpXG4gICAgICBkZWxldGUgdGhpcy5icFtpXVxuICAgIH1cbiAgfVxufVxuXG5QaWtvLnByb3RvdHlwZS5hZGRCb2R5ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5icC5ib2R5ID0gdGhpcy5nYW1lLmFkZFNwcml0ZSh0aGlzLnMueCwgdGhpcy5zLnksICdib2R5Jyk7XG5cbiAgdGhpcy5nYW1lLmVuYWJsZSh0aGlzLmJwLmJvZHkpXG5cbiAgdGhpcy5icC5ib2R5LmJvZHkuY2xlYXJTaGFwZXMoKTtcbiAgdGhpcy5icC5ib2R5LmJvZHkubG9hZFBvbHlnb24oJ3BoeXNpY3NEYXRhJywgJ2JvZHlfcycpO1xuXG4gIHRoaXMuYnAuYm9keS5ib2R5LnBpa29JZCA9IHRoaXMuaWRcbn1cblxuUGlrby5wcm90b3R5cGUuYWRkSGVhZCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuYnAuaGVhZCA9IHRoaXMuZ2FtZS5hZGRTcHJpdGUodGhpcy5zLngsIHRoaXMucy55IC0gKFMucGlrb1MuYm9keUhlaWdodEZ1bGwgKiAwLjUgKyBTLnBpa29TLm5lY2sgKyBTLnBpa29TLmhlYWRIZWlnaHQgKiAwLjUpLCAnaGVhZCcpXG5cbiAgdGhpcy5nYW1lLmVuYWJsZSh0aGlzLmJwLmhlYWQpXG5cbiAgdGhpcy5icC5oZWFkLmJvZHkuY2xlYXJTaGFwZXMoKTtcbiAgdGhpcy5icC5oZWFkLmJvZHkubG9hZFBvbHlnb24oJ3BoeXNpY3NEYXRhJywgJ2hlYWRfcycpO1xuXG4gIHRoaXMuYnAuaGVhZC5ib2R5LnBpa29JZCA9IHRoaXMuaWRcbn1cblxuUGlrby5wcm90b3R5cGUuYWRkTGVncyA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuYnAubGVnTGVmdCA9IHRoaXMuZ2FtZS5hZGRTcHJpdGUodGhpcy5zLnggKyBTLnBpa29TLmxlZ0Rpc3RhbmNlLCB0aGlzLnMueSArIFMucGlrb1MuYm9keUhlaWdodEZ1bGwgKiAwLjUsICdtZW1iZXInKVxuICB0aGlzLmJwLmxlZ1JpZ2h0ID0gdGhpcy5nYW1lLmFkZFNwcml0ZSh0aGlzLnMueCAtIFMucGlrb1MubGVnRGlzdGFuY2UsIHRoaXMucy55ICsgUy5waWtvUy5ib2R5SGVpZ2h0RnVsbCAqIDAuNSwgJ21lbWJlcicpXG5cbiAgdGhpcy5nYW1lLmVuYWJsZShbdGhpcy5icC5sZWdMZWZ0LCB0aGlzLmJwLmxlZ1JpZ2h0XSlcblxuICB0aGlzLmJwLmxlZ0xlZnQuYm9keS5jbGVhclNoYXBlcygpO1xuICB0aGlzLmJwLmxlZ1JpZ2h0LmJvZHkuY2xlYXJTaGFwZXMoKTtcbiAgdGhpcy5icC5sZWdMZWZ0LmJvZHkubG9hZFBvbHlnb24oJ3BoeXNpY3NEYXRhJywgJ21lbWJlcl9zJyk7XG4gIHRoaXMuYnAubGVnUmlnaHQuYm9keS5sb2FkUG9seWdvbigncGh5c2ljc0RhdGEnLCAnbWVtYmVyX3MnKTtcblxuICB0aGlzLmJwLmxlZ0xlZnQuYm9keS5waWtvSWQgPSB0aGlzLmlkXG4gIHRoaXMuYnAubGVnUmlnaHQuYm9keS5waWtvSWQgPSB0aGlzLmlkXG59XG5cblBpa28ucHJvdG90eXBlLmFkZEhhbmRzID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5icC5oYW5kTGVmdCA9IHRoaXMuZ2FtZS5hZGRTcHJpdGUodGhpcy5zLnggKyB0aGlzLnMuaGFuZFhEaXNwbGFjZW1lbnQsIHRoaXMucy55ICsgdGhpcy5zLmhhbmRZRGlzcGxhY2VtZW50IC0gdGhpcy5zLmhhbmRZRGlzcGxhY2VtZW50Q29uc3RyYWludCwgJ21lbWJlcicpXG4gIHRoaXMuYnAuaGFuZFJpZ2h0ID0gdGhpcy5nYW1lLmFkZFNwcml0ZSh0aGlzLnMueCAtIHRoaXMucy5oYW5kWERpc3BsYWNlbWVudCwgdGhpcy5zLnkgKyB0aGlzLnMuaGFuZFlEaXNwbGFjZW1lbnQgLSB0aGlzLnMuaGFuZFlEaXNwbGFjZW1lbnRDb25zdHJhaW50LCAnbWVtYmVyJylcblxuICB0aGlzLmdhbWUuZW5hYmxlKFt0aGlzLmJwLmhhbmRMZWZ0LCB0aGlzLmJwLmhhbmRSaWdodF0pXG5cbiAgdGhpcy5icC5oYW5kTGVmdC5ib2R5LmNsZWFyU2hhcGVzKCk7XG4gIHRoaXMuYnAuaGFuZFJpZ2h0LmJvZHkuY2xlYXJTaGFwZXMoKTtcbiAgdGhpcy5icC5oYW5kTGVmdC5ib2R5LmxvYWRQb2x5Z29uKCdwaHlzaWNzRGF0YScsICdtZW1iZXJfcycpO1xuICB0aGlzLmJwLmhhbmRSaWdodC5ib2R5LmxvYWRQb2x5Z29uKCdwaHlzaWNzRGF0YScsICdtZW1iZXJfcycpO1xuXG4gIHRoaXMuYnAuaGFuZExlZnQuYm9keS5waWtvSWQgPSB0aGlzLmlkXG4gIHRoaXMuYnAuaGFuZFJpZ2h0LmJvZHkucGlrb0lkID0gdGhpcy5pZFxufVxuXG5QaWtvLnByb3RvdHlwZS5hZGRDb25zdHJhaW50ID0gZnVuY3Rpb24oYjEsIHAxLCBiMiwgcDIsIGFuZ2xlU3RhcnQsIGFuZ2xlTWluLCBhbmdsZU1heCl7XG4gIHZhciBjb25zdHJhaW50ID0gdGhpcy5nYW1lLmFkZFJldm9sdXRlQ29uc3RyYWludChiMSwgcDEsIGIyLCBwMik7XG4gIGNvbnN0cmFpbnQucm90YXRlZCA9IGFuZ2xlU3RhcnQgLy8gY2FjaGUgcm90YXRpb24gY29uc3RyYWludFxuICBjb25zdHJhaW50LmxpbWl0cyA9IFthbmdsZU1pbiwgYW5nbGVNYXhdIC8vIGNhY2hlIHJvdGF0aW9uIGxpbWl0c1xuICB0aGlzLnNldFJldm9sdXRpb25MaW1pdHMoY29uc3RyYWludCwgY29uc3RyYWludC5yb3RhdGVkKVxuXG4gIHJldHVybiBjb25zdHJhaW50XG59XG5cblBpa28ucHJvdG90eXBlLnNldFJldm9sdXRpb25MaW1pdHMgPSBmdW5jdGlvbihvYmosIHVwcGVyLCBsb3dlcil7XG4gIGlmKGxvd2VyID09PSB1bmRlZmluZWQgfHwgbG93ZXIgPT09IG51bGwpIGxvd2VyID0gdXBwZXI7XG5cbiAgb2JqLnVwcGVyTGltaXRFbmFibGVkID0gdHJ1ZTtcbiAgb2JqLnVwcGVyTGltaXQgPSB1cHBlcjtcbiAgb2JqLmxvd2VyTGltaXRFbmFibGVkID0gdHJ1ZTtcbiAgb2JqLmxvd2VyTGltaXQgPSBsb3dlcjtcbn1cblxuUGlrby5wcm90b3R5cGUuYWRkQ29uc3RyYWludEhlYWQgPSBmdW5jdGlvbigpe1xuICB0aGlzLmMuaGVhZCA9IHRoaXMuYWRkQ29uc3RyYWludChcbiAgICB0aGlzLmJwLmJvZHlcbiAgLCBbMCwgLVMucGlrb1MuYm9keUhlaWdodEZ1bGwgKiAwLjVdXG4gICwgdGhpcy5icC5oZWFkXG4gICwgWzAsIFMucGlrb1MuaGVhZEhlaWdodCAqIDAuNSArIFMucGlrb1MubmVja11cbiAgLCAwXG4gICwgLU1hdGguUEkgKiAwLjJcbiAgLCBNYXRoLlBJICogMC4yXG4gIClcbn1cblxuUGlrby5wcm90b3R5cGUuYWRkQ29uc3RyYWludEhhbmRMZWZ0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5jLmhhbmRMZWZ0ID0gdGhpcy5hZGRDb25zdHJhaW50KFxuICAgIHRoaXMuYnAuYm9keVxuICAsIFt0aGlzLnMuaGFuZFhEaXNwbGFjZW1lbnQsIHRoaXMucy5oYW5kWURpc3BsYWNlbWVudF1cbiAgLCB0aGlzLmJwLmhhbmRMZWZ0XG4gICwgWzAsIHRoaXMucy5oYW5kWURpc3BsYWNlbWVudENvbnN0cmFpbnRdXG4gICwgLU1hdGguUEkgLyA2XG4gICwgLU1hdGguUEkgKiAwLjhcbiAgLCAtTWF0aC5QSSAvIDZcbiAgKVxufVxuUGlrby5wcm90b3R5cGUuYWRkQ29uc3RyYWludEhhbmRSaWdodCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuYy5oYW5kUmlnaHQgPSB0aGlzLmFkZENvbnN0cmFpbnQoXG4gICAgdGhpcy5icC5ib2R5XG4gICwgWy10aGlzLnMuaGFuZFhEaXNwbGFjZW1lbnQsIHRoaXMucy5oYW5kWURpc3BsYWNlbWVudF1cbiAgLCB0aGlzLmJwLmhhbmRSaWdodFxuICAsIFswLCB0aGlzLnMuaGFuZFlEaXNwbGFjZW1lbnRDb25zdHJhaW50XVxuICAsIE1hdGguUEkgLyA2XG4gICwgTWF0aC5QSSAvIDZcbiAgLCBNYXRoLlBJICogMC44XG4gIClcbn1cblBpa28ucHJvdG90eXBlLmFkZENvbnN0cmFpbnRMZWdMZWZ0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5jLmxlZ0xlZnQgPSB0aGlzLmFkZENvbnN0cmFpbnQoXG4gICAgdGhpcy5icC5ib2R5XG4gICwgW1MucGlrb1MubGVnRGlzdGFuY2UsIFMucGlrb1MuYm9keUhlaWdodEZ1bGwgKiAwLjVdXG4gICwgdGhpcy5icC5sZWdMZWZ0XG4gICwgWzAsIDBdXG4gICwgMFxuICAsIC1NYXRoLlBJIC8gNFxuICAsIE1hdGguUEkgLzRcbiAgKVxufVxuUGlrby5wcm90b3R5cGUuYWRkQ29uc3RyYWludExlZ1JpZ2h0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5jLmxlZ1JpZ2h0ID0gdGhpcy5hZGRDb25zdHJhaW50KFxuICAgIHRoaXMuYnAuYm9keVxuICAsIFstUy5waWtvUy5sZWdEaXN0YW5jZSwgUy5waWtvUy5ib2R5SGVpZ2h0RnVsbCAqIDAuNV1cbiAgLCB0aGlzLmJwLmxlZ1JpZ2h0XG4gICwgWzAsIDBdXG4gICwgMFxuICAsIC1NYXRoLlBJIC8gNFxuICAsIE1hdGguUEkgLzRcbiAgKVxufVxuXG5QaWtvLnByb3RvdHlwZS5ob29rS2V5Ym9hcmQgPSBmdW5jdGlvbigpe1xuICB2YXIgdGhhdCA9IHRoaXNcblxuICBPLmFkZCgna2V5Ym9hcmQtcScsIHRoaXMuZi5mMSA9IGZ1bmN0aW9uKCl7dGhhdC5jLmhhbmRSaWdodC5yb3RhdGVkICs9IHRoYXQucy5yb3RhdGlvblN0ZXB9KSAvLyB1cFxuICBPLmFkZCgna2V5Ym9hcmQtYScsIHRoaXMuZi5mMiA9IGZ1bmN0aW9uKCl7dGhhdC5jLmhhbmRSaWdodC5yb3RhdGVkIC09IHRoYXQucy5yb3RhdGlvblN0ZXB9KSAvLyBkb3duXG4gIE8uYWRkKCdrZXlib2FyZC10JywgdGhpcy5mLmYzID0gZnVuY3Rpb24oKXt0aGF0LmMuaGFuZExlZnQucm90YXRlZCArPSB0aGF0LnMucm90YXRpb25TdGVwfSkgLy8gZG93blxuICBPLmFkZCgna2V5Ym9hcmQtcCcsIHRoaXMuZi5mNCA9IGZ1bmN0aW9uKCl7dGhhdC5jLmhhbmRMZWZ0LnJvdGF0ZWQgLT0gdGhhdC5zLnJvdGF0aW9uU3RlcH0pIC8vIHVwXG4gIE8uYWRkKCdrZXlib2FyZC1zJywgdGhpcy5mLmY1ID0gZnVuY3Rpb24oKXt0aGF0LmMuaGVhZC5yb3RhdGVkICs9IHRoYXQucy5yb3RhdGlvblN0ZXB9KSAvLyByaWdodFxuICBPLmFkZCgna2V5Ym9hcmQtcicsIHRoaXMuZi5mNiA9IGZ1bmN0aW9uKCl7dGhhdC5jLmhlYWQucm90YXRlZCAtPSB0aGF0LnMucm90YXRpb25TdGVwfSkgLy8gbGVmdFxuICBPLmFkZCgna2V5Ym9hcmQteicsIHRoaXMuZi5mNyA9IGZ1bmN0aW9uKCl7dGhhdC5jLmxlZ1JpZ2h0LnJvdGF0ZWQgKz0gdGhhdC5zLnJvdGF0aW9uU3RlcH0pIC8vIGxlZnRcbiAgTy5hZGQoJ2tleWJvYXJkLXgnLCB0aGlzLmYuZjggPSBmdW5jdGlvbigpe3RoYXQuYy5sZWdSaWdodC5yb3RhdGVkIC09IHRoYXQucy5yb3RhdGlvblN0ZXB9KSAvLyByaWdodFxuICBPLmFkZCgna2V5Ym9hcmQtYycsIHRoaXMuZi5mOSA9IGZ1bmN0aW9uKCl7dGhhdC5jLmxlZ0xlZnQucm90YXRlZCArPSB0aGF0LnMucm90YXRpb25TdGVwfSkgLy8gbGVmdFxuICBPLmFkZCgna2V5Ym9hcmQtdicsIHRoaXMuZi5mMTAgPSBmdW5jdGlvbigpe3RoYXQuYy5sZWdMZWZ0LnJvdGF0ZWQgLT0gdGhhdC5zLnJvdGF0aW9uU3RlcH0pIC8vIHJpZ2h0XG4gIE8uYWRkKCdrZXlib2FyZC1qJywgdGhpcy5mLmYxMSA9IGZ1bmN0aW9uKCl7XG4gICAgLy8gSnVtcFxuICAgIGlmICh0aGF0LmJwLmJvZHkuYm9keS5kYXRhLmFuZ2xlID4gLU1hdGguUEkgLyA0ICYmIHRoYXQuYnAuYm9keS5ib2R5LmRhdGEuYW5nbGUgPCBNYXRoLlBJIC8gNCkge1xuICAgICAgdGhhdC5icC5ib2R5LmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG4gICAgfVxuICB9KVxufVxuUGlrby5wcm90b3R5cGUudW5ob29rS2V5Ym9hcmQgPSBmdW5jdGlvbigpe1xuICBPLnJlbW92ZSgna2V5Ym9hcmQtcScsIHRoaXMuZi5mMSlcbiAgTy5yZW1vdmUoJ2tleWJvYXJkLWEnLCB0aGlzLmYuZjIpXG4gIE8ucmVtb3ZlKCdrZXlib2FyZC10JywgdGhpcy5mLmYzKVxuICBPLnJlbW92ZSgna2V5Ym9hcmQtcCcsIHRoaXMuZi5mNClcbiAgTy5yZW1vdmUoJ2tleWJvYXJkLXMnLCB0aGlzLmYuZjUpXG4gIE8ucmVtb3ZlKCdrZXlib2FyZC1yJywgdGhpcy5mLmY2KVxuICBPLnJlbW92ZSgna2V5Ym9hcmQteicsIHRoaXMuZi5mNylcbiAgTy5yZW1vdmUoJ2tleWJvYXJkLXgnLCB0aGlzLmYuZjgpXG4gIE8ucmVtb3ZlKCdrZXlib2FyZC1jJywgdGhpcy5mLmY5KVxuICBPLnJlbW92ZSgna2V5Ym9hcmQtdicsIHRoaXMuZi5mMTApXG4gIE8ucmVtb3ZlKCdrZXlib2FyZC1qJywgdGhpcy5mLmYxMSlcbn1cblxuUGlrby5wcm90b3R5cGUuaG9va1VwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0aGF0ID0gdGhpc1xuXG4gIE8uYWRkKCd1cGRhdGUnLCB0aGlzLmYudSA9IGZ1bmN0aW9uKCl7XG4gICAgdGhhdC5yb3RhdGVPYmplY3QodGhhdC5jLmhhbmRMZWZ0KVxuICAgIHRoYXQucm90YXRlT2JqZWN0KHRoYXQuYy5oYW5kUmlnaHQpXG4gICAgdGhhdC5yb3RhdGVPYmplY3QodGhhdC5jLmxlZ0xlZnQpXG4gICAgdGhhdC5yb3RhdGVPYmplY3QodGhhdC5jLmxlZ1JpZ2h0KVxuICAgIHRoYXQucm90YXRlT2JqZWN0KHRoYXQuYy5oZWFkKVxuICB9KVxufVxuUGlrby5wcm90b3R5cGUudW5ob29rVXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgTy5yZW1vdmUoJ3VwZGF0ZScsIHRoaXMuZi51KVxufVxuXG5QaWtvLnByb3RvdHlwZS5yb3RhdGVPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgaWYgKG9iai5yb3RhdGVkIDwgLU1hdGguUEkpIG9iai5yb3RhdGVkICs9IE1hdGguUEkgKiAyXG4gIGlmIChvYmoucm90YXRlZCA+IE1hdGguUEkpIG9iai5yb3RhdGVkIC09IE1hdGguUEkgKiAyXG5cbiAgaWYgKG9iai5yb3RhdGVkIDwgb2JqLmxpbWl0c1swXSB8fCBvYmoucm90YXRlZCA+IG9iai5saW1pdHNbMV0pIHtcbiAgICBpZiAoTWF0aC5hYnMob2JqLnJvdGF0ZWQgLSBvYmoubGltaXRzWzBdKSA8IE1hdGguYWJzKG9iai5yb3RhdGVkIC0gb2JqLmxpbWl0c1sxXSkpIHtcbiAgICAgIG9iai5yb3RhdGVkID0gb2JqLmxpbWl0c1swXVxuICAgIH0gZWxzZSB7XG4gICAgICBvYmoucm90YXRlZCA9IG9iai5saW1pdHNbMV1cbiAgICB9XG4gIH1cblxuICB0aGlzLnNldFJldm9sdXRpb25MaW1pdHMob2JqLCBvYmoucm90YXRlZClcbn1cblxuZnVuY3Rpb24gYW5nbGVCZXR3ZWVuTGluZXNBc1BvaW50cyhwMTEsIHAxMiwgcDIxLCBwMjIsIGZhbGxiYWNrKSB7XG4gIGlmKCFwMTEgfHwgIXAxMiB8fCAhcDIxIHx8ICFwMjIpIHJldHVybiBmYWxsYmFjaztcblxuICB2YXIgYW5nbGUxID0gTWF0aC5hdGFuMihwMTEueSAtIHAxMi55LCBwMTEueCAtIHAxMi54KTtcbiAgdmFyIGFuZ2xlMiA9IE1hdGguYXRhbjIocDIxLnkgLSBwMjIueSwgcDIxLnggLSBwMjIueCk7XG4gIHJldHVybiBhbmdsZTEtYW5nbGUyO1xufVxuXG5mdW5jdGlvbiBhbmdsZUJldHdlZW4zUG9pbnRzKHAxLCBwMiwgcDMsIGZhbGxiYWNrKSB7XG4gIHJldHVybiBhbmdsZUJldHdlZW5MaW5lc0FzUG9pbnRzKHAxLCBwMiwgcDIsIHAzLCBmYWxsYmFjaylcbn1cblxuZnVuY3Rpb24gYW5nbGVCeUhvcml6b250KHAxLCBwMiwgZmFsbGJhY2spIHtcbiAgaWYoIXAxIHx8ICFwMikgcmV0dXJuIGZhbGxiYWNrO1xuICByZXR1cm4gTWF0aC5hdGFuMihwMS55IC0gcDIueSwgcDEueCAtIHAyLngpO1xufVxuXG5QaWtvLnByb3RvdHlwZS5wcm9jZXNzS2luZWN0ID0gZnVuY3Rpb24oZGF0YSl7XG4gIHRoaXMubGFzdEFsaXZlID0gRGF0ZS5ub3coKVxuXG4gIC8vIEhhbmRzXG4gIHRoaXMuYy5oYW5kTGVmdC5yb3RhdGVkID0gYW5nbGVCZXR3ZWVuM1BvaW50cyhkYXRhLmxlZnRfc2hvdWxkZXIsIGRhdGEucmlnaHRfc2hvdWxkZXIsIGRhdGEucmlnaHRfZWxib3csIHRoaXMuYy5oYW5kTGVmdC5yb3RhdGVkKSAtIE1hdGguUEkgKiAwLjVcbiAgdGhpcy5jLmhhbmRSaWdodC5yb3RhdGVkID0gYW5nbGVCZXR3ZWVuM1BvaW50cyhkYXRhLnJpZ2h0X3Nob3VsZGVyLCBkYXRhLmxlZnRfc2hvdWxkZXIsIGRhdGEubGVmdF9lbGJvdywgdGhpcy5jLmhhbmRMZWZ0LnJvdGF0ZWQpICsgTWF0aC5QSSAqIDAuNVxuXG4gIC8vIExlZ3NcbiAgdGhpcy5jLmxlZ0xlZnQucm90YXRlZCA9IC1hbmdsZUJ5SG9yaXpvbnQoZGF0YS5yaWdodF9oaXAsIGRhdGEucmlnaHRfZm9vdCwgdGhpcy5jLmxlZ0xlZnQucm90YXRlZCkgLSBNYXRoLlBJICogMC41XG4gIHRoaXMuYy5sZWdSaWdodC5yb3RhdGVkID0gLWFuZ2xlQnlIb3Jpem9udChkYXRhLmxlZnRfaGlwLCBkYXRhLmxlZnRfZm9vdCwgdGhpcy5jLmxlZ1JpZ2h0LnJvdGF0ZWQpIC0gTWF0aC5QSSAqIDAuNVxuXG4gIC8vIEhlYWRcbiAgaWYoZGF0YS5uZWNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBOZWNrIGlzIHZlcnkgdW5zdGFibGVcbiAgICB2YXIgYSA9IC1NYXRoLmF0YW4yKChkYXRhLmxlZnRfc2hvdWxkZXIueSArIGRhdGEucmlnaHRfc2hvdWxkZXIueSkgKiAwLjUgLSBkYXRhLm5lY2sueSwgKGRhdGEubGVmdF9zaG91bGRlci54ICsgZGF0YS5yaWdodF9zaG91bGRlci54KSAqIDAuNSAtIGRhdGEubmVjay54KVxuICAgIGlmIChhIDwgLU1hdGguUEkgKiAwLjUpIGEgKz0gTWF0aC5QSVxuICAgIGlmIChhID4gTWF0aC5QSSAqIDAuNSkgYSAtPSBNYXRoLlBJXG5cbiAgICB0aGlzLmMuaGVhZC5yb3RhdGVkID0gYVxuICB9XG5cbiAgdGhpcy5yZWNvcmRIZWlnaHQoZGF0YSlcbiAgdmFyIGhcbiAgaWYoaCA9IHRoaXMuanVtcEhlaWdodCgpID4gMCl7XG4gICAgY29uc29sZS5sb2coaClcbiAgICB0aGlzLmJwLmJvZHkuYm9keS52ZWxvY2l0eS55ID0gLTgwMCAtIGgqNTtcbiAgfVxufVxuXG5cblBpa28ucHJvdG90eXBlLnJlY29yZEhlaWdodCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgLy8gUmVtb3ZlIG9sZGVzdCBoZWlnaHQgbGltaXRzIGlzIGxpbWl0IHJlYWNoZWRcbiAgaWYgKHRoaXMuaC5oZWlnaHRzLmxlbmd0aCArIDEgPiB0aGlzLnMuaGVpZ2h0UXVldWVMaW1pdCkgdGhpcy5oLmhlaWdodHMuc2hpZnQoKTtcblxuICB0aGlzLmguaGVpZ2h0cy5wdXNoKChkYXRhLmxlZnRfc2hvdWxkZXIueSArIGRhdGEucmlnaHRfc2hvdWxkZXIueSArIGRhdGEubGVmdF9zaG91bGRlci55ICsgZGF0YS5yaWdodF9zaG91bGRlci55KSAqIDAuMjUpXG59XG5cblBpa28ucHJvdG90eXBlLmp1bXBIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgLy8gQ2hlY2sgb25seSBpZiB3ZSBoYXZlIGhpc3RvcnkgZGF0YVxuICBpZiAodGhpcy5oLmhlaWdodHMubGVuZ3RoID09IHRoaXMucy5oZWlnaHRRdWV1ZUxpbWl0KSB7XG4gICAgdmFyIG1pbiA9IHRoaXMuaC5oZWlnaHRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKXtyZXR1cm4gTWF0aC5taW4ocHJldiwgY3Vycil9LCB0aGlzLmguaGVpZ2h0c1swXSlcbiAgICB2YXIgbWF4ID0gdGhpcy5oLmhlaWdodHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpe3JldHVybiBNYXRoLm1heChwcmV2LCBjdXJyKX0sIHRoaXMuaC5oZWlnaHRzWzBdKVxuXG4gICAgLy8gUHJldmlvdXMgbWF4IHNob3VsZCBiZSBsb3dlciBhcyBZIGF4aXMgaXMgaW52ZXJzZVxuICAgIGlmIChtYXggLSBtaW4gPiA4MCAmJiBtYXggPCB0aGlzLmgucHJldk1heEhlaWdodCkge1xuICAgICAgdGhpcy5oLmhlaWdodHMgPSBbXSAvLyByZXNldCBqdW1wcyBoaXN0b3J5XG4gICAgICB0aGlzLmgucHJldk1heEhlaWdodCA9IG1heFxuICAgICAgcmV0dXJuIG1heC1taW5cbiAgICB9XG5cbiAgICAvLyBTdG9yZSBwcmV2aW91cyBtYXggc28gd2UgY2FuIGNoZWNrIGlmIHdlIGp1bXBlZCB1cCBvciBkb3duXG4gICAgdGhpcy5oLnByZXZNYXhIZWlnaHQgPSBtYXhcblxuICAgIHJldHVybiAwXG4gIH1cbn1cblxuUGlrby5wcm90b3R5cGUuc2hvdWxkRGllID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLmxhc3RBbGl2ZSA+IFMuYm9keUxpZmVzcGFuO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBpa29cbiIsIlNldHRpbmdzID0ge1xuICB3aWR0aDogODAwXG4sIGhlaWdodDogNjAwXG4sIGlzRGVidWc6IGZhbHNlXG4sIHNwcml0ZVNjYWxlOiAzMDAvMTMuOCAvLyAyMS43NFxuLCBib2R5TGlmZXNwYW46IDUwMDBcbiwgcGlrbzogeyAvLyBQaWNvIHNldHRpbmdzXG4gICAgYm9keVdpZHRoOiA2LjJcbiAgLCBib2R5SGVpZ2h0RnVsbDogOC40IC8vIDE4M1xuICAsIGJvZHlIZWlnaHRMb3dlcjogOC40IC0gMy4xXG4gICwgYm9keVJhZGlpOiAzLjFcbiAgLCBsZWdIZWlnaHQ6IDIuNFxuICAsIGxlZ1dpZHRoOiAwLjZcbiAgLCBsZWdEaXN0YW5jZTogMS41XG4gICwgaGFuZExlbmd0aDogMi40XG4gICwgaGFuZFdpZHRoOiAwLjZcbiAgLCBuZWNrOiAwLjJcbiAgLCBoZWFkSGVpZ2h0OiA0LjJcbiAgLCBoZWlnaHRUb3RhbDogMTMuOFxuICB9XG4sIHBpa29TOiB7IC8vIFBpa28gc2V0dGluZ3Mgc2NhbGVkXG4gICAgY2VudGVyOiB7XG4gICAgICB4OiAxMDA4LzJcbiAgICAsIHk6IDcwMC8yXG4gICAgfVxuICB9XG4sIHNvY2tldDoge1xuICAgIGhvc3RuYW1lOiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IFwiODA4MFwiLFxuICAgIHBhdGg6IFwicDV3ZWJzb2NrZXRcIixcbiAgfVxufVxuXG5mb3IodmFyIGtleSBpbiBTZXR0aW5ncy5waWtvKSB7aWYgKCFTZXR0aW5ncy5waWtvLmhhc093blByb3BlcnR5KGtleSkpIGNvbnRpbnVlO1xuICBTZXR0aW5ncy5waWtvU1trZXldID0gU2V0dGluZ3MucGlrb1trZXldICogU2V0dGluZ3Muc3ByaXRlU2NhbGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZXR0aW5nc1xuIl19
;