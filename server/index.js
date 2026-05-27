const express = require('express');
const path = require('path');
const cors = require('cors');
const { replacePlaceholders } = require('./placeholder');
const apiRoutes = require('./routes');

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, '..', 'out');

replacePlaceholders(STATIC_DIR);

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(express.static(STATIC_DIR, {
  maxAge: '1y',
  setHeaders(res, filePath) {
    if (/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, immutable');
    }
  },
}));

// SPA fallback: serve index.html for non-API routes that don't match a static file
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') return next();
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/state`);
  console.log(`Static: ${STATIC_DIR}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process first.`);
    process.exit(1);
  }
  throw err;
});
