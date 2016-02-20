var ect = require('ect');
var express = require('express');
var twitter = require('twitter');
var request = require('request');

var client = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.OAUTH_TOKEN,
  access_token_secret: process.env.OAUTH_TOKEN_SECRET
});

var app = express();
var server = app.listen(process.env.PORT || 8080, function() {
  console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io')(server);
io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

var helpers = {
  getTitleFromHtml: function(html) {
    var m = html.match(/<title[^>]*>([^<]+)<\/title>/);
    if (m && m[1]) return m[1];
    else return 'no title';
  },

  updateList: function(tweet) {
    tweet.entities.urls.forEach(function(url) {
      request.get(url.expanded_url, function(error, response, body) {
        if (error || response.statusCode != 200) return;
        io.emit('update', {
          name: tweet.user.screen_name,
          icon: tweet.user.profile_image_url,
          url: url.expanded_url,
          title: helpers.getTitleFromHtml(body)
        });
      });
    });
  },

  loadHomeTweets: function() {
    client.get('statuses/home_timeline', {}, function(error, tweets, response) {
      if (!error) {
        tweets.forEach(function(tweet) {
          helpers.updateList(tweet);
        });
      }
    });
  }
};

client.stream('user', function(stream) {
  stream.on('data', function(tweet) {
    if (tweet.user) helpers.updateList(tweet);
  });
});

app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index');
  helpers.loadHomeTweets();
});
