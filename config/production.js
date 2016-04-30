config = module.exports = {
  name: 'delter',
  host: (process.env.HOST || 'localhost'),
  port: (process.env.PORT || 5000),
  db: (process.env.MONGODB_URI || 'mongodb://localhost/delter'),

  twitter: {
    app: {
      consumer_key: process.env.TW_CONSUMER_KEY,
      consumer_secret: process.env.TW_CONSUMER_SECRET,
      access_token_key: process.env.TW_OAUTH_TOKEN,
      access_token_secret: process.env.TW_OAUTH_TOKEN_SECRET
    },
    callback: '/api/auth/twitter/callback'
  }
};

var callback_url = 'https://delter.herokuapp.com' + config.twitter.callback;
config.twitter.callback_url = callback_url;

