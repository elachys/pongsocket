/*global define */
/*global $:false */
/*global Two:false */
'use strict';
define([], function () {
    return '\'Allo \'Allo!';
});

var App = {
    ball: null,
    player1: null,
    player2: null,
    width: 1024,
    height: 768,
    ballRadius: 50,
    batWidth: 30,
    two: null,

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
        this.initPlayerEvents(this.player1);
    },
    initPlayerEvents: function (player){
        $(document).keydown(function(e){
            if(e.which === 40 || e.which === 38){
                player.beginEvent(e.which);
            }
        }).keyup(function(e){
            if(e.which === 40 || e.which === 38){
                player.endEvent(e.which);
            }
        });

    },
    getCurrentPlayer: function(){
        return this.player1;
    },
    collisionBall: function(){

        var bounds = this.ball.getBoundingClientRect();
        if(bounds.bottom > this.height && this.ball.yVelocity > 0){
            this.ball.yVelocity *= -1;
        } else if(bounds.top < 1 && this.ball.yVelocity < 0){
            this.ball.yVelocity *= -1;
        }

        if(bounds.right > this.width || bounds.left < 0) {
            this.endGame();
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
    init: function(){
        this.two = new Two({
            fullscreen: true,
            type: this.hasWebgl() ? Two.Types.webgl : Two.Types.canvas,
        }).appendTo(document.body);

        this.drawBall();
        this.initPlayers();

        window.setInterval(function(){
            App.collisionBall();
        }, 50);

        window.setInterval(function(){
            App.getCurrentPlayer().update();
        }, 40);


        this.two.bind('update', function(){ App.update(); } ).play();

    }
};
