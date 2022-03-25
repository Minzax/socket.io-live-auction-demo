// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
Timer = require('./timer.js').Timer,
timer = new Timer();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var timeLeft = 0;
var timer = null;
var maxPrice = 0;
var maxUsername = '';

io.on('connection', function (socket) {
  var addedUser = false;

  socket.on('setPrice', function(data) {
    const price = data.price;
    if(price > maxPrice) {
      maxPrice = price;
      maxUsername = socket.username;
      socket.emit('priceChange', {
        price: maxPrice,
        username: socket.username,
      })
      socket.broadcast.emit('priceChange', {
        price: maxPrice,
        username: socket.username,
      })
    }
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;

    if(timeLeft <= 0 && !timer) {
      timeLeft = 60;
      maxPrice = 1;
      timer = setInterval(() => {
        if(timeLeft <= 0) {
          clearInterval(timer);
          timer = null;
          socket.emit('timeEnd', { price: maxPrice, username: maxUsername });
          socket.broadcast.emit('timeEnd', { price: maxPrice, username: maxUsername });
        }
        timeLeft--;
      }, 1000);
    }

    socket.emit('login', {
      numUsers: numUsers,
      timeLeft: timeLeft,
      price: maxPrice
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});