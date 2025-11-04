import { Router } from 'express';
import healthRouter from './health';
import proxyRouter from './proxy';
import config from '../config';

const router = Router();

// Health check routes (no authentication required)
router.use('/health', healthRouter);

// API routes with versioning
router.use(`/api/${config.apiVersion}`, proxyRouter);

export default router;
