import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const isAuthenticated = async (req, res, next) => {
  try {
    // First check if user is authenticated via Passport
    if (req.isAuthenticated()) {
      return next();
    }

    // If not authenticated via Passport, check for JWT token
    let token;
    
    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check for token in session
    else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
