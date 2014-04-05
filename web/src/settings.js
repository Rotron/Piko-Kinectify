Settings = {
  width: 1008
, height: 700
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
