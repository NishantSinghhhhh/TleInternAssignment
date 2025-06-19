import { Router, RequestHandler } from "express";
import {
  sendEmailToUser,
  sendEmailByHandle,  
  testEmailService
} from '../controllers/emailController';

const router = Router();

router.post(
  "/send-to-user",
  sendEmailToUser as unknown as RequestHandler   // 👈 one-line cast
);   
router.post('/send-by-handle', sendEmailByHandle as unknown as RequestHandler);    
router.get('/test-service', testEmailService as unknown as RequestHandler);

export default router;