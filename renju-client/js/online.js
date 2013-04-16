var socket = io.connect('http://localhost:1337/');
socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});

socket.on('connect', function(){
  //TODO: put stuff on loggingin
});

socket.on('message', function(data){
  if(data.type == 'transaction'){
    $(observer).trigger('transaction:' + data.transactionId, data);
  }
  //TODO: put other message handlers
});

var observer = {};

function message(msgObj){
  var baseMsg = {name:"someName"};
  return _(baseMsg).extend(msgObj);
}

function broadcast(){
  return {
    available: function(){
      socket.emit(message({'status':'available'}));
    },
    busy: function(){
      socket.emit(message({'status':'busy'}))
    }
  }
}

function send(){
  return {
    message: function(userId, msgObj){
      var msgObj = _({'type':'message'}).extend(msgObj);
      socket.emit(message(msgObj));
    },
    transaction: function(userId, msgObj, callback){
      var transactionId = getTransactionId();
      var msgObj = _({'type':'transaction','transactionId': transactionId}).extend(msgObj);
      socket.emit(message(msgObj));
      $(observer).on('transaction:'+ transactionId, callback);
    }
  }
  function getTransactionId(){
    return Math.floor(Math.random()*99999);
  }
}


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