import express from 'express';
import cors from 'cors';
const app = express();

// Enable CORS for all routes
app.use(cors());

// In-memory store for debug logs
let debugLogs = [];
const MAX_LOGS = 1000;

// Add a log
app.post('/api/debug-logs', express.json(), (req, res) => {
  const { message, data } = req.body;
  const log = {
    timestamp: Date.now(),
    message,
    data
  };
  debugLogs.push(log);
  
  // Keep only last MAX_LOGS entries
  if (debugLogs.length > MAX_LOGS) {
    debugLogs = debugLogs.slice(-MAX_LOGS);
  }
  
  res.status(200).json(log);
});

// Get logs
app.get('/api/debug-logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  const logs = limit ? debugLogs.slice(-limit) : debugLogs;
  res.status(200).json(logs);
});

// Clear logs
app.delete('/api/debug-logs', (req, res) => {
  debugLogs = [];
  res.status(200).json({ message: 'Logs cleared' });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Debug API server running on port ${PORT}`);
});
