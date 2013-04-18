var socket = io.connect('http://localhost:1337/');
var user = {};

socket.on('connect', function(){
  //TODO: put stuff on loggingin
  setInterval(function(){
    send().transaction(user.id+1, {time:+new Date()}, function(e, data){
      console.log('transaction back');
      console.log(data);
    });
  },1000);
});
socket.on('userId', function(userId){
  user.id = userId;
  broadcast().available();
});


socket.on('message', function(data){
  if(data.type == 'transaction' && data.origin.id == user.id){
    $(observer).trigger('transaction-cb:' + data.transactionId, data);
  }
  if(data.type == 'transaction' && +data.origin.id !== +user.id){
    send().reply(data); // just bing back
  }
  //TODO: put other message handlers
});

socket.on('broadcast', function(data){
  console.log(data);// handle broadcast calls
});

var observer = {};

function message(msgObj){
  var baseMsg = {name:"someName", origin: user};
  return _(baseMsg).extend(msgObj);
}

function broadcast(){
  return {
    available: function(){
      socket.emit('broadcast', message({'status':'available'}));
    },
    busy: function(){
      socket.emit('broadcast', message({'status':'busy'}))
    }
  }
}

function send(){
  return {
    message: function(userId, msgObj){
      var msgObj = _({'type':'message', 'to':userId}).extend(msgObj);
      socket.emit('message', message(msgObj));
    },
    transaction: function(userId, msgObj, callback){
      var transactionId = getTransactionId();
      var msgObj = _({'type':'transaction','transactionId': transactionId, 'to': userId}).extend(msgObj);
      socket.emit('message', message(msgObj));
      $(observer).on('transaction-cb:'+ transactionId, callback);
    },
    reply: function(msgIn, msgOut){
      msgOut = msgOut || {};
      msgOut.to = msgIn.origin.id;
      socket.emit('message', _(msgIn).extend(msgOut));
    }
  }
  function getTransactionId(){
    return Math.floor(Math.random()*99999);
  }

}