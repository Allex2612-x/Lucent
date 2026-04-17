import { Router } from 'express';
import { TransactionController } from './transaction.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', TransactionController.getAll);
router.post('/', TransactionController.create);
router.get('/:id', TransactionController.getById);
router.patch('/:id', TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
