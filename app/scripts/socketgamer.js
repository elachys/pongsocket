/*global define */
/*global $:false */
/*global Two:false */
'use strict';
var SocketGamer;

define(['socketio'], function() {

SocketGamer = {
    socket: null,
    room: null,
    callbacks: [],

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
    /*
    * enter: callback on user join
    * exit: callback on user disconnect
    * ready: callback on user confirm
    * created: callback on room created (with room id)
    * connected: when socket is created
    */
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
