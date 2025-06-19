import { Router } from 'express';
import {
  sendEmailToUser,
  sendEmailByHandle,  
  testEmailService
} from '../controllers/emailController';

const router = Router();

router.post('/send-to-user', sendEmailToUser);     
router.post('/send-by-handle', sendEmailByHandle);    
router.get('/test-service', testEmailService);

export default router;