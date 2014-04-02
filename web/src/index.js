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
