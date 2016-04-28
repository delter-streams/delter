var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  username: String,
  email: String,
  twitter: {
    id: String,
    token: String,
    username: String,
    image_url: String
  }
});

module.exports = mongoose.model('User', UserSchema);
