var socket = io.connect('http://websaints.net:1337/');
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });

 // var sock = new SockJS('http://websaints.net:1337/');
 // sock.onopen = function() {
 //     console.log('open');
 // };
 // sock.onmessage = function(e) {
 //     console.log('message', e.data);
 // };
 // sock.onclose = function() {
 //     console.log('close');
 // };
 // sock.send('bojo');