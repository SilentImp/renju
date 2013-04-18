// Пользователь
function Player(){
  this.player = Handlebars.compile($("#player").html());
  this.avatar = {
    x:0,
    y:0
  };
  this.name = '';
  this.id = Math.round(Math.random()*10000)*Math.round(Math.random()*10000);
}

Player.prototype.getHtml = function(){
  return this.player({
    name: this.name,
    x: this.avatar.x,
    y: this.avatar.y,
    first: this.first,
    id: this.id
  });
};

var socket = io.connect('http://localhost:1337/');
var user = new Player;
user.name = "Тобиас";
user.avatar.x = 0;
user.avatar.y = 0;


//
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
  saveDetails(user);
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

function getUserList(){
  socket.emit('requestList');
}

function saveDetails(player){
  socket.emit('saveDetails', JSON.stringify(player));
}


//Сохранили пользователя
socket.on('userSaved', function(data){
  broadcast().available();
  //Сохранили на сервере данные о пользователе, говорим что с ним можно играть
});

//Получили список пользователей
socket.on('userList', function(data){
  //Формируем список пользователей
  // data - строка JSON с массивом пользователей в формате указаном в документе
});

// Броадкаст

socket.on('removeUser', function(data){
  // Удаляем из списка доступных для приглашения пользователей
  // data — id cокета
});

socket.on('addUser', function(data){
  // Добавляем в список доступных для игры
  // data — строка JSON с объектом пользователя в формате указаном в документе
});

//Полученные транзакции

socket.on('onChallenge', function(data){
  // Вывожу предложение поиграть
  // data — строка JSON с объектом пользователя в формате указаном в документе +
  // он хочет быть первым или вторым например второй объект {"first":"[true|false]"}
});

socket.on('onMadeAMove', function(data){
  // Добавляю здание
  // data — {"x":"0","y":"0"}
});

socket.on('onPass', function(){
  // Противник пасовал
});

socket.on('onOpponentQuit', function(){
  // Противник вышел из игры
});

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