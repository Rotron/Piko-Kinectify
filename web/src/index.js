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

