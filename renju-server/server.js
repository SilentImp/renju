var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(1337);

var users = [];


function handler (req, res) {
    res.writeHead(200);
    res.end('SocketIO - server, use 1337 port');
}

io.sockets.on('connection', function (socket) {
  var userId = users.length;
  users[userId] = socket;
  socket.emit('userId', userId);
  socket.on('disconnect', function(){
    delete socket[userId];
  })
  socket.on('message', function(data){
    if(!users[data.to]) return;
    users[data.to].emit('message', data);
  })
  socket.on('broadcast', function(data){
    socket.broadcast.emit('broadcast', data);
  })

});
