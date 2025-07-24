import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';
import { validatePassword, validateEmail } from '../utils/validation.js';
import { sendVerificationEmail } from '../services/email.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const user = new User({ 
      email, 
      password,
      verificationToken,
      verificationExpires
    });
    await user.save();
    
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: 'Account created. Please check your email to verify your account.',
      email: user.email 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();
    
    await sendVerificationEmail(email, verificationToken);
    
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    const authToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Email verified successfully',
      user,
      token: authToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true,
        email: user.email
      });
    }

    const isValid = await user.checkPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const isValid = await user.checkPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {
    await Task.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;