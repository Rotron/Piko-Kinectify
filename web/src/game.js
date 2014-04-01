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
