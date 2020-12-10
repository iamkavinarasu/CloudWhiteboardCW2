var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', process.env.PORT || 8081);
app.use(express.static("public"))

app.use('/', function(req,res){
    res.sendFile(path.join(__dirname+'/public/index.html'));
  });

server.listen(process.env.PORT || 8081, function() {
    console.log(`Starting server on port ${process.env.PORT || 8081}`);
  });


const users = {}

const usersList = []

var history = []

io.on('connection',(socket) => {

    // Maintain an array of users (Inserted into the array as they join)
    usersList.push(socket.id)

    //Selecting a leader from a list of users (socket ids)
    leader = usersList[0]
    socket.emit('leader', leader)

    // Appoint another leader incase the leader node disconnects
    socket.on('disconnect', () => {
      var index = usersList.indexOf(socket.id);
      if (index !== -1) {
        disconnectedSocket = usersList.splice(index, 1);
        if (disconnectedSocket == leader)
        {
          leader = usersList[0]
        } 
      }
    });


    // For state management.
    socket.emit('redrawEverything', history)
        
    socket.on('rectangleCoordinates', (coords) => {
        const {x, y, width, height, strokeWeight} = coords
        const rectangleObject = {'shape':'Rectangle',
                                  'x':x,
                                  'y':y,
                                  'width':width,
                                  'height':height,
                                  'strokeWeight':strokeWeight}
        history.push(rectangleObject)
        io.sockets.emit('drawRectangle',coords);
    });

    socket.on('circleDimensions', (coords) => {
      const {x, y, width, height, strokeWeight} = coords
      const circleObject = {'shape':'Circle',
                                  'x':x,
                                  'y':y,
                                  'width':width,
                                  'height':height,
                                  'strokeWeight':strokeWeight}
      history.push(circleObject)
      io.sockets.emit('drawCircle',coords);
  });

});