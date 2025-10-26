import { Router } from 'express';
import { loginController, registerController, meController } from '../../controllers/auth.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.post('/login', loginController);
router.post('/register', registerController);
router.get('/me', requireAuth, meController);


export default router;
