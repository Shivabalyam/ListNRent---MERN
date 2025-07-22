const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  console.log('Pre-save hook: hashing password for user', this.username, 'before:', this.password);
  this.password = await bcrypt.hash(this.password, 12);
  console.log('Pre-save hook: after hashing for user', this.username, 'hashed:', this.password);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);