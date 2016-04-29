var
  path = require('path'),
  express = require('express'),
  Twitter = require('twitter'),
  session = require('express-session'),
  mongoStore = require('connect-mongo')(session),
  passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  config = require('./config/config'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  methodOverride = require('method-override'),
  cheerio = require('cheerio-httpcli'),
  async = require('async'),
  mongoose = require('mongoose'),
  User = require('./models/user');


/**
 * server
 */

var app = express();
var server = app.listen(config.port, function () {
  console.log('Listening on port %d', config.port);
});


/**
 * configuration
 */

app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(session({
  secret: config.name,
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 15}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride());
app.use(bodyParser.json());
app.use(morgan('dev'));


/**
 * db
 */

mongoose.connect(config.db);
db = mongoose.connection;
db.on('error', function (err) {
  console.error('There was a db connection error');
  return console.error(err.message);
});
db.once('connected', function () {
  return console.log('Successfully connected to ' + config.db);
});
db.once('disconnected', function () {
  return console.error('Successfully disconnected from ' + config.db);
});
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.error('DB connection closed due to app termination');
    return process.exit(0);
  });
});
sessionStore = new mongoStore({
  mongooseConnection: db,
  touchAfter: 24 * 3600
});


/**
 * passport
 */

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    if (err) return done(err);
    return done(null, user);
  });
});

var twitter;
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.app.consumer_key,
    consumerSecret: config.twitter.app.consumer_secret,
    callbackURL: config.twitter.callback_url,
    profileFields: ['id', 'username', 'photos'],
    passReqToCallback : true
  },
  function (req, token, tokenSecret, profile, done) {
    process.nextTick(function () {
      twitter = new Twitter({
        consumer_key: config.twitter.app.consumer_key,
        consumer_secret: config.twitter.app.consumer_secret,
        access_token_key: token,
        access_token_secret: tokenSecret
      });
      if(!req.user) { // confirm that user not loggedin
        User.findOne({ 'social.twitter.id': profile.id }, function (err, user) {
          if (err) return done(err);
          if (user) {
            return done(null, user);
          } else {
            var newUser = new User({
              social: {
                twitter: {
                  id: profile.id,
                  token: token,
                  username: profile.username,
                  image_url: profile.photos[0].value || ''
                }
              }
            });
            newUser.save(function (err) {
              if (err) return done(err);
              return done(null, newUser);
            });
          }
        });
      } else { // user exists and is loggedin
        var user = req.user; // pull the user out of the session
        // TODO: update the current users info
        return;
      }
    });
  }
));


/**
 * tweet habdling
 */

// var twitter = new Twitter(config.twitter.app);

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
      if (req.user) {
        twitter.get('statuses/home_timeline', {
          count: 200, exclude_replies: true
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
    }
  },

  utils: {
    isAuthenticated: function (req, res) {
      if (req.isAuthenticated()) {
        res.send({
          is_authenticated: true,
          user: req.user
        });
      } else {
        res.send({
          is_authenticated: false,
          user: {}
        });
      }
    }
  }

};


/**
 * routes
 */

var isLoggedIn = function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  return res.status(302).redirect('/');
};

app.get('/api', controllers.base.index);
app.get('/api/entries', controllers.entries.all);
app.get('/api/auth/twitter', isLoggedIn, passport.authenticate('twitter'));
app.get(config.twitter.callback, passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}));
app.get('/api/is_authenticated', controllers.utils.isAuthenticated);
