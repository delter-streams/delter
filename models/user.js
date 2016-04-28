var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  username: String,
  email: String,
  social: {
    twitter: {
      id: String,
      token: String,
      username: String,
      image_url: String
    }
  },
  params: {
    friend: { type: Number, default: 1.0 },
    interest: { type: Number, default: 1.0 },
    trend: {type: Number, default: 1.0}
  },
  keywords: [String]
});

module.exports = mongoose.model('User', UserSchema);
