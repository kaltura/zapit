/**
 * Created by itayk on 29/12/15.
 */

var app = require('express')();
var http = require('http').Server(app);
var url = require('url');
var io = require('socket.io')(http);
var querystring = require('querystring');

app.get('/command', function(req, res){
	console.log('in get');
	var parsedUrl = url.parse(req.url);
	var queryParams = querystring.parse(parsedUrl.query);
	console.log(queryParams.dir);
	io.emit(queryParams.dir, { for: 'everyone', dir: queryParams.dir });
	res.end();
});


io.on('connection', function(socket){
	console.log('a user connected');
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});