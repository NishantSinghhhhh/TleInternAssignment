import { Router, RequestHandler } from "express";
import {
  sendEmailToUser,
  sendEmailByHandle,  
} from '../controllers/emailController';

const router = Router();

router.post(
  "/send-to-user",
  sendEmailToUser as unknown as RequestHandler   // 👈 one-line cast
);   
router.post('/send-by-handle', sendEmailByHandle as unknown as RequestHandler);    

export default router;