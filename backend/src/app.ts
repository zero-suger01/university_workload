import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { CONSTANTS } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import departmentRoutes from './modules/departments/departments.routes';
import courseRoutes from './modules/courses/courses.routes';
import semesterRoutes from './modules/semesters/semesters.routes';
import workloadRoutes from './modules/workloads/workloads.routes';
import requestRoutes from './modules/requests/requests.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import reportRoutes from './modules/reports/reports.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import programRoutes from './modules/programs/programs.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import planningRoutes from './modules/planning/planning.routes';
import groupRoutes from './modules/groups/groups.routes';
import vacancyRoutes from './modules/vacancy/vacancy.routes';
import staffUnitsRoutes from './modules/staff-units/staff-units.routes';
import studentCohortRoutes from './modules/student-cohorts/student-cohorts.routes';
import roomRoutes from './modules/rooms/rooms.routes';
import workloadAssignmentRoutes from './modules/workload-assignments/workload-assignments.routes';
import cqiRoutes from './modules/cqi/cqi.routes';
import courseObjectiveRoutes from './modules/course-objectives/course-objectives.routes';
import importRoutes from './modules/import/import.routes';

const app = express();

// Trust nginx reverse proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression & logging
app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiter
app.use(
  '/api',
  rateLimit({
    windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
    max: CONSTANTS.RATE_LIMIT_MAX_API,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/workloads', workloadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/vacancy', vacancyRoutes);
app.use('/api/staff-units', staffUnitsRoutes);
app.use('/api/student-cohorts', studentCohortRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/workload-assignments', workloadAssignmentRoutes);
app.use('/api/cqi', cqiRoutes);
app.use('/api/course-objectives', courseObjectiveRoutes);
app.use('/api/import', importRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

// Error handler
app.use(errorHandler);

export default app;
