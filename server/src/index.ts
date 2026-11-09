import app from './app.js';
import { initDatabase } from './db/connection.js';

const PORT = process.env.PORT || 5000;

// Ensure database tables exist
initDatabase();

app.listen(PORT, () => {
  console.log(`[Brand Sentinel] API Server running on port ${PORT}`);
  console.log(`[Brand Sentinel] Health endpoint: http://localhost:${PORT}/api/health`);
});
