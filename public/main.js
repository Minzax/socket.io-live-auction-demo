$(function() {
  var $window = $(window);
  var $priceInput = $('#priceInput');
  var $placeBidBtn = $('#placeBidBtn');
  var $usernameInput = $('#usernameInput');
  var $loginPage = $('#loginPage');
  var $minPrice = $('#minPrice');
  var $timeout = $('#timeout')

  var username = 'Tim';
  var connected = false;
  var socket = io.connect('/');
  var minPrice = 99;
  var timeLeft = 0;
  var timer = null;
  var record = [];

  $placeBidBtn.click(function () {
    if(timeLeft > 0) {
      var price = parseInt($priceInput.val())
      if(price <= minPrice) {
        alert('Bid amount too small')
      } else {
        socket.emit('setPrice', { price: price })
      }
    } else {
      alert('Bidding ends');
    }
  })

  $usernameInput.keydown(function(evt) {
    if(evt.keyCode == 13) {
      username = $usernameInput.val().trim();
      $loginPage.fadeOut();
      $loginPage.off('click');

      socket.emit('add user', username)
    }
  })

  $loginPage.click(function () {
    $usernameInput.focus();
  });

  // Socket events

  // 当登录
  socket.on('login', function (data) {
    connected = true;
    console.log('ws: login');
    var num = parseInt(data.timeLeft);
    if(num) {
      if(!timer) {
        timeLeft = num
        minPrice = data.price
        $minPrice.text(`$${minPrice}`)
        timer = setInterval(() => {
          timeLeft--;
          if(timeLeft <= 0) {
            clearInterval(timer);
            timer = null
          }
          $timeout.text(`${timeLeft}s`)
        }, 1000)
      }
    } else {
      $timeout.text('Bidding ends')
    }
  });

  socket.on('priceChange', function(data) {
    console.log('priceChange', data)
    const price = data.price

    if(data.timeLeft) {
      timeLeft = data.timeLeft
    }

    if(price) {
      minPrice = price
      $minPrice.text(`$${price}`)

      var html = ''
      record.push(Object.assign({
        date: moment().format('MM-DD HH:mm')
      }, data))
      record.reverse().forEach(function(v) {
        html += `<tr data-uw-styling-context="true">
        <td style="font-size: .85em; line-height: 1.6em;" data-uw-styling-context="true">${v.username}</td>
        <td class="text-right" data-uw-styling-context="true">$${v.price}</td>
        <td class="text-right hidden-sm hidden-xs" title="March 13, 2022 7:00:00 PM (PDT)" data-uw-styling-context="true">${v.date}</span></td>
      </tr>`
      })
      $('#bidsRecord').html(html)
    }
  })

  socket.on('timeEnd', function(data) {
    if(data) {
      console.log('timeEnd')
      clearInterval(timer);
      timer = null;
      timeLeft = 0;
      $timeout.text('Bidding ends')
      alert(`${data.username} won the bid for $${data.price}`)
    }
  })

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    // log(data.username + ' joined');
    // addParticpantBidders(data);
    console.log('ws: user joined', data)
  });

  socket.on('disconnect', function () {
    console.log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    console.log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    console.log('attempt to reconnect has failed');
  });

  $minPrice.text('$' + minPrice)
})