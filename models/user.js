import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  social: {
    twitter: {
      id: String,
      token: String,
      username: String,
      image_url: String,
    },
  },
  params: {
    friend: { type: Number, default: 0.5 },
    interest: { type: Number, default: 0.5 },
    trend: { type: Number, default: 0.5 },
  },
  keywords: [String],
});

export default mongoose.model('User', UserSchema);
