/*global define */
/*global $:false */
/*global Two:false */
'use strict';
var App
 , lastkeypressed = false;

define(['jquery','two', 'socketio', 'socketgamer'], function () {

App = {
    ball: null,
    player1: null,
    player2: null,
    width: 1024,
    height: 768,
    ballRadius: 50,
    batWidth: 30,
    two: null,
    socket: null,
    room: null,
    me: null,

    hasWebgl: function(){
        try { return !!window.WebGLRenderingContext && !!(document.createElement('canvas').getContext('webgl') || document.createElement('canvas').getContext('experimental-webgl'));
            } catch(e) {
            return false;
        }
    },
    drawBall: function(){
        this.ball = this.two.makeCircle(72, 100, this.ballRadius);
        this.ball.fill = '#FF8000';
        this.ball.stroke = 'orangered';
        this.ball.linewidth = 5;
        this.ball.xVelocity = 5;
        this.ball.yVelocity = 5;
    },
    drawPlayer: function(x, y){
        var w = this.batWidth;
        var h = this.height*0.4;

        var player = this.two.makeRectangle(x, y, w, h);
        player.fill = '#000';
        player.speed = 10;
        player.height = h;
        player.width = w;
        player.movingx = 0;
        player.beginEvent = function(e){
            if(e === 40){
                this.movingx = 4;
            } else {
                this.movingx = -4;
            }
        };
        player.endEvent = function(){
            this.movingx = 0;
        };
        player.update = function(){
            this.translation.set(
                this.translation.x,
                this.translation.y + this.movingx
            );
        };
        return player;

    },
    initPlayers: function(){
        this.player1 = this.drawPlayer(this.batWidth/2, this.height/2);
        this.player2 = this.drawPlayer(this.width - (this.batWidth/2), this.height/2);
        this.initPlayerEvents();
    },
    initPlayerEvents: function (player){
        $(document).focus();
        $(document).keydown(function(e){
            if(e.which === 40 || e.which === 38)
                e.preventDefault();

            if(e.which != window.lastkeypressed && (e.which === 40 || e.which === 38)){
                window.lastkeypressed = e.which;
                App.getCurrentPlayer().beginEvent(e.which);
                App.channelSendMessage('move', {
                    'direction': App.getCurrentPlayer().movingx,
                    'action': 'begin',
                    'player': App.getCurrentPlayerNumber(),
                    'room': App.room
                });
            }
        }).keyup(function(e){
            window.lastkeypressed = false;
            if(e.which === 40 || e.which === 38){
                App.getCurrentPlayer().endEvent(e.which);
                App.channelSendMessage('move', {
                    'direction': App.getCurrentPlayer().movingx,
                    'action': 'end',
                    'player': App.getCurrentPlayerNumber()
                });


                e.preventDefault();
            }
        });

    },
    getCurrentPlayerNumber: function(){
        return App.me;
    },
    getCurrentPlayer: function(){
        if(App.getCurrentPlayerNumber() == 2){
            return App.player2;
        }
        return App.player1;
    },
    collisionBall: function(){

        var bounds = this.ball.getBoundingClientRect();
        if(bounds.bottom > this.height && this.ball.yVelocity > 0){
            this.ball.yVelocity *= -1;
        } else if(bounds.top < 1 && this.ball.yVelocity < 0){
            this.ball.yVelocity *= -1;
        }

        if(bounds.right > this.width || bounds.left < 0) {
            //this.endGame();
        }

        //hit player bats
        var p1bounds = this.player1.getBoundingClientRect();

        //p1 detection
        if(!
            (
                (bounds.bottom < p1bounds.top) ||
                (bounds.top > p1bounds.bottom) ||
                (bounds.left > p1bounds.right) ||
                (bounds.right < p1bounds.left)
            )
        ){
            this.ball.xVelocity = Math.abs(this.ball.xVelocity);
            return;
        }

        var p2bounds = this.player2.getBoundingClientRect();
        //p2 detection
        if(!
            (
                (bounds.bottom < p2bounds.top) ||
                (bounds.top > p2bounds.bottom) ||
                (bounds.left > p2bounds.right) ||
                (bounds.right < p2bounds.left)
            )
        ){
            this.ball.xVelocity = -Math.abs(this.ball.xVelocity);
            return;
        }

    },
    endGame: function(){
        if(this.two.playing){
            window.alert('game over');
            this.two.pause();
        }
    },
    update: function(){
        this.ball.translation.set(
            this.ball.translation.x + this.ball.xVelocity,
            this.ball.translation.y + this.ball.yVelocity
        );
    },
    directionToKey: function(dir){
        return (dir > 0) ? 40: 38;
    },
    channelSendMessage: function(path, opt){
        var params =  {'room': App.room, 'me': App.me};
        if(opt){
            jQuery.extend(params, opt);
        }
        App.socket.emit(path, params);
    },
    channelOnMessage: function(m){

        var data = m.msg.data;
        console.log(m);
        var current = App.getCurrentPlayerNumber();
        if(data.Player === current){
            return;
        }
        console.log('a');
        var otherPlayer = (current === 2) ? 1 : 2;

        eval('App.player' + otherPlayer + '.' + data.PlayerAction + 'Event(App.directionToKey(' + data.PlayerDirection + '));');
    },
    indicateRoom: function(room){
        $('body').prepend('<p>You are in room: <a href="' + window.location.origin + '/?room=' + room + '">' + room + '</a></p>');
    },
    requestRoom: function(){
        //App.channelSendMessage('requestroom');
    },
    roomReady: function(){
        SocketGamer.sendReady(App.sartGame);
    },
    sartGame: function(){
        console.log('begin game');
        this.two.bind('update', function(){ App.update(); } ).play();

    },
    joinedRoom: function(data){
        console.log('player: ' + data + ' joined room:' + SocketGamer.room);
        if(!App.me){
            App.me = data;
        }
    },
    leftRoom: function(data){
        console.log('player: ' + data + 'left the room');
    },
    /* 
    * if we have a room, join it.
    * if we don't, make a new room and join it.
    */
    initSockets: function(){
        var room = window.location.search.match(/\?room\=([a-z0-9]*)/)
        , callback;
        if(room){
            callback = function(){ SocketGamer.joinRoom(room[1], App.joinedRoom); };
        } else {
            callback = function(){ SocketGamer.requestRoom(App.joinedRoom); };
        }
        SocketGamer.init(window.location.origin, callback);
    },

    init: function(){
        App.initSockets();

        this.two = new Two({
            fullscreen: false,
            width: App.width,
            height: App.height, 
            type: this.hasWebgl() ? Two.Types.webgl : Two.Types.canvas,
        }).appendTo(document.getElementById('canvas'));

        this.drawBall();
        this.initPlayers();

        window.setInterval(function(){
            App.collisionBall();
        }, 50);

        window.setInterval(function(){
                App.player1.update();
                App.player2.update();
        }, 40);

    }
};

});
