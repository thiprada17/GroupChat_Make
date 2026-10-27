import { Router } from 'express';
import healthRoutes from './health.routes.js';
import receiptRoutes from './receipt.routes.js';

const router = Router();
router.use('/health', healthRoutes);
router.use('/receipts', receiptRoutes);

export default router;
