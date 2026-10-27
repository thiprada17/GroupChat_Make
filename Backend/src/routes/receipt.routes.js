import { Router } from 'express';
import { analyzeReceipt } from '../controllers/receipt.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.post('/analyze', asyncHandler(analyzeReceipt));

export default router;
