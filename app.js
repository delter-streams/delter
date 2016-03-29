var ect = require('ect');
var express = require('express');
var twitter = require('twitter');
var request = require('request');
var session = require('express-session');
var passport = require('./passport').passport;
var encoding = require('encoding-japanese');

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
    if (m && m[1]) {
      if (encoding.detect(m[1]) !== 'UNICODE') return encoding.convert(m[1], 'UNICODE', 'AUTO');
      return m[1];
    }
    else return 'no title';
  },

  updateList: function(tweet, n_alg) {
    tweet.entities.urls.forEach(function(url) {
      request.get(url.expanded_url, function(error, response, body) {
        if (error || response.statusCode != 200) return;
        io.emit('update', {
          name: tweet.user.screen_name,
          icon: tweet.user.profile_image_url,
          url: url.expanded_url,
          title: helpers.getTitleFromHtml(body),
          alg: n_alg
        });
      });
    });
  },

  loadHomeTweets: function() {
    client.get('statuses/user_timeline', { count: 200, exclude_replies: true }, function(error, tweets, response) {
      if (!error) {
        tweets.forEach(function(tweet) {
          helpers.updateList(tweet, 1);
        });
      }
    });
  },

  getTrends: function() {
    client.get('trends/place', {id: 23424856, exclude: 'hashtags'}, function(error, res, response) {
      if (!error) {
        io.emit('trend', res[0].trends);
      }
    });
  }
};

client.stream('statuses/filter', {track: 'アニメ', lang: 'ja'}, function(stream) {
  stream.on('data', function(tweet) {
    if (tweet.user) helpers.updateList(tweet, 2);
  });
});

client.stream('statuses/sample', {filter_level: 'low', language: 'ja'}, function(stream) {
  stream.on('data', function(tweet) {
    if (tweet.user) helpers.updateList(tweet, 3);
  });
});

app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'delter', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
  if (req.session.passport) {
    res.render('index', { session: req.session.passport });
    helpers.getTrends();
    helpers.loadHomeTweets();
  } else {
    res.render('index');
  }
});


/**
 * Routes
 */

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}));
