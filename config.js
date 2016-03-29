config = module.exports = {
  name: 'delter',
  host: 'localhost',
  port: (process.env.PORT || 8080),

  twitter: {
    app: {
      consumer_key: process.env.TW_CONSUMER_KEY,
      consumer_secret: process.env.TW_CONSUMER_SECRET,
      access_token_key: process.env.TW_OAUTH_TOKEN,
      access_token_secret: process.env.TW_OAUTH_TOKEN_SECRET
    },
    route: {
      auth: '/auth/twitter',
      callback: '/auth/twitter/callback'
    }
  }
};

var callback_url = 'http://' + config.host + ':' + config.port + config.twitter.route.callback;
config.twitter.callback_url = callback_url;
