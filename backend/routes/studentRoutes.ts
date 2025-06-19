// backend/src/routes/studentRoutes.ts

import { Router, RequestHandler } from 'express';
import { 
  // Existing functions
  fetch100Users, 
  fetchStudentDetails,
  
  // CREATE operations
  createStudent,
  bulkCreateStudents,
  
  // READ operations
  getStudentById,
  getStudentStats,
  
  // UPDATE operations
  updateStudent,
  
  // DELETE operations
  deleteStudent,

  getStudentProfile,
  getStudentContestHistory,
  getStudentProblemSolving, 

  toggleInactivityEmails
  
} from '../controllers/UserController';

const router = Router();

// Add logging to see which routes are being hit
router.use((req, res, next) => {
  console.log(`Students route: ${req.method} ${req.path}`);
  next();
});

router.get('/fetch-100', fetch100Users);

router.get('/list', fetchStudentDetails);

router.get('/stats', getStudentStats);

router.post('/create-student', createStudent as unknown as RequestHandler);

router.post('/bulk', bulkCreateStudents as unknown as RequestHandler);

router.get('/:id', getStudentById as unknown as RequestHandler);

router.put('/:id', updateStudent as unknown as RequestHandler);

router.get('/:id/profile', getStudentProfile as unknown as RequestHandler);

router.get('/:id/contest-history', getStudentContestHistory as unknown as RequestHandler);

router.get('/:id/problem-solving', getStudentProblemSolving as unknown as RequestHandler);

router.get('/:id', getStudentById as unknown as RequestHandler);

router.delete('/:id', deleteStudent as unknown as RequestHandler);

router.patch( '/:id/notifications/inactivity', toggleInactivityEmails as unknown as RequestHandler);

export default router;