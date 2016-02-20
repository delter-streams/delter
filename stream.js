var twitter = require('twitter');
var request = require('request');

var client = new twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

function getTitleFromHtml(html) {
  var m = html.match(/<title[^>]*>([^<]+)<\/title>/);
  if (m && m[1]) return m[1];
  else return 'no title';
}

function printUrlsInTweet(tweet) {
  if (!tweet.user) return;
  var name = tweet.user.screen_name;
  var icon = tweet.user.profile_image_url;
  tweet.entities.urls.forEach(function(url) {
      request.get(url.expanded_url, function(error, response, body) {
        if (!error && response.statusCode == 200)
          console.log('@' + name + ' (' + icon + '): ' + url.expanded_url + ' -- ' + getTitleFromHtml(body));
      });
  });
}

// initial timeline
client.get('statuses/home_timeline', {}, function(error, tweets, response) {
  if (!error) {
    tweets.forEach(function(tweet) {
      printUrlsInTweet(tweet);
    });
  }
});

// user stream
client.stream('user', function(stream) {
  stream.on('data', function(tweet) {
    printUrlsInTweet(tweet)
  });
});
