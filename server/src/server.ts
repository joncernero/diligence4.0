import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { projectsRouter } from './routes/projects';
import { propertiesRouter } from './routes/properties';
import { buildingsRouter } from './routes/buildings';
import { walksRouter } from './routes/walks';
import { observationsRouter } from './routes/observations';
import { unitTypesRouter } from './routes/unitTypes';
import { scopeRouter } from './routes/scope';
import { csiCodesRouter } from './routes/csiCodes';
import { tasksRouter } from './routes/tasks';
import { documentsRouter } from './routes/documents';
import { notificationsRouter } from './routes/notifications';
import { residentsRouter } from './routes/residents';
import { bulletinsRouter } from './routes/bulletins';
import { pushRouter } from './routes/push';
import { workSchedulesRouter } from './routes/workSchedules';
import { approvalsRouter } from './routes/approvals';
import { maintenanceRouter } from './routes/maintenance';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

// Matches any private/local network IP on port 3000
const localNetworkPattern = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, native mobile)
      if (!origin) return callback(null, true);
      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any local network address in development
      if (process.env.NODE_ENV !== 'production' && localNetworkPattern.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Construction PM API is running!' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/walks', walksRouter);
app.use('/api/observations', observationsRouter);
app.use('/api/unit-types', unitTypesRouter);
app.use('/api/scope', scopeRouter);
app.use('/api/csi-codes', csiCodesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/residents', residentsRouter);
app.use('/api/bulletins', bulletinsRouter);
app.use('/api/push', pushRouter);
app.use('/api/work-schedules', workSchedulesRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/maintenance', maintenanceRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  },
);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `✓ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`,
  );
});

export default app;
