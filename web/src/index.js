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
