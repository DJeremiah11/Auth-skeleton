import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

router.get('/admin', authenticate, authorize(['ADMIN']), (req, res) => {
    res.json({ message: 'Welcome Admin!' });
});

export default router;
