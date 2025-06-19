import { Router } from 'express';
import {

  sendEmailToUser,    // New
  sendEmailByHandle,  // New
  testEmailService    // New
} from '../controllers/emailController';

const router = Router();


router.post('/send-to-user', sendEmailToUser);        // Send by user ID
router.post('/send-by-handle', sendEmailByHandle);    // Send by handle

router.get('/test-service', testEmailService);

export default router;