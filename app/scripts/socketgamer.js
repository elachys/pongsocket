/*global define */
/*global io:false */

'use strict';
var SocketGamer;

define(['socketio'], function() {

    SocketGamer = {
        socket: null,
        room: null,
        callbacks: [],

        listen: function(e, callback){
            SocketGamer.socket.on(e, function(data){
                callback(data);
            });
        },

        sendPlayerEvent: function(e, params){
            SocketGamer.socket.emit(e, params);
        },

        sendReady: function(callback){
            SocketGamer.socket.on('gamebegin', function(data){
                callback.call(data);
            });
            SocketGamer.socket.emit('clientready');
        },

        requestRoom: function(callback){
            console.log('request room');
            SocketGamer.socket.on('requestedroom', function(data){
                SocketGamer.room = data;
                SocketGamer.joinRoom(data, callback);
            });

            SocketGamer.socket.emit('requestroom');
        },

        joinRoom: function(room, callback){
            SocketGamer.socket.on('joinedroom', function(data){
                SocketGamer.room = room;
                SocketGamer.joinedRoom(data, callback);
            });
            SocketGamer.socket.emit('joinroom', room);
        },

        joinedRoom: function(data, callback){
            callback(data);
        },

        leftRoom: function(data, callback){
            callback.call(data);
            console.log('player: ' + data + 'left the room');
        },

        connected: function(data, callback){
            callback.call(data);
            console.log('connected');
        },

        init: function(location, callback){
            SocketGamer.socket = io.connect(location);

            SocketGamer.socket.on('connect', function (data) {
                SocketGamer.connected(data, callback);
            });

            SocketGamer.socket.on('leftroom', function(data){
                SocketGamer.leftRoom(data);
            });
        }
    };

});
