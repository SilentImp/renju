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
  users[userId] = {sock:socket};
  socket.emit('userId', userId);
  socket.emit('users', _.chain(users).filter(function(obj){ return obj.status == 'available';}).map(function(u){
    return _(u).omit('sock');
  }));

  socket.on('user', function(data){
    users[userId] = _(users[userId]).extend(data);
    users[userId].status = 'available';
    var usr = _.clone(users[userId]);
    usr.sock = undefined;
    socket.broadcast.emit('broadcast', usr);
  });

  socket.on('disconnect', function(){
    users[userId].sock = undefined;
    users[userId].status = 'dead';
    socket.broadcast.emit('broadcast', users[userId]);
    delete users[userId];
  });

  socket.on('message', function(data){
    if(!users[data.to]) return;
    users[data.to].sock.emit('message', data);
  });

  socket.on('broadcast', function(data){
    if(data.status && data.origin && data.origin.id){
      users[data.origin.id].sock = undefined;
      users[data.origin.id].status = data.status;
    }
    socket.broadcast.emit('broadcast', data);
  });

});
