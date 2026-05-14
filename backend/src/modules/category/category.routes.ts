import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.getAll);
router.get('/suggest', CategoryController.suggest);
router.post('/', CategoryController.create);
router.patch('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
