var connection = {}
  , config = {
      socket: {
        hostname: "localhost",
        port: "8080",
        path: "p5websocket",
      }
    }
  ;

openConnection = function() {
  if (connection.readyState === undefined || connection.readyState > 1) {
    connection = new WebSocket('ws://'+config.socket.hostname+':'+config.socket.port+'/'+config.socket.path);
    connection.onopen = function () {
      console.log('socket opened')
    };

    connection.onmessage = function (event) {
      O.trigger('kinect', JSON.parse(event.data))
    };

    connection.onclose = function (event) {
      console.log("socket closed");
    };
  }
}
openConnection();
