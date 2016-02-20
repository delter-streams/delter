var twitter = require('twitter');

var client = new twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

client.stream( 'user', function(stream) {
  stream.on('data', function(data) {
    console.log(data.text);
  });
});
