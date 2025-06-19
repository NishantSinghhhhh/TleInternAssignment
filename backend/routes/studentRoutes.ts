// backend/src/routes/studentRoutes.ts

import { Router } from 'express';
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
  getStudentProblemSolving
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

router.post('/create-student', createStudent);

router.post('/bulk', bulkCreateStudents);

router.get('/:id', getStudentById);

router.put('/:id', updateStudent);

router.get('/:id/profile', getStudentProfile);

router.get('/:id/contest-history', getStudentContestHistory);

router.get('/:id/problem-solving', getStudentProblemSolving);

router.get('/:id', getStudentById);

router.delete('/:id', deleteStudent);

export default router;