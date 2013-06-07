
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

io.sockets.on('connection',function(socket){
    var token;

    require('crypto').randomBytes(5, function(ex, buf) {
        token = buf.toString('hex');
        socket.emit('connect',{msg:{data: {'initial': true, 'playerid': token}}});
    });

    socket.on('move', function(data){
        io.sockets.emit(data.action, {msg: 
            {data: {
                Player: data.player,
                PlayerAction: data.action,
                PlayerDirection: data.direction
            }}
        });
    });

});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
