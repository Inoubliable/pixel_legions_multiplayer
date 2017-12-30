var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var public = __dirname + '/public/';

app.use(express.static(public));

app.get('/', (req, res) => {
	//res.sendFile(path.join(public + 'login.html'));
	res.sendFile(path.join(public + 'game.html'));
});
app.post('/', (req, res) => {
	res.sendFile(path.join(public + 'game.html'));
});
app.get('/login', (req, res) => {
	res.sendFile(path.join(public + 'login.html'));
});
app.get('/win', (req, res) => {
	res.sendFile(path.join(public + 'win.html'));
});
app.get('/lose', (req, res) => {
	res.sendFile(path.join(public + 'lose.html'));
});

io.on('connection', onConnection);

function onConnection(socket) {

  	socket.on('disconnect', function(){
  		console.log('User disconnected');
  	});
};

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('We are up on 3000');
});