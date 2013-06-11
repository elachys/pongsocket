
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'app')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
//app.get('/users', user.list);


var server = http.createServer(app)
    , io = require('socket.io').listen(server);

var rooms = [];
var ready = [];

io.sockets.on('connection',function(socket){
    var token;

    require('crypto').randomBytes(5, function(ex, buf) {
        token = buf.toString('hex');
        //socket.emit('connect',{msg:{data: {'initial': true, 'playerid': token}}});
    });

    /**
    * Request new room
    **/
    socket.on('requestroom', function(){

        var newroom = rooms.length;
        console.log('new room: ' + newroom + ": " + socket.id);
        rooms[newroom] = 0;
        socket.room = newroom;
//      socket.join(socket.room);
//      socket.playernumber = 1;
        socket.emit('requestedroom', newroom);
    });

    /**
    * joinRoom
    * if a user leaves a room and re-enters. Give them a player number and position
    **/
    socket.on('joinroom', function(data){
        if(rooms[data] == 2){
            socket.emit('joinedroom', 'failed');
            return;
        }
        socket.join(data);
        rooms[data]++;

        var clients = io.sockets.clients(socket.room);
        if(clients){
            for(i in clients){
                if(clients[i].disconnected === false){
                    socket.playernumber = (clients[i].playernumber === 1) ? 2:1;
                    break;
                }
            }
        }
        if(!socket.playernumber){
            socket.playernumber = rooms[data];
        }
        io.sockets.in(socket.room).emit('joinedroom', socket.playernumber);
        socket.room = data;
    });

    /**
    * begin game
    **/
    socket.on('clientready', function(data){
        io.sockets.in(socket.room).emit('clientready', socket.playernumber);
        if(ready[socket.room] == 1){
            ready[socket.room]++;
            io.sockets.in(socket.room).emit('gamebegin');
            return;
        }
        ready[socket.room] = 1;
    });

    /**
    * update move to the other client
    */
    socket.on('move', function(data){
        io.sockets.in(socket.room).emit(data.action, {msg: 
            {data: {
                Player: data.player,
                PlayerAction: data.action,
                PlayerDirection: data.direction
                }
            }
        });
    });

    /**
    * disconnect client, clear rooms if needed
    **/
    socket.on('disconnect', function(){
        if(rooms[socket.room] === 1){
            rooms.splice(socket.room-1, 1);
        } else {
            rooms[socket.room]--;
            io.sockets.in(socket.room).emit('leftroom', socket.playernumber);
        }
    });


});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
