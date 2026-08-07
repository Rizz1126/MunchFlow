import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import cashRoutes from './modules/cash/cash.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import recipesRoutes from './modules/recipes/recipes.routes.js';
import posRoutes from './modules/pos/pos.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const APP_NAME = process.env.APP_NAME || 'MunchFlow';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: APP_NAME, timestamp: new Date().toISOString() });
});

// App config endpoint (public)
app.get('/api/config', (req, res) => {
  res.json({ appName: APP_NAME });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/ingredients', inventoryRoutes);
app.use('/api/menu', recipesRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/reports', reportsRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🍔 ${APP_NAME} Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Config: http://localhost:${PORT}/api/config\n`);
});

export default app;
