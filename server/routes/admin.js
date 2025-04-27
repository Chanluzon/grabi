const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  // In a real application, you would verify the token here
  // For now, we'll just check if it exists
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Apply middleware to all routes except login
router.use((req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  verifyAdminToken(req, res, next);
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });

    // Create the user in Realtime Database
    const db = admin.database();
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({
      userId: userRecord.uid,
      email: email,
      accountType: 'free',
      username: email.split('@')[0],
      status: 'offline',
      language: 'English',
      translator: 'google',
      createdAt: new Date().toISOString(),
      lastLoginDate: new Date().toISOString()
    });

    res.json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const db = admin.database();
    const snapshot = await db.ref('users').once('value');
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    delete userData.userId; // Remove userId from update data

    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    await userRef.update(userData);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete user from Authentication
    await admin.auth().deleteUser(userId);
    
    // Delete user from Realtime Database
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    await userRef.remove();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in Firebase Authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Verify if the user is an admin (you should have a way to identify admin users)
    const db = admin.database();
    const userRef = db.ref(`users/${userRecord.uid}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    if (!userData || userData.accountType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Create a custom token for the admin
    const token = await admin.auth().createCustomToken(userRecord.uid);

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'https://adminhehe.netlify.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({ 
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        accountType: userData.accountType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  try {
    // In a real application, you might want to invalidate the token on the server
    // For now, we'll just return a success message
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Update the user's password to the temporary password
    await admin.auth().updateUser(userRecord.uid, {
      password: tempPassword
    });
    
    // Send a custom email with the temporary password
    // Note: In a production environment, you would use a proper email service
    console.log(`Password reset email would be sent to ${email} with temporary password: ${tempPassword}`);
    
    res.json({ 
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage statistics
router.get('/usage', async (req, res) => {
  try {
    const db = admin.database();
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    
    // Get daily login usage for the last 7 days
    const dailyLoginUsage = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count users who logged in on this date
      const usersLoggedIn = Object.values(users).filter(user => {
        if (!user.lastLoginDate) return false;
        const loginDate = new Date(user.lastLoginDate).toISOString().split('T')[0];
        return loginDate === dateStr;
      });

      dailyLoginUsage.push({
        date: dateStr,
        count: usersLoggedIn.length,
        users: usersLoggedIn.map(user => ({
          email: user.email,
          accountType: user.accountType,
          loginTime: user.lastLoginDate
        }))
      });
    }

    res.json({
      dailyLoginUsage
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

module.exports = router; 