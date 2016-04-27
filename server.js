var
  path = require('path'),
  express = require('express'),
  Twitter = require('twitter'),
  session = require('express-session'),
  passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  config = require('./config'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  methodOverride = require('method-override'),
  cheerio = require('cheerio-httpcli'),
  async = require('async');


var app = express();
var server = app.listen(config.port, function () {
  console.log('Listening on port %d', config.port);
});


/**
 * configuration
 */

app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(session({ secret: config.name, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride());
app.use(bodyParser.json());
app.use(morgan('dev'));


/**
 * passport
 */

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
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

  parseTweets: function (tweets, callback) {
    var results = {
      rows: []
    };
    var cnt = 0;

    async.forEach(tweets, function (tweet, cb) {
      if (tweet.entities.urls.length == 0) {
        cb();
        return;
      }

      var url = tweet.entities.urls[0];
      cheerio.fetch(url.expanded_url).then(function (result) {
        if (result.response.statusCode != 200) return;

        results.rows.push({
          url: url.expanded_url,
          title: result.$('title').text().trim(),
          user: {
            home_url: 'http://twitter.com/' + tweet.user.screen_name,
            image_url: tweet.user.profile_image_url
          },
          source: 'twitter'
        });

      }).finally(cb);

    }, function (err) {
      callback(err, results);
    });
  },

}

var controllers = {

  base: {
    index: function (req, res) {
      res.send('My Entries API');
    }
  },

  entries: {
    all: function (req, res) {
      twitter.get('statuses/user_timeline', {
        count: 10, exclude_replies: true
      }, function (error, tweets, response) {
        if (error) {
          console.log(error);
          res.status(500).send({ msg: error });
        } else {
          helpers.parseTweets(tweets, function (err, entries) {
            res.send(entries);
          });
        }
      });
    }
  },

};


/**
 * routes
 */


app.get('/api', controllers.base.index);
app.get('/api/entries', controllers.entries.all);
app.get(config.twitter.route.auth, passport.authenticate('twitter'));
app.get(config.twitter.route.callback, passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}));
