var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , _ = require('underscore')

app.listen(1337, '178.79.181.157');

var users = [];


function handler (req, res) {
    res.writeHead(200);
    res.end('SocketIO - server, use 1337 port');
}

io.sockets.on('connection', function (socket) {
  var userId = users.length;
  users[userId] = {sock:socket, 'status':'available'};
  socket.emit('userId', userId);
  socket.emit('users', _(users).filter(function(obj){ return obj.status == 'available';}));

  socket.on('user', function(data){
    users[userId] = _(users[userId]).extend(data);
  });
  socket.on('disconnect', function(){
    socket[userId].sock = undefined;
    socket[userId].status = 'dead';
    socket.broadcast.emit('broadcast', socket[userId].status);
    delete socket[userId];
  })
  socket.on('message', function(data){
    if(!users[data.to]) return;
    users[data.to].sock.emit('message', data);
  })
  socket.on('broadcast', function(data){
    if(data.status && data.origin && data.origin.id){
      users[data.origin.id].status = data.status;
    }
    socket.broadcast.emit('broadcast', data);
  })

});
