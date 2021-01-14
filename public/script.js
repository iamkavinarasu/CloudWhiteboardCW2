// Creating a socket
var socket = io({
  transports: [ 'websocket', 'polling' ]
})

var toolId = 0 
var toolsList = document.querySelectorAll(".tool")

var lastPoint = null
var graphic = null

var squareOrigin = null
var circleOrigin = null


var coords = []

for (var i = 0; i < toolsList.length; i++) {
  toolsList[i].onclick = function (id) {
    return function () {
      toolId = id
      for (var i = 0; i < toolsList.length; i++) {
        toolsList[i].classList.remove("selected")
      if (id == i)
        toolsList[i].classList.add("selected")
      }
    }
  }(i)
}

function setup() {
  createCanvas(document.body.clientWidth, document.body.clientHeight - 50).parent("#canvas")
  graphic = createGraphics(document.body.clientWidth, document.body.clientHeight - 50)
  graphic.background(255)
}

function draw() {
  background(255)
  image(graphic, 0, 0)
  
  if (mouseIsPressed) {
    if (lastPoint == null)
    lastPoint = [mouseX, mouseY]
  
  if (toolId == 0) {
    if (squareOrigin == null) {
      squareOrigin = [mouseX, mouseY]
    } else {
      noStroke()
      rect(squareOrigin[0], squareOrigin[1], mouseX - squareOrigin[0], mouseY - squareOrigin[1])
    }
  }
  
  if (toolId == 1) {
    if (circleOrigin == null) {
      circleOrigin = [mouseX, mouseY]
    } else {
      noStroke()
      let d = createVector(mouseX - circleOrigin[0], mouseY - circleOrigin[1]).mag()
      ellipseMode(CENTER)
      ellipse(circleOrigin[0], circleOrigin[1], d * 2, d * 2)
    }
  }
    
  lastPoint = [mouseX, mouseY]
  } else {
    lastPoint = null
    onMouseQuit()
  }
 
}

function onMouseQuit() {
  if (squareOrigin != null) {
      graphic.rect(squareOrigin[0], squareOrigin[1], mouseX - squareOrigin[0], mouseY - squareOrigin[1])
      captureRectangleCoordinates(squareOrigin[0], squareOrigin[1], mouseX - squareOrigin[0], mouseY - squareOrigin[1], 5)
      squareOrigin = null
  }
  if (circleOrigin != null) {
    let d = createVector(mouseX - circleOrigin[0], mouseY - circleOrigin[1]).mag()
    graphic.ellipseMode(CENTER)
    graphic.ellipse(circleOrigin[0], circleOrigin[1], d * 2, d * 2)
    captureCircleDimensions(circleOrigin[0], circleOrigin[1], d * 2, d * 2, 5)
    circleOrigin = null
  }
}

function captureRectangleCoordinates(x,y,width,height,strokeWeight)
{
  coords = {
    'x': x,
    'y': y,
    'width': width,
    'height': height,
    'strokeWeight': strokeWeight 
  }
  if(socket.connected)
    socket.emit('rectangleCoordinates', coords)
}

function captureCircleDimensions(x,y,width,height, strokeWeight)
{
  coords = {
    'x': x,
    'y': y,
    'width': width,
    'height': height,
    'strokeWeight' : strokeWeight
  }
  if(socket.connected)
    socket.emit('circleDimensions', coords)
}


function drawRectangleOnClient(x,y,width,height, strokeWeight)
{
  graphic.strokeWeight(strokeWeight)
  graphic.rect(x,y,width,height)
}

function drawCircleOnClient(x,y,width,height, strokeWeight)
{
  graphic.strokeWeight(strokeWeight)
  graphic.ellipseMode(CENTER)
  graphic.ellipse(x,y,width,height)
}

function addThisUser(username,index){
  var node=document.createElement("LI");
  var textnode=document.createTextNode(username);;
  node.appendChild(textnode);
  document.getElementById("Users").appendChild(node);
}

leader = false

socket.on('connect', () => {

  socket.on('leader', (leader) => {
      if (leader == socket.id)
        socket.leader = true
    });

    socket.on('redrawEverything', (history) =>{
      history.forEach( (element) => {

        if (element.shape == "Rectangle")
        {
          drawRectangleOnClient(element.x,element.y,element.width,element.height,element.strokeWeight)
        }
        else if(element.shape == "Circle")
        {
          drawCircleOnClient(element.x,element.y,element.width,element.height,element.strokeWeight)
        }
      });
      });

    socket.on('drawRectangle', (receivedCoords) => {
      const {x,y,width,height,strokeWeight} = receivedCoords
      console.log(`Received coordinates: ${x} ${y} ${width} ${height} ${strokeWeight}`)

      drawRectangleOnClient(x,y,width,height,strokeWeight)

    });

    socket.on('drawCircle', (receivedCoords) => {
      const {x,y,width,height,strokeWeight} = receivedCoords
      console.log(`Received coordinates: ${x} ${y} ${width} ${height} ${strokeWeight}`)

      drawCircleOnClient(x,y,width,height, strokeWeight)

    });

});

/**
 * Do not send events to author
 * Maintain history in stack emit it when a new user joins - [{shape:, x, y, h, w}]
 */