'use strict';

import 'babel-polyfill';
import path from 'path';
import express from 'express';
import Twitter from 'twitter';
import session from 'express-session';
import MongoConnector from 'connect-mongo';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import config from './config/config';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import methodOverride from 'method-override';
import cheerio from 'cheerio-httpcli';
import async from 'async';
import mongoose from 'mongoose';
import User from './models/user';

const mongoStore = MongoConnector(session);

/**
 * server
 */

let app = express();
let server = app.listen(config.port, () => {
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
let db = mongoose.connection;
db.on('error', (err) => {
  console.error('There was a db connection error');
  return console.error(err.message);
});
db.once('connected', () => {
  return console.log('Successfully connected to ' + config.db);
});
db.once('disconnected', () => {
  return console.error('Successfully disconnected from ' + config.db);
});
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.error('DB connection closed due to app termination');
    return process.exit(0);
  });
});
let sessionStore = new mongoStore({
  mongooseConnection: db,
  touchAfter: 24 * 3600
});


/**
 * passport
 */

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) return done(err);
    return done(null, user);
  });
});

let twitter = null;
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.app.consumer_key,
    consumerSecret: config.twitter.app.consumer_secret,
    callbackURL: config.twitter.callback_url,
    profileFields: ['id', 'username', 'photos'],
    passReqToCallback : true
  },
  (req, token, tokenSecret, profile, done) => {
    process.nextTick(() => {
      twitter = new Twitter({
        consumer_key: config.twitter.app.consumer_key,
        consumer_secret: config.twitter.app.consumer_secret,
        access_token_key: token,
        access_token_secret: tokenSecret
      });
      if(!req.user) { // confirm that user not loggedin
        User.findOne({ 'social.twitter.id': profile.id }, (err, user) => {
          if (err) return done(err);
          if (user) {
            return done(null, user);
          } else {
            let newUser = new User({
              social: {
                twitter: {
                  id: profile.id,
                  token: token,
                  username: profile.username,
                  image_url: profile.photos[0].value || ''
                }
              }
            });
            newUser.save((err) => {
              if (err) return done(err);
              return done(null, newUser);
            });
          }
        });
      } else { // user exists and is loggedin
        let user = req.user; // pull the user out of the session
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

let helpers = {

  classifyURL: (url) => {
    let result = {
      url: url,
      type: 'article',
      is_noise: false
    };

    const noiseList = ['buzztter.com', 'swarmapp.com', '4sq.com', 'instagram.com', 'amazon.co.jp'];
    for (let domain of noiseList) {
      if (url.indexOf(domain) > -1) {
        result.is_noise = true;
        break;
      }
    }

    const nonArticleList = ['nicovideo.jp', 'youtube.com'];
    for (let domain of nonArticleList) {
      if (url.indexOf(domain) > -1) {
        result.type = 'movie';
        break;
      }
    }

    return result;
  },

  parseTweets: (tweets, callback) => {
    let results = {
      rows: []
    };
    let cnt = 0;

    async.forEach(tweets, (tweet, cb) => {
      if (tweet.entities.urls.length == 0) {
        cb();
        return;
      }

      let url = tweet.entities.urls[0];

      // ignore noise/non-article urls
      let result = helpers.classifyURL(url.expanded_url);
      if (result.is_noise || result.type != 'article') {
        cb();
        return;
      }

      cheerio.fetch(url.expanded_url).then((result) => {
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

    }, (err) => {
      callback(err, results);
    });
  },

}

let controllers = {

  base: {
    index: (req, res) => {
      res.send('My Entries API');
    },

    trend: (req, res) => {
      if (!twitter) twitter = new Twitter(config.twitter.app);

      twitter.get('trends/place', {id: 23424856, exclude: 'hashtags'}, (error, result, response) => {
        if (error) {
          console.log(error);
          res.status(500).send({ msg: 'Cannot load trend terms' });
        }
        res.send(result[0].trends.map((trend) => { return trend.name }));
      });
    },

    classifier: (req, res) => {
      if (!('url' in req.query)) res.status(400).send({ msg: 'You must give `url` parameter' });
      else res.send(helpers.classifyURL(req.query.url));
    }
  },

  entries: {
    all: (req, res) => {
      if (req.user) {
        twitter.get('statuses/home_timeline', {
          count: 100, exclude_replies: true
        }, (error, tweets, response) => {
          if (error) {
            console.log(error);
            res.status(500).send({ msg: error });
          } else {
            helpers.parseTweets(tweets, (err, entries) => {
              res.send(entries);
            });
          }
        });
      }
    }
  },

  utils: {
    isAuthenticated: (req, res) => {
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

let isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  return res.status(302).redirect('/');
};

// general
app.get('/api', controllers.base.index);
app.get('/api/trend', controllers.base.trend);
app.get('/api/classifier', controllers.base.classifier);

// app-related
app.get('/api/entries', controllers.entries.all);
app.get('/api/auth/twitter', isLoggedIn, passport.authenticate('twitter'));
app.get(config.twitter.callback, passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}));
app.get('/api/is_authenticated', controllers.utils.isAuthenticated);
