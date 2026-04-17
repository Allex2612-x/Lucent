import { Router } from 'express';
import { BudgetController } from './budget.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', BudgetController.getAll);
router.post('/', BudgetController.create);
router.get('/:id', BudgetController.getById);
router.patch('/:id', BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
