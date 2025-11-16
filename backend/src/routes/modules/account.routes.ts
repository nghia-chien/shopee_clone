import { Router, RequestHandler } from 'express';
import {
  getAccountController,
  updateAccountController,
  uploadAvatarController,
  changePasswordController,
  getAddressesController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
} from '../../controllers/account.controller';
import { requireAuth } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';

const router = Router();

// Tất cả routes đều cần authentication
router.use(requireAuth);

// User profile routes
router.get('/', getAccountController);
router.put('/', updateAccountController);
router.post(
  '/avatar',
  upload.single('avatar') as unknown as RequestHandler,
  uploadAvatarController as RequestHandler
);
router.put('/password', changePasswordController);

// Address routes
router.get('/addresses', getAddressesController);
router.post('/addresses', createAddressController);
router.put('/addresses/:id', updateAddressController);
router.delete('/addresses/:id', deleteAddressController);
router.put('/addresses/:id/default', setDefaultAddressController);

export default router;
