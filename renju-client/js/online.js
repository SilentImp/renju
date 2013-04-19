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
      socket.emit('broadcast', message({'status':'available', 'userid': user.id}));
    },
    busy: function(){
      socket.emit('broadcast', message({'status':'busy', 'userid': user.id}))
    }
  }
}


//Cообщения серверу ???????

// Когда мы получили ID — передаем серверу свои данные, после чего он объявляет
// нас доступными для игры
socket.on('userId', function(userId){
  user.id = userId;
  saveDetails(user);
});

// Заправшиваем список пользователей
function getUserList(){
  socket.emit('requestList');
}

// Отправляем серверу данные о себе
function saveDetails(player){
  socket.emit('saveDetails', JSON.stringify(player));
}


//Сообщения всем

//С мной можно поиграть
broadcast().available();

//С мной нельзя поиграть
broadcast().busy();


socket.on('broadcast', function(msgObj){
  switch(msgObj.status){
    case 'available':
      //Добавляем пользователя c msgObj.userid в список доступных онлайн пользователей
      break;
    case 'busy':
      //Удаляем пользователя c msgObj.userid из списка доступных онлайн пользователей
      break;
  }
});

//Отправка сообщений конкретному пользователю
var my_message = {},
    reply = {};

//Бросаю тебе вызов
my_message = {
  "game_event":"challenge"
}
send().message(user.id, my_message);

//Пасс
my_message = {
  "game_event":"pass"
}
send().message(user.id, my_message);

//Ход
my_message = {
  "game_event":"move",
  "x":0,
  "y":1
}
send().message(user.id, my_message);

//Противник вышел из игры
my_message = {
  "game_event":"quit"
}
send().message(user.id, my_message);

//Получение сообщения пользователем
socket.on('message', readMessage);

function readMessage(msgObj){
  switch(msgObj.game_event){
    case 'challenge':
      //Вам бросили вызов, вы можете принять или отказаться
      reply = {
        "game_event":"challenge accepted"
      };
      reply = {
        "game_event":"challenge declined"
      };
      send().reply(msgObj,reply);
      break;
    case 'challenge accepted':
      //С вами согласились играть
      break;
    case 'challenge declined':
      //С вами отказались играть
      break;
    case 'pass':
      //Пасс
      break;
    case 'move':
      //Ход
      break;
    case 'quit':
      //Противник вышел из игры
      break;
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