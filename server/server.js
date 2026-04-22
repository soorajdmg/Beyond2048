const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});

const listEndpoints = () => {
  if (!app._router || !app._router.stack) {
    console.log('No routes have been registered yet.');
    return;
  }

  console.log('REGISTERED ROUTES:');
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      const path = middleware.regexp.toString().split('?')[0].slice(3, -1);
      console.log(`BASE PATH: ${path}`);

      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const routePath = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          console.log(`  ${methods} ${routePath}`);
        }
      });
    }
  });
};


app.use('/api/auth', authRoutes);

listEndpoints();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).send("Route not found");
});

// Only start the server when not running in Vercel (serverless)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;