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
        if (!players.hasOwnProperty(data.player)) {
          // Create new player
          players[data.player] = new Piko(Game, data.player, data.right_shoulder.x || 400, 500 - data.right_shoulder.y || 300)
        }

        players[data.player].processKinect(data)
      })
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
