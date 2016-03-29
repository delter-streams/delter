var ect = require('ect')
  , express = require('express')
  , Twitter = require('twitter')
  , request = require('request')
  , session = require('express-session')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , cheerio = require('cheerio-httpcli')
  , config = require('./config')
  ;

var app = express();
var server = app.listen(config.port, function() {
  console.log('Listening on port %d', config.port);
});

var io = require('socket.io')(server);
io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});


/**
 * passport
 */

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
});

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.app.consumer_key,
    consumerSecret: config.twitter.app.consumer_secret,
    callbackURL: config.twitter.callback_url
  },
  function (token, tokenSecret, profile, done) {
    profile.twitter_token = token;
    profile.twitter_token_secret = tokenSecret;
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));


/**
 * tweet habdling
 */

var twitter = new Twitter(config.twitter.app);

var helpers = {

  updateList: function(tweet, n_alg) {
    tweet.entities.urls.forEach(function(url) {
      cheerio.fetch(url.expanded_url, function(err, $, res) {
        if (res.statusCode != 200) return;

        io.emit('update', {
          name: tweet.user.screen_name,
          icon: tweet.user.profile_image_url,
          url: url.expanded_url,
          title: $('title').text(),
          alg: n_alg
        });
      });
    });
  },

  loadHomeTweets: function() {
    twitter.get('statuses/user_timeline', { count: 200, exclude_replies: true }, function(error, tweets, response) {
      if (!error) {
        tweets.forEach(function(tweet) {
          helpers.updateList(tweet, 1);
        });
      }
    });
  },

  getTrends: function() {
    twitter.get('trends/place', {id: 23424856, exclude: 'hashtags'}, function(error, res, response) {
      if (!error) {
        io.emit('trend', res[0].trends);
      }
    });
  }
};

// interest-based filtering
twitter.stream('statuses/filter', {track: 'アニメ', lang: 'ja'}, function(stream) {
  stream.on('data', function(tweet) {
    if (tweet.user) helpers.updateList(tweet, 2);
  });
});

// trend-based filtering
twitter.stream('statuses/sample', {filter_level: 'low', language: 'ja'}, function(stream) {
  stream.on('data', function(tweet) {
    if (tweet.user) helpers.updateList(tweet, 3);
  });
});


/**
 * configuration
 */

app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: config.name, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


/**
 * routes
 */

app.get(config.twitter.route.auth, passport.authenticate('twitter'));
app.get(config.twitter.route.callback, passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}));

app.get('/', function(req, res) {
  if (req.session.passport) {
    res.render('index', { session: req.session.passport });
    helpers.getTrends();
    helpers.loadHomeTweets();
  } else {
    res.render('index');
  }
});
