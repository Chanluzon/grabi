const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const adminRoutes = require('./routes/admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://appdev-86a96-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const app = express();

// Configure CORS
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/, // Allow any localhost port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Use admin routes
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 