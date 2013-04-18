(function(global){

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

  // Ячейка на карте
  function Place(){
    this.player = null;
    this.building = null;
    this.level = null;
  }

  // Контроллер игры
  function renjuController(){

    this.server = 'http://178.79.181.157:1337/';
    this.socket = null;
    this.onLineUserList = [];
    this.onLineUser = new Player;

    //Всякое
    this.turn = 0;
    this.place_size = 50;
    this.field = $('.field');
    this.board = this.field.find('.board');
    this.board_top = this.board.find('.board-top');

    //Шаблоны
    this.church_message = Handlebars.compile($("#church_message").html());
    this.house_message = Handlebars.compile($("#house_message").html());
    this.loose_message = Handlebars.compile($("#loose_message").html());
    this.player = Handlebars.compile($("#player").html());
    this.house = Handlebars.compile($("#house").html());
    this.church = Handlebars.compile($("#church").html());
    this.standoff_message = Handlebars.compile($("#standoff_message").html());


    //Попап
    this.game_status  =  $('.game-status');
    this.avatar_popup =  $('.avatars-popup');
    this.avatar_icons =  this.avatar_popup.find('.icons');

    //Экраны
    this.connecting_screen =            $('.connecting-screen');
    this.decline_screen =               $('.decline-screen');
    this.quit_screen =                  $('.quit-screen');
    this.lost_screen =                  $('.lost-screen');
    this.request_screen =               $('.request-screen');
    this.user_list_screen =             $('.user-list-screen');
    this.see_game_screen =              $('.see-game-screen');
    this.start_screen =                 $('.start-screen');
    this.standoff_screen =              $('.standoff');
    this.win_screen =                   $('.win-screen');
    this.game_screen =                  $('.game-screen');
    this.user_creation_screen =         $('.user-creation-screen');
    this.create_two_users_screen =      $('.two-user-screen');
    this.create_online_user_screen =    $('.create-online-user-screen');

    //События

    //Стартовый экран
    this.start_screen.find('.online').on('click',$.proxy(this.online,this));
    this.start_screen.find('.hotseat').on('click',$.proxy(this.hotseat,this));

    //Экраны состояния
    this.decline_screen.find('.ok').on('click',$.proxy(this.connectToServer,this));
    this.quit_screen.find('.ok').on('click',$.proxy(this.connectToServer,this));
    this.lost_screen.find('.ok').on('click',$.proxy(this.connectToServer,this));

    this.see_game_screen.on('click',$.proxy(this.endGame,this));
    this.win_screen.find('.replay').on('click',$.proxy(this.startHotseatGame,this));
    this.win_screen.find('.ok').on('click',$.proxy(this.startScreen,this));
    this.game_screen.find('.quit').on('click',$.proxy(this.startScreen,this));

    //Общее для экранов создания пользователя
    this.user_creation_screen.find('.avatar').on('click',$.proxy(this.selectAvatar,this));
    this.user_creation_screen.find('.cancel').on('click',$.proxy(this.startScreen,this));
    this.user_creation_screen.find('form').on('submit',$.proxy(this.createUser,this));
    this.user_creation_screen.find('input').on('change',$.proxy(this.checkName,this));

    //Попап
    this.avatar_popup.on('click',$.proxy(this.cancelAvatar,this));
    this.avatar_icons.on('click',$.proxy(this.updateAvatar,this));

    //Создаем хотсит
    this.create_two_users_screen.find('.confirm').on('click',$.proxy(this.startHotseatGame,this));

    //Cоздаем онлайн
    this.create_online_user_screen.find('.confirm').on('click',$.proxy(this.connectToServer,this));

    //Возврат к настройкам онлайн пользователя
    this.user_list_screen.find('.cancel').on('click',$.proxy(this.backToOnLineUser,this));
    this.user_list_screen.find('.turn').on('click',$.proxy(this.switchTurn,this));

  }

  renjuController.prototype.showGameStatus = function(player){
    this.game_status.find('.placeholder').html(player.getHtml());
    this.game_status.show();
  };

  // Пользователь отказался с вами играть
  renjuController.prototype.playerDecline = function(player){
    this.decline_screen.find('.placeholder').html(player);
    this.openScreen(this.decline_screen);
  };

  // Потеряли связь с пользователем
  renjuController.prototype.playerLost = function(player){
    this.quit_screen.find('.placeholder').html(player);
    this.openScreen(this.quit_screen);
  };

  // Пользователь сбежал
  renjuController.prototype.playerQuit = function(player){
    this.lost_screen.find('.placeholder').html(player);
    this.openScreen(this.lost_screen);
  };

  //меняем пользователей
  renjuController.prototype.switchTurn = function(event){
    event.preventDefault();
    this.user_list_screen.find('.turn').toggleClass('selected');
  };

  //Создаем пользователя для онлайн игры
  renjuController.prototype.backToOnLineUser = function(event){
    event.preventDefault();
    this.openScreen(this.create_online_user_screen);
  };

  renjuController.prototype.connectToServer = function(event){

    if(this.socket !== null){
      this.selectPartner();
      return;
    }

    this.openScreen(this.connecting_screen);
    this.socket = io.connect(this.server);
    this.socket.on('connect',$.proxy(this.selectPartner,this));

  };

  // Выбираем противника
  renjuController.prototype.selectPartner = function(data){

    p1 = $('.create-online-user-screen .online-player');

    this.online_player = new Player;
    this.online_player.name = p1.find('.name').text();
    this.online_player.first = true;
    this.online_player.avatar.x = p1.find('.avatar').attr('data-avatar-x');
    this.online_player.avatar.y = p1.find('.avatar').attr('data-avatar-y');

    this.user_list_screen.find('.players').html();

    this.openScreen(this.user_list_screen);

    //TODO getUserList
    var players = [],
        foo_count = Math.ceil(Math.random()*100),
        names = ['Муфаса', 'Джеймс', 'Му', 'Пу', 'Фумбаса', 'Зуррйир', 'Тутуола', 'Одафин', 'Танука', 'Мексиканец', 'Жабоглот', 'Муга', 'Муса', 'Амос', 'Аратара', 'Джанго', 'Намиби', 'Чучéлло', 'Бонга-Бонга', 'Ян', 'Флукс', 'Монтгомери'],
        names_count = names.length;

    while(foo_count--){
      player = new Player;
      player.name = names[Math.floor(Math.random()*names_count)];
      player.avatar.x = Math.floor(Math.random()*9)*23;
      player.avatar.y = Math.floor(Math.random()*7)*23;
      player.id =
      players.push(player);
    }

    this.renderUserList(players);
    };

  renjuController.prototype.sendRequest = function(event){
    var player = $(event.currentTarget);

    this.request_screen.find('.placeholder-1').html(this.player1.getHtml());
    this.request_screen.find('.placeholder-2').html(player);
    var turn = this.user_list_screen.find('.turn.selected');
    if(turn.hasClass('first_player')){
      this.request_screen.find('.play-first').show();
      this.request_screen.find('.play-second').hide();
    }else{
      this.request_screen.find('.play-first').hide();
      this.request_screen.find('.play-second').show();
    }

    this.openScreen(this.request_screen);

    window.setTimeout($.proxy(function(){this.playerDecline(player)},this),3500);
  };

  renjuController.prototype.renderUserList = function(players){
    var count = players.length,
        wrapper = this.user_list_screen.find('.wrapper'),
        playersWrapper = wrapper.find('.players');

    while(count--){
      playersWrapper.append(players[count].getHtml());
    }
    wrapper.css('background-image',"none");

    var p1 = this.create_online_user_screen.find('.player');
    this.player1 = new Player;
    this.player1.name = p1.find('.name').text();
    this.player1.first = true;
    this.player1.avatar.x = p1.find('.avatar').attr('data-avatar-x');
    this.player1.avatar.y = p1.find('.avatar').attr('data-avatar-y');

    this.user_list_screen.find('.player-holder').html(this.player1.getHtml());
    playersWrapper.find('.player').on('click',$.proxy(this.sendRequest,this));
  };

  //Создаем пользователя для онлайн игры
  renjuController.prototype.online = function(event){
    event.preventDefault();
    var avatar = this.create_online_user_screen.find('form .avatar'),
        x = Math.floor(Math.random()*9)*23,
        y = Math.floor(Math.random()*7)*23;

    $(avatar[0]).css({
      'background-position':'-'+x+'px -'+y+'px'
    }).attr('data-avatar-x',x).attr('data-avatar-y',y);

    this.openScreen(this.create_online_user_screen);
    this.create_online_user_screen.find('input').focus();
    };

  renjuController.prototype.endGame = function(event){
    event.preventDefault();
    this.game_screen.find('.field').removeClass('played');
    this.openScreen(this.win_screen);
  };

  renjuController.prototype.startHotseatGame = function(event){
    event.preventDefault();
    this.openScreen(this.game_screen);
    this.startGame();
  };

  renjuController.prototype.createHouse = function(event){
    var place = $(event.currentTarget),
        first = (Math.floor(this.turn/2) == this.turn/2),
        id = null,
        y = parseInt(place.attr('data-y'),10),
        x = parseInt(place.attr('data-x'),10);

    place.off('click').addClass('passive');

    if(first){
      place.append(this.church({}));
      place.building = place.find('.church');
      current_player = this.player1;
    }else{
      place.append(this.house({}));
      place.building = place.find('.house');
      current_player = this.player2;
    }

    place.player = current_player;
    id = current_player.id;

    this.gameField[y][x] = place;

    win = false;
    loose = false;
    count = 0;
    place_list = [];

    // vertical
    dy = parseInt(y,10);
    while(dy>=0){
      tmp_place = this.gameField[dy][x];
      if(
        (tmp_place.player==null)||
        (current_player.id != tmp_place.player.id)
        ){

        dy++;
        tmp_place = this.gameField[dy][x];

        while(
          dy<15&&
          tmp_place.player!==null
        ){

          tmp_place = this.gameField[dy][x];
          if(
            (tmp_place.player==null)||
            (current_player.id != tmp_place.player.id)
          ){
            break;
          }

          place_list.push(tmp_place);
          count++;
          dy++;
        }

        break;
      }

      dy--;
    }


    this.testResult(current_player,place_list,count);

    win = false;
    loose = false;
    count = 0;
    place_list = [];

    // horizontal
    dx = parseInt(x,10);
    while(dx>=0){
      tmp_place = this.gameField[y][dx];
      if(
        (tmp_place.player==null)||
        (current_player.id != tmp_place.player.id)
        ){

        dx++;
        tmp_place = this.gameField[y][dx];

        while(
          dx<15&&
          tmp_place.player!==null
        ){

          tmp_place = this.gameField[y][dx];
          if(
            (tmp_place.player==null)||
            (current_player.id != tmp_place.player.id)
          ){
            break;
          }

          place_list.push(tmp_place);
          count++;
          dx++;
        }

        break;
      }

      dx--;
    }

    this.testResult(current_player,place_list,count);

    win = false;
    loose = false;
    count = 0;
    place_list = [];

    // diagonal 1
    dx = parseInt(x,10);
    dy = parseInt(y,10);
    while(
      dx>=0&&
      dy>=0
    ){

      tmp_place = this.gameField[dy][dx];

      if(
        (tmp_place.player==null)||
        (current_player.id != tmp_place.player.id)
        ){

        dx++;
        dy++;
        tmp_place = this.gameField[dy][dx];

        while(
          dx<15&&
          dy<15&&
          tmp_place.player!==null
        ){

          tmp_place = this.gameField[dy][dx];
          if(
            (tmp_place.player==null)||
            (current_player.id != tmp_place.player.id)
          ){
            break;
          }

          place_list.push(tmp_place);
          count++;
          dx++;
          dy++;
        }

        break;
      }

      dx--;
      dy--;
    }

    this.testResult(current_player,place_list,count);

    win = false;
    loose = false;
    count = 0;
    place_list = [];

    // diagonal 2
    dx = parseInt(x,10);
    dy = parseInt(y,10);
    while(
      dx<15&&
      dy>=0
    ){

      tmp_place = this.gameField[dy][dx];

      if(
        (tmp_place.player==null)||
        (current_player.id != tmp_place.player.id)
        ){

        dx--;
        dy++;
        tmp_place = this.gameField[dy][dx];

        while(
          dx>=0&&
          dy<15&&
          tmp_place.player!==null
        ){

          tmp_place = this.gameField[dy][dx];
          if(
            (tmp_place.player==null)||
            (current_player.id != tmp_place.player.id)
          ){
            break;
          }

          place_list.push(tmp_place);
          count++;
          dx--;
          dy++;
        }

        break;
      }

      dx++;
      dy--;
    }

    this.testResult(current_player,place_list,count);


    this.endTurn();
  };

  renjuController.prototype.testResult = function(current_player,place_list,count){
    if(count>=5){
      win = true;
    }

    if(
        count>5&&
        current_player.first==true
      ){
      win = false;
      loose = true;
    }

    if(win){
      index = place_list.length;
      while(index--){
        place_list[index].building.addClass('marked_win');
      }
      this.game_screen.find('.board-top .place').off('click');
      this.game_screen.find('.information .pass').remove();
      this.game_screen.find('.field').addClass('played');

      if(current_player.first==true){
        this.win_screen.find('.message').html(this.church_message({
          player1: this.player1.name,
          player2: this.player2.name
        }));
      }else{
        this.win_screen.find('.message').html(this.house_message({
          player1: this.player1.name,
          player2: this.player2.name
        }));
      }
      this.see_game_screen.show();
      // this.win_screen.show();
    }

    if(loose){
      index = place_list.length;
      while(index--){
        place_list[index].building.addClass('marked_loose');
      }
      this.game_screen.find('.board-top .place').off('click');
      this.game_screen.find('.information .pass').remove();
      this.game_screen.find('.field').addClass('played');

      this.win_screen.find('.message').html(this.loose_message({
        player1: this.player1.name,
        player2: this.player2.name
      }));

      this.see_game_screen.show();
      // this.win_screen.show();
    }
  };

  //Ничья в хотсит
  renjuController.prototype.standoff = function(){
    this.standoff_screen.find('.message').html(this.standoff_message({
      player1: this.player1.name,
      player2: this.player2.name
    }));
    this.openScreen(this.standoff_screen);
  };

  //Окончание хода в хотсит
  renjuController.prototype.endTurn = function(){
    this.turn++;
    this.p1dom.toggleClass('selected');
    this.p2dom.toggleClass('selected');
    if(this.turn==6){
      this.game_screen.find('.pass').css('display','inline-block');
    }
  };

  ///Пас в хотсит
  renjuController.prototype.pass = function(event){
    event.preventDefault();

    if(this.last_pass==this.turn-1){
      this.standoff();
      }
    this.last_pass = this.turn;
    this.endTurn();
  };

  //Генерируем игральную доску
  renjuController.prototype.generateBoard = function(){
    var h = 15,
        figure = null;
    while(h--){
      v = 15;
      while(v--){

        figure = document.createElement('div');
        figure.className = 'place';
        figure.setAttribute('data-x',h);
        figure.setAttribute('data-y',v);

        $(figure).css({
          left: this.place_size*h + 'px',
          top: this.place_size*v + 'px',
          "z-index": (v+1)*10+(15-Math.abs(7-h))
        });
        this.board_top.append(figure);
      }
    }
    this.board_top.find('.place').on('click',$.proxy(this.createHouse,this));

  };

  //Начинаем игру в хотсит
  renjuController.prototype.startGame = function(){
    var p1 = this.create_two_users_screen.find('.player-1'),
        p2 = this.create_two_users_screen.find('.player-2');

    this.game_screen.find('.information .player, .board-top *').remove();

    this.turn = 0;
    this.gameField = [];
    var v = 15
    while(v--){
      h = 15;
      this.gameField.push([]);
      while(h--){
        this.gameField[14-v].push(new Place);
      }
    }

    this.player1 = new Player;
    this.player1.name = p1.find('.name').text();
    this.player1.first = true;
    this.player1.avatar.x = p1.find('.avatar').attr('data-avatar-x');
    this.player1.avatar.y = p1.find('.avatar').attr('data-avatar-y');

    this.player2 = new Player;
    this.player2.name = p2.find('.name').text();;
    this.player2.avatar.x = p2.find('.avatar').attr('data-avatar-x');
    this.player2.avatar.y = p2.find('.avatar').attr('data-avatar-y');

    var information = this.game_screen.find('.information');
    information.append(this.player1.getHtml());
    information.append(this.player2.getHtml());
    this.p1dom = information.find('.player-1');
    this.p2dom = information.find('.player-2');

    $('.player .pass').on('click',$.proxy(this.pass,this));
    $('.standoff .ok').on('click',$.proxy(this.startScreen,this));

    this.generateBoard();
  };

  //Проверяем подходит ли имя по формату в хотсит
  renjuController.prototype.checkName = function(event){
    event.preventDefault();
    var input = $(event.currentTarget),
        start_name = input.val().trim(),
        name = start_name.replace(/[^a-zA-Zа-яА-Я]/g,"").trim();
    input.val(name);
    if(start_name.length==0){
      input[0].setCustomValidity("Ты не представился. Это меня обижает.");
      return;
      }
    if(name==''||name.length<2||name.length>20){
      input[0].setCustomValidity("На нашей планете имена коротки, хотя и не слишком и состоят только из букв. Смирись.");
      return;
    }
    input[0].setCustomValidity("");
  };

  //Создаем пользователя
  renjuController.prototype.createUser = function(event){
    event.preventDefault();
    var form = $(event.currentTarget),
        input = form.find('input'),
        start_name = input.val().trim(),
        name = start_name.replace(/[^a-zA-Zа-яА-Я]/g,"").trim(),
        avatar = form.find('.avatar'),
        x = avatar.attr('data-avatar-x'),
        y = avatar.attr('data-avatar-y'),
        first = form.hasClass('first-user'),
        id = Math.floor(Math.random()*100000),
        player = this.player({
          name: name,
          x: x,
          y: y,
          first: first,
          id: id
        });

      if(start_name.length==0){
        input[0].setCustomValidity("Ты не представился. Это меня обижает.");
        return;
        }
      if(name==''||name.length<2||name.length>20){
        input[0].setCustomValidity("На нашей планете имена коротки, хотя и не слишком и состоят только из букв. Смирись.");
        return;
      }

      before = form.prev();
      if(before.hasClass('player')){
        before.remove();
      }
      var screen = form.parents('.user-creation-screen'),
          forms = screen.find('form'),
          forms_count = forms.length;

      form.hide().before(player);
      $('#'+id).find('.remove').on('click',$.proxy(this.removeUser,this));

      if(forms_count==2){
        // Хотсит
        if(this.create_two_users_screen.find('.player').length==2){
          this.create_two_users_screen.find('.confirm').show();
        }
      }else{
        // OnLine
        this.create_online_user_screen.find('.confirm').show();
      }
    };

  renjuController.prototype.removeUser = function(event){
    event.preventDefault();
    var link = $(event.currentTarget),
        player = link.closest('.player'),
        form = player.next();
        player.parent().find('.confirm').hide();
        player.remove();
        form.show();
  };

  renjuController.prototype.hotseat = function(event){
    event.preventDefault();

    var avatar = this.create_two_users_screen.find('form .avatar'),
        x = Math.floor(Math.random()*9)*23,
        y = Math.floor(Math.random()*7)*23,
        oldx = x,
        oldy = y;

    $(avatar[0]).css({
      'background-position':'-'+x+'px -'+y+'px'
    }).attr('data-avatar-x',x).attr('data-avatar-y',y);

    while(x==oldx&&y==oldy){
      x = Math.floor(Math.random()*9)*23;
      y = Math.floor(Math.random()*7)*23;
    }

    $(avatar[1]).css({
      'background-position':'-'+x+'px -'+y+'px'
    }).attr('data-avatar-x',x).attr('data-avatar-y',y);

    this.openScreen(this.create_two_users_screen);
    $('form:visible input:eq(0)').focus();
    };

  renjuController.prototype.selectAvatar = function(event){
    event.preventDefault();
    this.avatar_popup.show();
    this.avatar_popup.player_avatar = $(event.currentTarget);
    };

  renjuController.prototype.updateAvatar = function(event){
    event.preventDefault();
    event.originalEvent.cancelBubble = true;
    var container = $(event.currentTarget),
        x = Math.floor((event.clientX-container.offset().left)/46)*23,
        y = Math.floor((event.clientY-container.offset().top)/46)*23;
    this.avatar_popup.player_avatar.css({
      'background-position':'-'+x+'px -'+y+'px'
    }).attr('data-avatar-x',x).attr('data-avatar-y',y);
    this.avatar_popup.player_avatar = null;
    this.avatar_popup.hide();
    };

  renjuController.prototype.cancelAvatar = function(event){
    event.preventDefault();
    this.avatar_popup.hide();
    };

  renjuController.prototype.startScreen = function(event){
    event.preventDefault();
    this.openScreen(this.start_screen);
  };

  renjuController.prototype.getTransform = function(element){
    var st = window.getComputedStyle(element, null);
    var transform = st.getPropertyValue("-webkit-transform") ||
                    st.getPropertyValue("-moz-transform") ||
                    st.getPropertyValue("-ms-transform") ||
                    st.getPropertyValue("-o-transform") ||
                    st.getPropertyValue("transform");
    if(transform == 'none'){
      transform ='';
    }
    return transform;
  };

  renjuController.prototype.openScreen = function(game_screen){
    $('.screen, .popup').stop().hide();
    game_screen.stop().show();
  };

  function onDomReady(){
    new renjuController;
  }

  $(document).ready(onDomReady);

})(this)

if (!window.getComputedStyle) {
  window.getComputedStyle = function(el, pseudo) {
    this.el = el;
    this.getPropertyValue = function(prop) {
    var re = /(\-([a-z]){1})/g;
    if (prop == 'float') prop = 'styleFloat';
    if (re.test(prop)) {
      prop = prop.replace(re, function () {
        return arguments[2].toUpperCase();
      });
    }
    return el.currentStyle[prop] ? el.currentStyle[prop] : null;
    }
    return this;
  }
}