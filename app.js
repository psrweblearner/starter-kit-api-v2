'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const adminAuth = require('./middleware/adminAuth');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;


/* 
============================================================
                       STATIC FILES
============================================================
This section defines the directory that Express will use 
to serve all publicly accessible static files such as CSS, 
JavaScript assets, front-end libraries, uploads, and any 
other resources required by the browser.
============================================================
*/
const staticPath = path.join(__dirname, './public');
app.use(express.static(staticPath));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestId);
app.use(requestLogger);

// Health endpoint used by load balancers and uptime checks.
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ✅ Fix for Auto-Logout (IP Mismatch)
app.set('trust proxy', true);

// ✅ Consolidated API Protection (CORS + API Key)
app.use(require('./middleware/apiProtection'));

// Global Identity Identification
app.use(adminAuth.identify);


app.use('/', require('./routes'));
app.use(require('./middleware/errorHandler'));

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});