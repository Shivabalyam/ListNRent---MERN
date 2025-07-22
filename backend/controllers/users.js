const jwt = require('jsonwebtoken');
const User = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

function createToken(user) {
  return jwt.sign(
    { _id: user._id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Setup nodemailer transporter (Gmail for production)
// Make sure to enable 'Less secure app access' or use an App Password if 2FA is enabled
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Register a new user
module.exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password }); // role not settable from frontend
    await user.save();
    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.status(201).json({
      message: 'Signup successful',
      user: { _id: user._id, username, email, role: user.role }
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
    }
    res.status(400).json({ error: error.message });
  }
};

// Login user
module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ username });
    console.log('User found:', !!user, user && user.username, user && user.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }
    const passwordMatch = await user.comparePassword(password);
    console.log('Password match:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials (password mismatch)' });
    }
    const token = createToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({
      message: 'Login successful',
      user: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Logout user
module.exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

// Forgot Password (OTP version)
module.exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) {
    console.log('Forgot password: user not found for email', email);
    // Always respond with success to prevent email enumeration
    return res.json({ message: 'If this email exists, an OTP has been sent.' });
  }
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
  await user.save();
  console.log('Forgot password: user found', user.username, user.email);
  console.log('Generated OTP:', otp);
  // Send OTP email
  const mailOptions = {
    from: 'no-reply@example.com',
    to: user.email,
    subject: 'Your Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}\nIt is valid for 10 minutes. If you did not request this, please ignore this email.`
  };
  try {
    console.log('Sending OTP email to', user.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending OTP email:', err);
  }
  res.json({ message: 'If this email exists, an OTP has been sent.' });
};

// Reset Password (OTP version)
module.exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });
  user.password = newPassword;
  user.markModified('password'); // Ensure pre-save hook runs
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful' });
};

