### Requirements:
* Processing
* Processing library: [WebSocketP5](http://muthesius.github.io/WebSocketP5/websocketP5-0.1.3/)
* Processing library: [SimpleOpenNI](https://code.google.com/p/simple-openni/downloads/)
* SimpleOpenNI Version 0.27
* Kinect One (hardware)
* Google Chrome 33

### Sources/Inspiration
* [Kinect-Virtual-Disco-Deathmatch](https://github.com/sydlawrence/Kinect-Virtual-Disco-Deathmatch) with [instructions](http://developkinect.com/resource/mac-os-x/kinect-virtual-disco-deathmatch-installation-guide)
* [Phaser 2](http://phaser.io/), [Docs](http://rcolinray.github.io/phaser-dash-docset/), [Examples](http://examples.phaser.io/)

### Features
* Offline mode: if Kinect is not connected you still can control the player
* Automatic connection detection: you may first start the browser and then the processing application, it should find the connection automatically
* Multiple players instances: application supports as many players as many are supported by Kinect
* Dead players are removed automatically from playground in 5-10 seconds
* Player can be controlled by moving hands, legs, head and jumping

### How to run
* Download or clone repository
* Open processing/processing.pde in your Processing IDE
* Open web/index.html in Chrome (or Firefox)
* Play

### Demo
* [Web standalone](http://bumbu.github.io/Piko-Kinectify/web/)
* [Youtube Piko Kinectify](https://www.youtube.com/watch?v=CvOIyR2JgSs)
* [Youtube Piko Kinectify 2](https://www.youtube.com/watch?v=K68MGGk0tGQ)

### ToDo
* Add a random object on raising hands up
